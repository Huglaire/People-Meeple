<?php

namespace App\Security;

use App\Entity\User;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Vérifie qu'un compte est actif avant l'authentification.
 */
final class UserChecker implements UserCheckerInterface
{
    /**
     * Vérifie le compte avant l'authentification.
     */
    public function checkPreAuth(UserInterface $user): void
    {
        // Vérifie uniquement les utilisateurs de notre application
        if (!$user instanceof User) {
            return;
        }

        // Empêche la connexion d'un compte désactivé
        if (!$user->isActive()) {
            throw new CustomUserMessageAuthenticationException(
                'Ce compte est désactivé.'
            );
        }
    }

    /**
     * Aucune vérification supplémentaire après l'authentification.
     */
    public function checkPostAuth(UserInterface $user): void
    {
    }
}