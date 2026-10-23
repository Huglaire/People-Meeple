<?php

namespace App\Controller;

use App\Document\GameView;
use App\Document\RegistrationEvent;
use App\Entity\Game;
use Doctrine\ODM\MongoDB\DocumentManager;
use Doctrine\ORM\EntityManagerInterface;
use MongoDB\BSON\UTCDateTime;
use OpenApi\Attributes as OA;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/statistics')]
#[IsGranted('ROLE_ADMIN')]
#[OA\Tag(name: 'Admin - Statistics')]
final class StatisticsController extends AbstractController
{
    #[Route('', name: 'api_admin_statistics', methods: ['GET'])]
    #[OA\Get(
        summary: 'Récupérer les statistiques de la plateforme',
        description: 'Retourne les dix jeux les plus consultés et le nombre de nouvelles inscriptions pour chacune des douze dernières semaines. Les événements sont stockés dans MongoDB.'
    )]
    #[OA\Response(
        response: 200,
        description: 'Statistiques récupérées avec succès',
        content: new OA\JsonContent(
            properties: [
                new OA\Property(
                    property: 'mostViewedGames',
                    type: 'array',
                    items: new OA\Items(
                        properties: [
                            new OA\Property(
                                property: 'gameId',
                                type: 'integer',
                                example: 242
                            ),
                            new OA\Property(
                                property: 'name',
                                type: 'string',
                                example: 'Akropolis'
                            ),
                            new OA\Property(
                                property: 'views',
                                type: 'integer',
                                example: 12
                            ),
                        ],
                        type: 'object'
                    )
                ),
                new OA\Property(
                    property: 'registrationsByWeek',
                    type: 'array',
                    items: new OA\Items(
                        properties: [
                            new OA\Property(
                                property: 'week',
                                type: 'string',
                                example: '2026-W43'
                            ),
                            new OA\Property(
                                property: 'registrations',
                                type: 'integer',
                                example: 5
                            ),
                        ],
                        type: 'object'
                    )
                ),
            ],
            type: 'object'
        )
    )]
    #[OA\Response(
        response: 403,
        description: 'Accès réservé aux administrateurs'
    )]
    #[OA\Response(
        response: 503,
        description: 'Impossible de récupérer les statistiques'
    )]
    public function index(
        DocumentManager $documentManager,
        EntityManagerInterface $entityManager,
        LoggerInterface $logger
    ): JsonResponse {
        try {
            /*
             * 1. Récupération des dix jeux les plus consultés dans MongoDB.
             */
            $gameViewCollection = $documentManager->getDocumentCollection(
                GameView::class
            );

            $gameViewResults = $gameViewCollection->aggregate([
                [
                    '$group' => [
                        '_id' => '$gameId',
                        'views' => ['$sum' => 1],
                    ],
                ],
                [
                    '$sort' => [
                        'views' => -1,
                        '_id' => 1,
                    ],
                ],
                [
                    '$limit' => 10,
                ],
            ]);

            $gameViewRows = iterator_to_array($gameViewResults);

            // Récupère les identifiants des jeux présents dans les résultats.
            $gameIds = [];

            foreach ($gameViewRows as $row) {
                $gameIds[] = (int) $row['_id'];
            }

            /*
             * 2. Récupération des noms des jeux depuis MySQL.
             *
             * MongoDB conserve les événements de consultation.
             * MySQL reste la source de référence pour les informations des jeux.
             */
            $gameNamesById = [];

            if ($gameIds !== []) {
                $games = $entityManager
                    ->createQueryBuilder()
                    ->select('g.id, g.name')
                    ->from(Game::class, 'g')
                    ->where('g.id IN (:ids)')
                    ->setParameter('ids', $gameIds)
                    ->getQuery()
                    ->getArrayResult();

                foreach ($games as $game) {
                    $gameNamesById[(int) $game['id']] = $game['name'];
                }
            }

            $mostViewedGames = [];

            foreach ($gameViewRows as $row) {
                $gameId = (int) $row['_id'];

                // Ignore les jeux qui n'existent plus dans la base MySQL.
                if (!isset($gameNamesById[$gameId])) {
                    continue;
                }

                $mostViewedGames[] = [
                    'gameId' => $gameId,
                    'name' => $gameNamesById[$gameId],
                    'views' => (int) $row['views'],
                ];
            }

            /*
             * 3. Définition de la période des douze dernières semaines.
             *
             * Les semaines commencent le lundi et sont calculées selon
             * le fuseau horaire français.
             */
            $timezone = new \DateTimeZone('Europe/Paris');

            $currentWeekStart = (new \DateTimeImmutable(
                'now',
                $timezone
            ))
                ->modify('monday this week')
                ->setTime(0, 0, 0);

            $firstWeekStart = $currentWeekStart->modify('-11 weeks');

            /*
             * Convertit la date en BSON UTCDateTime.
             *
             * Le filtre MongoDB doit comparer des dates BSON et non
             * un objet DateTimeImmutable PHP.
             */
            $firstWeekStartMongo = new UTCDateTime(
                $firstWeekStart->getTimestamp() * 1000
            );

            /*
             * 4. Agrégation des inscriptions dans MongoDB.
             */
            $registrationCollection = $documentManager
                ->getDocumentCollection(RegistrationEvent::class);

            $registrationResults = $registrationCollection->aggregate([
                [
                    '$match' => [
                        'registeredAt' => [
                            '$gte' => $firstWeekStartMongo,
                        ],
                    ],
                ],
                [
                    '$group' => [
                        '_id' => [
                            '$dateToString' => [
                                'format' => '%G-W%V',
                                'date' => '$registeredAt',
                                'timezone' => 'Europe/Paris',
                            ],
                        ],
                        'registrations' => ['$sum' => 1],
                    ],
                ],
                [
                    '$sort' => [
                        '_id' => 1,
                    ],
                ],
            ]);

            $registrationRows = iterator_to_array(
                $registrationResults
            );

            // Associe chaque semaine à son nombre d'inscriptions.
            $registrationsByWeekMap = [];

            foreach ($registrationRows as $row) {
                $weekLabel = (string) $row['_id'];

                $registrationsByWeekMap[$weekLabel] = (int) (
                    $row['registrations'] ?? 0
                );
            }

            /*
             * 5. Préparation des douze semaines.
             *
             * Les semaines sans inscription sont conservées avec une
             * valeur de zéro. Aucun événement historique n'est inventé.
             */
            $registrationsByWeek = [];

            for ($week = 0; $week < 12; $week++) {
                $weekStart = $firstWeekStart->modify(
                    sprintf('+%d weeks', $week)
                );

                $weekLabel = $weekStart->format('o-\WW');

                $registrationsByWeek[] = [
                    'week' => $weekLabel,
                    'registrations' => $registrationsByWeekMap[
                        $weekLabel
                    ] ?? 0,
                ];
            }

            /*
             * 6. Retourne les deux statistiques au frontend.
             */
            return $this->json([
                'mostViewedGames' => $mostViewedGames,
                'registrationsByWeek' => $registrationsByWeek,
            ]);
        } catch (\Throwable $exception) {
            $logger->error(
                'Impossible de récupérer les statistiques depuis MongoDB.',
                [
                    'exception' => $exception,
                ]
            );

            return $this->json([
                'message' => 'Impossible de récupérer les statistiques pour le moment.',
            ], JsonResponse::HTTP_SERVICE_UNAVAILABLE);
        }
    }
}