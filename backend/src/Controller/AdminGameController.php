<?php

namespace App\Controller;

use App\Entity\Game;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/admin/games')]
#[IsGranted('ROLE_ADMIN')]
#[OA\Tag(name: 'Admin - Game')]
final class AdminGameController extends AbstractController
{
    /**
     * Récupère tous les jeux, actifs ou désactivés.
     */
    #[Route('', name: 'api_admin_games_list', methods: ['GET'])]
    #[OA\Get(
        summary: 'Lister tous les jeux',
        description: 'Récupère les jeux actifs et désactivés. Réservé aux administrateurs.'
    )]
    #[OA\Response(
        response: 200,
        description: 'Liste complète des jeux.'
    )]
    #[OA\Response(
        response: 403,
        description: 'Accès réservé aux administrateurs.'
    )]
    public function list(EntityManagerInterface $entityManager): JsonResponse
    {
        $games = $entityManager
            ->getRepository(Game::class)
            ->findBy([], ['name' => 'ASC']);

        $result = [];

        foreach ($games as $game) {
            $result[] = $this->serializeGame($game);
        }

        return new JsonResponse($result);
    }

    /**
     * Ajoute un nouveau jeu à la collection.
     */
    #[Route('', name: 'api_admin_games_create', methods: ['POST'])]
    #[OA\Post(
        summary: 'Ajouter un jeu',
        description: 'Ajoute un nouveau jeu à la collection de People Meeple. Réservé aux administrateurs.'
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
                new OA\Property(property: 'name', type: 'string', example: 'Azul'),
                new OA\Property(property: 'image', type: 'string', example: '/images/games/azul.jpg'),
                new OA\Property(property: 'description', type: 'string', example: 'Un jeu de placement de tuiles.'),
                new OA\Property(property: 'publisher', type: 'string', example: 'Next Move'),
                new OA\Property(property: 'minPlayers', type: 'integer', example: 2),
                new OA\Property(property: 'maxPlayers', type: 'integer', example: 4),
                new OA\Property(property: 'minimumAge', type: 'integer', example: 8),
                new OA\Property(property: 'duration', type: 'integer', example: 45)
            ]
        )
    )]
    #[OA\Response(response: 201, description: 'Jeu ajouté avec succès.')]
    #[OA\Response(response: 400, description: 'Données invalides.')]
    #[OA\Response(response: 403, description: 'Accès réservé aux administrateurs.')]
    public function create(
        Request $request,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
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

        foreach (['minPlayers', 'maxPlayers', 'minimumAge', 'duration'] as $field) {
            if (!is_int($data[$field])) {
                return new JsonResponse([
                    'message' => sprintf('Le champ "%s" doit être un entier.', $field)
                ], 400);
            }
        }

        if ($data['minPlayers'] < 1 || $data['maxPlayers'] < 1) {
            return new JsonResponse([
                'message' => 'Le nombre de joueurs doit être supérieur ou égal à 1.'
            ], 400);
        }

        if ($data['minPlayers'] > $data['maxPlayers']) {
            return new JsonResponse([
                'message' => 'Le nombre minimum de joueurs ne peut pas être supérieur au nombre maximum.'
            ], 400);
        }

        if ($data['minimumAge'] < 0 || $data['duration'] < 1) {
            return new JsonResponse([
                'message' => 'L’âge minimum doit être positif ou nul et la durée doit être supérieure à zéro.'
            ], 400);
        }

        $game = new Game();

        $game
            ->setName(trim((string) $data['name']))
            ->setImage(trim((string) $data['image']))
            ->setDescription(trim((string) $data['description']))
            ->setPublisher(trim((string) $data['publisher']))
            ->setMinPlayers($data['minPlayers'])
            ->setMaxPlayers($data['maxPlayers'])
            ->setMinimumAge($data['minimumAge'])
            ->setDuration($data['duration'])
            ->setIsActive(true)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(null);

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

        $entityManager->persist($game);
        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Jeu ajouté avec succès.',
            'game' => $this->serializeGame($game)
        ], 201);
    }

    /**
     * Modifie un jeu existant.
     */
    #[Route('/{id}', name: 'api_admin_games_update', methods: ['PATCH'])]
    #[OA\Patch(
        summary: 'Modifier un jeu',
        description: 'Modifie les informations d’un jeu existant. Réservé aux administrateurs.'
    )]
    #[OA\Parameter(
        name: 'id',
        description: 'Identifiant du jeu',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer'),
        example: 1
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'name', type: 'string', example: 'Azul'),
                new OA\Property(property: 'image', type: 'string', example: '/images/games/azul.jpg'),
                new OA\Property(property: 'description', type: 'string', example: 'Description mise à jour.'),
                new OA\Property(property: 'publisher', type: 'string', example: 'Next Move'),
                new OA\Property(property: 'minPlayers', type: 'integer', example: 2),
                new OA\Property(property: 'maxPlayers', type: 'integer', example: 4),
                new OA\Property(property: 'minimumAge', type: 'integer', example: 8),
                new OA\Property(property: 'duration', type: 'integer', example: 45),
                new OA\Property(property: 'isActive', type: 'boolean', example: true)
            ]
        )
    )]
    #[OA\Response(response: 200, description: 'Jeu modifié avec succès.')]
    #[OA\Response(response: 400, description: 'Données invalides.')]
    #[OA\Response(response: 404, description: 'Jeu introuvable.')]
    #[OA\Response(response: 403, description: 'Accès réservé aux administrateurs.')]
    public function update(
        int $id,
        Request $request,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        $game = $entityManager->getRepository(Game::class)->find($id);

        if ($game === null) {
            return new JsonResponse(['message' => 'Jeu introuvable.'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return new JsonResponse([
                'message' => 'Le corps de la requête doit être un objet JSON valide.'
            ], 400);
        }

        foreach (['name', 'image', 'description', 'publisher'] as $field) {
            if (array_key_exists($field, $data)) {
                if (!is_string($data[$field])) {
                    return new JsonResponse([
                        'message' => sprintf('Le champ "%s" doit être une chaîne de caractères.', $field)
                    ], 400);
                }

                $value = trim($data[$field]);

                match ($field) {
                    'name' => $game->setName($value),
                    'image' => $game->setImage($value),
                    'description' => $game->setDescription($value),
                    'publisher' => $game->setPublisher($value),
                };
            }
        }

        foreach (['minPlayers', 'maxPlayers', 'minimumAge', 'duration'] as $field) {
            if (!array_key_exists($field, $data)) {
                continue;
            }

            if (!is_int($data[$field])) {
                return new JsonResponse([
                    'message' => sprintf('Le champ "%s" doit être un entier.', $field)
                ], 400);
            }

            match ($field) {
                'minPlayers' => $game->setMinPlayers($data[$field]),
                'maxPlayers' => $game->setMaxPlayers($data[$field]),
                'minimumAge' => $game->setMinimumAge($data[$field]),
                'duration' => $game->setDuration($data[$field]),
            };
        }

        if (array_key_exists('isActive', $data)) {
            if (!is_bool($data['isActive'])) {
                return new JsonResponse([
                    'message' => 'Le champ "isActive" doit être un booléen.'
                ], 400);
            }

            $game->setIsActive($data['isActive']);
        }

        if ($game->getMinPlayers() > $game->getMaxPlayers()) {
            return new JsonResponse([
                'message' => 'Le nombre minimum de joueurs ne peut pas être supérieur au nombre maximum.'
            ], 400);
        }

        if ($game->getMinPlayers() < 1 || $game->getMaxPlayers() < 1) {
            return new JsonResponse([
                'message' => 'Le nombre de joueurs doit être supérieur ou égal à 1.'
            ], 400);
        }

        if ($game->getMinimumAge() < 0 || $game->getDuration() < 1) {
            return new JsonResponse([
                'message' => 'L’âge minimum doit être positif ou nul et la durée doit être supérieure à zéro.'
            ], 400);
        }

        $game->setUpdatedAt(new \DateTimeImmutable());

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

        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Jeu modifié avec succès.',
            'game' => $this->serializeGame($game)
        ]);
    }

    /**
     * Réactive un jeu précédemment désactivé.
     */
    #[Route('/{id}/reactivate', name: 'api_admin_games_reactivate', methods: ['PATCH'])]
    #[OA\Patch(
        summary: 'Réactiver un jeu',
        description: 'Réactive un jeu précédemment désactivé. Réservé aux administrateurs.'
    )]
    #[OA\Parameter(
        name: 'id',
        description: 'Identifiant du jeu',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer'),
        example: 1
    )]
    #[OA\Response(response: 200, description: 'Jeu réactivé avec succès.')]
    #[OA\Response(response: 404, description: 'Jeu introuvable.')]
    #[OA\Response(response: 403, description: 'Accès réservé aux administrateurs.')]
    public function reactivate(
        int $id,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $game = $entityManager->getRepository(Game::class)->find($id);

        if ($game === null) {
            return new JsonResponse([
                'message' => 'Jeu introuvable.'
            ], 404);
        }

        if ($game->isActive()) {
            return new JsonResponse([
                'message' => 'Ce jeu est déjà actif.',
                'game' => $this->serializeGame($game)
            ]);
        }

        $game
            ->setIsActive(true)
            ->setUpdatedAt(new \DateTimeImmutable());

        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Jeu réactivé avec succès.',
            'game' => $this->serializeGame($game)
        ]);
    }

    /**
     * Désactive un jeu sans le supprimer de la base de données.
     */
    #[Route('/{id}', name: 'api_admin_games_delete', methods: ['DELETE'])]
    #[OA\Delete(
        summary: 'Désactiver un jeu',
        description: 'Désactive un jeu sans supprimer ses données de la base. Réservé aux administrateurs.'
    )]
    #[OA\Parameter(
        name: 'id',
        description: 'Identifiant du jeu',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer'),
        example: 1
    )]
    #[OA\Response(response: 200, description: 'Jeu désactivé avec succès.')]
    #[OA\Response(response: 404, description: 'Jeu introuvable.')]
    #[OA\Response(response: 403, description: 'Accès réservé aux administrateurs.')]
    public function delete(
        int $id,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $game = $entityManager->getRepository(Game::class)->find($id);

        if ($game === null) {
            return new JsonResponse([
                'message' => 'Jeu introuvable.'
            ], 404);
        }

        if (!$game->isActive()) {
            return new JsonResponse([
                'message' => 'Ce jeu est déjà désactivé.'
            ]);
        }

        $game
            ->setIsActive(false)
            ->setUpdatedAt(new \DateTimeImmutable());

        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Jeu désactivé avec succès.'
        ]);
    }

    /**
     * Formate les données d'un jeu pour les réponses JSON.
     */
    private function serializeGame(Game $game): array
    {
        return [
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
        ];
    }
}