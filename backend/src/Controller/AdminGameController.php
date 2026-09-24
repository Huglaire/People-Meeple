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
                new OA\Property(
                    property: 'name',
                    type: 'string',
                    example: 'Azul'
                ),
                new OA\Property(
                    property: 'image',
                    type: 'string',
                    example: '/images/games/azul.jpg'
                ),
                new OA\Property(
                    property: 'description',
                    type: 'string',
                    example: 'Un jeu de placement de tuiles dans lequel les joueurs créent une mosaïque.'
                ),
                new OA\Property(
                    property: 'publisher',
                    type: 'string',
                    example: 'Next Move'
                ),
                new OA\Property(
                    property: 'minPlayers',
                    type: 'integer',
                    example: 2
                ),
                new OA\Property(
                    property: 'maxPlayers',
                    type: 'integer',
                    example: 4
                ),
                new OA\Property(
                    property: 'minimumAge',
                    type: 'integer',
                    example: 8
                ),
                new OA\Property(
                    property: 'duration',
                    type: 'integer',
                    example: 45
                )
            ]
        )
    )]
    #[OA\Response(
        response: 201,
        description: 'Jeu ajouté avec succès.'
    )]
    #[OA\Response(
        response: 400,
        description: 'Données invalides.'
    )]
    #[OA\Response(
        response: 403,
        description: 'Accès réservé aux administrateurs.'
    )]
    public function create(
        Request $request,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        // Lecture du JSON envoyé par le client
        $data = json_decode($request->getContent(), true);

        // Vérification du format du JSON
        if (!is_array($data)) {
            return new JsonResponse([
                'message' => 'Le corps de la requête doit être un objet JSON valide.'
            ], 400);
        }

        // Vérification des champs obligatoires
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

        // Vérification des types numériques
        $numericFields = [
            'minPlayers',
            'maxPlayers',
            'minimumAge',
            'duration'
        ];

        foreach ($numericFields as $field) {
            if (!is_int($data[$field])) {
                return new JsonResponse([
                    'message' => sprintf(
                        'Le champ "%s" doit être un entier.',
                        $field
                    )
                ], 400);
            }
        }

        // Vérification de la cohérence du nombre de joueurs
        if ($data['minPlayers'] > $data['maxPlayers']) {
            return new JsonResponse([
                'message' => 'Le nombre minimum de joueurs ne peut pas être supérieur au nombre maximum.'
            ], 400);
        }

        // Création du jeu
        $game = new Game();

        $game
            ->setName((string) $data['name'])
            ->setImage((string) $data['image'])
            ->setDescription((string) $data['description'])
            ->setPublisher((string) $data['publisher'])
            ->setMinPlayers($data['minPlayers'])
            ->setMaxPlayers($data['maxPlayers'])
            ->setMinimumAge($data['minimumAge'])
            ->setDuration($data['duration'])
            ->setIsActive(true)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(null);

        // Validation Symfony de l'entité
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

        // Enregistrement du jeu
        $entityManager->persist($game);
        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Jeu ajouté avec succès.',
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
            ]
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
                new OA\Property(
                    property: 'name',
                    type: 'string',
                    example: 'Azul'
                ),
                new OA\Property(
                    property: 'image',
                    type: 'string',
                    example: '/images/games/azul.jpg'
                ),
                new OA\Property(
                    property: 'description',
                    type: 'string',
                    example: 'Description mise à jour du jeu.'
                ),
                new OA\Property(
                    property: 'publisher',
                    type: 'string',
                    example: 'Next Move'
                ),
                new OA\Property(
                    property: 'minPlayers',
                    type: 'integer',
                    example: 2
                ),
                new OA\Property(
                    property: 'maxPlayers',
                    type: 'integer',
                    example: 4
                ),
                new OA\Property(
                    property: 'minimumAge',
                    type: 'integer',
                    example: 8
                ),
                new OA\Property(
                    property: 'duration',
                    type: 'integer',
                    example: 45
                ),
                new OA\Property(
                    property: 'isActive',
                    type: 'boolean',
                    example: true
                )
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: 'Jeu modifié avec succès.'
    )]
    #[OA\Response(
        response: 400,
        description: 'Données invalides.'
    )]
    #[OA\Response(
        response: 404,
        description: 'Jeu introuvable.'
    )]
    #[OA\Response(
        response: 403,
        description: 'Accès réservé aux administrateurs.'
    )]
    public function update(
        int $id,
        Request $request,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        // Recherche du jeu
        $game = $entityManager
            ->getRepository(Game::class)
            ->find($id);

        if ($game === null) {
            return new JsonResponse([
                'message' => 'Jeu introuvable.'
            ], 404);
        }

        // Lecture du JSON envoyé par le client
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return new JsonResponse([
                'message' => 'Le corps de la requête doit être un objet JSON valide.'
            ], 400);
        }

        // Mise à jour uniquement des champs transmis
        if (array_key_exists('name', $data)) {
            $game->setName((string) $data['name']);
        }

        if (array_key_exists('image', $data)) {
            $game->setImage((string) $data['image']);
        }

        if (array_key_exists('description', $data)) {
            $game->setDescription((string) $data['description']);
        }

        if (array_key_exists('publisher', $data)) {
            $game->setPublisher((string) $data['publisher']);
        }

        if (array_key_exists('minPlayers', $data)) {
            if (!is_int($data['minPlayers'])) {
                return new JsonResponse([
                    'message' => 'Le champ "minPlayers" doit être un entier.'
                ], 400);
            }

            $game->setMinPlayers($data['minPlayers']);
        }

        if (array_key_exists('maxPlayers', $data)) {
            if (!is_int($data['maxPlayers'])) {
                return new JsonResponse([
                    'message' => 'Le champ "maxPlayers" doit être un entier.'
                ], 400);
            }

            $game->setMaxPlayers($data['maxPlayers']);
        }

        if (array_key_exists('minimumAge', $data)) {
            if (!is_int($data['minimumAge'])) {
                return new JsonResponse([
                    'message' => 'Le champ "minimumAge" doit être un entier.'
                ], 400);
            }

            $game->setMinimumAge($data['minimumAge']);
        }

        if (array_key_exists('duration', $data)) {
            if (!is_int($data['duration'])) {
                return new JsonResponse([
                    'message' => 'Le champ "duration" doit être un entier.'
                ], 400);
            }

            $game->setDuration($data['duration']);
        }

        if (array_key_exists('isActive', $data)) {
            if (!is_bool($data['isActive'])) {
                return new JsonResponse([
                    'message' => 'Le champ "isActive" doit être un booléen.'
                ], 400);
            }

            $game->setIsActive($data['isActive']);
        }

        // Vérification de la cohérence du nombre de joueurs
        if (
            $game->getMinPlayers() !== null &&
            $game->getMaxPlayers() !== null &&
            $game->getMinPlayers() > $game->getMaxPlayers()
        ) {
            return new JsonResponse([
                'message' => 'Le nombre minimum de joueurs ne peut pas être supérieur au nombre maximum.'
            ], 400);
        }

        // Mise à jour de la date de modification
        $game->setUpdatedAt(new \DateTimeImmutable());

        // Validation Symfony de l'entité
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

        // Enregistrement des modifications
        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Jeu modifié avec succès.',
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
            ]
        ]);
    }

    /**
     * Désactive un jeu sans le supprimer de la base de données.
     */
    #[Route('/{id}', name: 'api_admin_games_delete', methods: ['DELETE'])]
    #[OA\Delete(
        summary: 'Désactiver un jeu',
        description: 'Désactive un jeu de la collection sans supprimer ses données de la base. Réservé aux administrateurs.'
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
        description: 'Jeu désactivé avec succès.'
    )]
    #[OA\Response(
        response: 404,
        description: 'Jeu introuvable.'
    )]
    #[OA\Response(
        response: 403,
        description: 'Accès réservé aux administrateurs.'
    )]
    public function delete(
        int $id,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Recherche du jeu
        $game = $entityManager
            ->getRepository(Game::class)
            ->find($id);

        if ($game === null) {
            return new JsonResponse([
                'message' => 'Jeu introuvable.'
            ], 404);
        }

        // Désactivation logique du jeu
        $game
            ->setIsActive(false)
            ->setUpdatedAt(new \DateTimeImmutable());

        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Jeu désactivé avec succès.'
        ]);
    }
}