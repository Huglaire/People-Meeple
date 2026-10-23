<?php

namespace App\Controller;

use App\Entity\Game;
use App\Entity\UserGame;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/me/games')]
#[IsGranted('ROLE_USER')]
#[OA\Tag(name: 'User - Game')]
final class UserGameController extends AbstractController
{
    /**
     * Retourne les jeux associés à l'utilisateur connecté.
     */
    #[Route('', name: 'api_me_games_list', methods: ['GET'])]
    #[OA\Get(
        summary: 'Lister ma ludothèque',
        description: 'Retourne les jeux associés au compte de l’utilisateur connecté, triés par ordre alphabétique.'
    )]
    #[OA\Response(
        response: 200,
        description: 'Ludothèque récupérée avec succès.'
    )]
    #[OA\Response(
        response: 401,
        description: 'Utilisateur non authentifié.'
    )]
    public function list(
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Récupération de l'utilisateur connecté
        $user = $this->getUser();

        if ($user === null) {
            return new JsonResponse([
                'message' => 'Utilisateur non authentifié.'
            ], 401);
        }

        // Récupération des associations triées par nom de jeu
        $userGames = $entityManager
            ->getRepository(UserGame::class)
            ->createQueryBuilder('userGame')
            ->join('userGame.game', 'game')
            ->where('userGame.user = :user')
            ->setParameter('user', $user)
            ->orderBy('game.name', 'ASC')
            ->getQuery()
            ->getResult();

        // Préparation de la réponse
        $result = [];

        foreach ($userGames as $userGame) {
            $game = $userGame->getGame();

            if ($game === null) {
                continue;
            }

            $result[] = $this->formatUserGame($userGame);
        }

        return new JsonResponse($result);
    }

    /**
     * Ajoute un jeu à la ludothèque de l'utilisateur connecté.
     */
    #[Route('', name: 'api_me_games_create', methods: ['POST'])]
    #[OA\Post(
        summary: 'Ajouter un jeu à ma ludothèque',
        description: 'Associe un jeu existant et actif à la ludothèque de l’utilisateur connecté.'
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['gameId', 'owns', 'knowsRules'],
            properties: [
                new OA\Property(
                    property: 'gameId',
                    type: 'integer',
                    example: 1
                ),
                new OA\Property(
                    property: 'owns',
                    type: 'boolean',
                    example: true
                ),
                new OA\Property(
                    property: 'knowsRules',
                    type: 'boolean',
                    example: true
                )
            ]
        )
    )]
    #[OA\Response(
        response: 201,
        description: 'Jeu ajouté à la ludothèque.'
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
        response: 409,
        description: 'Le jeu est déjà présent dans la ludothèque.'
    )]
    public function create(
        Request $request,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Récupération de l'utilisateur connecté
        $user = $this->getUser();

        if ($user === null) {
            return new JsonResponse([
                'message' => 'Utilisateur non authentifié.'
            ], 401);
        }

        // Lecture du JSON
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return new JsonResponse([
                'message' => 'Le corps de la requête doit être un objet JSON valide.'
            ], 400);
        }

        // Vérification des champs obligatoires
        if (!array_key_exists('gameId', $data)) {
            return new JsonResponse([
                'message' => 'Le champ "gameId" est obligatoire.'
            ], 400);
        }

        if (!array_key_exists('owns', $data)) {
            return new JsonResponse([
                'message' => 'Le champ "owns" est obligatoire.'
            ], 400);
        }

        if (!array_key_exists('knowsRules', $data)) {
            return new JsonResponse([
                'message' => 'Le champ "knowsRules" est obligatoire.'
            ], 400);
        }

        // Vérification des types
        if (!is_int($data['gameId'])) {
            return new JsonResponse([
                'message' => 'Le champ "gameId" doit être un entier.'
            ], 400);
        }

        if (!is_bool($data['owns'])) {
            return new JsonResponse([
                'message' => 'Le champ "owns" doit être un booléen.'
            ], 400);
        }

        if (!is_bool($data['knowsRules'])) {
            return new JsonResponse([
                'message' => 'Le champ "knowsRules" doit être un booléen.'
            ], 400);
        }

        // Un jeu doit être possédé ou ses règles doivent être connues
        if (!$data['owns'] && !$data['knowsRules']) {
            return new JsonResponse([
                'message' => 'Un jeu doit être possédé ou ses règles doivent être connues.'
            ], 400);
        }

        // Recherche du jeu
        $game = $entityManager
            ->getRepository(Game::class)
            ->find($data['gameId']);

        if ($game === null || !$game->isActive()) {
            return new JsonResponse([
                'message' => 'Jeu introuvable.'
            ], 404);
        }

        // Vérification d'une association existante
        $existingUserGame = $entityManager
            ->getRepository(UserGame::class)
            ->findOneBy([
                'user' => $user,
                'game' => $game,
            ]);

        if ($existingUserGame !== null) {
            return new JsonResponse([
                'message' => 'Ce jeu est déjà présent dans votre ludothèque.'
            ], 409);
        }

        // Création de l'association
        $now = new \DateTimeImmutable();

        $userGame = new UserGame();

        $userGame
            ->setUser($user)
            ->setGame($game)
            ->setOwns($data['owns'])
            ->setKnowsRules($data['knowsRules'])
            ->setCreatedAt($now)
            ->setUpdatedAt($now);

        $entityManager->persist($userGame);
        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Jeu ajouté à votre ludothèque.',
            'game' => $this->formatUserGame($userGame),
        ], 201);
    }

    /**
     * Modifie les informations d'un jeu dans la ludothèque.
     */
    #[Route('/{id}', name: 'api_me_games_update', methods: ['PATCH'])]
    #[OA\Patch(
        summary: 'Modifier un jeu de ma ludothèque',
        description: 'Modifie les informations owns et knowsRules d’une association USER_GAME.'
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
                    property: 'owns',
                    type: 'boolean',
                    example: false
                ),
                new OA\Property(
                    property: 'knowsRules',
                    type: 'boolean',
                    example: true
                )
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: 'Association modifiée avec succès.'
    )]
    #[OA\Response(
        response: 400,
        description: 'Données invalides.'
    )]
    #[OA\Response(
        response: 404,
        description: 'Association introuvable.'
    )]
    public function update(
        int $id,
        Request $request,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Récupération de l'utilisateur connecté
        $user = $this->getUser();

        if ($user === null) {
            return new JsonResponse([
                'message' => 'Utilisateur non authentifié.'
            ], 401);
        }

        // Recherche uniquement dans la ludothèque de l'utilisateur connecté
        $userGame = $entityManager
            ->getRepository(UserGame::class)
            ->findOneBy([
                'user' => $user,
                'game' => $id,
            ]);

        if ($userGame === null) {
            return new JsonResponse([
                'message' => 'Jeu introuvable dans votre ludothèque.'
            ], 404);
        }

        // Lecture du JSON
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return new JsonResponse([
                'message' => 'Le corps de la requête doit être un objet JSON valide.'
            ], 400);
        }

        // Au moins un champ doit être transmis
        if (
            !array_key_exists('owns', $data) &&
            !array_key_exists('knowsRules', $data)
        ) {
            return new JsonResponse([
                'message' => 'Au moins un champ à modifier est obligatoire.'
            ], 400);
        }

        // Vérification des types avant modification
        if (array_key_exists('owns', $data) && !is_bool($data['owns'])) {
            return new JsonResponse([
                'message' => 'Le champ "owns" doit être un booléen.'
            ], 400);
        }

        if (array_key_exists('knowsRules', $data) && !is_bool($data['knowsRules'])) {
            return new JsonResponse([
                'message' => 'Le champ "knowsRules" doit être un booléen.'
            ], 400);
        }

        // Détermination des nouvelles valeurs
        $owns = array_key_exists('owns', $data)
            ? $data['owns']
            : $userGame->isOwns();

        $knowsRules = array_key_exists('knowsRules', $data)
            ? $data['knowsRules']
            : $userGame->isKnowsRules();

        // Un jeu doit rester possédé ou avoir ses règles connues
        if (!$owns && !$knowsRules) {
            return new JsonResponse([
                'message' => 'Un jeu doit être possédé ou ses règles doivent être connues.'
            ], 400);
        }

        // Modification de owns
        if (array_key_exists('owns', $data)) {
            $userGame->setOwns($data['owns']);
        }

        // Modification de knowsRules
        if (array_key_exists('knowsRules', $data)) {
            $userGame->setKnowsRules($data['knowsRules']);
        }

        // Mise à jour de la date de modification
        $userGame->setUpdatedAt(new \DateTimeImmutable());

        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Jeu modifié dans votre ludothèque.',
            'game' => $this->formatUserGame($userGame),
        ]);
    }

    /**
     * Retire un jeu de la ludothèque de l'utilisateur.
     */
    #[Route('/{id}', name: 'api_me_games_delete', methods: ['DELETE'])]
    #[OA\Delete(
        summary: 'Retirer un jeu de ma ludothèque',
        description: 'Supprime l’association entre le jeu et la ludothèque de l’utilisateur connecté.'
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
        description: 'Jeu retiré de la ludothèque.'
    )]
    #[OA\Response(
        response: 404,
        description: 'Association introuvable.'
    )]
    public function delete(
        int $id,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Récupération de l'utilisateur connecté
        $user = $this->getUser();

        if ($user === null) {
            return new JsonResponse([
                'message' => 'Utilisateur non authentifié.'
            ], 401);
        }

        // Recherche uniquement dans la ludothèque de l'utilisateur connecté
        $userGame = $entityManager
            ->getRepository(UserGame::class)
            ->findOneBy([
                'user' => $user,
                'game' => $id,
            ]);

        if ($userGame === null) {
            return new JsonResponse([
                'message' => 'Jeu introuvable dans votre ludothèque.'
            ], 404);
        }

        // Suppression uniquement de l'association USER_GAME
        $entityManager->remove($userGame);
        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Jeu retiré de votre ludothèque.'
        ]);
    }

    /**
     * Formate une association USER_GAME pour la réponse API.
     */
    private function formatUserGame(UserGame $userGame): array
    {
        $game = $userGame->getGame();

        return [
            'id' => $game?->getId(),
            'name' => $game?->getName(),
            'image' => $game?->getImage(),
            'description' => $game?->getDescription(),
            'publisher' => $game?->getPublisher(),
            'minPlayers' => $game?->getMinPlayers(),
            'maxPlayers' => $game?->getMaxPlayers(),
            'minimumAge' => $game?->getMinimumAge(),
            'duration' => $game?->getDuration(),
            'owns' => $userGame->isOwns(),
            'knowsRules' => $userGame->isKnowsRules(),
        ];
    }
}