import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (authService.hasToken()) {
    return true;
  }

  // Redirect to login page with return URL
  router.navigate(['/signin'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
