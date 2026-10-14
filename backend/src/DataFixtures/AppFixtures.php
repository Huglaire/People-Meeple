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

        // Recherche les avatars téléchargés dans le dossier public.
        $avatarDirectory = dirname(__DIR__, 2) . '/public/images/avatars';
        $profilePictures = [];

        if (is_dir($avatarDirectory)) {
            $files = glob($avatarDirectory . '/*.{jpg,jpeg,png,webp}', GLOB_BRACE);

            if ($files !== false) {
                foreach ($files as $file) {
                    $profilePictures[] = basename($file);
                }
            }
        }

        // Utilise le meeple par défaut si aucun avatar n'est disponible.
        if ($profilePictures === []) {
            $profilePictures = ['meeple-default.png'];
        }

        /*
         * Création du compte administrateur.
         */
        $admin = $this->createUser(
            $manager,
            'admin@mail.fr',
            'AdminMeeple',
            'ADMIN',
            '1985-01-15',
            '75',
            'Paris',
            $faker->randomElement($profilePictures),
            $now
        );

        /*
         * Création des deux comptes de test.
         */
        $testUser = $this->createUser(
            $manager,
            'test@mail.fr',
            'TestMeeple',
            'USER',
            '1990-05-10',
            '75',
            'Paris',
            $faker->randomElement($profilePictures),
            $now
        );

        $testUser2 = $this->createUser(
            $manager,
            'test2@mail.fr',
            'TestMeeple2',
            'USER',
            '1992-08-20',
            '92',
            'Clamart',
            $faker->randomElement($profilePictures),
            $now
        );

        /*
         * Villes de référence associées à leur département.
         * Elles permettent d'éviter les associations incohérentes.
         */
        $departmentCities = [
            '01' => ['Bourg-en-Bresse', 'Oyonnax', 'Ambérieu-en-Bugey'],
            '02' => ['Laon', 'Saint-Quentin', 'Soissons'],
            '03' => ['Moulins', 'Vichy', 'Montluçon'],
            '04' => ['Digne-les-Bains', 'Manosque', 'Sisteron'],
            '05' => ['Gap', 'Briançon', 'Embrun'],
            '06' => ['Nice', 'Cannes', 'Antibes', 'Grasse'],
            '07' => ['Privas', 'Annonay', 'Aubenas'],
            '08' => ['Charleville-Mézières', 'Sedan', 'Rethel'],
            '09' => ['Foix', 'Pamiers', 'Saint-Girons'],
            '10' => ['Troyes', 'Romilly-sur-Seine', 'Nogent-sur-Seine'],
            '11' => ['Carcassonne', 'Narbonne', 'Castelnaudary'],
            '12' => ['Rodez', 'Millau', 'Villefranche-de-Rouergue'],
            '13' => ['Marseille', 'Aix-en-Provence', 'Arles'],
            '14' => ['Caen', 'Bayeux', 'Lisieux'],
            '15' => ['Aurillac', 'Saint-Flour', 'Mauriac'],
            '16' => ['Angoulême', 'Cognac', 'Confolens'],
            '17' => ['La Rochelle', 'Rochefort', 'Saintes'],
            '18' => ['Bourges', 'Vierzon', 'Saint-Amand-Montrond'],
            '19' => ['Tulle', 'Brive-la-Gaillarde', 'Ussel'],
            '2A' => ['Ajaccio', 'Porto-Vecchio', 'Propriano'],
            '2B' => ['Bastia', 'Calvi', 'Corte'],
            '21' => ['Dijon', 'Beaune', 'Chenôve'],
            '22' => ['Saint-Brieuc', 'Lannion', 'Dinan'],
            '23' => ['Guéret', 'Aubusson', 'La Souterraine'],
            '24' => ['Périgueux', 'Bergerac', 'Sarlat-la-Canéda'],
            '25' => ['Besançon', 'Montbéliard', 'Pontarlier'],
            '26' => ['Valence', 'Montélimar', 'Romans-sur-Isère'],
            '27' => ['Évreux', 'Vernon', 'Louviers'],
            '28' => ['Chartres', 'Dreux', 'Châteaudun'],
            '29' => ['Quimper', 'Brest', 'Morlaix'],
            '30' => ['Nîmes', 'Alès', 'Uzès'],
            '31' => ['Toulouse', 'Muret', 'Saint-Gaudens'],
            '32' => ['Auch', 'Condom', 'Fleurance'],
            '33' => ['Bordeaux', 'Mérignac', 'Libourne'],
            '34' => ['Montpellier', 'Béziers', 'Sète'],
            '35' => ['Rennes', 'Saint-Malo', 'Fougères'],
            '36' => ['Châteauroux', 'Issoudun', 'Le Blanc'],
            '37' => ['Tours', 'Amboise', 'Chinon'],
            '38' => ['Grenoble', 'Vienne', 'Bourgoin-Jallieu'],
            '39' => ['Lons-le-Saunier', 'Dole', 'Saint-Claude'],
            '40' => ['Mont-de-Marsan', 'Dax', 'Biscarrosse'],
            '41' => ['Blois', 'Vendôme', 'Romorantin-Lanthenay'],
            '42' => ['Saint-Étienne', 'Roanne', 'Saint-Chamond'],
            '43' => ['Le Puy-en-Velay', 'Yssingeaux', 'Brioude'],
            '44' => ['Nantes', 'Saint-Nazaire', 'Rezé'],
            '45' => ['Orléans', 'Montargis', 'Gien'],
            '46' => ['Cahors', 'Figeac', 'Gourdon'],
            '47' => ['Agen', 'Marmande', 'Villeneuve-sur-Lot'],
            '48' => ['Mende', 'Florac', 'Marvejols'],
            '49' => ['Angers', 'Cholet', 'Saumur'],
            '50' => ['Saint-Lô', 'Cherbourg-en-Cotentin', 'Granville'],
            '51' => ['Reims', 'Châlons-en-Champagne', 'Épernay'],
            '52' => ['Chaumont', 'Saint-Dizier', 'Langres'],
            '53' => ['Laval', 'Mayenne', 'Château-Gontier'],
            '54' => ['Nancy', 'Lunéville', 'Toul'],
            '55' => ['Bar-le-Duc', 'Verdun', 'Commercy'],
            '56' => ['Vannes', 'Lorient', 'Pontivy'],
            '57' => ['Metz', 'Thionville', 'Forbach'],
            '58' => ['Nevers', 'Cosne-Cours-sur-Loire', 'Clamecy'],
            '59' => ['Lille', 'Roubaix', 'Dunkerque'],
            '60' => ['Beauvais', 'Compiègne', 'Creil'],
            '61' => ['Alençon', 'Argentan', 'Flers'],
            '62' => ['Arras', 'Calais', 'Boulogne-sur-Mer'],
            '63' => ['Clermont-Ferrand', 'Issoire', 'Riom'],
            '64' => ['Pau', 'Bayonne', 'Biarritz'],
            '65' => ['Tarbes', 'Lourdes', 'Bagnères-de-Bigorre'],
            '66' => ['Perpignan', 'Argelès-sur-Mer', 'Céret'],
            '67' => ['Strasbourg', 'Haguenau', 'Sélestat'],
            '68' => ['Colmar', 'Mulhouse', 'Saint-Louis'],
            '69' => ['Lyon', 'Villeurbanne', 'Vénissieux'],
            '70' => ['Vesoul', 'Lure', 'Gray'],
            '71' => ['Mâcon', 'Chalon-sur-Saône', 'Le Creusot'],
            '72' => ['Le Mans', 'La Flèche', 'Sablé-sur-Sarthe'],
            '73' => ['Chambéry', 'Aix-les-Bains', 'Albertville'],
            '74' => ['Annecy', 'Thonon-les-Bains', 'Annemasse'],
            '75' => ['Paris'],
            '76' => ['Rouen', 'Le Havre', 'Dieppe'],
            '77' => ['Melun', 'Meaux', 'Fontainebleau'],
            '78' => ['Versailles', 'Mantes-la-Jolie', 'Poissy'],
            '79' => ['Niort', 'Bressuire', 'Parthenay'],
            '80' => ['Amiens', 'Abbeville', 'Péronne'],
            '81' => ['Albi', 'Castres', 'Gaillac'],
            '82' => ['Montauban', 'Castelsarrasin', 'Moissac'],
            '83' => ['Toulon', 'Fréjus', 'Draguignan'],
            '84' => ['Avignon', 'Orange', 'Carpentras'],
            '85' => ['La Roche-sur-Yon', 'Les Sables-d’Olonne', 'Challans'],
            '86' => ['Poitiers', 'Châtellerault', 'Montmorillon'],
            '87' => ['Limoges', 'Saint-Junien', 'Panazol'],
            '88' => ['Épinal', 'Saint-Dié-des-Vosges', 'Gérardmer'],
            '89' => ['Auxerre', 'Sens', 'Joigny'],
            '90' => ['Belfort', 'Delle', 'Valdoie'],
            '91' => ['Évry-Courcouronnes', 'Massy', 'Palaiseau'],
            '92' => ['Nanterre', 'Clamart', 'Boulogne-Billancourt'],
            '93' => ['Saint-Denis', 'Montreuil', 'Aubervilliers'],
            '94' => ['Créteil', 'Vincennes', 'Ivry-sur-Seine'],
            '95' => ['Cergy', 'Argenteuil', 'Sarcelles'],
            '971' => ['Les Abymes', 'Pointe-à-Pitre', 'Basse-Terre'],
            '972' => ['Fort-de-France', 'Le Lamentin', 'Le Robert'],
            '973' => ['Cayenne', 'Kourou', 'Saint-Laurent-du-Maroni'],
            '974' => ['Saint-Denis', 'Saint-Pierre', 'Saint-Paul'],
            '976' => ['Mamoudzou', 'Dzaoudzi', 'Koungou'],
        ];

        /*
         * Création des jeux de la plateforme.
         */
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
            [$name, $description, $publisher, $minPlayers, $maxPlayers, $minimumAge, $duration] = $data;

            $game = new Game();
            $game->setName($name);
            $game->setImage('/images/games/' . $this->slugify($name) . '.jpg');
            $game->setDescription($description);
            $game->setPublisher($publisher);
            $game->setMinPlayers($minPlayers);
            $game->setMaxPlayers($maxPlayers);
            $game->setMinimumAge($minimumAge);
            $game->setDuration($duration);
            $game->setIsActive(true);
            $game->setCreatedAt($now);
            $game->setUpdatedAt($now);

            $manager->persist($game);
            $games[$name] = $game;
        }

        /*
         * Crée dix profils fictifs pour chaque département répertorié.
         */
        $fakerUsers = [];
        $profileNumber = 1;

        foreach ($departmentCities as $department => $cities) {
            for ($i = 0; $i < 10; $i++) {
                $user = new User();

                $pseudo = 'Meeple' . str_pad(
                    (string) $profileNumber,
                    4,
                    '0',
                    STR_PAD_LEFT
                );

                $user->setEmail('joueur' . $profileNumber . '@mail.fr');
                $user->setRoles(['ROLE_USER']);
                $user->setPassword(
                    $this->passwordHasher->hashPassword($user, 'password')
                );
                $user->setPseudo($pseudo);
                $user->setProfilePicture($faker->randomElement($profilePictures));
                $user->setDateOfBirth(
                    \DateTimeImmutable::createFromMutable(
                        $faker->dateTimeBetween('-60 years', '-18 years')
                    )
                );
                $user->setDepartment($department);
                $user->setCity($faker->randomElement($cities));
                $user->setCityVisible($faker->boolean(80));
                $user->setIsActive(true);
                $user->setRole('USER');
                $user->setCreatedAt($now);
                $user->setUpdatedAt($now);

                $manager->persist($user);
                $fakerUsers[] = $user;
                $profileNumber++;
            }
        }

        /*
         * Enregistre les utilisateurs et les jeux avant les associations.
         */
        $manager->flush();

        /*
         * Le compte administrateur ne reçoit pas de ludothèque.
         * Les deux comptes de test et tous les profils fictifs en reçoivent une.
         */
        $players = [
            $testUser,
            $testUser2,
            ...$fakerUsers,
        ];

        foreach ($players as $user) {
            // Chaque joueur reçoit entre 1 et 12 jeux distincts.
            $numberOfGames = $faker->numberBetween(
                1,
                min(12, count($games))
            );

            $randomGames = $faker->randomElements(
                array_values($games),
                $numberOfGames
            );

            foreach ($randomGames as $game) {
                $userGame = new UserGame();
                $userGame->setUser($user);
                $userGame->setGame($game);

                // Génère les statuts de possession et de connaissance des règles.
                $owns = $faker->boolean();
                $knowsRules = $faker->boolean();

                // Un jeu doit être possédé ou ses règles doivent être connues.
                if (!$owns && !$knowsRules) {
                    if ($faker->boolean()) {
                        $owns = true;
                    } else {
                        $knowsRules = true;
                    }
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
     * Crée un utilisateur avec les informations fournies.
     */
    private function createUser(
        ObjectManager $manager,
        string $email,
        string $pseudo,
        string $role,
        string $dateOfBirth,
        string $department,
        string $city,
        string $profilePicture,
        \DateTimeImmutable $now
    ): User {
        $user = new User();
        $user->setEmail($email);
        $user->setRoles(
            $role === 'ADMIN' ? ['ROLE_ADMIN'] : ['ROLE_USER']
        );
        $user->setPassword(
            $this->passwordHasher->hashPassword($user, 'password')
        );
        $user->setPseudo($pseudo);
        $user->setProfilePicture($profilePicture);
        $user->setDateOfBirth(new \DateTimeImmutable($dateOfBirth));
        $user->setDepartment($department);
        $user->setCity($city);
        $user->setCityVisible(true);
        $user->setIsActive(true);
        $user->setRole($role);
        $user->setCreatedAt($now);
        $user->setUpdatedAt($now);

        $manager->persist($user);

        return $user;
    }

    /**
     * Transforme un nom de jeu en slug utilisable pour son image.
     */
    private function slugify(string $text): string
    {
        $text = strtolower($text);

        $text = str_replace(
            ['à', 'â', 'ä', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ö', 'ù', 'û', 'ü', 'ç'],
            ['a', 'a', 'a', 'e', 'e', 'e', 'e', 'i', 'i', 'o', 'o', 'u', 'u', 'u', 'c'],
            $text
        );

        $text = preg_replace('/[^a-z0-9]+/', '-', $text);

        return trim($text, '-');
    }
}
