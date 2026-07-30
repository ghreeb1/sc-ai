import Constants from "expo-constants";

const CONFIG_API_BASE_URL =
  typeof Constants.expoConfig?.extra?.publicApiUrl === "string"
    ? Constants.expoConfig.extra.publicApiUrl.trim()
    : undefined;
const RAW_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || CONFIG_API_BASE_URL;
export const API_BASE_URL = RAW_API_BASE_URL?.replace(/\/$/, "");

type TokenHandlers = {
  getAccessToken: () => Promise<string | null>;
  refreshAccessToken: () => Promise<string | null>;
  onUnauthorized?: () => void;
};

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

let tokenHandlers: TokenHandlers | null = null;
let activeRefreshPromise: Promise<string | null> | null = null;
let hasLoggedApiBaseUrl = false;

export function configureAuthTokenHandlers(handlers: TokenHandlers) {
  tokenHandlers = handlers;
}

function logNetworkDebug(event: string, payload: Record<string, unknown>) {
  if (!__DEV__) {
    return;
  }

  console.info(`[network-debug] ${event}`, payload);
}

function getApiBaseUrl() {
  if (!API_BASE_URL) {
    logNetworkDebug("missing_api_base_url", {
      rawEnvValue: RAW_API_BASE_URL ?? null,
    });
    throw new Error("EXPO_PUBLIC_API_URL is required.");
  }

  if (!hasLoggedApiBaseUrl) {
    hasLoggedApiBaseUrl = true;
    logNetworkDebug("resolved_api_base_url", {
      processEnvValue: process.env.EXPO_PUBLIC_API_URL ?? null,
      configExtraValue: CONFIG_API_BASE_URL ?? null,
      source: process.env.EXPO_PUBLIC_API_URL ? "process.env" : "expo.extra",
      resolvedBaseUrl: API_BASE_URL,
    });
  }

  return API_BASE_URL;
}

export function buildApiUrl(path: string) {
  return `${getApiBaseUrl()}${path}`;
}

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown, fallbackMessage: string) {
    super(extractErrorMessage(detail) || fallbackMessage);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function extractErrorMessage(detail: unknown): string | null {
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === "object" && item && "msg" in item
          ? String((item as { msg: unknown }).msg)
          : null,
      )
      .filter(Boolean)
      .join("\n");
  }
  if (typeof detail === "object" && "detail" in detail) {
    return extractErrorMessage((detail as { detail: unknown }).detail);
  }
  if (typeof detail === "object" && "message" in detail) {
    return String((detail as { message: unknown }).message);
  }
  return null;
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ─── Helper: redact a token for safe logging ────────────────────────────────
function redactToken(token: string | null): string {
  if (!token) return "(none)";
  if (token.length <= 8) return "***";
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { auth = false, retryOnUnauthorized = true, headers, ...init } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  if (!requestHeaders.has("Content-Type") && init.body) {
    requestHeaders.set("Content-Type", "application/json");
  }

  let attachedToken: string | null = null;

  if (auth) {
    const accessToken = tokenHandlers
      ? await tokenHandlers.getAccessToken()
      : null;
    attachedToken = accessToken;
    if (accessToken) {
      requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  // ── D: Log every outgoing authenticated request ──────────────────────────
  if (auth) {
  }

  const url = buildApiUrl(path);
  logNetworkDebug("outgoing_request", {
    method: init.method ?? "GET",
    url,
  });

  const response = await fetch(url, {
    ...init,
    headers: requestHeaders,
  });

  // ── D: Log every response ─────────────────────────────────────────────────
  
  if (response.status === 401 && auth && retryOnUnauthorized) {
    // ── D: 401 on authenticated request ──────────────────────────────────────
    if (tokenHandlers) {
      if (!activeRefreshPromise) {
        activeRefreshPromise = tokenHandlers.refreshAccessToken().finally(() => {
                    activeRefreshPromise = null;
        });
      } else {
      }

      let nextAccessToken: string | null = null;
      try {
        nextAccessToken = await activeRefreshPromise;
      } catch {
        // fall through – nextAccessToken stays null
      }

      if (nextAccessToken) {
                requestHeaders.set("Authorization", `Bearer ${nextAccessToken}`);
        return apiRequest<T>(path, {
          ...options,
          headers: requestHeaders,
          retryOnUnauthorized: false,
        });
      } else {
        // ── D: onUnauthorized about to fire ────────────────────────────────
        if (tokenHandlers.onUnauthorized) {
          tokenHandlers.onUnauthorized();
        }
      }
    }
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(response.status, data, "Request failed");
  }

  return data as T;
}
