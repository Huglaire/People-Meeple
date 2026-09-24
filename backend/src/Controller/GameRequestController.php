<?php

namespace App\Controller;

use App\Entity\GameRequest;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/game-requests')]
#[OA\Tag(name: 'Game Request')]
final class GameRequestController extends AbstractController
{
    /**
     * Crée une demande d'ajout de jeu.
     */
    #[Route('', name: 'api_game_requests_create', methods: ['POST'])]
    #[OA\Post(
        summary: 'Proposer un jeu',
        description: 'Permet à un utilisateur connecté de proposer un nouveau jeu à ajouter à la collection.'
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: [
                'name',
                'publisher',
                'description'
            ],
            properties: [
                new OA\Property(
                    property: 'name',
                    type: 'string',
                    example: 'Cascadia'
                ),
                new OA\Property(
                    property: 'publisher',
                    type: 'string',
                    example: 'Lucky Duck Games'
                ),
                new OA\Property(
                    property: 'description',
                    type: 'string',
                    example: 'Un jeu de construction de paysages et de placement d’animaux.'
                )
            ]
        )
    )]
    #[OA\Response(
        response: 201,
        description: 'Demande créée avec succès.'
    )]
    #[OA\Response(
        response: 400,
        description: 'Données invalides.'
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
        foreach (['name', 'publisher', 'description'] as $field) {
            if (!array_key_exists($field, $data)) {
                return new JsonResponse([
                    'message' => sprintf('Le champ "%s" est obligatoire.', $field)
                ], 400);
            }

            if (!is_string($data[$field]) || trim($data[$field]) === '') {
                return new JsonResponse([
                    'message' => sprintf('Le champ "%s" doit être une chaîne non vide.', $field)
                ], 400);
            }
        }

        // Création de la demande
        $gameRequest = new GameRequest();

        $gameRequest
            ->setName(trim($data['name']))
            ->setPublisher(trim($data['publisher']))
            ->setDescription(trim($data['description']))
            ->setStatus('pending')
            ->setCreatedAt(new \DateTimeImmutable())
            ->setProcessedAt(null)
            ->setUser($this->getUser());

        // Validation Symfony de l'entité
        $errors = $validator->validate($gameRequest);

        if (count($errors) > 0) {
            $messages = [];

            foreach ($errors as $error) {
                $messages[] = $error->getMessage();
            }

            return new JsonResponse([
                'message' => 'Les données de la demande sont invalides.',
                'errors' => $messages
            ], 400);
        }

        // Enregistrement de la demande
        $entityManager->persist($gameRequest);
        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Demande de jeu créée avec succès.',
            'gameRequest' => [
                'id' => $gameRequest->getId(),
                'name' => $gameRequest->getName(),
                'publisher' => $gameRequest->getPublisher(),
                'description' => $gameRequest->getDescription(),
                'status' => $gameRequest->getStatus(),
                'createdAt' => $gameRequest->getCreatedAt()?->format('Y-m-d H:i:s'),
                'processedAt' => $gameRequest->getProcessedAt()?->format('Y-m-d H:i:s'),
            ]
        ], 201);
    }

    /**
     * Retourne les demandes de l'utilisateur connecté.
     */
    #[Route('', name: 'api_game_requests_list', methods: ['GET'])]
    #[OA\Get(
        summary: 'Lister mes demandes',
        description: 'Retourne les demandes de jeux créées par l’utilisateur connecté.'
    )]
    #[OA\Response(
        response: 200,
        description: 'Liste des demandes récupérée avec succès.'
    )]
    public function list(
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Récupération des demandes appartenant à l'utilisateur connecté
        $gameRequests = $entityManager
            ->getRepository(GameRequest::class)
            ->findBy(
                ['user' => $this->getUser()],
                ['createdAt' => 'DESC']
            );

        // Préparation des données retournées par l'API
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
            ];
        }

        return new JsonResponse($result);
    }
}