import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (authService.isAuthenticated()) {
    return true;
  }

  // If we're on the server, we don't know if the user is authenticated (localStorage is browser-only)
  // So we return true to let the page load, and the client-side will handle the redirect if needed.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  router.navigate([state.url.startsWith('/admin') || state.url.startsWith('/officer') ? '/staff/login' : '/candidate/login']);
  return false;
};