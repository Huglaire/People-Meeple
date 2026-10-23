<?php

namespace App\Controller;

use App\Entity\Game;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
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
    private const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

    private const ALLOWED_IMAGE_MIME_TYPES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    /**
     * Retourne tous les jeux, actifs et désactivés.
     */
    #[Route('', name: 'api_admin_games_list', methods: ['GET'])]
    #[OA\Get(
        summary: 'Lister tous les jeux',
        description: 'Retourne les jeux actifs et désactivés. Réservé aux administrateurs.'
    )]
    #[OA\Response(
        response: 200,
        description: 'Liste des jeux récupérée avec succès.'
    )]
    public function list(
        EntityManagerInterface $entityManager
    ): JsonResponse {
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
        description: 'Ajoute un jeu à la collection. Une image peut être envoyée sous forme de fichier.'
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\MediaType(
            mediaType: 'multipart/form-data',
            schema: new OA\Schema(
                type: 'object',
                required: [
                    'name',
                    'description',
                    'publisher',
                    'minPlayers',
                    'maxPlayers',
                    'minimumAge',
                    'duration'
                ],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Azul'),
                    new OA\Property(property: 'imageFile', type: 'string', format: 'binary'),
                    new OA\Property(property: 'image', type: 'string', example: '/images/games/azul.jpg'),
                    new OA\Property(property: 'description', type: 'string'),
                    new OA\Property(property: 'publisher', type: 'string', example: 'Next Move'),
                    new OA\Property(property: 'minPlayers', type: 'integer', example: 2),
                    new OA\Property(property: 'maxPlayers', type: 'integer', example: 4),
                    new OA\Property(property: 'minimumAge', type: 'integer', example: 8),
                    new OA\Property(property: 'duration', type: 'integer', example: 45)
                ]
            )
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
        // Récupération des données envoyées en formulaire ou en JSON.
        $data = $this->getRequestData($request);

        if ($data === null) {
            return new JsonResponse([
                'message' => 'Les données envoyées sont invalides.'
            ], 400);
        }

        // Vérification des champs obligatoires.
        $requiredFields = [
            'name',
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

        // Vérification des champs numériques.
        $numericFields = [
            'minPlayers',
            'maxPlayers',
            'minimumAge',
            'duration'
        ];

        foreach ($numericFields as $field) {
            $value = $this->normalizeInteger($data[$field]);

            if ($value === null) {
                return new JsonResponse([
                    'message' => sprintf(
                        'Le champ "%s" doit être un entier.',
                        $field
                    )
                ], 400);
            }

            $data[$field] = $value;
        }

        // Vérification de la cohérence du nombre de joueurs.
        if ($data['minPlayers'] > $data['maxPlayers']) {
            return new JsonResponse([
                'message' => 'Le nombre minimum de joueurs ne peut pas être supérieur au nombre maximum.'
            ], 400);
        }

        // La photo est prioritaire si un fichier a été sélectionné.
        $uploadedImage = $request->files->get('imageFile');

        if ($uploadedImage !== null && !$uploadedImage instanceof UploadedFile) {
            return new JsonResponse([
                'message' => 'Le fichier image envoyé est invalide.'
            ], 400);
        }

        // Conservation de la compatibilité avec les anciennes données utilisant une URL.
        $imagePath = isset($data['image']) && is_string($data['image'])
            ? trim($data['image'])
            : '';

        if ($uploadedImage === null && $imagePath === '') {
            return new JsonResponse([
                'message' => 'Veuillez sélectionner une photo ou renseigner une URL d’image.'
            ], 400);
        }

        // Création du jeu.
        $game = new Game();

        $game
            ->setName(trim((string) $data['name']))
            ->setImage($imagePath)
            ->setDescription(trim((string) $data['description']))
            ->setPublisher(trim((string) $data['publisher']))
            ->setMinPlayers($data['minPlayers'])
            ->setMaxPlayers($data['maxPlayers'])
            ->setMinimumAge($data['minimumAge'])
            ->setDuration($data['duration'])
            ->setIsActive(true)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(null);

        // Validation Symfony de l'entité avant l'enregistrement.
        $errors = $validator->validate($game);

        if (count($errors) > 0) {
            return $this->createValidationErrorResponse($errors);
        }

        // Enregistrement du fichier après validation des données.
        if ($uploadedImage instanceof UploadedFile) {
            $imagePath = $this->storeGameImage($uploadedImage);

            if ($imagePath instanceof JsonResponse) {
                return $imagePath;
            }

            $game->setImage($imagePath);
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
    #[Route('/{id}', name: 'update', methods: ['PATCH', 'POST'])]
    #[OA\Patch(
        summary: 'Modifier un jeu',
        description: 'Modifie les informations d’un jeu existant. Une nouvelle image peut être envoyée.'
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
        content: [
            new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Azul'),
                    new OA\Property(property: 'image', type: 'string', example: '/images/games/azul.jpg'),
                    new OA\Property(property: 'description', type: 'string'),
                    new OA\Property(property: 'publisher', type: 'string', example: 'Next Move'),
                    new OA\Property(property: 'minPlayers', type: 'integer', example: 2),
                    new OA\Property(property: 'maxPlayers', type: 'integer', example: 4),
                    new OA\Property(property: 'minimumAge', type: 'integer', example: 8),
                    new OA\Property(property: 'duration', type: 'integer', example: 45),
                    new OA\Property(property: 'isActive', type: 'boolean', example: true)
                ]
            ),
            new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    type: 'object',
                    properties: [
                        new OA\Property(property: 'name', type: 'string'),
                        new OA\Property(property: 'imageFile', type: 'string', format: 'binary'),
                        new OA\Property(property: 'description', type: 'string'),
                        new OA\Property(property: 'publisher', type: 'string'),
                        new OA\Property(property: 'minPlayers', type: 'integer'),
                        new OA\Property(property: 'maxPlayers', type: 'integer'),
                        new OA\Property(property: 'minimumAge', type: 'integer'),
                        new OA\Property(property: 'duration', type: 'integer'),
                        new OA\Property(property: 'isActive', type: 'boolean')
                    ]
                )
            )
        ]
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
        // Recherche du jeu.
        $game = $entityManager
            ->getRepository(Game::class)
            ->find($id);

        if ($game === null) {
            return new JsonResponse([
                'message' => 'Jeu introuvable.'
            ], 404);
        }

        $data = $this->getRequestData($request);

        if ($data === null) {
            return new JsonResponse([
                'message' => 'Les données envoyées sont invalides.'
            ], 400);
        }

        // Mise à jour uniquement des champs transmis.
        if (array_key_exists('name', $data)) {
            $game->setName(trim((string) $data['name']));
        }

        if (array_key_exists('image', $data) && is_string($data['image'])) {
            $game->setImage(trim($data['image']));
        }

        if (array_key_exists('description', $data)) {
            $game->setDescription(trim((string) $data['description']));
        }

        if (array_key_exists('publisher', $data)) {
            $game->setPublisher(trim((string) $data['publisher']));
        }

        $numericFields = [
            'minPlayers' => 'setMinPlayers',
            'maxPlayers' => 'setMaxPlayers',
            'minimumAge' => 'setMinimumAge',
            'duration' => 'setDuration'
        ];

        foreach ($numericFields as $field => $setter) {
            if (array_key_exists($field, $data)) {
                $value = $this->normalizeInteger($data[$field]);

                if ($value === null) {
                    return new JsonResponse([
                        'message' => sprintf(
                            'Le champ "%s" doit être un entier.',
                            $field
                        )
                    ], 400);
                }

                $game->$setter($value);
            }
        }

        if (array_key_exists('isActive', $data)) {
            $isActive = $this->normalizeBoolean($data['isActive']);

            if ($isActive === null) {
                return new JsonResponse([
                    'message' => 'Le champ "isActive" doit être un booléen.'
                ], 400);
            }

            $game->setIsActive($isActive);
        }

        // Vérification de la cohérence du nombre de joueurs.
        if (
            $game->getMinPlayers() !== null
            && $game->getMaxPlayers() !== null
            && $game->getMinPlayers() > $game->getMaxPlayers()
        ) {
            return new JsonResponse([
                'message' => 'Le nombre minimum de joueurs ne peut pas être supérieur au nombre maximum.'
            ], 400);
        }

        // Réception d'une éventuelle nouvelle photo.
        $uploadedImage = $request->files->get('imageFile');

        if ($uploadedImage !== null && !$uploadedImage instanceof UploadedFile) {
            return new JsonResponse([
                'message' => 'Le fichier image envoyé est invalide.'
            ], 400);
        }

        // Mise à jour de la date de modification.
        $game->setUpdatedAt(new \DateTimeImmutable());

        // Validation Symfony de l'entité.
        $errors = $validator->validate($game);

        if (count($errors) > 0) {
            return $this->createValidationErrorResponse($errors);
        }

        // Enregistrement de la nouvelle image si elle a été sélectionnée.
        if ($uploadedImage instanceof UploadedFile) {
            $imagePath = $this->storeGameImage($uploadedImage);

            if ($imagePath instanceof JsonResponse) {
                return $imagePath;
            }

            $game->setImage($imagePath);
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
    #[Route(
        '/{id}/reactivate',
        name: 'api_admin_games_reactivate',
        methods: ['PATCH']
    )]
    #[OA\Patch(
        summary: 'Réactiver un jeu',
        description: 'Réactive un jeu désactivé. Réservé aux administrateurs.'
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
    public function reactivate(
        int $id,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $game = $entityManager
            ->getRepository(Game::class)
            ->find($id);

        if ($game === null) {
            return new JsonResponse([
                'message' => 'Jeu introuvable.'
            ], 404);
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
        description: 'Désactive un jeu sans supprimer ses données de la base.'
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
    public function delete(
        int $id,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $game = $entityManager
            ->getRepository(Game::class)
            ->find($id);

        if ($game === null) {
            return new JsonResponse([
                'message' => 'Jeu introuvable.'
            ], 404);
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
     * Récupère les données depuis une requête JSON ou un formulaire.
     *
     * @return array<string, mixed>|null
     */
    private function getRequestData(Request $request): ?array
    {
        if ($request->request->all() !== []) {
            return $request->request->all();
        }

        $contentType = (string) $request->headers->get('Content-Type', '');

        if (str_contains($contentType, 'application/json')) {
            $data = json_decode($request->getContent(), true);

            return is_array($data) ? $data : null;
        }

        return [];
    }

    /**
     * Vérifie et enregistre une image dans public/images/games.
     *
     * @return string|JsonResponse Chemin public de l'image ou réponse d'erreur.
     */
    private function storeGameImage(UploadedFile $image): string|JsonResponse
    {
        // Refus des fichiers trop volumineux.
        if ($image->getSize() > self::MAX_IMAGE_SIZE) {
            return new JsonResponse([
                'message' => 'La photo ne doit pas dépasser 5 Mo.'
            ], 400);
        }

        // Détection du type MIME réel du fichier.
        $mimeType = $image->getMimeType();

        if (
            $mimeType === false
            || !array_key_exists($mimeType, self::ALLOWED_IMAGE_MIME_TYPES)
        ) {
            return new JsonResponse([
                'message' => 'Format d’image non accepté. Utilisez JPG, PNG, WEBP ou GIF.'
            ], 400);
        }

        $projectDirectory = $this->getParameter('kernel.project_dir');
        $uploadDirectory = $projectDirectory . '/public/images/games';

        // Création du dossier si nécessaire.
        if (
            !is_dir($uploadDirectory)
            && !mkdir($uploadDirectory, 0755, true)
            && !is_dir($uploadDirectory)
        ) {
            return new JsonResponse([
                'message' => 'Impossible de préparer le dossier de stockage des images.'
            ], 500);
        }

        // Génération d'un nom unique indépendant du nom fourni par l'utilisateur.
        $extension = self::ALLOWED_IMAGE_MIME_TYPES[$mimeType];
        $filename = bin2hex(random_bytes(16)) . '.' . $extension;

        try {
            $image->move($uploadDirectory, $filename);
        } catch (\Throwable) {
            return new JsonResponse([
                'message' => 'Impossible d’enregistrer la photo sur le serveur.'
            ], 500);
        }

        return '/images/games/' . $filename;
    }

    /**
     * Convertit une valeur en entier sans accepter les valeurs invalides.
     */
    private function normalizeInteger(mixed $value): ?int
    {
        if (is_int($value)) {
            return $value;
        }

        if (
            is_string($value)
            && $value !== ''
            && preg_match('/^-?\d+$/', $value) === 1
        ) {
            return (int) $value;
        }

        return null;
    }

    /**
     * Convertit les valeurs de formulaire en booléen.
     */
    private function normalizeBoolean(mixed $value): ?bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if ($value === '1' || $value === 'true') {
            return true;
        }

        if ($value === '0' || $value === 'false') {
            return false;
        }

        return null;
    }

    /**
     * Construit une réponse contenant les erreurs de validation Symfony.
     */
    private function createValidationErrorResponse(
        iterable $errors
    ): JsonResponse {
        $messages = [];

        foreach ($errors as $error) {
            $messages[] = $error->getMessage();
        }

        return new JsonResponse([
            'message' => 'Les données du jeu sont invalides.',
            'errors' => $messages
        ], 400);
    }

    /**
     * Prépare les informations d'un jeu pour la réponse JSON.
     *
     * @return array<string, mixed>
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