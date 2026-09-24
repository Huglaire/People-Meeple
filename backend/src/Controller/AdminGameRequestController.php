<?php

namespace App\Controller;

use App\Entity\GameRequest;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

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
        // Récupération des demandes les plus récentes en premier
        $gameRequests = $entityManager
            ->getRepository(GameRequest::class)
            ->findBy(
                [],
                ['createdAt' => 'DESC']
            );

        // Préparation des données retournées par l'API
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
     * Traite une demande de jeu.
     */
    #[Route('/{id}', name: 'api_admin_game_requests_process', methods: ['PATCH'])]
    #[OA\Patch(
        summary: 'Traiter une demande de jeu',
        description: 'Accepte ou refuse une demande de jeu. Réservé aux administrateurs.'
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
                    example: 'accepted'
                )
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: 'Demande traitée avec succès.'
    )]
    #[OA\Response(
        response: 400,
        description: 'Statut invalide.'
    )]
    #[OA\Response(
        response: 404,
        description: 'Demande introuvable.'
    )]
    #[OA\Response(
        response: 403,
        description: 'Accès réservé aux administrateurs.'
    )]
    public function process(
        int $id,
        Request $request,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Recherche de la demande
        $gameRequest = $entityManager
            ->getRepository(GameRequest::class)
            ->find($id);

        if ($gameRequest === null) {
            return new JsonResponse([
                'message' => 'Demande introuvable.'
            ], 404);
        }

        // Lecture du JSON envoyé par l'administrateur
        $data = json_decode($request->getContent(), true);

        if (!is_array($data) || !isset($data['status'])) {
            return new JsonResponse([
                'message' => 'Le champ "status" est obligatoire.'
            ], 400);
        }

        // Vérification du statut demandé
        if (!in_array($data['status'], ['accepted', 'rejected'], true)) {
            return new JsonResponse([
                'message' => 'Le statut doit être "accepted" ou "rejected".'
            ], 400);
        }

        // Une demande déjà traitée ne peut pas être retraitée
        if ($gameRequest->getStatus() !== 'pending') {
            return new JsonResponse([
                'message' => 'Cette demande a déjà été traitée.'
            ], 400);
        }

        // Mise à jour du traitement de la demande
        $gameRequest
            ->setStatus($data['status'])
            ->setProcessedAt(new \DateTimeImmutable())
            ->setUser1($this->getUser());

        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Demande traitée avec succès.',
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