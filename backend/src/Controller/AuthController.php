<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class AuthController
{
    /**
     * Inscription d'un nouvel utilisateur.
     */
    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    #[OA\Tag(name: 'Authentication')]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: [
                'email',
                'password',
                'pseudo',
                'dateOfBirth',
                'department',
                'city',
                'cityVisible'
            ],
            properties: [
                new OA\Property(
                    property: 'email',
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                ),
                new OA\Property(
                    property: 'password',
                    type: 'string',
                    format: 'password',
                    example: 'MotDePasse123!'
                ),
                new OA\Property(
                    property: 'pseudo',
                    type: 'string',
                    maxLength: 50,
                    example: 'MeeplePlayer'
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
                    example: '75'
                ),
                new OA\Property(
                    property: 'city',
                    type: 'string',
                    maxLength: 100,
                    example: 'Paris'
                ),
                new OA\Property(
                    property: 'cityVisible',
                    type: 'boolean',
                    example: true
                )
            ]
        )
    )]
    #[OA\Response(
        response: 201,
        description: 'Utilisateur créé avec succès.'
    )]
    #[OA\Response(
        response: 400,
        description: 'Données invalides.'
    )]
    #[OA\Response(
        response: 409,
        description: 'Cette adresse email est déjà utilisée.'
    )]
    public function register(
        Request $request,
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

        // Vérification des champs obligatoires
        $requiredFields = [
            'email',
            'password',
            'pseudo',
            'dateOfBirth',
            'department',
            'city',
            'cityVisible'
        ];

        foreach ($requiredFields as $field) {
            if (!array_key_exists($field, $data)) {
                return new JsonResponse([
                    'message' => sprintf(
                        'Le champ "%s" est obligatoire.',
                        $field
                    )
                ], 400);
            }
        }

        // Vérification du type du choix de visibilité de la ville
        if (!is_bool($data['cityVisible'])) {
            return new JsonResponse([
                'message' => 'Le champ "cityVisible" doit être un booléen.'
            ], 400);
        }

        // Conversion et validation de la date de naissance
        try {
            $dateOfBirth = new \DateTimeImmutable($data['dateOfBirth']);
        } catch (\Exception) {
            return new JsonResponse([
                'message' => 'Le champ "dateOfBirth" doit être une date valide.'
            ], 400);
        }

        // Vérification de l'unicité de l'adresse email
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

        // Création du nouvel utilisateur
        $user = new User();

        $user->setEmail($data['email']);

        // Hashage du mot de passe avant son enregistrement
        $user->setPassword(
            $passwordHasher->hashPassword(
                $user,
                $data['password']
            )
        );

        $user->setPseudo($data['pseudo']);
        $user->setDateOfBirth($dateOfBirth);
        $user->setDepartment($data['department']);
        $user->setCity($data['city']);
        $user->setCityVisible($data['cityVisible']);

        // Valeurs définies automatiquement par le serveur
        $user->setIsActive(true);
        $user->setRole('USER');
        $user->setCreatedAt(new \DateTimeImmutable());

        // Validation des contraintes définies sur l'entité User
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

        // Enregistrement de l'utilisateur en base de données
        $entityManager->persist($user);
        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Utilisateur créé avec succès.'
        ], 201);
    }

    /**
     * Réactive un compte précédemment désactivé.
     */
    #[Route('/api/reactivate', name: 'api_reactivate', methods: ['POST'])]
    #[OA\Tag(name: 'Authentication')]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: [
                'email',
                'password'
            ],
            properties: [
                new OA\Property(
                    property: 'email',
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                ),
                new OA\Property(
                    property: 'password',
                    type: 'string',
                    format: 'password',
                    example: 'MotDePasse123!'
                )
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: 'Compte réactivé avec succès.'
    )]
    #[OA\Response(
        response: 401,
        description: 'Email ou mot de passe incorrect.'
    )]
    #[OA\Response(
        response: 409,
        description: 'Le compte est déjà actif.'
    )]
    public function reactivate(
        Request $request,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        // Décodage du JSON envoyé par le client
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return new JsonResponse([
                'message' => 'Le JSON envoyé est invalide.'
            ], 400);
        }

        // Vérification de la présence des identifiants
        if (
            !array_key_exists('email', $data)
            || !array_key_exists('password', $data)
        ) {
            return new JsonResponse([
                'message' => 'Les champs "email" et "password" sont obligatoires.'
            ], 400);
        }

        // Recherche du compte à partir de son email
        $user = $entityManager
            ->getRepository(User::class)
            ->findOneBy([
                'email' => $data['email']
            ]);

        // Vérification des identifiants
        if (
            $user === null
            || !$passwordHasher->isPasswordValid(
                $user,
                $data['password']
            )
        ) {
            return new JsonResponse([
                'message' => 'Email ou mot de passe incorrect.'
            ], 401);
        }

        // Vérifie si le compte est déjà actif
        if ($user->isActive()) {
            return new JsonResponse([
                'message' => 'Ce compte est déjà actif.'
            ], 409);
        }

        // Réactivation du compte sans modifier ses données
        $user->setIsActive(true);
        $user->setUpdatedAt(new \DateTimeImmutable());

        // Enregistrement de la réactivation
        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Compte réactivé avec succès.'
        ]);
    }
}