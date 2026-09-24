<?php

namespace App\Controller;

use App\Entity\Conversation;
use App\Entity\User;
use App\Repository\ConversationRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Gère la création et la consultation des conversations.
 */
#[Route('/api/conversations')]
#[IsGranted('ROLE_USER')]
#[OA\Tag(name: 'Conversations')]
class ConversationController extends AbstractController
{
    /**
     * Crée une nouvelle conversation avec un autre utilisateur.
     */
    #[Route('', name: 'api_conversations_create', methods: ['POST'])]
    #[OA\Post(
        summary: 'Créer une conversation',
        description: 'Crée une conversation entre l’utilisateur connecté et un autre utilisateur.'
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['userId'],
            properties: [
                new OA\Property(
                    property: 'userId',
                    type: 'integer',
                    example: 2,
                    description: 'Identifiant de l’autre utilisateur'
                )
            ]
        )
    )]
    #[OA\Response(
        response: 201,
        description: 'Conversation créée'
    )]
    #[OA\Response(
        response: 400,
        description: 'Données invalides'
    )]
    #[OA\Response(
        response: 404,
        description: 'Utilisateur destinataire introuvable'
    )]
    #[OA\Response(
        response: 409,
        description: 'Une conversation existe déjà entre ces deux utilisateurs'
    )]
    public function create(
        Request $request,
        UserRepository $userRepository,
        ConversationRepository $conversationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $currentUser */
        $currentUser = $this->getUser();

        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json([
                'message' => 'Le corps de la requête doit être un JSON valide.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (!isset($data['userId'])) {
            return $this->json([
                'message' => 'Le champ "userId" est obligatoire.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (!is_int($data['userId'])) {
            return $this->json([
                'message' => 'Le champ "userId" doit être un entier.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $otherUser = $userRepository->find($data['userId']);

        if (!$otherUser instanceof User) {
            return $this->json([
                'message' => 'Utilisateur introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($otherUser->getId() === $currentUser->getId()) {
            return $this->json([
                'message' => 'Vous ne pouvez pas créer une conversation avec vous-même.',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Vérifie si une conversation existe déjà entre ces deux utilisateurs,
        // quel que soit l'ordre dans lequel ils apparaissent.
        $existingConversation = $conversationRepository
            ->createQueryBuilder('c')
            ->where(
                '(c.user = :currentUser AND c.user1 = :otherUser)'
                . ' OR '
                . '(c.user = :otherUser AND c.user1 = :currentUser)'
            )
            ->setParameter('currentUser', $currentUser)
            ->setParameter('otherUser', $otherUser)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        if ($existingConversation instanceof Conversation) {
            return $this->json([
                'message' => 'Une conversation existe déjà entre ces deux utilisateurs.',
                'conversationId' => $existingConversation->getId(),
            ], Response::HTTP_CONFLICT);
        }

        $conversation = new Conversation();

        // Définit les deux participants de la conversation
        $conversation->setUser($currentUser);
        $conversation->setUser1($otherUser);

        // Définit la date de création
        $conversation->setCreatedAt(new \DateTimeImmutable());

        // updatedAt reste null tant qu'aucun message n'a été envoyé
        $conversation->setUpdatedAt(null);

        $entityManager->persist($conversation);
        $entityManager->flush();

        return $this->json([
            'id' => $conversation->getId(),
            'createdAt' => $conversation->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'updatedAt' => $conversation->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
            'user' => [
                'id' => $currentUser->getId(),
                'pseudo' => $currentUser->getPseudo(),
            ],
            'user1' => [
                'id' => $otherUser->getId(),
                'pseudo' => $otherUser->getPseudo(),
            ],
        ], Response::HTTP_CREATED);
    }

    /**
     * Retourne les conversations auxquelles participe l'utilisateur connecté.
     */
    #[Route('', name: 'api_conversations_list', methods: ['GET'])]
    #[OA\Get(
        summary: 'Lister mes conversations',
        description: 'Retourne toutes les conversations auxquelles participe l’utilisateur connecté.'
    )]
    #[OA\Response(
        response: 200,
        description: 'Liste des conversations'
    )]
    public function index(
        ConversationRepository $conversationRepository
    ): JsonResponse {
        /** @var User $currentUser */
        $currentUser = $this->getUser();

        // Récupère les conversations où l'utilisateur est l'un des deux participants
        $conversations = $conversationRepository
            ->createQueryBuilder('c')
            ->where('c.user = :user')
            ->orWhere('c.user1 = :user')
            ->setParameter('user', $currentUser)
            ->orderBy('c.updatedAt', 'DESC')
            ->addOrderBy('c.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        $result = [];

        foreach ($conversations as $conversation) {
            /** @var Conversation $conversation */
            $result[] = [
                'id' => $conversation->getId(),
                'createdAt' => $conversation->getCreatedAt()?->format(\DateTimeInterface::ATOM),
                'updatedAt' => $conversation->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
                'user' => [
                    'id' => $conversation->getUser()?->getId(),
                    'pseudo' => $conversation->getUser()?->getPseudo(),
                ],
                'user1' => [
                    'id' => $conversation->getUser1()?->getId(),
                    'pseudo' => $conversation->getUser1()?->getPseudo(),
                ],
            ];
        }

        return $this->json($result);
    }

    /**
     * Retourne une conversation si l'utilisateur connecté en est participant.
     */
    #[Route('/{id}', name: 'api_conversations_show', methods: ['GET'])]
    #[OA\Get(
        summary: 'Afficher une conversation',
        description: 'Retourne une conversation uniquement si l’utilisateur connecté en est participant.'
    )]
    #[OA\Parameter(
        name: 'id',
        description: 'Identifiant de la conversation',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(
        response: 200,
        description: 'Conversation trouvée'
    )]
    #[OA\Response(
        response: 403,
        description: 'Utilisateur non autorisé'
    )]
    #[OA\Response(
        response: 404,
        description: 'Conversation introuvable'
    )]
    public function show(
        int $id,
        ConversationRepository $conversationRepository
    ): JsonResponse {
        /** @var User $currentUser */
        $currentUser = $this->getUser();

        $conversation = $conversationRepository->find($id);

        if (!$conversation instanceof Conversation) {
            return $this->json([
                'message' => 'Conversation introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Vérifie que l'utilisateur connecté participe à cette conversation
        if (
            $conversation->getUser()?->getId() !== $currentUser->getId()
            && $conversation->getUser1()?->getId() !== $currentUser->getId()
        ) {
            return $this->json([
                'message' => 'Vous n’êtes pas autorisé à accéder à cette conversation.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $this->json([
            'id' => $conversation->getId(),
            'createdAt' => $conversation->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'updatedAt' => $conversation->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
            'user' => [
                'id' => $conversation->getUser()?->getId(),
                'pseudo' => $conversation->getUser()?->getPseudo(),
            ],
            'user1' => [
                'id' => $conversation->getUser1()?->getId(),
                'pseudo' => $conversation->getUser1()?->getPseudo(),
            ],
        ]);
    }
}