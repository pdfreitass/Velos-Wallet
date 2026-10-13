/**
 * Único caminho do front até a API (ADR 0013): mesma origem, sessão em cookie httpOnly
 * (o JavaScript nunca vê o token) e o header CSRF em toda mutação.
 */

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Erro da API no formato ProblemDetails, com o `code` estável que o front traduz. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Erros por campo do `validation_failed` (nomes iguais aos do formulário). */
  get fieldErrors(): Record<string, string[]> {
    const errors = this.details.errors;
    if (typeof errors !== "object" || errors === null) return {};
    return Object.fromEntries(
      Object.entries(errors).filter((entry): entry is [string, string[]] =>
        Array.isArray(entry[1]) && entry[1].every((item) => typeof item === "string"),
      ),
    );
  }
}

export async function api<T = void>(
  path: string,
  options: { method?: Method; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["X-Velos-Csrf"] = "1";

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      credentials: "same-origin",
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "network_error", "Sem conexão com o servidor.");
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204 || response.headers.get("Content-Length") === "0") {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Corpo vazio ou não JSON (ex.: proxy fora do ar): fica só o status.
  }

  if (typeof body === "object" && body !== null) {
    const { code, detail, ...rest } = body as Record<string, unknown>;
    return new ApiError(
      response.status,
      typeof code === "string" ? code : "unknown_error",
      typeof detail === "string" ? detail : response.statusText,
      rest,
    );
  }

  return new ApiError(response.status, response.status >= 500 ? "server_unavailable" : "unknown_error", response.statusText);
}

export function isUnauthenticated(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}
