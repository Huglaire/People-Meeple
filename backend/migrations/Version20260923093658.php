<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260923093658 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE conversation (idConversation INT AUTO_INCREMENT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, idUser INT NOT NULL, idUser_1 INT NOT NULL, INDEX IDX_8A8E26E9FE6E88D7 (idUser), INDEX IDX_8A8E26E93EF5FA (idUser_1), PRIMARY KEY (idConversation)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE game (idGame INT AUTO_INCREMENT NOT NULL, name VARCHAR(150) NOT NULL, image VARCHAR(255) NOT NULL, description LONGTEXT NOT NULL, publisher VARCHAR(100) NOT NULL, min_players SMALLINT NOT NULL, max_players SMALLINT NOT NULL, minimum_age SMALLINT NOT NULL, duration SMALLINT NOT NULL, is_active TINYINT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, PRIMARY KEY (idGame)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE game_request (idGameRequest INT AUTO_INCREMENT NOT NULL, name VARCHAR(150) NOT NULL, publisher VARCHAR(100) NOT NULL, description LONGTEXT NOT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, processed_at DATETIME DEFAULT NULL, idUser INT NOT NULL, idUser_1 INT NOT NULL, INDEX IDX_AE55F0B0FE6E88D7 (idUser), INDEX IDX_AE55F0B03EF5FA (idUser_1), PRIMARY KEY (idGameRequest)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE message (idMessage INT AUTO_INCREMENT NOT NULL, content LONGTEXT NOT NULL, created_at DATETIME NOT NULL, idUser INT NOT NULL, idConversation INT NOT NULL, INDEX IDX_B6BD307FFE6E88D7 (idUser), INDEX IDX_B6BD307FD4108218 (idConversation), PRIMARY KEY (idMessage)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE user (idUser INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, pseudo VARCHAR(50) NOT NULL, date_of_birth DATE NOT NULL, department VARCHAR(3) NOT NULL, city VARCHAR(100) DEFAULT NULL, city_visible TINYINT NOT NULL, is_active TINYINT NOT NULL, role VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL (email), PRIMARY KEY (idUser)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE user_game (owns TINYINT NOT NULL, knows_rules TINYINT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, idUser INT NOT NULL, idGame INT NOT NULL, INDEX IDX_59AA7D45FE6E88D7 (idUser), INDEX IDX_59AA7D4550D66F12 (idGame), PRIMARY KEY (idUser, idGame)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE messenger_messages (id BIGINT AUTO_INCREMENT NOT NULL, body LONGTEXT NOT NULL, headers LONGTEXT NOT NULL, queue_name VARCHAR(190) NOT NULL, created_at DATETIME NOT NULL, available_at DATETIME NOT NULL, delivered_at DATETIME DEFAULT NULL, INDEX IDX_75EA56E0FB7336F0E3BD61CE16BA31DBBF396750 (queue_name, available_at, delivered_at, id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE conversation ADD CONSTRAINT FK_8A8E26E9FE6E88D7 FOREIGN KEY (idUser) REFERENCES user (idUser)');
        $this->addSql('ALTER TABLE conversation ADD CONSTRAINT FK_8A8E26E93EF5FA FOREIGN KEY (idUser_1) REFERENCES user (idUser)');
        $this->addSql('ALTER TABLE game_request ADD CONSTRAINT FK_AE55F0B0FE6E88D7 FOREIGN KEY (idUser) REFERENCES user (idUser)');
        $this->addSql('ALTER TABLE game_request ADD CONSTRAINT FK_AE55F0B03EF5FA FOREIGN KEY (idUser_1) REFERENCES user (idUser)');
        $this->addSql('ALTER TABLE message ADD CONSTRAINT FK_B6BD307FFE6E88D7 FOREIGN KEY (idUser) REFERENCES user (idUser)');
        $this->addSql('ALTER TABLE message ADD CONSTRAINT FK_B6BD307FD4108218 FOREIGN KEY (idConversation) REFERENCES conversation (idConversation)');
        $this->addSql('ALTER TABLE user_game ADD CONSTRAINT FK_59AA7D45FE6E88D7 FOREIGN KEY (idUser) REFERENCES user (idUser)');
        $this->addSql('ALTER TABLE user_game ADD CONSTRAINT FK_59AA7D4550D66F12 FOREIGN KEY (idGame) REFERENCES game (idGame)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE conversation DROP FOREIGN KEY FK_8A8E26E9FE6E88D7');
        $this->addSql('ALTER TABLE conversation DROP FOREIGN KEY FK_8A8E26E93EF5FA');
        $this->addSql('ALTER TABLE game_request DROP FOREIGN KEY FK_AE55F0B0FE6E88D7');
        $this->addSql('ALTER TABLE game_request DROP FOREIGN KEY FK_AE55F0B03EF5FA');
        $this->addSql('ALTER TABLE message DROP FOREIGN KEY FK_B6BD307FFE6E88D7');
        $this->addSql('ALTER TABLE message DROP FOREIGN KEY FK_B6BD307FD4108218');
        $this->addSql('ALTER TABLE user_game DROP FOREIGN KEY FK_59AA7D45FE6E88D7');
        $this->addSql('ALTER TABLE user_game DROP FOREIGN KEY FK_59AA7D4550D66F12');
        $this->addSql('DROP TABLE conversation');
        $this->addSql('DROP TABLE game');
        $this->addSql('DROP TABLE game_request');
        $this->addSql('DROP TABLE message');
        $this->addSql('DROP TABLE user');
        $this->addSql('DROP TABLE user_game');
        $this->addSql('DROP TABLE messenger_messages');
    }
}
