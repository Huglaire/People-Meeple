<?php

namespace App\Document;

use Doctrine\ODM\MongoDB\Mapping\Annotations as ODM;

#[ODM\Document(collection: 'registration_events')]
class RegistrationEvent
{
    #[ODM\Id]
    private ?string $id = null;

    #[ODM\Field(type: 'date_immutable')]
    private \DateTimeImmutable $registeredAt;

    public function __construct(
        ?\DateTimeImmutable $registeredAt = null
    ) {
        $this->registeredAt = $registeredAt ?? new \DateTimeImmutable();
    }

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getRegisteredAt(): \DateTimeImmutable
    {
        return $this->registeredAt;
    }
}