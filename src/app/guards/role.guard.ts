import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = route.data['roles'] as Array<string>;
  const userRole = authService.userRole();

  if (authService.isAuthenticated() && expectedRoles.includes(userRole)) {
    return true;
  }

  // Redirect to their default dashboard if they have a role but not the right one
  if (authService.isAuthenticated()) {
     if (userRole === 'CANDIDATE') router.navigate(['/candidate/dashboard']);
     else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') router.navigate(['/admin/users']);
     else if (userRole === 'L1_OFFICER' || userRole === 'L2_OFFICER') router.navigate(['/officer/alerts']);
     return false;
  }

  router.navigate(['/candidate/login']);
  return false;
};
