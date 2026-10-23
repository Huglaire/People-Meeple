<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\KernelInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[OA\Tag(name: 'User')]
final class ProfilePictureController extends AbstractController
{
    /**
     * Modifie la photo de profil de l'utilisateur connecté.
     */
    #[Route(
        '/api/me/profile-picture',
        name: 'api_me_profile_picture',
        methods: ['POST']
    )]
    #[OA\Post(
        summary: 'Modifier ma photo de profil',
        description: 'Permet à l’utilisateur authentifié de remplacer sa photo de profil. Les formats JPEG, PNG, WebP et GIF sont acceptés, dans la limite de 10 Mo.',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    type: 'object',
                    required: ['profilePicture'],
                    properties: [
                        new OA\Property(
                            property: 'profilePicture',
                            description: 'Fichier image de la nouvelle photo de profil (10 Mo maximum).',
                            type: 'string',
                            format: 'binary'
                        )
                    ]
                )
            )
        )
    )]
    #[OA\Response(
        response: 200,
        description: 'Photo de profil modifiée avec succès.',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(
                    property: 'message',
                    type: 'string',
                    example: 'Photo de profil modifiée avec succès.'
                ),
                new OA\Property(
                    property: 'profilePicture',
                    type: 'string',
                    example: 'a1b2c3d4e5f607182930aabbccddeeff.jpg'
                )
            ]
        )
    )]
    #[OA\Response(
        response: 400,
        description: 'Fichier absent, transfert invalide, taille excessive ou format non autorisé.',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(
                    property: 'message',
                    type: 'string',
                    example: 'Veuillez sélectionner une image.'
                )
            ]
        )
    )]
    #[OA\Response(
        response: 401,
        description: 'Authentification requise.'
    )]
    #[OA\Response(
        response: 500,
        description: 'Impossible de préparer le dossier ou d’enregistrer l’image.',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(
                    property: 'message',
                    type: 'string',
                    example: 'Impossible d’enregistrer la nouvelle image.'
                )
            ]
        )
    )]
    #[OA\SecurityRequirement(name: 'Bearer')]
    public function update(
        Request $request,
        #[CurrentUser] User $user,
        EntityManagerInterface $entityManager,
        KernelInterface $kernel,
        LoggerInterface $logger
    ): JsonResponse {
        // Récupère le fichier envoyé dans le formulaire
        $file = $request->files->get('profilePicture');

        if (!$file instanceof UploadedFile) {
            return new JsonResponse([
                'message' => 'Veuillez sélectionner une image.'
            ], 400);
        }

        // Vérifie que le transfert du fichier s'est correctement déroulé
        if (!$file->isValid()) {
            $logger->warning('Échec du transfert de la photo de profil.', [
                'error' => $file->getError(),
                'originalName' => $file->getClientOriginalName(),
            ]);

            return new JsonResponse([
                'message' => 'Le transfert de l’image a échoué.'
            ], 400);
        }

        // Limite la taille de l'image à 10 Mo
        if ($file->getSize() > 10 * 1024 * 1024) {
            return new JsonResponse([
                'message' => 'L’image ne doit pas dépasser 10 Mo.'
            ], 400);
        }

        // Vérifie le type MIME détecté à partir du fichier
        $allowedMimeTypes = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
        ];

        $mimeType = $file->getMimeType();

        if (!isset($allowedMimeTypes[$mimeType])) {
            return new JsonResponse([
                'message' => 'Format non autorisé. Utilisez JPEG, PNG, WebP ou GIF.'
            ], 400);
        }

        // Prépare le dossier public destiné aux photos de profil
        $uploadDirectory = $kernel->getProjectDir() . '/public/images';

        if (
            !is_dir($uploadDirectory)
            && !mkdir($uploadDirectory, 0755, true)
            && !is_dir($uploadDirectory)
        ) {
            $logger->error('Impossible de créer le dossier des photos de profil.', [
                'directory' => $uploadDirectory,
            ]);

            return new JsonResponse([
                'message' => 'Impossible de préparer le dossier des images.'
            ], 500);
        }

        // Génère un nom aléatoire pour éviter les collisions et noms dangereux
        $fileName = bin2hex(random_bytes(16))
            . '.'
            . $allowedMimeTypes[$mimeType];

        try {
            // Déplace l'image dans le dossier public
            $file->move($uploadDirectory, $fileName);
        } catch (FileException $exception) {
            // Enregistre le détail de l'erreur dans les logs Symfony
            $logger->error('Échec du déplacement de la photo de profil.', [
                'directory' => $uploadDirectory,
                'fileName' => $fileName,
                'fileSize' => $file->getSize(),
                'mimeType' => $mimeType,
                'exception' => $exception,
            ]);

            return new JsonResponse([
                'message' => 'Impossible d’enregistrer la nouvelle image.'
            ], 500);
        }

        // Met à jour le nom de la photo dans le compte utilisateur
        $user->setProfilePicture($fileName);
        $user->setUpdatedAt(new \DateTimeImmutable());

        // Enregistre les modifications en base de données
        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Photo de profil modifiée avec succès.',
            'profilePicture' => $fileName
        ]);
    }
}