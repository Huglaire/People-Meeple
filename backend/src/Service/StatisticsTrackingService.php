<?php

namespace App\Service;

use App\Document\GameView;
use App\Document\RegistrationEvent;
use Doctrine\ODM\MongoDB\DocumentManager;
use Psr\Log\LoggerInterface;

final class StatisticsTrackingService
{
    public function __construct(
        private readonly DocumentManager $documentManager,
        private readonly LoggerInterface $logger
    ) {
    }

    /**
     * Enregistre la consultation d'une fiche de jeu.
     */
    public function trackGameView(int $gameId): void
    {
        try {
            $this->documentManager->persist(
                new GameView($gameId)
            );

            $this->documentManager->flush();
        } catch (\Throwable $exception) {
            // Une erreur statistique ne doit pas bloquer la navigation.
            $this->logger->error(
                'Impossible d’enregistrer la consultation d’un jeu dans MongoDB.',
                [
                    'gameId' => $gameId,
                    'exception' => $exception,
                ]
            );
        }
    }

    /**
     * Enregistre une nouvelle inscription, sans donnée personnelle.
     */
    public function trackRegistration(): void
    {
        try {
            $this->documentManager->persist(
                new RegistrationEvent()
            );

            $this->documentManager->flush();
        } catch (\Throwable $exception) {
            // Une erreur statistique ne doit pas annuler une inscription MySQL.
            $this->logger->error(
                'Impossible d’enregistrer une inscription dans MongoDB.',
                [
                    'exception' => $exception,
                ]
            );
        }
    }
}