<?php

namespace App\Controller;

use App\Entity\Game;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[OA\Tag(name: 'Game')]
final class GameController extends AbstractController
{
    /**
     * Retourne la liste des jeux actifs.
     */
    #[Route('/api/games', name: 'api_games_list', methods: ['GET'])]
    #[OA\Get(
        summary: 'Lister les jeux',
        description: 'Retourne la liste des jeux actifs disponibles dans People Meeple.'
    )]
    #[OA\Response(
        response: 200,
        description: 'Liste des jeux récupérée avec succès.'
    )]
    public function list(
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Récupération uniquement des jeux actifs
        $games = $entityManager
            ->getRepository(Game::class)
            ->findBy(
                ['isActive' => true],
                ['name' => 'ASC']
            );

        // Préparation des données retournées par l'API
        $result = [];

        foreach ($games as $game) {
            $result[] = [
                'id' => $game->getId(),
                'name' => $game->getName(),
                'image' => $game->getImage(),
                'description' => $game->getDescription(),
                'publisher' => $game->getPublisher(),
                'minPlayers' => $game->getMinPlayers(),
                'maxPlayers' => $game->getMaxPlayers(),
                'minimumAge' => $game->getMinimumAge(),
                'duration' => $game->getDuration(),
            ];
        }

        return new JsonResponse($result);
    }

    /**
     * Retourne un jeu actif à partir de son identifiant.
     */
    #[Route('/api/games/{id}', name: 'api_games_show', methods: ['GET'])]
    #[OA\Get(
        summary: 'Afficher un jeu',
        description: 'Retourne les informations détaillées d’un jeu actif.'
    )]
    #[OA\Parameter(
        name: 'id',
        description: 'Identifiant du jeu',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer'),
        example: 1
    )]
    #[OA\Response(
        response: 200,
        description: 'Jeu récupéré avec succès.'
    )]
    #[OA\Response(
        response: 404,
        description: 'Jeu introuvable.'
    )]
    public function show(
        int $id,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Recherche du jeu par son identifiant
        $game = $entityManager
            ->getRepository(Game::class)
            ->find($id);

        // Un jeu désactivé n'est pas accessible publiquement
        if ($game === null || !$game->isActive()) {
            return new JsonResponse([
                'message' => 'Jeu introuvable.'
            ], 404);
        }

        return new JsonResponse([
            'id' => $game->getId(),
            'name' => $game->getName(),
            'image' => $game->getImage(),
            'description' => $game->getDescription(),
            'publisher' => $game->getPublisher(),
            'minPlayers' => $game->getMinPlayers(),
            'maxPlayers' => $game->getMaxPlayers(),
            'minimumAge' => $game->getMinimumAge(),
            'duration' => $game->getDuration(),
        ]);
    }
}