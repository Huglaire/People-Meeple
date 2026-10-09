<?php

namespace App\DataFixtures;

use App\Entity\Game;
use App\Entity\User;
use App\Entity\UserGame;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Faker\Factory;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher
    ) {
    }

    public function load(ObjectManager $manager): void
    {
        $faker = Factory::create('fr_FR');
        $now = new \DateTimeImmutable();

        /*
         * Création du compte administrateur.
         */
        $admin = new User();
        $admin->setEmail('admin@mail.fr');
        $admin->setRoles(['ROLE_ADMIN']);
        $admin->setPassword(
            $this->passwordHasher->hashPassword($admin, 'password')
        );
        $admin->setPseudo('AdminMeeple');
        $admin->setDateOfBirth(new \DateTimeImmutable('1985-01-15'));
        $admin->setDepartment('75');
        $admin->setCity('Paris');
        $admin->setCityVisible(true);
        $admin->setIsActive(true);
        $admin->setRole('ADMIN');
        $admin->setCreatedAt($now);
        $admin->setUpdatedAt($now);

        $manager->persist($admin);

        /*
         * Création du compte de test.
         */
        $testUser = new User();
        $testUser->setEmail('test@mail.fr');
        $testUser->setRoles(['ROLE_USER']);
        $testUser->setPassword(
            $this->passwordHasher->hashPassword($testUser, 'password')
        );
        $testUser->setPseudo('TestMeeple');
        $testUser->setDateOfBirth(new \DateTimeImmutable('1990-05-10'));
        $testUser->setDepartment('75');
        $testUser->setCity('Paris');
        $testUser->setCityVisible(true);
        $testUser->setIsActive(true);
        $testUser->setRole('USER');
        $testUser->setCreatedAt($now);
        $testUser->setUpdatedAt($now);

        $manager->persist($testUser);

        /*
         * Création du deuxième compte de test.
         */
        $testUser2 = new User();
        $testUser2->setEmail('test2@mail.fr');
        $testUser2->setRoles(['ROLE_USER']);
        $testUser2->setPassword(
            $this->passwordHasher->hashPassword($testUser2, 'password')
        );
        $testUser2->setPseudo('TestMeeple2');
        $testUser2->setDateOfBirth(new \DateTimeImmutable('1992-08-20'));
        $testUser2->setDepartment('92');
        $testUser2->setCity('Clamart');
        $testUser2->setCityVisible(true);
        $testUser2->setIsActive(true);
        $testUser2->setRole('USER');
        $testUser2->setCreatedAt($now);
        $testUser2->setUpdatedAt($now);

        $manager->persist($testUser2);

        /*
         * Création des six joueurs utilisés dans les écrans
         * de démonstration du frontend.
         */
        $demoUsersData = [
            [
                'email' => 'marion@mail.fr',
                'pseudo' => 'Marion',
                'dateOfBirth' => '1998-06-15',
                'department' => '92',
                'city' => 'Chaville',
            ],
            [
                'email' => 'aurel@mail.fr',
                'pseudo' => 'Aurel',
                'dateOfBirth' => '1995-05-15',
                'department' => '92',
                'city' => 'Sceaux',
            ],
            [
                'email' => 'jean@mail.fr',
                'pseudo' => 'Jean',
                'dateOfBirth' => '1988-04-15',
                'department' => '92',
                'city' => 'Antony',
            ],
            [
                'email' => 'charlotte@mail.fr',
                'pseudo' => 'Charlotte',
                'dateOfBirth' => '1999-03-15',
                'department' => '92',
                'city' => 'Saint-Cloud',
            ],
            [
                'email' => 'caroline@mail.fr',
                'pseudo' => 'Caroline',
                'dateOfBirth' => '1992-02-15',
                'department' => '92',
                'city' => 'Issy-Les-Moulineaux',
            ],
            [
                'email' => 'mickael@mail.fr',
                'pseudo' => 'Mickaël',
                'dateOfBirth' => '1993-01-15',
                'department' => '92',
                'city' => 'Clamart',
            ],
        ];

        $demoUsers = [];

        foreach ($demoUsersData as $userData) {
            $user = new User();

            $user->setEmail($userData['email']);
            $user->setRoles(['ROLE_USER']);
            $user->setPassword(
                $this->passwordHasher->hashPassword($user, 'password')
            );
            $user->setPseudo($userData['pseudo']);
            $user->setDateOfBirth(
                new \DateTimeImmutable($userData['dateOfBirth'])
            );
            $user->setDepartment($userData['department']);
            $user->setCity($userData['city']);
            $user->setCityVisible(true);
            $user->setIsActive(true);
            $user->setRole('USER');
            $user->setCreatedAt($now);
            $user->setUpdatedAt($now);

            $manager->persist($user);

            $demoUsers[$userData['pseudo']] = $user;
        }

        /*
         * Création de 20 utilisateurs supplémentaires
         * avec Faker pour disposer de données de test.
         */
        $fakerUsers = [];

        for ($i = 0; $i < 20; $i++) {
            $user = new User();

            $user->setEmail($faker->unique()->safeEmail());
            $user->setRoles(['ROLE_USER']);
            $user->setPassword(
                $this->passwordHasher->hashPassword($user, 'password')
            );
            $user->setPseudo($faker->unique()->userName());
            $user->setDateOfBirth(
                \DateTimeImmutable::createFromMutable(
                    $faker->dateTimeBetween('-60 years', '-18 years')
                )
            );
            $user->setDepartment(
                str_pad(
                    (string) $faker->numberBetween(1, 95),
                    2,
                    '0',
                    STR_PAD_LEFT
                )
            );
            $user->setCity($faker->city());
            $user->setCityVisible($faker->boolean(80));
            $user->setIsActive(true);
            $user->setRole('USER');
            $user->setCreatedAt($now);
            $user->setUpdatedAt($now);

            $manager->persist($user);

            $fakerUsers[] = $user;
        }

        /*
         * Liste des jeux disponibles sur la plateforme.
         */
        $gamesData = [
            [
                'name' => 'Azul',
                'description' => 'Un jeu de pose de tuiles élégant et accessible.',
                'publisher' => 'Next Move Games',
                'minPlayers' => 2,
                'maxPlayers' => 4,
                'minimumAge' => 8,
                'duration' => 45,
            ],
            [
                'name' => '7 Wonders',
                'description' => 'Développez votre civilisation et construisez votre merveille.',
                'publisher' => 'Repos Production',
                'minPlayers' => 3,
                'maxPlayers' => 7,
                'minimumAge' => 10,
                'duration' => 30,
            ],
            [
                'name' => 'Micro Macro Crime City',
                'description' => 'Observez une immense carte pour résoudre des enquêtes.',
                'publisher' => 'Spielwiese',
                'minPlayers' => 1,
                'maxPlayers' => 4,
                'minimumAge' => 10,
                'duration' => 30,
            ],
            [
                'name' => 'Citadelles',
                'description' => 'Construisez votre cité en choisissant judicieusement vos personnages.',
                'publisher' => 'Z-Man Games',
                'minPlayers' => 2,
                'maxPlayers' => 8,
                'minimumAge' => 10,
                'duration' => 60,
            ],
            [
                'name' => 'Splendor Duel',
                'description' => 'Un duel tactique pour développer votre prestige.',
                'publisher' => 'Space Cowboys',
                'minPlayers' => 2,
                'maxPlayers' => 2,
                'minimumAge' => 10,
                'duration' => 30,
            ],
            [
                'name' => 'Terraforming Mars',
                'description' => 'Participez à la transformation de Mars en planète habitable.',
                'publisher' => 'FryxGames',
                'minPlayers' => 1,
                'maxPlayers' => 5,
                'minimumAge' => 12,
                'duration' => 120,
            ],
            [
                'name' => 'Heat',
                'description' => 'Une course automobile intense et pleine de rebondissements.',
                'publisher' => 'Days of Wonder',
                'minPlayers' => 1,
                'maxPlayers' => 6,
                'minimumAge' => 10,
                'duration' => 60,
            ],
            [
                'name' => 'Root',
                'description' => 'Un jeu de conquête asymétrique dans une forêt en guerre.',
                'publisher' => 'Leder Games',
                'minPlayers' => 2,
                'maxPlayers' => 4,
                'minimumAge' => 10,
                'duration' => 90,
            ],
            [
                'name' => 'Emblèmes',
                'description' => 'Un jeu de stratégie et de combinaison.',
                'publisher' => 'Origames',
                'minPlayers' => 2,
                'maxPlayers' => 4,
                'minimumAge' => 8,
                'duration' => 45,
            ],
            [
                'name' => 'Orléans',
                'description' => 'Développez votre cité et votre réseau commercial.',
                'publisher' => 'DLP Games',
                'minPlayers' => 2,
                'maxPlayers' => 4,
                'minimumAge' => 12,
                'duration' => 90,
            ],
            [
                'name' => 'Leda',
                'description' => 'Un jeu tactique basé sur la gestion et l anticipation.',
                'publisher' => 'Lumberjacks Studio',
                'minPlayers' => 2,
                'maxPlayers' => 4,
                'minimumAge' => 10,
                'duration' => 45,
            ],
            [
                'name' => 'Carcassonne',
                'description' => 'Construisez ensemble un paysage médiéval.',
                'publisher' => 'Hans im Glück',
                'minPlayers' => 2,
                'maxPlayers' => 5,
                'minimumAge' => 7,
                'duration' => 45,
            ],
            [
                'name' => 'Catan',
                'description' => 'Développez votre colonie et négociez avec les autres joueurs.',
                'publisher' => 'Kosmos',
                'minPlayers' => 3,
                'maxPlayers' => 4,
                'minimumAge' => 10,
                'duration' => 75,
            ],
            [
                'name' => 'Sagrada',
                'description' => 'Composez un magnifique vitrail en plaçant vos dés.',
                'publisher' => 'Floodgate Games',
                'minPlayers' => 1,
                'maxPlayers' => 4,
                'minimumAge' => 13,
                'duration' => 45,
            ],
            [
                'name' => 'Five Tribes',
                'description' => 'Déplacez les tribus et prenez le contrôle du sultanat.',
                'publisher' => 'Days of Wonder',
                'minPlayers' => 2,
                'maxPlayers' => 4,
                'minimumAge' => 13,
                'duration' => 60,
            ],
            [
                'name' => 'Dice Forge',
                'description' => 'Améliorez vos dés et devenez le héros le plus puissant.',
                'publisher' => 'Libellud',
                'minPlayers' => 2,
                'maxPlayers' => 4,
                'minimumAge' => 10,
                'duration' => 45,
            ],
            [
                'name' => 'Orichalque',
                'description' => 'Développez votre civilisation sur une île mythologique.',
                'publisher' => 'Catch Up Games',
                'minPlayers' => 2,
                'maxPlayers' => 4,
                'minimumAge' => 12,
                'duration' => 60,
            ],
            [
                'name' => 'Challengers',
                'description' => 'Affrontez vos adversaires dans un tournoi de capture de drapeau.',
                'publisher' => 'Z-Man Games',
                'minPlayers' => 1,
                'maxPlayers' => 8,
                'minimumAge' => 8,
                'duration' => 45,
            ],
            [
                'name' => 'Skyjo',
                'description' => 'Un jeu de cartes simple, rapide et addictif.',
                'publisher' => 'Magilano',
                'minPlayers' => 2,
                'maxPlayers' => 8,
                'minimumAge' => 8,
                'duration' => 30,
            ],
            [
                'name' => 'Love Letter',
                'description' => 'Déduction et bluff autour de la princesse.',
                'publisher' => 'Z-Man Games',
                'minPlayers' => 2,
                'maxPlayers' => 6,
                'minimumAge' => 10,
                'duration' => 20,
            ],
        ];

        $games = [];

        foreach ($gamesData as $gameData) {
            $game = new Game();

            $game->setName($gameData['name']);
            $game->setImage(
                '/images/games/' . $this->slugify($gameData['name']) . '.jpg'
            );
            $game->setDescription($gameData['description']);
            $game->setPublisher($gameData['publisher']);
            $game->setMinPlayers($gameData['minPlayers']);
            $game->setMaxPlayers($gameData['maxPlayers']);
            $game->setMinimumAge($gameData['minimumAge']);
            $game->setDuration($gameData['duration']);
            $game->setIsActive(true);
            $game->setCreatedAt($now);
            $game->setUpdatedAt($now);

            $manager->persist($game);

            $games[$gameData['name']] = $game;
        }

        /*
         * Enregistrement des utilisateurs et des jeux avant
         * la création des associations UserGame.
         */
        $manager->flush();

        /*
         * Ludothèques fixes des six joueurs affichés
         * dans le frontend.
         */
        $demoLibraries = [
            'Marion' => [
                'Azul',
                'Challengers',
                'Five Tribes',
                'Orléans',
                'Root',
                'Orichalque',
            ],
            'Aurel' => [
                '7 Wonders',
                'Terraforming Mars',
                'Heat',
                'Catan',
                'Carcassonne',
                'Dice Forge',
            ],
            'Jean' => [
                'Root',
                'Terraforming Mars',
                'Orléans',
                'Catan',
                'Five Tribes',
                'Challengers',
            ],
            'Charlotte' => [
                'Azul',
                'Splendor Duel',
                'Sagrada',
                'Love Letter',
                'Skyjo',
                'Micro Macro Crime City',
            ],
            'Caroline' => [
                '7 Wonders',
                'Azul',
                'Citadelles',
                'Carcassonne',
                'Sagrada',
                'Five Tribes',
            ],
            'Mickaël' => [
                'Heat',
                'Root',
                'Terraforming Mars',
                'Orléans',
                'Catan',
                'Challengers',
            ],
        ];

        /*
         * Création des associations UserGame des six profils.
         */
        foreach ($demoLibraries as $pseudo => $library) {
            foreach ($library as $gameName) {
                if (!isset($games[$gameName])) {
                    continue;
                }

                $userGame = new UserGame();

                $userGame->setUser($demoUsers[$pseudo]);
                $userGame->setGame($games[$gameName]);
                $userGame->setOwns(true);
                $userGame->setKnowsRules(true);
                $userGame->setCreatedAt($now);
                $userGame->setUpdatedAt($now);

                $manager->persist($userGame);
            }
        }

        /*
         * Création de ludothèques aléatoires pour les autres utilisateurs.
         */
        $otherUsers = [
            $testUser,
            $testUser2,
            ...$fakerUsers,
        ];

        foreach ($otherUsers as $user) {
            $randomGames = $faker->randomElements(
                array_values($games),
                $faker->numberBetween(6, 12)
            );

            foreach ($randomGames as $game) {
                $userGame = new UserGame();

                $userGame->setUser($user);
                $userGame->setGame($game);

                $owns = $faker->boolean();
                $knowsRules = $faker->boolean();

                /*
                 * On garantit qu'un jeu est au moins possédé
                 * ou connu du joueur.
                 */
                if (!$owns && !$knowsRules) {
                    $owns = true;
                }

                $userGame->setOwns($owns);
                $userGame->setKnowsRules($knowsRules);
                $userGame->setCreatedAt($now);
                $userGame->setUpdatedAt($now);

                $manager->persist($userGame);
            }
        }

        $manager->flush();
    }

    /**
     * Transforme un nom de jeu en slug utilisable pour son image.
     */
    private function slugify(string $text): string
    {
        $text = strtolower($text);

        $text = str_replace(
            [
                'à',
                'â',
                'ä',
                'é',
                'è',
                'ê',
                'ë',
                'î',
                'ï',
                'ô',
                'ö',
                'ù',
                'û',
                'ü',
                'ç',
            ],
            [
                'a',
                'a',
                'a',
                'e',
                'e',
                'e',
                'e',
                'i',
                'i',
                'o',
                'o',
                'u',
                'u',
                'u',
                'c',
            ],
            $text
        );

        $text = preg_replace('/[^a-z0-9]+/', '-', $text);

        return trim($text, '-');
    }
}