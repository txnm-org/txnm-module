// Wire-format DTOs mirror kc-auth-service's Java records exactly (field names/casing as
// serialized over JSON) - see kc-auth-service/src/main/java/com/txnm/dto.

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PREMIUM';

export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * What kc-auth-service's /auth/login, /auth/refresh and /auth/google/callback actually return
 * (snake_case, matching AccessTokenResponse.java). Deliberately has no refresh_token field - per
 * adr04_refresh_token_cookie_flow.md, the refresh token only ever travels as an httpOnly cookie,
 * never in a JSON body the frontend could read.
 */
export interface AccessTokenResponseDto {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
  subscriptionTier?: SubscriptionTier;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface PermissionDto {
  resourceName: string;
  scopes: string[];
}

/**
 * App-internal, camelCase token state. expiresAt is derived client-side (Date.now() +
 * expires_in*1000) so callers don't have to redo that math. There's no refreshToken field here -
 * per adr04_refresh_token_cookie_flow.md it never reaches the frontend as a value to hold at all,
 * only as an httpOnly cookie the browser manages on its own.
 */
export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  scope: string;
  expiresAt: number;
}

/** Fields pulled from the decoded (unverified - display only) access token JWT payload. */
export interface DecodedAccessToken {
  sub: string;
  preferredUsername: string | null;
  email: string | null;
  fullName: string | null;
  roles: string[];
}
