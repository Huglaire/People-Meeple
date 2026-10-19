<?php

namespace App\Document;

use Doctrine\ODM\MongoDB\Mapping\Annotations as ODM;

#[ODM\Document(collection: 'game_views')]
class GameView
{
    #[ODM\Id]
    private ?string $id = null;

    #[ODM\Field(type: 'int')]
    private int $gameId;

    #[ODM\Field(type: 'date_immutable')]
    private \DateTimeImmutable $viewedAt;

    public function __construct(
        int $gameId,
        ?\DateTimeImmutable $viewedAt = null
    ) {
        $this->gameId = $gameId;
        $this->viewedAt = $viewedAt ?? new \DateTimeImmutable();
    }

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getGameId(): int
    {
        return $this->gameId;
    }

    public function getViewedAt(): \DateTimeImmutable
    {
        return $this->viewedAt;
    }
}