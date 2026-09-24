<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[OA\Tag(name: 'User')]
final class UserController extends AbstractController
{
    /**
     * Retourne les informations de l'utilisateur connecté.
     */
    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    #[OA\Get(
        summary: 'Récupérer mon profil',
        description: 'Retourne les informations du compte de l’utilisateur authentifié.'
    )]
    #[OA\Response(
        response: 200,
        description: 'Informations de l’utilisateur connecté.'
    )]
    #[OA\Response(
        response: 401,
        description: 'Authentification requise.'
    )]
    #[OA\SecurityRequirement(name: 'bearerAuth')]
    public function me(
        #[CurrentUser] User $user
    ): JsonResponse {
        // Retourne les informations du profil
        return new JsonResponse([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'pseudo' => $user->getPseudo(),
            'dateOfBirth' => $user->getDateOfBirth()?->format('Y-m-d'),
            'department' => $user->getDepartment(),
            'city' => $user->getCity(),
            'cityVisible' => $user->isCityVisible(),
            'role' => $user->getRole(),
            'createdAt' => $user->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'updatedAt' => $user->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
        ]);
    }

    /**
     * Modifie les informations du profil de l'utilisateur connecté.
     */
    #[Route('/api/me', name: 'api_me_update', methods: ['PATCH'])]
    #[OA\Patch(
        summary: 'Modifier mon profil',
        description: 'Modifie les informations du profil de l’utilisateur authentifié.'
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(
                    property: 'email',
                    type: 'string',
                    format: 'email',
                    maxLength: 180,
                    example: 'nouveau@example.com'
                ),
                new OA\Property(
                    property: 'pseudo',
                    type: 'string',
                    maxLength: 50,
                    example: 'NouveauPseudo'
                ),
                new OA\Property(
                    property: 'dateOfBirth',
                    type: 'string',
                    format: 'date',
                    example: '1990-05-15'
                ),
                new OA\Property(
                    property: 'department',
                    type: 'string',
                    maxLength: 3,
                    example: '92'
                ),
                new OA\Property(
                    property: 'city',
                    type: 'string',
                    maxLength: 100,
                    example: 'Clamart'
                ),
                new OA\Property(
                    property: 'cityVisible',
                    type: 'boolean',
                    example: true
                ),
                new OA\Property(
                    property: 'password',
                    type: 'string',
                    format: 'password',
                    example: 'NouveauMotDePasse123!'
                )
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: 'Profil modifié avec succès.'
    )]
    #[OA\Response(
        response: 400,
        description: 'Données invalides.'
    )]
    #[OA\Response(
        response: 401,
        description: 'Authentification requise.'
    )]
    #[OA\Response(
        response: 409,
        description: 'Cette adresse email est déjà utilisée.'
    )]
    #[OA\SecurityRequirement(name: 'bearerAuth')]
    public function update(
        Request $request,
        #[CurrentUser] User $user,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        ValidatorInterface $validator
    ): JsonResponse {
        // Décodage du JSON envoyé par le client
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return new JsonResponse([
                'message' => 'Le JSON envoyé est invalide.'
            ], 400);
        }

        // Mise à jour de l'adresse email
        if (array_key_exists('email', $data)) {
            if (!is_string($data['email']) || trim($data['email']) === '') {
                return new JsonResponse([
                    'message' => 'Le champ "email" doit être une adresse email valide.'
                ], 400);
            }

            if ($data['email'] !== $user->getEmail()) {
                $existingUser = $entityManager
                    ->getRepository(User::class)
                    ->findOneBy([
                        'email' => $data['email']
                    ]);

                if ($existingUser !== null) {
                    return new JsonResponse([
                        'message' => 'Cette adresse email est déjà utilisée.'
                    ], 409);
                }

                $user->setEmail($data['email']);
            }
        }

        // Mise à jour du pseudo
        if (array_key_exists('pseudo', $data)) {
            if (!is_string($data['pseudo']) || trim($data['pseudo']) === '') {
                return new JsonResponse([
                    'message' => 'Le champ "pseudo" ne peut pas être vide.'
                ], 400);
            }

            $user->setPseudo($data['pseudo']);
        }

        // Mise à jour de la date de naissance
        if (array_key_exists('dateOfBirth', $data)) {
            if (!is_string($data['dateOfBirth'])) {
                return new JsonResponse([
                    'message' => 'Le champ "dateOfBirth" doit être une date valide.'
                ], 400);
            }

            try {
                $dateOfBirth = new \DateTimeImmutable($data['dateOfBirth']);
            } catch (\Exception) {
                return new JsonResponse([
                    'message' => 'Le champ "dateOfBirth" doit être une date valide.'
                ], 400);
            }

            $user->setDateOfBirth($dateOfBirth);
        }

        // Mise à jour du département
        if (array_key_exists('department', $data)) {
            if (!is_string($data['department']) || trim($data['department']) === '') {
                return new JsonResponse([
                    'message' => 'Le champ "department" ne peut pas être vide.'
                ], 400);
            }

            $user->setDepartment($data['department']);
        }

        // Mise à jour de la ville
        if (array_key_exists('city', $data)) {
            if ($data['city'] !== null && !is_string($data['city'])) {
                return new JsonResponse([
                    'message' => 'Le champ "city" doit être une chaîne de caractères ou null.'
                ], 400);
            }

            $user->setCity($data['city']);
        }

        // Mise à jour de la visibilité de la ville
        if (array_key_exists('cityVisible', $data)) {
            if (!is_bool($data['cityVisible'])) {
                return new JsonResponse([
                    'message' => 'Le champ "cityVisible" doit être un booléen.'
                ], 400);
            }

            $user->setCityVisible($data['cityVisible']);
        }

        // Modification facultative du mot de passe
        if (array_key_exists('password', $data)) {
            if (!is_string($data['password']) || trim($data['password']) === '') {
                return new JsonResponse([
                    'message' => 'Le champ "password" ne peut pas être vide.'
                ], 400);
            }

            $user->setPassword(
                $passwordHasher->hashPassword(
                    $user,
                    $data['password']
                )
            );
        }

        // Mise à jour de la date de modification
        $user->setUpdatedAt(new \DateTimeImmutable());

        // Validation des données modifiées
        $errors = $validator->validate($user);

        if (count($errors) > 0) {
            $validationErrors = [];

            foreach ($errors as $error) {
                $validationErrors[] = $error->getMessage();
            }

            return new JsonResponse([
                'message' => 'Les données envoyées sont invalides.',
                'errors' => $validationErrors
            ], 400);
        }

        // Enregistrement des modifications
        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Profil modifié avec succès.'
        ]);
    }

    /**
     * Désactive le compte de l'utilisateur connecté.
     *
     * Aucune donnée n'est supprimée.
     * Le compte pourra être réactivé ultérieurement.
     */
    #[Route('/api/me', name: 'api_me_delete', methods: ['DELETE'])]
    #[OA\Delete(
        summary: 'Désactiver mon compte',
        description: 'Désactive le compte de l’utilisateur sans supprimer ses données.'
    )]
    #[OA\Response(
        response: 200,
        description: 'Compte désactivé avec succès.'
    )]
    #[OA\Response(
        response: 401,
        description: 'Authentification requise.'
    )]
    #[OA\SecurityRequirement(name: 'bearerAuth')]
    public function delete(
        #[CurrentUser] User $user,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Désactivation du compte sans supprimer aucune donnée
        $user->setIsActive(false);
        $user->setUpdatedAt(new \DateTimeImmutable());

        // Enregistrement de la désactivation
        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Compte désactivé avec succès.'
        ]);
    }
}