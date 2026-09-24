<?php

namespace App\DataFixtures;

use App\Entity\Game;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Faker\Factory;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class AppFixtures extends Fixture
{
    /**
     * Initialise le générateur de données Faker et le hashage des mots de passe.
     */
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher
    ) {
    }

    /**
     * Charge les données de test dans la base de données.
     */
    public function load(ObjectManager $manager): void
    {
        $faker = Factory::create('fr_FR');
        $now = new \DateTimeImmutable();

        // Création du compte administrateur fixe
        $admin = new User();
        $admin
            ->setEmail('admin@mail.fr')
            ->setRoles(['ROLE_ADMIN'])
            ->setPassword($this->passwordHasher->hashPassword($admin, 'password'))
            ->setPseudo('AdminMeeple')
            ->setDateOfBirth(new \DateTimeImmutable('1985-01-15'))
            ->setDepartment('75')
            ->setCity('Paris')
            ->setCityVisible(true)
            ->setIsActive(true)
            ->setRole('ADMIN')
            ->setCreatedAt($now)
            ->setUpdatedAt(null);

        $manager->persist($admin);

        // Liste de départements utilisée pour les utilisateurs de test
        $departments = [
            '01',
            '02',
            '13',
            '31',
            '33',
            '34',
            '35',
            '44',
            '59',
            '67',
            '69',
            '75',
            '76',
            '78',
            '83',
            '91',
            '92',
            '93',
            '94',
            '95',
        ];

        // Création de 20 utilisateurs Faker
        for ($i = 1; $i <= 20; $i++) {
            $user = new User();

            $user
                ->setEmail($faker->unique()->safeEmail())
                ->setRoles(['ROLE_USER'])
                ->setPassword($this->passwordHasher->hashPassword($user, 'password'))
                ->setPseudo($faker->unique()->userName())
                ->setDateOfBirth(
                    \DateTimeImmutable::createFromMutable(
                        $faker->dateTimeBetween('-70 years', '-18 years')
                    )
                )
                ->setDepartment($faker->randomElement($departments))
                ->setCity($faker->city())
                ->setCityVisible($faker->boolean())
                ->setIsActive(true)
                ->setRole('USER')
                ->setCreatedAt($now)
                ->setUpdatedAt(null);

            $manager->persist($user);
        }

        // Données fixes des jeux de la plateforme
        $games = [
            [
                'name' => 'Azul',
                'publisher' => 'Next Move',
                'minPlayers' => 2,
                'maxPlayers' => 4,
                'minimumAge' => 8,
                'duration' => 45,
                'description' => 'Les joueurs incarnent des artisans chargés de créer une mosaïque pour décorer le Palais Royal d’Évora. Ils sélectionnent des tuiles et cherchent à optimiser leur placement pour marquer le plus de points.',
            ],
            [
                'name' => '7 Wonders',
                'publisher' => 'Repos Production',
                'minPlayers' => 3,
                'maxPlayers' => 7,
                'minimumAge' => 10,
                'duration' => 45,
                'description' => 'Les joueurs dirigent une grande cité de l’Antiquité et la développent à travers trois âges en construisant des bâtiments, en produisant des ressources et en développant leur civilisation.',
            ],
            [
                'name' => 'Micro Macro Crime City',
                'publisher' => 'Spielwiese',
                'minPlayers' => 1,
                'maxPlayers' => 4,
                'minimumAge' => 10,
                'duration' => 45,
                'description' => 'Dans Crime City, les joueurs enquêtent ensemble sur différentes affaires criminelles grâce à l’observation, la déduction et une grande carte représentant la ville.',
            ],
            [
                'name' => 'Citadelles',
                'publisher' => 'Edge',
                'minPlayers' => 2,
                'maxPlayers' => 8,
                'minimumAge' => 10,
                'duration' => 45,
                'description' => 'Les joueurs cherchent à construire la cité la plus prestigieuse en utilisant de l’or et les pouvoirs de différents personnages, tout en bluffant et en anticipant les choix de leurs adversaires.',
            ],
            [
                'name' => 'Splendor Duel',
                'publisher' => 'Space Cowboys',
                'minPlayers' => 2,
                'maxPlayers' => 2,
                'minimumAge' => 10,
                'duration' => 20,
                'description' => 'Deux guildes rivales s’affrontent pour le prestige. Les joueurs prennent des gemmes et des perles, achètent des cartes et utilisent différents pouvoirs pour atteindre l’une des conditions de victoire.',
            ],
            [
                'name' => 'Terraforming Mars',
                'publisher' => 'Intrafin',
                'minPlayers' => 1,
                'maxPlayers' => 5,
                'minimumAge' => 12,
                'duration' => 90,
                'description' => 'Les joueurs dirigent des corporations qui participent à la terraformation de Mars en développant des projets permettant notamment d’augmenter la température, l’oxygène et les océans.',
            ],
            [
                'name' => 'Heat',
                'publisher' => 'Days of Wonder',
                'minPlayers' => 1,
                'maxPlayers' => 6,
                'minimumAge' => 10,
                'duration' => 45,
                'description' => 'Les joueurs prennent place au volant de voitures de course des années 1960. La gestion des cartes, de la vitesse et de la température du moteur permet de tenter de remporter les courses.',
            ],
            [
                'name' => 'Root',
                'publisher' => 'Matagot',
                'minPlayers' => 1,
                'maxPlayers' => 6,
                'minimumAge' => 10,
                'duration' => 90,
                'description' => 'Différentes factions s’affrontent pour prendre le contrôle d’une vaste forêt. Chaque faction possède ses propres règles, objectifs et manière de marquer des points.',
            ],
            [
                'name' => 'Emblèmes',
                'publisher' => 'Savana',
                'minPlayers' => 3,
                'maxPlayers' => 5,
                'minimumAge' => 10,
                'duration' => 20,
                'description' => 'Les joueurs dirigent des familles qui cherchent à prendre de l’influence dans trois lieux du royaume : le Château, le Village et le Port, grâce à un système de cartes et de placement.',
            ],
            [
                'name' => 'Orléans',
                'publisher' => 'Matagot',
                'minPlayers' => 2,
                'maxPlayers' => 5,
                'minimumAge' => 12,
                'duration' => 90,
                'description' => 'Dans la France médiévale, les joueurs rassemblent différents partisans pour développer leur influence, produire, commercer, construire et participer au développement de leur territoire.',
            ],
            [
                'name' => 'Leda',
                'publisher' => 'Sorry We Are French',
                'minPlayers' => 2,
                'maxPlayers' => 2,
                'minimumAge' => 12,
                'duration' => 45,
                'description' => 'Leda est un jeu de cartes asymétrique pour deux joueurs. Chaque joueur dirige un clan animal possédant ses propres règles, objectifs et manière de développer sa grille de cartes.',
            ],
            [
                'name' => 'Carcassonne',
                'publisher' => 'Z-Man Games',
                'minPlayers' => 2,
                'maxPlayers' => 5,
                'minimumAge' => 7,
                'duration' => 45,
                'description' => 'Les joueurs construisent progressivement un paysage médiéval composé de routes, de villes, d’abbayes et de prés. Ils placent leurs meeples pour prendre le contrôle des différents éléments et marquer des points.',
            ],
            [
                'name' => 'Catan',
                'publisher' => 'Asmodee',
                'minPlayers' => 3,
                'maxPlayers' => 4,
                'minimumAge' => 10,
                'duration' => 75,
                'description' => 'Les joueurs développent leur colonie sur l’île de Catan en produisant et échangeant des ressources afin de construire des routes, des colonies et des villes et d’accumuler des points de victoire.',
            ],
            [
                'name' => 'Sagrada',
                'publisher' => 'Floodgate Games',
                'minPlayers' => 1,
                'maxPlayers' => 4,
                'minimumAge' => 10,
                'duration' => 45,
                'description' => 'Chaque joueur construit un vitrail en plaçant des dés colorés dans une grille. Les couleurs et les valeurs des dés imposent des contraintes de placement qui influencent le score final.',
            ],
            [
                'name' => 'Five Tribes',
                'publisher' => 'Days of Wonder',
                'minPlayers' => 2,
                'maxPlayers' => 4,
                'minimumAge' => 13,
                'duration' => 60,
                'description' => 'Les joueurs cherchent à prendre le contrôle du sultanat de Naqala en déplaçant les cinq tribus présentes sur le plateau et en exploitant les différents territoires et pouvoirs disponibles.',
            ],
            [
                'name' => 'Dice Forge',
                'publisher' => 'Libellud',
                'minPlayers' => 2,
                'maxPlayers' => 4,
                'minimumAge' => 10,
                'duration' => 45,
                'description' => 'Les joueurs incarnent des héros capables de modifier les faces de leurs dés. Ils améliorent progressivement leurs dés, collectent des ressources et accomplissent des exploits pour gagner du prestige.',
            ],
            [
                'name' => 'Orichalque',
                'publisher' => 'Catch Up Games',
                'minPlayers' => 2,
                'maxPlayers' => 4,
                'minimumAge' => 12,
                'duration' => 60,
                'description' => 'Les joueurs explorent une île, exploitent ses ressources et affrontent les créatures qui l’occupent. L’objectif est de pacifier son territoire et d’obtenir cinq points de victoire avant ses adversaires.',
            ],
            [
                'name' => 'Challengers',
                'publisher' => 'Z-Man Games',
                'minPlayers' => 1,
                'maxPlayers' => 8,
                'minimumAge' => 8,
                'duration' => 45,
                'description' => 'Les joueurs construisent et améliorent leur équipe grâce au deck building avant de participer à un tournoi en plusieurs manches. Les deux joueurs ayant obtenu le plus de fans s’affrontent en finale.',
            ],
            [
                'name' => 'Skyjo',
                'publisher' => 'Magilano',
                'minPlayers' => 2,
                'maxPlayers' => 8,
                'minimumAge' => 8,
                'duration' => 20,
                'description' => 'Skyjo est un jeu de cartes dans lequel les joueurs cherchent à obtenir le plus petit score possible au fil de plusieurs manches.',
            ],
            [
                'name' => 'Love Letter',
                'publisher' => 'Z-Man Games',
                'minPlayers' => 2,
                'maxPlayers' => 6,
                'minimumAge' => 14,
                'duration' => 20,
                'description' => 'Love Letter est un jeu rapide de déduction et de prise de risque dans lequel les joueurs utilisent les effets des personnages pour tenter de faire parvenir leur lettre à la princesse.',
            ],
        ];

        // Création des jeux fixes
        foreach ($games as $gameData) {
            $game = new Game();

            $game
                ->setName($gameData['name'])
                ->setImage('/images/games/' . $this->slugify($gameData['name']) . '.jpg')
                ->setDescription($gameData['description'])
                ->setPublisher($gameData['publisher'])
                ->setMinPlayers($gameData['minPlayers'])
                ->setMaxPlayers($gameData['maxPlayers'])
                ->setMinimumAge($gameData['minimumAge'])
                ->setDuration($gameData['duration'])
                ->setIsActive(true)
                ->setCreatedAt($now)
                ->setUpdatedAt(null);

            $manager->persist($game);
        }

        // Enregistrement de toutes les fixtures
        $manager->flush();
    }

    /**
     * Génère un nom de fichier simple pour les images des jeux.
     */
    private function slugify(string $value): string
    {
        $value = strtolower($value);

        $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);

        $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? '';

        return trim($value, '-');
    }
}