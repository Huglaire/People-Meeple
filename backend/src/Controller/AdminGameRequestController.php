<?php

namespace App\Controller;

use App\Entity\Game;
use App\Entity\GameRequest;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
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
    private const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

    private const ALLOWED_IMAGE_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
    ];

    /**
     * Retourne toutes les demandes de jeux.
     */
    #[Route('', name: 'api_admin_game_requests_list', methods: ['GET'])]
    #[OA\Get(
        summary: 'Lister les demandes de jeux',
        description: 'Retourne toutes les demandes de jeux. Les demandes en attente sont affichées en premier, de la plus ancienne à la plus récente. Les demandes traitées suivent, de la plus récente à la plus ancienne. Réservé aux administrateurs.'
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
        // Récupération de toutes les demandes avant de les trier.
        $gameRequests = $entityManager
            ->getRepository(GameRequest::class)
            ->findAll();

        // Les demandes en attente apparaissent en premier, de la plus ancienne à la plus récente.
        // Les demandes traitées apparaissent ensuite, de la plus récente à la plus ancienne.
        usort($gameRequests, static function (
            GameRequest $a,
            GameRequest $b
        ): int {
            $aIsPending = $a->getStatus() === 'pending';
            $bIsPending = $b->getStatus() === 'pending';

            // Priorité aux demandes en attente.
            if ($aIsPending !== $bIsPending) {
                return $aIsPending ? -1 : 1;
            }

            $aCreatedAt = $a->getCreatedAt();
            $bCreatedAt = $b->getCreatedAt();

            // Les dates absentes sont placées après les dates renseignées.
            if ($aCreatedAt === null && $bCreatedAt !== null) {
                return 1;
            }

            if ($aCreatedAt !== null && $bCreatedAt === null) {
                return -1;
            }

            if ($aCreatedAt === null && $bCreatedAt === null) {
                return 0;
            }

            // En attente : ordre chronologique croissant.
            if ($aIsPending) {
                return $aCreatedAt <=> $bCreatedAt;
            }

            // Demandes traitées : ordre chronologique décroissant.
            return $bCreatedAt <=> $aCreatedAt;
        });

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
        description: 'Crée le jeu dans le catalogue puis accepte la demande dans une transaction. Les données sont envoyées en multipart/form-data. Une image JPEG, PNG, WebP ou GIF de 5 Mo maximum peut être jointe. Réservé aux administrateurs.'
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
                    new OA\Property(property: 'name', type: 'string', example: 'Sky Team'),
                    new OA\Property(property: 'imageFile', type: 'string', format: 'binary', description: 'Image facultative : JPEG, PNG, WebP ou GIF, 5 Mo maximum.'),
                    new OA\Property(property: 'description', type: 'string', example: 'Un jeu coopératif pour deux joueurs.'),
                    new OA\Property(property: 'publisher', type: 'string', example: 'Scorpion Masqué'),
                    new OA\Property(property: 'minPlayers', type: 'integer', example: 2),
                    new OA\Property(property: 'maxPlayers', type: 'integer', example: 2),
                    new OA\Property(property: 'minimumAge', type: 'integer', example: 12),
                    new OA\Property(property: 'duration', type: 'integer', example: 20)
                ]
            )
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

        // Lecture des champs envoyés en multipart/form-data.
        $data = $request->request->all();

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

        // Vérification des champs textuels.
        foreach (['name', 'description', 'publisher'] as $field) {
            if (!is_string($data[$field]) || trim($data[$field]) === '') {
                return new JsonResponse([
                    'message' => sprintf('Le champ "%s" doit être un texte non vide.', $field)
                ], 400);
            }
        }

        // Vérification des champs numériques transmis par FormData.
        $numericFields = [
            'minPlayers',
            'maxPlayers',
            'minimumAge',
            'duration'
        ];

        $numericData = [];

        foreach ($numericFields as $field) {
            $value = $data[$field];

            if (
                !is_string($value)
                || $value === ''
                || filter_var($value, FILTER_VALIDATE_INT) === false
            ) {
                return new JsonResponse([
                    'message' => sprintf('Le champ "%s" doit être un entier.', $field)
                ], 400);
            }

            $numericData[$field] = (int) $value;

            if ($numericData[$field] < 0) {
                return new JsonResponse([
                    'message' => sprintf('Le champ "%s" ne peut pas être négatif.', $field)
                ], 400);
            }
        }

        if (
            $numericData['minPlayers'] < 1
            || $numericData['minPlayers'] > $numericData['maxPlayers']
        ) {
            return new JsonResponse([
                'message' => 'Le nombre minimum de joueurs doit être supérieur ou égal à 1 et ne peut pas dépasser le maximum.'
            ], 400);
        }

        // Récupération et validation de l'image facultative.
        $imageFile = $request->files->get('imageFile');

        if ($imageFile !== null && !$imageFile instanceof UploadedFile) {
            return new JsonResponse([
                'message' => 'Le fichier image transmis est invalide.'
            ], 400);
        }

        if ($imageFile instanceof UploadedFile) {
            if (!$imageFile->isValid()) {
                return new JsonResponse([
                    'message' => 'Le transfert de l’image a échoué.'
                ], 400);
            }

            if ($imageFile->getSize() > self::MAX_IMAGE_SIZE) {
                return new JsonResponse([
                    'message' => 'L’image ne doit pas dépasser 5 Mo.'
                ], 400);
            }

            // Le type MIME est déterminé côté serveur, pas à partir du nom du fichier.
            $mimeType = $imageFile->getMimeType();

            if (!in_array($mimeType, self::ALLOWED_IMAGE_MIME_TYPES, true)) {
                return new JsonResponse([
                    'message' => 'Format d’image non accepté. Utilisez un fichier JPEG, PNG, WebP ou GIF.'
                ], 400);
            }
        }

        // Prépare le chemin de l'image sans déplacer le fichier avant la validation.
        $imagePath = '/images/meeple-default.png';

        if ($imageFile instanceof UploadedFile) {
            $extensionByMimeType = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
                'image/gif' => 'gif',
            ];

            $imageFilename = bin2hex(random_bytes(16))
                . '.'
                . $extensionByMimeType[$mimeType];

            $imagePath = '/images/games/' . $imageFilename;
        }

        // Préparation du jeu à partir des informations du formulaire.
        $game = new Game();

        $game
            ->setName(trim($data['name']))
            ->setImage($imagePath)
            ->setDescription(trim($data['description']))
            ->setPublisher(trim($data['publisher']))
            ->setMinPlayers($numericData['minPlayers'])
            ->setMaxPlayers($numericData['maxPlayers'])
            ->setMinimumAge($numericData['minimumAge'])
            ->setDuration($numericData['duration'])
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

        // Vérifie le dossier de destination avant de commencer la transaction.
        $uploadDirectory = $this->getParameter('kernel.project_dir')
            . '/public/images/games';

        if (
            $imageFile instanceof UploadedFile
            && !is_dir($uploadDirectory)
            && !mkdir($uploadDirectory, 0775, true)
            && !is_dir($uploadDirectory)
        ) {
            return new JsonResponse([
                'message' => 'Impossible de préparer le dossier de stockage des images.'
            ], 500);
        }

        $connection = $entityManager->getConnection();
        $connection->beginTransaction();

        try {
            // Déplace la photo si une image a été sélectionnée.
            if ($imageFile instanceof UploadedFile) {
                $imageFile->move($uploadDirectory, $imageFilename);
            }

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
            // Annule les écritures en base si une opération échoue.
            if ($connection->isTransactionActive()) {
                $connection->rollBack();
            }

            // Supprime la photo si elle a été déplacée mais que la transaction échoue.
            if (
                $imageFile instanceof UploadedFile
                && isset($imageFilename)
                && is_file($uploadDirectory . '/' . $imageFilename)
            ) {
                unlink($uploadDirectory . '/' . $imageFilename);
            }

            // Réinitialise l'EntityManager après une erreur de persistance.
            $entityManager->clear();

            return new JsonResponse([
                'message' => 'Impossible de créer le jeu et de traiter la demande. Aucune modification en base de données n’a été conservée.'
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