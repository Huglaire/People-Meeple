<?php

namespace App\Command;

use App\Entity\Game;
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
    name: 'app:demo-data:load',
    description: 'Ajoute les données de démonstration People Meeple sans supprimer les données existantes.'
)]
class LoadDemoDataCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher
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
        $gameRepository = $this->entityManager->getRepository(Game::class);
        $userGameRepository = $this->entityManager->getRepository(UserGame::class);

        $io->title('Chargement des données de démonstration People Meeple');

        // Récupère les avatars disponibles.
        $avatarDirectory = dirname(__DIR__, 2) . '/public/images/avatars';
        $avatars = [];

        if (is_dir($avatarDirectory)) {
            $files = glob(
                $avatarDirectory . '/*.{jpg,jpeg,png,webp}',
                GLOB_BRACE
            );

            if ($files !== false) {
                foreach ($files as $file) {
                    $avatars[] = basename($file);
                }
            }
        }

        if ($avatars === []) {
            $avatars = ['meeple-default.png'];
        }

        // Crée uniquement les comptes prédéfinis qui n'existent pas.
        $accountDefinitions = [
            [
                'email' => 'admin@mail.fr',
                'pseudo' => 'AdminMeeple',
                'role' => 'ADMIN',
                'birth' => '1985-01-15',
                'department' => '75',
                'city' => 'Paris',
            ],
            [
                'email' => 'test@mail.fr',
                'pseudo' => 'TestMeeple',
                'role' => 'USER',
                'birth' => '1990-05-10',
                'department' => '75',
                'city' => 'Paris',
            ],
            [
                'email' => 'test2@mail.fr',
                'pseudo' => 'TestMeeple2',
                'role' => 'USER',
                'birth' => '1992-08-20',
                'department' => '92',
                'city' => 'Clamart',
            ],
        ];

        $users = [];

        foreach ($accountDefinitions as $definition) {
            $user = $userRepository->findOneBy([
                'email' => $definition['email'],
            ]);

            if (!$user instanceof User) {
                $user = new User();
                $user->setEmail($definition['email']);
                $user->setPseudo($definition['pseudo']);
                $user->setRoles(
                    $definition['role'] === 'ADMIN'
                        ? ['ROLE_ADMIN']
                        : ['ROLE_USER']
                );
                $user->setRole($definition['role']);
                $user->setPassword(
                    $this->passwordHasher->hashPassword($user, 'password')
                );
                $user->setDateOfBirth(
                    new DateTimeImmutable($definition['birth'])
                );
                $user->setDepartment($definition['department']);
                $user->setCity($definition['city']);
                $user->setProfilePicture(
                    $avatars[array_rand($avatars)]
                );
                $user->setCityVisible(true);
                $user->setIsActive(true);
                $user->setCreatedAt($now);
                $user->setUpdatedAt($now);

                $this->entityManager->persist($user);
                $io->text('Compte créé : ' . $definition['email']);
            }

            $users[$definition['email']] = $user;
        }

        // Catalogue de jeux repris des fixtures existantes.
        $gamesData = [
            ['Azul', 'Un jeu de pose de tuiles élégant et accessible.', 'Next Move Games', 2, 4, 8, 45],
            ['7 Wonders', 'Développez votre civilisation et construisez votre merveille.', 'Repos Production', 3, 7, 10, 30],
            ['Micro Macro Crime City', 'Observez une immense carte pour résoudre des enquêtes.', 'Spielwiese', 1, 4, 10, 30],
            ['Citadelles', 'Construisez votre cité en choisissant judicieusement vos personnages.', 'Z-Man Games', 2, 8, 10, 60],
            ['Splendor Duel', 'Un duel tactique pour développer votre prestige.', 'Space Cowboys', 2, 2, 10, 30],
            ['Terraforming Mars', 'Participez à la transformation de Mars en planète habitable.', 'FryxGames', 1, 5, 12, 120],
            ['Heat', 'Une course automobile intense et pleine de rebondissements.', 'Days of Wonder', 1, 6, 10, 60],
            ['Root', 'Un jeu de conquête asymétrique dans une forêt en guerre.', 'Leder Games', 2, 4, 10, 90],
            ['Emblèmes', 'Un jeu de stratégie et de combinaison.', 'Origames', 2, 4, 8, 45],
            ['Orléans', 'Développez votre cité et votre réseau commercial.', 'DLP Games', 2, 5, 12, 90],
            ['Leda', 'Un jeu tactique basé sur la gestion et l’anticipation.', 'Lumberjacks Studio', 2, 4, 10, 45],
            ['Carcassonne', 'Construisez ensemble un paysage médiéval.', 'Hans im Glück', 2, 5, 7, 45],
            ['Catan', 'Développez votre colonie et négociez avec les autres joueurs.', 'Kosmos', 3, 4, 10, 75],
            ['Sagrada', 'Composez un magnifique vitrail en plaçant vos dés.', 'Floodgate Games', 1, 4, 13, 45],
            ['Five Tribes', 'Déplacez les tribus et prenez le contrôle du sultanat.', 'Days of Wonder', 2, 4, 13, 60],
            ['Dice Forge', 'Améliorez vos dés et devenez le héros le plus puissant.', 'Libellud', 2, 4, 10, 45],
            ['Orichalque', 'Développez votre civilisation sur une île mythologique.', 'Catch Up Games', 2, 4, 12, 60],
            ['Challengers', 'Affrontez vos adversaires dans un tournoi de capture de drapeau.', 'Z-Man Games', 1, 8, 8, 45],
            ['Skyjo', 'Un jeu de cartes simple, rapide et addictif.', 'Magilano', 2, 8, 10, 30],
            ['Love Letter', 'Déduction et bluff autour de la princesse.', 'Z-Man Games', 2, 6, 10, 20],
        ];

        $games = [];

        foreach ($gamesData as $data) {
            [
                $name,
                $description,
                $publisher,
                $minPlayers,
                $maxPlayers,
                $minimumAge,
                $duration,
            ] = $data;

            $game = $gameRepository->findOneBy(['name' => $name]);

            if (!$game instanceof Game) {
                $game = new Game();
                $game->setName($name);
                $game->setImage(
                    '/images/games/' . $this->slugify($name) . '.jpg'
                );
                $game->setDescription($description);
                $game->setPublisher($publisher);
                $game->setMinPlayers($minPlayers);
                $game->setMaxPlayers($maxPlayers);
                $game->setMinimumAge($minimumAge);
                $game->setDuration($duration);
                $game->setIsActive(true);
                $game->setCreatedAt($now);
                $game->setUpdatedAt($now);

                $this->entityManager->persist($game);
                $io->text('Jeu créé : ' . $name);
            }

            $games[$name] = $game;
        }

        // Enregistre les utilisateurs et les jeux avant de créer les associations.
        $this->entityManager->flush();

        // Associe les comptes de test à quelques jeux, sans doublons.
        $gameNamesByUser = [
            'test@mail.fr' => [
                'Azul',
                '7 Wonders',
                'Carcassonne',
                'Catan',
                'Skyjo',
            ],
            'test2@mail.fr' => [
                'Heat',
                'Root',
                'Splendor Duel',
                'Terraforming Mars',
                'Love Letter',
            ],
        ];

        foreach ($gameNamesByUser as $email => $gameNames) {
            $user = $users[$email];

            foreach ($gameNames as $gameName) {
                $game = $games[$gameName];

                $association = $userGameRepository->findOneBy([
                    'user' => $user,
                    'game' => $game,
                ]);

                if ($association instanceof UserGame) {
                    continue;
                }

                $userGame = new UserGame();
                $userGame->setUser($user);
                $userGame->setGame($game);

                // Les deux indicateurs ne peuvent pas être faux simultanément.
                $owns = random_int(0, 1) === 1;
                $knowsRules = random_int(0, 1) === 1;

                if (!$owns && !$knowsRules) {
                    $knowsRules = true;
                }

                $userGame->setOwns($owns);
                $userGame->setKnowsRules($knowsRules);
                $userGame->setCreatedAt($now);
                $userGame->setUpdatedAt($now);

                $this->entityManager->persist($userGame);
            }
        }

        $this->entityManager->flush();

        $io->success(
            'Chargement terminé. Aucune donnée existante n’a été supprimée.'
        );

        $io->note([
            'Comptes de démonstration : admin@mail.fr, test@mail.fr et test2@mail.fr.',
            'Mot de passe initial des comptes créés : password.',
            'Cette première version crée les 20 jeux et les associations des deux comptes de test.',
            'Elle ne recrée pas les quelque 1 000 profils Faker de AppFixtures.php.',
        ]);

        return Command::SUCCESS;
    }

    // Produit un nom de fichier cohérent avec les images du catalogue.
    private function slugify(string $value): string
    {
        $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);

        if ($value === false) {
            $value = '';
        }

        $value = strtolower($value);
        $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? '';

        return trim($value, '-');
    }
}