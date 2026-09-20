import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { SessionService } from './session.service';
import { AuthApiService } from './auth-api.service';
import { SessionInfo } from '../models/api-response.model';
import {
  AccessTokenResponseDto,
  AuthTokens,
  CreateUserRequest,
  DecodedAccessToken,
  ForgotPasswordRequest,
  LoginRequest,
  PermissionDto,
  ResetPasswordRequest,
  VerifyOtpRequest
} from '../models/auth.model';

export interface User {
  id: number;
  email: string | null;
  googleId: string | null;
  fullName: string | null;
  userType: 'GUEST' | 'REGISTERED';
  sessionId: string;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  /** Keycloak subject id - only set for REGISTERED users. */
  keycloakId?: string | null;
  roles?: string[];
}

/**
 * Two identities live side by side here on purpose (kept apart per
 * txnm-arch-docs/arch03_frontend_auth_integration_gaps.md, "guest/registered coexistence"):
 * - GUEST: SessionService's existing in-memory upload session, untouched by this integration.
 * - REGISTERED: a real kc-auth-service/Keycloak login, added by this integration.
 * Both publish through the same user$ so Header/txnm-home keep working unchanged.
 *
 * Token storage follows adr04_refresh_token_cookie_flow.md (superseding
 * adr03_frontend_token_storage_decision.md's "discard the refresh token" clause - its
 * in-memory-access-token clause still holds): the access token lives only in this service
 * instance's memory, same as before, but the refresh token now lives in an httpOnly cookie
 * kc-auth-service sets and reads - this class never sees its value. refreshAccessToken() redeems
 * that cookie via POST /auth/refresh to recover a session after a reload or after the access
 * token's exp, without the user re-entering credentials.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private permissionsSubject = new BehaviorSubject<PermissionDto[]>([]);

  public user$ = this.userSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public permissions$ = this.permissionsSubject.asObservable();

  private tokens: AuthTokens | null = null;
  /** Single-flight guard so concurrent 401s / a bootstrap race don't fire multiple /auth/refresh calls. */
  private refreshInFlight$: Observable<User | null> | null = null;

  constructor(
    private sessionService: SessionService,
    private authApi: AuthApiService
  ) {
  }

  private async initializeAuth(): Promise<void> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      const sessionId = this.sessionService.getSessionId();
      if (sessionId) {
        // SessionService now validates locally, so we can trust it
        const sessionInfo = this.sessionService.getSessionInfo();
        if (sessionInfo && this.sessionService.isSessionValid()) {
          const user: User = {
            id: 0, // This will be set by the backend
            email: sessionInfo.email || null,
            googleId: null,
            fullName: sessionInfo.fullName || null,
            userType: sessionInfo.userType,
            sessionId: sessionInfo.sessionId,
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          this.userSubject.next(user);
        } else {
          // Session is invalid, clear it
          // await this.sessionService.deleteSession().toPromise();
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      this.errorSubject.next('Failed to initialize authentication');
    } finally {
      this.loadingSubject.next(false);
    }
  }

  loginAsGuest(): Observable<User> {
    return new Observable(observer => {
      // Create new session for this upload
      const sessionId = this.sessionService.createSessionForUpload();

      const user: User = {
        id: 0,
        email: null,
        googleId: null,
        fullName: null,
        userType: 'GUEST',
        sessionId: sessionId,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.userSubject.next(user);
      observer.next(user);
      observer.complete();
    });
  }

  // ---- Real (Keycloak-backed) auth, added on top of the guest flow above ----

  login(request: LoginRequest): Observable<User> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.authApi.login(request).pipe(
      map(dto => this.applyTokenResponse(dto)),
      tap(() => this.fetchPermissions().subscribe()),
      catchError(err => {
        this.errorSubject.next(this.extractErrorMessage(err, 'Login failed'));
        this.loadingSubject.next(false);
        throw err;
      })
    );
  }

  /** Full-page redirect - see arch03 gaps doc for the callback-side limitation. */
  loginWithGoogle(): void {
    window.location.href = this.authApi.googleLoginUrl();
  }

  signupInitiate(request: CreateUserRequest): Observable<{ email: string; message: string }> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    return this.authApi.signupInitiate(request).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError(err => {
        this.errorSubject.next(this.extractErrorMessage(err, 'Signup failed'));
        this.loadingSubject.next(false);
        throw err;
      })
    );
  }

  signupVerify(request: VerifyOtpRequest): Observable<{ userId: string; email: string; subscriptionTier: string }> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    return this.authApi.signupVerify(request).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError(err => {
        this.errorSubject.next(this.extractErrorMessage(err, 'OTP verification failed'));
        this.loadingSubject.next(false);
        throw err;
      })
    );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<{ email: string; message: string }> {
    return this.authApi.forgotPassword(request).pipe(
      catchError(err => {
        this.errorSubject.next(this.extractErrorMessage(err, 'Request failed'));
        throw err;
      })
    );
  }

  resetPassword(request: ResetPasswordRequest): Observable<{ email: string; message: string }> {
    return this.authApi.resetPassword(request).pipe(
      catchError(err => {
        this.errorSubject.next(this.extractErrorMessage(err, 'Password reset failed'));
        throw err;
      })
    );
  }

  fetchPermissions(): Observable<PermissionDto[]> {
    if (!this.tokens) {
      return of([]);
    }
    return this.authApi.getPermissions(this.tokens.accessToken).pipe(
      tap(permissions => this.permissionsSubject.next(permissions)),
      catchError(() => of([]))
    );
  }

  getAccessToken(): string | null {
    if (!this.tokens || Date.now() >= this.tokens.expiresAt) {
      return null;
    }
    return this.tokens.accessToken;
  }

  /**
   * Stricter than isAuthenticated(): true only for a live Keycloak session, never for a guest
   * session. Route guards must use this one, not isAuthenticated() - see auth.guard.ts.
   */
  hasValidSession(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * Redeems the httpOnly refresh-token cookie for a new access token. Concurrent callers (e.g.
   * several requests 401-ing at once) share one in-flight call rather than each hitting
   * /auth/refresh separately. Never errors to the caller - a failed refresh (no cookie, expired,
   * revoked) resolves to `null` and clears local auth state, since "not logged in" is a valid
   * outcome here, not a failure the caller needs to catch.
   */
  refreshAccessToken(): Observable<User | null> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this.refreshInFlight$ = this.authApi.refresh().pipe(
      map(dto => this.applyTokenResponse(dto)),
      tap(() => this.fetchPermissions().subscribe()),
      catchError(() => {
        this.clearLocalState();
        return of(null);
      }),
      finalize(() => { this.refreshInFlight$ = null; }),
      shareReplay(1)
    );

    return this.refreshInFlight$;
  }

  /**
   * Call once at app bootstrap (see app-module.ts's provideAppInitializer) to recover a session
   * across a page reload - the access token itself doesn't survive a reload (in-memory only), but
   * the refresh-token cookie does, so this silently re-establishes it without asking for
   * credentials again. Resolves to whether a session was recovered; never rejects, so it never
   * blocks app startup.
   */
  restoreSession(): Observable<boolean> {
    return this.refreshAccessToken().pipe(map(user => !!user));
  }

  logout(): Observable<void> {
    return this.authApi.logout().pipe(
      map(() => undefined),
      // Local logout should succeed even if the backend call fails (network blip, already-expired
      // session, etc.) - the user asked to log out, and clearing local state is what makes that
      // true from the SPA's point of view regardless of what Keycloak's session state ends up as.
      catchError(() => of(undefined)),
      tap(() => this.clearLocalState())
    );
  }

  private clearLocalState(): void {
    this.tokens = null;
    this.permissionsSubject.next([]);
    this.userSubject.next(null);
    this.errorSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.userSubject.value;
  }

  isGuest(): boolean {
    const user = this.getCurrentUser();
    return user?.userType === 'GUEST';
  }

  getSessionId(): string | null {
    return this.sessionService.getSessionId();
  }

  private applyTokenResponse(dto: AccessTokenResponseDto): User {
    this.tokens = {
      accessToken: dto.access_token,
      tokenType: dto.token_type,
      scope: dto.scope,
      expiresAt: Date.now() + dto.expires_in * 1000
    };

    const decoded = this.decodeAccessToken(dto.access_token);
    const user: User = {
      id: 0,
      email: decoded?.email ?? null,
      googleId: null,
      fullName: decoded?.fullName ?? decoded?.preferredUsername ?? null,
      userType: 'REGISTERED',
      sessionId: decoded?.sub ?? '',
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      keycloakId: decoded?.sub ?? null,
      roles: decoded?.roles ?? []
    };

    this.userSubject.next(user);
    this.loadingSubject.next(false);
    return user;
  }

  /**
   * Decodes the JWT payload client-side for display purposes only (username/email/roles shown
   * in the header etc.) - this is NOT a signature/verification check. The gateway (adr02) and
   * each downstream service are what actually validate the token; a forged/tampered token
   * decoded here would just show wrong display data, not grant any real access.
   */
  private decodeAccessToken(accessToken: string): DecodedAccessToken | null {
    try {
      const payload = accessToken.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const claims = JSON.parse(json);
      const roles: string[] = claims?.realm_access?.roles ?? [];
      const combinedName = [claims?.given_name, claims?.family_name].filter(Boolean).join(' ');
      const fullName = claims?.name ?? (combinedName || null);
      return {
        sub: claims.sub,
        preferredUsername: claims.preferred_username ?? null,
        email: claims.email ?? null,
        fullName,
        roles
      };
    } catch {
      return null;
    }
  }

  private extractErrorMessage(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.error || err?.message || fallback;
  }
}
