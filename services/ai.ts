import type {
  AiAskStreamEvent,
  AiRateLimitResponse,
  ChatHistoryResponse,
  ChatRequest,
  ConversationCreateRequest,
  ConversationListItem,
  ConversationMessageRequest,
  ConversationMessageResponse,
  ConversationResponse,
} from "../lib/types";
import { ApiError, apiRequest, buildApiUrl } from "./api";
import { getAccessToken, refreshAccessToken } from "./auth";

type ChatHistoryParams = {
  limit?: number;
  offset?: number;
};

export type AiAskStreamHandlers = {
  signal?: AbortSignal;
  onEvent?: (event: AiAskStreamEvent) => void;
  onToken?: (token: string) => void;
  onDone?: () => void;
};

function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

function parseSseChunk(chunk: string, onEvent: (event: AiAskStreamEvent) => void) {
  chunk
    .split(/\r?\n\r?\n/)
    .map((eventBlock) =>
      eventBlock
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace(/^data:\s?/, ""))
        .join("\n")
        .trim(),
    )
    .filter(Boolean)
    .forEach((data) => {
      onEvent(JSON.parse(data) as AiAskStreamEvent);
    });
}

async function fetchAiAskStream(
  data: ChatRequest,
  accessToken: string | null,
  signal?: AbortSignal,
) {
  const headers = new Headers({
    Accept: "text/event-stream",
    "Content-Type": "application/json",
  });

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const url = buildApiUrl("/api/ai/ask");

  if (__DEV__) {
    console.info("[network-debug] outgoing_request", {
      method: "POST",
      url,
    });
  }

  return fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
    signal,
  });
}

async function fetchAiConversationMessageStream(
  conversationId: string,
  data: ConversationMessageRequest,
  accessToken: string | null,
  signal?: AbortSignal,
) {
  const headers = new Headers({
    Accept: "text/event-stream",
    "Content-Type": "application/json",
  });

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const url = buildApiUrl(
    `/api/ai/conversations/${conversationId}/messages/stream`,
  );

  if (__DEV__) {
    console.info("[network-debug] outgoing_request", {
      method: "POST",
      url,
    });
  }

  return fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
    signal,
  });
}

async function consumeAiStream(
  response: Response,
  handlers: AiAskStreamHandlers,
) {
  const emitEvent = (event: AiAskStreamEvent) => {
    handlers.onEvent?.(event);
    if (event.token) {
      handlers.onToken?.(event.token);
    }
    if (event.done) {
      handlers.onDone?.();
    }
  };

  if (!response.body) {
    parseSseChunk(await response.text(), emitEvent);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split(/\r?\n\r?\n/);
    buffer = parts.pop() ?? "";
    parseSseChunk(parts.join("\n\n"), emitEvent);
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    parseSseChunk(buffer, emitEvent);
  }
}

export async function streamAiAsk(
  data: ChatRequest,
  handlers: AiAskStreamHandlers = {},
) {
  let response = await fetchAiAskStream(
    data,
    await getAccessToken(),
    handlers.signal,
  );

  if (response.status === 401) {
    const nextAccessToken = await refreshAccessToken();
    if (nextAccessToken) {
      response = await fetchAiAskStream(data, nextAccessToken, handlers.signal);
    }
  }

  if (!response.ok) {
    let detail: unknown = null;
    try {
      detail = await response.json();
    } catch {}
    throw new ApiError(response.status, detail, "AI request failed");
  }

  await consumeAiStream(response, handlers);
}

export async function streamAiConversationMessage(
  conversationId: string,
  data: ConversationMessageRequest,
  handlers: AiAskStreamHandlers = {},
) {
  let response = await fetchAiConversationMessageStream(
    conversationId,
    data,
    await getAccessToken(),
    handlers.signal,
  );

  if (response.status === 401) {
    const nextAccessToken = await refreshAccessToken();
    if (nextAccessToken) {
      response = await fetchAiConversationMessageStream(
        conversationId,
        data,
        nextAccessToken,
        handlers.signal,
      );
    }
  }

  if (!response.ok) {
    let detail: unknown = null;
    try {
      detail = await response.json();
    } catch {}
    throw new ApiError(response.status, detail, "AI request failed");
  }

  await consumeAiStream(response, handlers);
}

export async function getAiChatHistory(params: ChatHistoryParams = {}) {
  return apiRequest<ChatHistoryResponse>(
    `/api/ai/history${buildQuery(params)}`,
    {
      method: "GET",
      auth: true,
    },
  );
}

export async function getAiRateLimit() {
  return apiRequest<AiRateLimitResponse>("/api/ai/limit", {
    method: "GET",
    auth: true,
  });
}

export async function listAiConversations() {
  return apiRequest<ConversationListItem[]>("/api/ai/conversations", {
    method: "GET",
    auth: true,
  });
}

export async function createAiConversation(data: ConversationCreateRequest) {
  return apiRequest<ConversationResponse>("/api/ai/conversations", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

export async function getAiConversation(conversationId: string) {
  return apiRequest<ConversationResponse>(
    `/api/ai/conversations/${conversationId}`,
    {
      method: "GET",
      auth: true,
    },
  );
}

export async function deleteAiConversation(conversationId: string) {
  await apiRequest<void>(`/api/ai/conversations/${conversationId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function postAiConversationMessage(
  conversationId: string,
  data: ConversationMessageRequest,
) {
  return apiRequest<ConversationMessageResponse>(
    `/api/ai/conversations/${conversationId}/messages`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}
