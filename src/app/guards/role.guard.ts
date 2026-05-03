import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // If we're on the server, we don't know if the user is authenticated (localStorage is browser-only)
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

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

  router.navigate([state.url.startsWith('/admin') || state.url.startsWith('/officer') ? '/staff/login' : '/candidate/login']);
  return false;
};
