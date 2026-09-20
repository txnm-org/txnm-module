import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Not wired to any route yet - nothing in txnm-module currently requires a real (non-guest)
 * login. Kept ready for whenever an account-only page shows up (see
 * txnm-arch-docs/arch03_frontend_auth_integration_gaps.md). Uses hasValidSession(), not
 * isAuthenticated() - the latter is also true for a GUEST upload session, which must not satisfy
 * a route that specifically requires a real login.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasValidSession()) {
    return true;
  }

  return router.createUrlTree(['/txnm/login'], { queryParams: { returnUrl: state.url } });
};
