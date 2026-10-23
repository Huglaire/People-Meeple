<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[OA\Tag(name: 'Admin - User')]
#[Route('/api/admin/users', name: 'api_admin_users_')]
#[IsGranted('ROLE_ADMIN')]
final class AdminUserController extends AbstractController
{
    /**
     * Liste les utilisateurs avec recherche et filtre par statut.
     */
    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(
        summary: 'Lister les utilisateurs',
        description: 'Retourne la liste des utilisateurs avec recherche par pseudo ou email et filtre par statut.'
    )]
    #[OA\Parameter(
        name: 'search',
        description: 'Recherche dans le pseudo et l’adresse email',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'string')
    )]
    #[OA\Parameter(
        name: 'status',
        description: 'Filtre par statut du compte',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'string', enum: ['active', 'inactive', 'all'], default: 'all')
    )]
    #[OA\Response(
        response: 200,
        description: 'Liste des utilisateurs.'
    )]
    #[OA\Response(
        response: 401,
        description: 'Authentification requise.'
    )]
    #[OA\Response(
        response: 403,
        description: 'Accès réservé aux administrateurs.'
    )]
    #[OA\SecurityRequirement(name: 'Bearer')]
    public function list(
        Request $request,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $search = trim((string) $request->query->get('search', ''));
        $status = (string) $request->query->get('status', 'all');

        if (!in_array($status, ['active', 'inactive', 'all'], true)) {
            return new JsonResponse([
                'message' => 'Le filtre "status" doit être active, inactive ou all.',
            ], 400);
        }

        $queryBuilder = $entityManager
            ->getRepository(User::class)
            ->createQueryBuilder('u');

        // Recherche insensible à la casse dans le pseudo et l'adresse email
        if ($search !== '') {
            $queryBuilder
                ->andWhere(
                    'LOWER(u.pseudo) LIKE :search OR LOWER(u.email) LIKE :search'
                )
                ->setParameter('search', '%' . mb_strtolower($search) . '%');
        }

        // Filtre selon le statut du compte
        if ($status === 'active') {
            $queryBuilder->andWhere('u.isActive = :active');
            $queryBuilder->setParameter('active', true);
        } elseif ($status === 'inactive') {
            $queryBuilder->andWhere('u.isActive = :active');
            $queryBuilder->setParameter('active', false);
        }

        $users = $queryBuilder
            ->orderBy('u.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        $results = [];

        foreach ($users as $user) {
            // Ne retourne que les informations utiles à la gestion administrative
            $results[] = [
                'id' => $user->getId(),
                'pseudo' => $user->getPseudo(),
                'email' => $user->getEmail(),
                'role' => $user->getRole(),
                'active' => $user->isActive(),
                'createdAt' => $user->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            ];
        }

        return new JsonResponse([
            'total' => count($results),
            'users' => $results,
        ]);
    }

    /**
     * Consulte les informations détaillées d'un utilisateur.
     */
    #[Route('/{id}', name: 'show', requirements: ['id' => '\d+'], methods: ['GET'])]
    #[OA\Get(
        summary: 'Consulter un utilisateur',
        description: 'Retourne les informations administratives d’un utilisateur.'
    )]
    #[OA\Response(
        response: 200,
        description: 'Informations de l’utilisateur.'
    )]
    #[OA\Response(
        response: 404,
        description: 'Utilisateur introuvable.'
    )]
    #[OA\SecurityRequirement(name: 'Bearer')]
    public function show(
        int $id,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $entityManager->getRepository(User::class)->find($id);

        if (!$user instanceof User) {
            return new JsonResponse([
                'message' => 'Utilisateur introuvable.',
            ], 404);
        }

        return new JsonResponse([
            'id' => $user->getId(),
            'pseudo' => $user->getPseudo(),
            'email' => $user->getEmail(),
            'dateOfBirth' => $user->getDateOfBirth()?->format('Y-m-d'),
            'department' => $user->getDepartment(),
            'city' => $user->getCity(),
            'cityVisible' => $user->isCityVisible(),
            'role' => $user->getRole(),
            'active' => $user->isActive(),
            'createdAt' => $user->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'updatedAt' => $user->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
            'profilePicture' => $user->getProfilePicture(),
        ]);
    }

    /**
     * Active ou désactive un compte sans supprimer ses données.
     */
    #[Route(
        '/{id}/status',
        name: 'status',
        requirements: ['id' => '\d+'],
        methods: ['PATCH']
    )]
    #[OA\Patch(
        summary: 'Modifier le statut d’un compte',
        description: 'Active ou désactive un compte sans supprimer ses données.'
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['active'],
            properties: [
                new OA\Property(
                    property: 'active',
                    type: 'boolean',
                    example: false
                ),
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: 'Statut du compte modifié.'
    )]
    #[OA\Response(
        response: 400,
        description: 'Données invalides.'
    )]
    #[OA\Response(
        response: 403,
        description: 'Opération interdite.'
    )]
    #[OA\Response(
        response: 404,
        description: 'Utilisateur introuvable.'
    )]
    #[OA\SecurityRequirement(name: 'Bearer')]
    public function updateStatus(
        int $id,
        Request $request,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $entityManager->getRepository(User::class)->find($id);

        if (!$user instanceof User) {
            return new JsonResponse([
                'message' => 'Utilisateur introuvable.',
            ], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (!is_array($data) || !array_key_exists('active', $data) || !is_bool($data['active'])) {
            return new JsonResponse([
                'message' => 'Le champ "active" doit être un booléen.',
            ], 400);
        }

        // Empêche un administrateur de désactiver son propre compte
        $currentUser = $this->getUser();

        if (
            $currentUser instanceof User
            && $currentUser->getId() === $user->getId()
            && $data['active'] === false
        ) {
            return new JsonResponse([
                'message' => 'Vous ne pouvez pas désactiver votre propre compte depuis cette interface.',
            ], 403);
        }

        // Met à jour le statut sans supprimer le compte ni son historique
        $user->setIsActive($data['active']);
        $user->setUpdatedAt(new \DateTimeImmutable());

        $entityManager->flush();

        return new JsonResponse([
            'message' => $data['active']
                ? 'Compte activé avec succès.'
                : 'Compte désactivé avec succès.',
            'id' => $user->getId(),
            'active' => $user->isActive(),
        ]);
    }
}