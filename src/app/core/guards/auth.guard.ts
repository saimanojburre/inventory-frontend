import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);

  const router = inject(Router);

  // =====================================================
  // NOT LOGGED IN
  // =====================================================

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/']);
  }

  // =====================================================
  // ROLE CHECK
  // =====================================================

  const allowedRoles = route.data?.['roles'] as string[];

  // If route has no roles -> allow access
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // Current user role
  const userRole = authService.getRole()?.toUpperCase();

  // Role validation
  if (!allowedRoles.includes(userRole)) {
    return router.createUrlTree(['/unauthorized']);
  }

  return true;
};
