import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // ✅ Check login
  if (!authService.isLoggedIn()) {
    router.navigate(['/']);
    return false;
  }

  // ✅ Get user role
  const userRole = authService.getRole(); // implement this

  // ✅ Get allowed roles from route
  const allowedRoles = route.data?.['roles'] as string[];

  // ✅ If roles defined → validate
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    router.navigate(['/unauthorized']); // better UX
    return false;
  }

  return true;
};
