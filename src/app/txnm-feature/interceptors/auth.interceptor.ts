import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

// Endpoints that must NOT get an Authorization header, and must NOT trigger a refresh-and-retry
// on their own 401: they're either how you get a token in the first place, cookie-authenticated
// rather than Bearer-authenticated (/auth/refresh, /auth/logout - see
// adr04_refresh_token_cookie_flow.md), or don't need auth at all.
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/google/login',
  '/auth/google/callback',
  '/users/signup/initiate',
  '/users/signup/verify',
  '/users/forgot-password',
  '/users/reset-password'
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const isOwnBackend = req.url.startsWith(environment.authApiUrl) || req.url.startsWith(environment.apiUrl);
  const isPublicAuthPath = PUBLIC_AUTH_PATHS.some(path => req.url.includes(path));

  const attachToken = (request: HttpRequest<unknown>): HttpRequest<unknown> => {
    const accessToken = authService.getAccessToken();
    return (isOwnBackend && !isPublicAuthPath && accessToken)
      ? request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
      : request;
  };

  return next(attachToken(req)).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || !isOwnBackend || isPublicAuthPath) {
        return throwError(() => error);
      }

      // Try one silent refresh before giving up - see adr04_refresh_token_cookie_flow.md. Plenty
      // of requests (guest upload/analytics calls to txnm-mvp) can also 401/403 for reasons
      // unrelated to a Keycloak session; isOwnBackend + isPublicAuthPath above is as precise as
      // this interceptor can be about which ones are actually worth retrying.
      return authService.refreshAccessToken().pipe(
        switchMap(user => user
          ? next(attachToken(req))
          : throwError(() => error))
      );
    })
  );
};
