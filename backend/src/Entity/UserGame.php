<?php

namespace App\Entity;

use App\Repository\UserGameRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserGameRepository::class)]
class UserGame
{
    #[ORM\Id]
    #[ORM\ManyToOne(inversedBy: 'userGames')]
    #[ORM\JoinColumn(name: 'idUser', referencedColumnName: 'idUser', nullable: false)]
    private ?User $user = null;

    #[ORM\Id]
    #[ORM\ManyToOne(inversedBy: 'userGames')]
    #[ORM\JoinColumn(name: 'idGame', referencedColumnName: 'idGame', nullable: false)]
    private ?Game $game = null;

    #[ORM\Column]
    private ?bool $owns = null;

    #[ORM\Column]
    private ?bool $knowsRules = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updatedAt = null;

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getGame(): ?Game
    {
        return $this->game;
    }

    public function setGame(?Game $game): static
    {
        $this->game = $game;

        return $this;
    }

    public function isOwns(): ?bool
    {
        return $this->owns;
    }

    public function setOwns(bool $owns): static
    {
        $this->owns = $owns;

        return $this;
    }

    public function isKnowsRules(): ?bool
    {
        return $this->knowsRules;
    }

    public function setKnowsRules(bool $knowsRules): static
    {
        $this->knowsRules = $knowsRules;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }
}