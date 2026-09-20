import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AccessTokenResponseDto,
  CreateUserRequest,
  ForgotPasswordRequest,
  LoginRequest,
  PermissionDto,
  ResetPasswordRequest,
  VerifyOtpRequest
} from '../models/auth.model';

/**
 * Talks to kc-auth-service (via the gateway) directly with plain HttpClient - unlike
 * BaseApiService, kc-auth-service does not wrap responses in the {success,data,message,error}
 * envelope txnm-mvp uses, so reusing BaseApiService here would misparse every response.
 *
 * login/refresh/logout pass `withCredentials: true` so the browser sends/stores the httpOnly
 * `txnm_refresh_token` cookie kc-auth-service sets (adr04_refresh_token_cookie_flow.md) - without
 * it, a cross-origin XHR silently drops both the incoming Set-Cookie and any outgoing cookie.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly baseUrl = environment.authApiUrl;

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<AccessTokenResponseDto> {
    return this.http.post<AccessTokenResponseDto>(
      `${this.baseUrl}/auth/login`, request, { withCredentials: true });
  }

  /** Redeems the httpOnly refresh-token cookie for a new access token - no body needed. */
  refresh(): Observable<AccessTokenResponseDto> {
    return this.http.post<AccessTokenResponseDto>(
      `${this.baseUrl}/auth/refresh`, {}, { withCredentials: true });
  }

  /** Revokes the session at Keycloak and clears the refresh-token cookie server-side. */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true });
  }

  getPermissions(accessToken: string): Observable<PermissionDto[]> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${accessToken}` });
    return this.http.get<PermissionDto[]>(`${this.baseUrl}/auth/permissions`, { headers });
  }

  /** Full-page redirect target for "Login with Google" - not an XHR call. */
  googleLoginUrl(): string {
    return `${this.baseUrl}/auth/google/login`;
  }

  signupInitiate(request: CreateUserRequest): Observable<{ email: string; message: string }> {
    return this.http.post<{ email: string; message: string }>(
      `${this.baseUrl}/users/signup/initiate`, request);
  }

  signupVerify(request: VerifyOtpRequest): Observable<{ userId: string; email: string; subscriptionTier: string }> {
    return this.http.post<{ userId: string; email: string; subscriptionTier: string }>(
      `${this.baseUrl}/users/signup/verify`, request);
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<{ email: string; message: string }> {
    return this.http.post<{ email: string; message: string }>(
      `${this.baseUrl}/users/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<{ email: string; message: string }> {
    return this.http.post<{ email: string; message: string }>(
      `${this.baseUrl}/users/reset-password`, request);
  }
}
