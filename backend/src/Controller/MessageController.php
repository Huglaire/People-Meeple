<?php

namespace App\Controller;

use App\Entity\Conversation;
use App\Entity\Message;
use App\Entity\User;
use App\Repository\ConversationRepository;
use App\Repository\MessageRepository;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Gère l'envoi et la consultation des messages.
 */
#[Route('/api/conversations/{conversationId}/messages')]
#[IsGranted('ROLE_USER')]
#[OA\Tag(name: 'Messages')]
class MessageController extends AbstractController
{
    /**
     * Envoie un message dans une conversation.
     */
    #[Route('', name: 'api_messages_create', methods: ['POST'])]
    #[OA\Post(
        summary: 'Envoyer un message',
        description: 'Envoie un message dans une conversation à laquelle participe l’utilisateur connecté.'
    )]
    #[OA\Parameter(
        name: 'conversationId',
        description: 'Identifiant de la conversation',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['content'],
            properties: [
                new OA\Property(
                    property: 'content',
                    type: 'string',
                    example: 'Salut, tu veux faire une partie de Catan ?'
                )
            ]
        )
    )]
    #[OA\Response(
        response: 201,
        description: 'Message envoyé'
    )]
    #[OA\Response(
        response: 400,
        description: 'Données invalides'
    )]
    #[OA\Response(
        response: 403,
        description: 'Utilisateur non autorisé'
    )]
    #[OA\Response(
        response: 404,
        description: 'Conversation introuvable'
    )]
    public function create(
        int $conversationId,
        Request $request,
        ConversationRepository $conversationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $currentUser */
        $currentUser = $this->getUser();

        $conversation = $conversationRepository->find($conversationId);

        if (!$conversation instanceof Conversation) {
            return $this->json([
                'message' => 'Conversation introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Vérifie que l'utilisateur connecté participe à la conversation
        if (
            $conversation->getUser()?->getId() !== $currentUser->getId()
            && $conversation->getUser1()?->getId() !== $currentUser->getId()
        ) {
            return $this->json([
                'message' => 'Vous n’êtes pas autorisé à envoyer un message dans cette conversation.',
            ], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json([
                'message' => 'Le corps de la requête doit être un JSON valide.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (!isset($data['content'])) {
            return $this->json([
                'message' => 'Le champ "content" est obligatoire.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (!is_string($data['content'])) {
            return $this->json([
                'message' => 'Le champ "content" doit être une chaîne de caractères.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $content = trim($data['content']);

        if ($content === '') {
            return $this->json([
                'message' => 'Le message ne peut pas être vide.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $message = new Message();

        // Définit le contenu et l'auteur du message
        $message->setContent($content);
        $message->setUser($currentUser);
        $message->setConversation($conversation);

        // Définit la date d'envoi
        $message->setCreatedAt(new \DateTimeImmutable());

        // Met à jour la date de dernière activité de la conversation
        $conversation->setUpdatedAt(new \DateTimeImmutable());

        $entityManager->persist($message);
        $entityManager->flush();

        return $this->json([
            'id' => $message->getId(),
            'content' => $message->getContent(),
            'createdAt' => $message->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'user' => [
                'id' => $currentUser->getId(),
                'pseudo' => $currentUser->getPseudo(),
            ],
            'conversationId' => $conversation->getId(),
        ], Response::HTTP_CREATED);
    }

    /**
     * Retourne les messages d'une conversation.
     */
    #[Route('', name: 'api_messages_list', methods: ['GET'])]
    #[OA\Get(
        summary: 'Lister les messages',
        description: 'Retourne les messages d’une conversation si l’utilisateur connecté en est participant.'
    )]
    #[OA\Parameter(
        name: 'conversationId',
        description: 'Identifiant de la conversation',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(
        response: 200,
        description: 'Liste des messages'
    )]
    #[OA\Response(
        response: 403,
        description: 'Utilisateur non autorisé'
    )]
    #[OA\Response(
        response: 404,
        description: 'Conversation introuvable'
    )]
    public function index(
        int $conversationId,
        ConversationRepository $conversationRepository,
        MessageRepository $messageRepository
    ): JsonResponse {
        /** @var User $currentUser */
        $currentUser = $this->getUser();

        $conversation = $conversationRepository->find($conversationId);

        if (!$conversation instanceof Conversation) {
            return $this->json([
                'message' => 'Conversation introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Vérifie que l'utilisateur connecté participe à la conversation
        if (
            $conversation->getUser()?->getId() !== $currentUser->getId()
            && $conversation->getUser1()?->getId() !== $currentUser->getId()
        ) {
            return $this->json([
                'message' => 'Vous n’êtes pas autorisé à accéder aux messages de cette conversation.',
            ], Response::HTTP_FORBIDDEN);
        }

        // Récupère les messages du plus ancien au plus récent
        $messages = $messageRepository
            ->createQueryBuilder('m')
            ->where('m.conversation = :conversation')
            ->setParameter('conversation', $conversation)
            ->orderBy('m.createdAt', 'ASC')
            ->getQuery()
            ->getResult();

        $result = [];

        foreach ($messages as $message) {
            /** @var Message $message */
            $result[] = [
                'id' => $message->getId(),
                'content' => $message->getContent(),
                'createdAt' => $message->getCreatedAt()?->format(\DateTimeInterface::ATOM),
                'user' => [
                    'id' => $message->getUser()?->getId(),
                    'pseudo' => $message->getUser()?->getPseudo(),
                ],
                'conversationId' => $conversation->getId(),
            ];
        }

        return $this->json($result);
    }
}