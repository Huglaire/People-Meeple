<?php

namespace App\Controller;

use App\Entity\Game;
use App\Entity\GameRequest;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/admin/game-requests')]
#[IsGranted('ROLE_ADMIN')]
#[OA\Tag(name: 'Admin - Game Request')]
final class AdminGameRequestController extends AbstractController
{
    /**
     * Retourne toutes les demandes de jeux.
     */
    #[Route('', name: 'api_admin_game_requests_list', methods: ['GET'])]
    #[OA\Get(
        summary: 'Lister les demandes de jeux',
        description: 'Retourne toutes les demandes de jeux. Réservé aux administrateurs.'
    )]
    #[OA\Response(
        response: 200,
        description: 'Liste des demandes récupérée avec succès.'
    )]
    #[OA\Response(
        response: 403,
        description: 'Accès réservé aux administrateurs.'
    )]
    public function list(
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Récupération des demandes les plus récentes en premier.
        $gameRequests = $entityManager
            ->getRepository(GameRequest::class)
            ->findBy([], ['createdAt' => 'DESC']);

        // Préparation des données retournées par l'API.
        $result = [];

        foreach ($gameRequests as $gameRequest) {
            $result[] = [
                'id' => $gameRequest->getId(),
                'name' => $gameRequest->getName(),
                'publisher' => $gameRequest->getPublisher(),
                'description' => $gameRequest->getDescription(),
                'status' => $gameRequest->getStatus(),
                'createdAt' => $gameRequest->getCreatedAt()?->format('Y-m-d H:i:s'),
                'processedAt' => $gameRequest->getProcessedAt()?->format('Y-m-d H:i:s'),
                'requester' => [
                    'id' => $gameRequest->getUser()?->getId(),
                    'pseudo' => $gameRequest->getUser()?->getPseudo(),
                ],
                'processor' => [
                    'id' => $gameRequest->getUser1()?->getId(),
                    'pseudo' => $gameRequest->getUser1()?->getPseudo(),
                ],
            ];
        }

        return new JsonResponse($result);
    }

    /**
     * Crée un jeu et accepte la demande dans une seule transaction.
     */
    #[Route(
        '/{id}/accept',
        name: 'api_admin_game_requests_accept',
        methods: ['POST']
    )]
    #[OA\Post(
        summary: 'Accepter une demande et créer le jeu',
        description: 'Crée le jeu dans le catalogue puis accepte la demande dans une transaction. Réservé aux administrateurs.'
    )]
    #[OA\Parameter(
        name: 'id',
        description: 'Identifiant de la demande de jeu',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer'),
        example: 1
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: [
                'name',
                'image',
                'description',
                'publisher',
                'minPlayers',
                'maxPlayers',
                'minimumAge',
                'duration'
            ],
            properties: [
                new OA\Property(property: 'name', type: 'string', example: 'Sky Team'),
                new OA\Property(property: 'image', type: 'string', example: '/images/games/sky-team.jpg'),
                new OA\Property(property: 'description', type: 'string', example: 'Un jeu coopératif pour deux joueurs.'),
                new OA\Property(property: 'publisher', type: 'string', example: 'Scorpion Masqué'),
                new OA\Property(property: 'minPlayers', type: 'integer', example: 2),
                new OA\Property(property: 'maxPlayers', type: 'integer', example: 2),
                new OA\Property(property: 'minimumAge', type: 'integer', example: 12),
                new OA\Property(property: 'duration', type: 'integer', example: 20)
            ]
        )
    )]
    #[OA\Response(response: 201, description: 'Jeu créé et demande acceptée.')]
    #[OA\Response(response: 400, description: 'Données invalides ou demande déjà traitée.')]
    #[OA\Response(response: 404, description: 'Demande introuvable.')]
    #[OA\Response(response: 403, description: 'Accès réservé aux administrateurs.')]
    public function accept(
        int $id,
        Request $request,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        // Recherche de la demande.
        $gameRequest = $entityManager
            ->getRepository(GameRequest::class)
            ->find($id);

        if ($gameRequest === null) {
            return new JsonResponse([
                'message' => 'Demande introuvable.'
            ], 404);
        }

        // Une demande traitée ne peut pas être acceptée une seconde fois.
        if ($gameRequest->getStatus() !== 'pending') {
            return new JsonResponse([
                'message' => 'Cette demande a déjà été traitée.'
            ], 400);
        }

        // Lecture et validation du JSON.
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return new JsonResponse([
                'message' => 'Le corps de la requête doit être un objet JSON valide.'
            ], 400);
        }

        $requiredFields = [
            'name',
            'image',
            'description',
            'publisher',
            'minPlayers',
            'maxPlayers',
            'minimumAge',
            'duration'
        ];

        foreach ($requiredFields as $field) {
            if (!array_key_exists($field, $data)) {
                return new JsonResponse([
                    'message' => sprintf('Le champ "%s" est obligatoire.', $field)
                ], 400);
            }
        }

        // Vérification des types et des champs textuels.
        foreach (['name', 'image', 'description', 'publisher'] as $field) {
            if (!is_string($data[$field]) || trim($data[$field]) === '') {
                return new JsonResponse([
                    'message' => sprintf('Le champ "%s" doit être un texte non vide.', $field)
                ], 400);
            }
        }

        foreach (['minPlayers', 'maxPlayers', 'minimumAge', 'duration'] as $field) {
            if (!is_int($data[$field])) {
                return new JsonResponse([
                    'message' => sprintf('Le champ "%s" doit être un entier.', $field)
                ], 400);
            }

            if ($data[$field] < 0) {
                return new JsonResponse([
                    'message' => sprintf('Le champ "%s" ne peut pas être négatif.', $field)
                ], 400);
            }
        }

        if ($data['minPlayers'] < 1 || $data['minPlayers'] > $data['maxPlayers']) {
            return new JsonResponse([
                'message' => 'Le nombre minimum de joueurs doit être supérieur ou égal à 1 et ne peut pas dépasser le maximum.'
            ], 400);
        }

        // Préparation du jeu à partir des informations du formulaire.
        $game = new Game();

        $game
            ->setName(trim($data['name']))
            ->setImage(trim($data['image']))
            ->setDescription(trim($data['description']))
            ->setPublisher(trim($data['publisher']))
            ->setMinPlayers($data['minPlayers'])
            ->setMaxPlayers($data['maxPlayers'])
            ->setMinimumAge($data['minimumAge'])
            ->setDuration($data['duration'])
            ->setIsActive(true)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(null);

        // Validation Symfony de l'entité avant toute écriture.
        $errors = $validator->validate($game);

        if (count($errors) > 0) {
            $messages = [];

            foreach ($errors as $error) {
                $messages[] = $error->getMessage();
            }

            return new JsonResponse([
                'message' => 'Les données du jeu sont invalides.',
                'errors' => $messages
            ], 400);
        }

        // La création du jeu et l'acceptation de la demande sont atomiques.
        $connection = $entityManager->getConnection();
        $connection->beginTransaction();

        try {
            $entityManager->persist($game);

            // Première écriture : création du jeu.
            $entityManager->flush();

            // Deuxième écriture : traitement de la demande.
            $gameRequest
                ->setStatus('accepted')
                ->setProcessedAt(new \DateTimeImmutable())
                ->setUser1($this->getUser());

            $entityManager->flush();

            $connection->commit();
        } catch (\Throwable $exception) {
            // Annule les deux opérations si l'une d'elles échoue.
            if ($connection->isTransactionActive()) {
                $connection->rollBack();
            }

            // Réinitialise l'EntityManager après une erreur de persistance.
            $entityManager->clear();

            return new JsonResponse([
                'message' => 'Impossible de créer le jeu et de traiter la demande. Aucune modification n’a été conservée.'
            ], 500);
        }

        return new JsonResponse([
            'message' => 'Jeu ajouté au catalogue et demande acceptée.',
            'game' => [
                'id' => $game->getId(),
                'name' => $game->getName(),
                'image' => $game->getImage(),
                'description' => $game->getDescription(),
                'publisher' => $game->getPublisher(),
                'minPlayers' => $game->getMinPlayers(),
                'maxPlayers' => $game->getMaxPlayers(),
                'minimumAge' => $game->getMinimumAge(),
                'duration' => $game->getDuration(),
                'isActive' => $game->isActive(),
                'createdAt' => $game->getCreatedAt()?->format('Y-m-d H:i:s'),
                'updatedAt' => $game->getUpdatedAt()?->format('Y-m-d H:i:s'),
            ],
            'gameRequest' => [
                'id' => $gameRequest->getId(),
                'status' => $gameRequest->getStatus(),
                'processedAt' => $gameRequest->getProcessedAt()?->format('Y-m-d H:i:s'),
            ]
        ], 201);
    }

    /**
     * Traite une demande de jeu sans créer de jeu.
     * Cette route reste utilisée notamment pour le refus.
     */
    #[Route('/{id}', name: 'api_admin_game_requests_process', methods: ['PATCH'])]
    #[OA\Patch(
        summary: 'Traiter une demande de jeu',
        description: 'Accepte ou refuse une demande de jeu sans créer de jeu. Réservé aux administrateurs.'
    )]
    #[OA\Parameter(
        name: 'id',
        description: 'Identifiant de la demande',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer'),
        example: 1
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['status'],
            properties: [
                new OA\Property(
                    property: 'status',
                    type: 'string',
                    enum: ['accepted', 'rejected'],
                    example: 'rejected'
                )
            ]
        )
    )]
    #[OA\Response(response: 200, description: 'Demande traitée avec succès.')]
    #[OA\Response(response: 400, description: 'Statut invalide ou demande déjà traitée.')]
    #[OA\Response(response: 404, description: 'Demande introuvable.')]
    #[OA\Response(response: 403, description: 'Accès réservé aux administrateurs.')]
    public function process(
        int $id,
        Request $request,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Recherche de la demande.
        $gameRequest = $entityManager
            ->getRepository(GameRequest::class)
            ->find($id);

        if ($gameRequest === null) {
            return new JsonResponse([
                'message' => 'Demande introuvable.'
            ], 404);
        }

        // Lecture du JSON envoyé par l'administrateur.
        $data = json_decode($request->getContent(), true);

        if (!is_array($data) || !isset($data['status'])) {
            return new JsonResponse([
                'message' => 'Le champ "status" est obligatoire.'
            ], 400);
        }

        // Cette route ne doit pas accepter une demande sans créer le jeu.
        if ($data['status'] !== 'rejected') {
            return new JsonResponse([
                'message' => 'Pour accepter une demande, utilisez la route de création du jeu associée.'
            ], 400);
        }

        if ($gameRequest->getStatus() !== 'pending') {
            return new JsonResponse([
                'message' => 'Cette demande a déjà été traitée.'
            ], 400);
        }

        // Enregistrement du refus.
        $gameRequest
            ->setStatus('rejected')
            ->setProcessedAt(new \DateTimeImmutable())
            ->setUser1($this->getUser());

        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Demande refusée.',
            'gameRequest' => [
                'id' => $gameRequest->getId(),
                'name' => $gameRequest->getName(),
                'publisher' => $gameRequest->getPublisher(),
                'description' => $gameRequest->getDescription(),
                'status' => $gameRequest->getStatus(),
                'createdAt' => $gameRequest->getCreatedAt()?->format('Y-m-d H:i:s'),
                'processedAt' => $gameRequest->getProcessedAt()?->format('Y-m-d H:i:s'),
            ]
        ]);
    }
}