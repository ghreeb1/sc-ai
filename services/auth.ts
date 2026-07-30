import * as SecureStore from "expo-secure-store";
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  MessageResponse,
  ResetPasswordRequest,
  RefreshRequest,
  TokenResponse,
  UserLoginRequest,
  UserPreferencesResponse,
  UserPreferencesUpdate,
  UserProfile,
  UserRegisterRequest,
  UserUpdateRequest,
  UserResponse,
} from "../lib/types";
import { apiRequest, configureAuthTokenHandlers } from "./api";

const ACCESS_TOKEN_KEY = "scholar.access_token";
const REFRESH_TOKEN_KEY = "scholar.refresh_token";

export type StoredTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

// ─── Helper: redact a token for safe logging ────────────────────────────────
function redactToken(token: string | null | undefined): string {
  if (!token) return "(none)";
  if (token.length <= 8) return "***";
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}

function mapGradingScale(gradingScale?: string | null): UserProfile["gradingSystem"] {
  return gradingScale === "5.0" ? "5.0" : "4.0";
}

export function mapBackendUserToProfile(user: UserResponse): UserProfile {
  return {
    fullName: user.name,
    email: user.email,
    major: user.major,
    university: user.university ?? undefined,
    academicLevel: user.level,
    enrollmentYear: user.enrollment_year,
    gradingSystem: mapGradingScale(user.grading_scale),
  };
}

// ── F / A: Token persistence ─────────────────────────────────────────────────
export async function saveAuthTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
}

export async function getStoredTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);

  if (!accessToken && !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function getAccessToken() {
  const tokens = await getStoredTokens();
  const token = tokens?.accessToken ?? null;
  return token;
}

export async function clearAuthTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

async function persistTokenResponse(response: TokenResponse) {
  // ── A: Access / refresh token received ──────────────────────────────────
  await saveAuthTokens({
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  });
  return response;
}

// ── D: Token refresh ─────────────────────────────────────────────────────────
async function requestTokenRefresh() {
  const tokens = await getStoredTokens();
  if (!tokens?.refreshToken) {
    return null;
  }

  const body: RefreshRequest = { refresh_token: tokens.refreshToken };
  const response = await apiRequest<TokenResponse>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify(body),
    retryOnUnauthorized: false,
  });

  return persistTokenResponse(response);
}

export async function refreshAccessToken() {
  try {
    const session = await requestTokenRefresh();
    const token = session?.access_token ?? null;
    return token;
  } catch (err) {
    return null;
  }
}

// ── Unauthorized handler registration ────────────────────────────────────────
let onUnauthorizedCallback: (() => void) | null = null;

export function setUnauthorizedHandler(callback: () => void) {
  onUnauthorizedCallback = callback;
}

export function initializeAuth() {
  configureAuthTokenHandlers({
    getAccessToken,
    refreshAccessToken,
    onUnauthorized: () => {
      onUnauthorizedCallback?.();
    },
  });
}

// ── A: Login ─────────────────────────────────────────────────────────────────
export async function login(data: UserLoginRequest) {
  const response = await apiRequest<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return persistTokenResponse(response);
}

export async function register(data: UserRegisterRequest) {
  const response = await apiRequest<TokenResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return persistTokenResponse(response);
}

export async function refreshSession() {
  return requestTokenRefresh();
}

export async function getCurrentUser() {
  return apiRequest<UserResponse>("/api/auth/me", {
    method: "GET",
    auth: true,
  });
}

export async function updateCurrentUser(data: UserUpdateRequest) {
  return apiRequest<UserResponse>("/api/auth/me", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(data),
  });
}

export async function getUserPreferences() {
  return apiRequest<UserPreferencesResponse>("/api/user/preferences", {
    method: "GET",
    auth: true,
  });
}

export async function updateUserPreferences(data: UserPreferencesUpdate) {
  return apiRequest<UserPreferencesResponse>("/api/user/preferences", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(data),
  });
}

// ── E: Logout – log every call with a stack trace ────────────────────────────
let isLoggingOut = false;

export async function logout() {
  
  if (isLoggingOut) {
    return;
  }

  isLoggingOut = true;
  try {
    const token = await getAccessToken();
    if (token) {
      try {
        await apiRequest<MessageResponse>("/api/auth/logout", {
          method: "POST",
          auth: true,
          retryOnUnauthorized: false, // Prevent infinite 401/refresh loop on logout
        });
      } catch (err) {
      }
    } else {
    }
  } finally {
    await clearAuthTokens();
    isLoggingOut = false;
  }
}

export async function forgotPassword(data: ForgotPasswordRequest) {
  return apiRequest<ForgotPasswordResponse>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function resetPassword(data: ResetPasswordRequest) {
  return apiRequest<MessageResponse>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteAccount() {
  await apiRequest<void>("/api/auth/account", {
    method: "DELETE",
    auth: true,
  });
  await clearAuthTokens();
}
