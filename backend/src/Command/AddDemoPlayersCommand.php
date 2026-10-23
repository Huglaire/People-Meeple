<?php

namespace App\Command;

use App\Entity\User;
use App\Entity\UserGame;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:demo-players:load',
    description: 'Ajoute 20 profils fictifs et leur ludothèque sans supprimer les données existantes.'
)]
class AddDemoPlayersCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
        parent::__construct();
    }

    protected function execute(
        InputInterface $input,
        OutputInterface $output
    ): int {
        $io = new SymfonyStyle($input, $output);
        $now = new DateTimeImmutable();

        $userRepository = $this->entityManager->getRepository(User::class);
        $gameRepository = $this->entityManager->getRepository(\App\Entity\Game::class);
        $userGameRepository = $this->entityManager->getRepository(UserGame::class);

        // Les profils sont fixes pour garantir l'absence de doublons lors des relances.
        $profiles = [
            ['Camille', 'Moreau', 'camille.moreau'],
            ['Thomas', 'Lefebvre', 'thomas.lefebvre'],
            ['Sarah', 'Garcia', 'sarah.garcia'],
            ['Nicolas', 'Roux', 'nicolas.roux'],
            ['Emma', 'Vincent', 'emma.vincent'],
            ['Lucas', 'Fournier', 'lucas.fournier'],
            ['Chloé', 'Girard', 'chloe.girard'],
            ['Hugo', 'Bonnet', 'hugo.bonnet'],
            ['Manon', 'Dupuis', 'manon.dupuis'],
            ['Nathan', 'Lambert', 'nathan.lambert'],
            ['Léa', 'Fontaine', 'lea.fontaine'],
            ['Enzo', 'Rousseau', 'enzo.rousseau'],
            ['Julie', 'Blanc', 'julie.blanc'],
            ['Maxime', 'Guerin', 'maxime.guerin'],
            ['Inès', 'Muller', 'ines.muller'],
            ['Antoine', 'Henry', 'antoine.henry'],
            ['Zoé', 'Roussel', 'zoe.roussel'],
            ['Mathis', 'Nicolas', 'mathis.nicolas'],
            ['Laura', 'Perrin', 'laura.perrin'],
            ['Alexandre', 'Morin', 'alexandre.morin'],
        ];

        $citiesByDepartment = [
            '75' => ['Paris'],
            '77' => ['Meaux', 'Melun', 'Chelles'],
            '78' => ['Versailles', 'Poissy', 'Mantes-la-Jolie'],
            '91' => ['Évry-Courcouronnes', 'Massy', 'Palaiseau'],
            '92' => ['Clamart', 'Nanterre', 'Boulogne-Billancourt'],
            '93' => ['Montreuil', 'Saint-Denis', 'Aubervilliers'],
            '94' => ['Créteil', 'Vincennes', 'Ivry-sur-Seine'],
            '95' => ['Cergy', 'Argenteuil', 'Pontoise'],
        ];

        $departments = array_keys($citiesByDepartment);

        // On récupère les avatars disponibles sans dépendre de Faker.
        $avatarDirectory = dirname(__DIR__, 2) . '/public/images/avatars';
        $avatars = glob($avatarDirectory . '/*.{jpg,jpeg,png,webp}', GLOB_BRACE) ?: [];

        if ($avatars === []) {
            $defaultAvatar = dirname(__DIR__, 2) . '/public/images/meeple-default.png';

            if (is_file($defaultAvatar)) {
                $avatars = [$defaultAvatar];
            }
        }

        $games = $gameRepository->findAll();

        if (count($games) < 6) {
            $io->error('Il faut au moins 6 jeux en base pour créer les ludothèques.');

            return Command::FAILURE;
        }

        $createdProfiles = 0;
        $createdAssociations = 0;

        foreach ($profiles as [$firstName, $lastName, $identifier]) {
            $email = $identifier . '@demo.peoplemeeple.fr';
            $pseudo = $firstName . $lastName . 'Demo';

            // Si le profil existe déjà, on le conserve et on ne le recrée pas.
            $user = $userRepository->findOneBy(['email' => $email]);

            if (!$user instanceof User) {
                $user = $userRepository->findOneBy(['pseudo' => $pseudo]);
            }

            if (!$user instanceof User) {
                $user = new User();

                $this->setIfAvailable($user, 'setEmail', $email);
                $this->setIfAvailable($user, 'setPseudo', $pseudo);
                $this->setIfAvailable($user, 'setRoles', ['ROLE_USER']);
                $this->setIfAvailable($user, 'setRole', 'ROLE_USER');

                // Mot de passe commun aux comptes de démonstration : password
                $this->setIfAvailable(
                    $user,
                    'setPassword',
                    $this->passwordHasher->hashPassword($user, 'password')
                );

                $department = $departments[array_rand($departments)];
                $city = $citiesByDepartment[$department][array_rand($citiesByDepartment[$department])];

                $this->setIfAvailable(
                    $user,
                    'setDateOfBirth',
                    new DateTimeImmutable('-' . random_int(20, 55) . ' years')
                );
                $this->setIfAvailable($user, 'setDepartment', $department);
                $this->setIfAvailable($user, 'setCity', $city);
                $this->setIfAvailable($user, 'setCityVisible', true);
                $this->setIfAvailable($user, 'setIsActive', true);
                $this->setIfAvailable($user, 'setCreatedAt', $now);
                $this->setIfAvailable($user, 'setUpdatedAt', $now);

                if ($avatars !== []) {
                    $avatar = $avatars[array_rand($avatars)];
                    $this->setIfAvailable(
                        $user,
                        'setProfilePicture',
                        '/images/avatars/' . basename($avatar)
                    );
                }

                $this->entityManager->persist($user);
                $createdProfiles++;
            }

            // On flush pour obtenir l'identifiant avant de créer les associations.
            $this->entityManager->flush();

            // On vérifie les associations existantes afin d'éviter les doublons.
            $existingGameIds = [];
            foreach ($userGameRepository->findBy(['user' => $user]) as $association) {
                $game = $association->getGame();

                if ($game !== null) {
                    $existingGameIds[] = $game->getId();
                }
            }

            $availableGames = array_values(array_filter(
                $games,
                static fn ($game): bool => !in_array($game->getId(), $existingGameIds, true)
            ));

            // On complète la ludothèque jusqu'à obtenir 6 à 14 jeux au total.
            $targetCount = random_int(6, min(14, count($games)));
            $missingCount = max(0, $targetCount - count($existingGameIds));

            if ($missingCount === 0 || $availableGames === []) {
                continue;
            }

            shuffle($availableGames);
            $selectedGames = array_slice(
                $availableGames,
                0,
                min($missingCount, count($availableGames))
            );

            foreach ($selectedGames as $game) {
                $userGame = new UserGame();
                $userGame->setUser($user);
                $userGame->setGame($game);

                $owns = (bool) random_int(0, 1);
                $knowsRules = (bool) random_int(0, 1);

                // Chaque association doit représenter au moins une connaissance du jeu.
                if (!$owns && !$knowsRules) {
                    $knowsRules = true;
                }

                $userGame->setOwns($owns);
                $userGame->setKnowsRules($knowsRules);
                $userGame->setCreatedAt($now);
                $userGame->setUpdatedAt($now);

                $this->entityManager->persist($userGame);
                $createdAssociations++;
            }

            $this->entityManager->flush();
        }

        $io->success(sprintf(
            '%d profil(s) créé(s) et %d association(s) de jeux ajoutée(s). Aucune donnée existante n’a été supprimée.',
            $createdProfiles,
            $createdAssociations
        ));

        return Command::SUCCESS;
    }

    /**
     * Appelle un setter uniquement s'il existe sur l'entité.
     * Cela permet de gérer les différences entre versions du modèle.
     */
    private function setIfAvailable(object $entity, string $method, mixed $value): void
    {
        if (method_exists($entity, $method)) {
            $entity->{$method}($value);
        }
    }
}