"use client";

import { API_URL } from "@/lib/api/config";
import type { AuthTokensDto } from "@/lib/api/types";
import { useSessionStore } from "@/features/auth/store";

/**
 * The one way the app calls the UseKollo API. Every success is `{ statusCode, message, data }` and this returns
 * `data`; every failure becomes an `ApiError` whose message is written to be shown to the user.
 *
 * Signed-in calls send the access token; when it has expired, the refresh token is swapped once (single flight: refresh
 * tokens are single use, so two parallel refreshes would end the session) and the call is repeated. If that fails too,
 * the session is cleared and `RequireAccount` sends the user to sign in.
 */

export class ApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
		/** HTTP status name from the API ("CONFLICT", "FORBIDDEN"…), or "NETWORK" when the API couldn't be reached. */
		readonly code: string,
		/** Per-field validation messages, when the body failed validation. */
		readonly details?: unknown,
		readonly retryAfterSeconds?: number,
	) {
		super(message);
	}
}

/** The API couldn't be reached at all (offline, DNS, CORS, server down). */
export const isNetworkError = (e: unknown) => e instanceof ApiError && e.code === "NETWORK";

type Options = {
	method?: "GET" | "POST" | "PATCH" | "DELETE";
	body?: unknown;
	query?: Record<string, string | number | undefined>;
	/** Send the access token (default true). Sign-in, sign-up and code routes don't. */
	auth?: boolean;
	signal?: AbortSignal;
};

export async function api<T>(path: string, options: Options = {}): Promise<T> {
	const auth = options.auth ?? true;
	const res = await send(path, options, auth ? useSessionStore.getState().tokens?.accessToken : undefined);
	if (res.status === 401 && auth && useSessionStore.getState().tokens) {
		const fresh = await refreshTokens();
		if (fresh) return parse<T>(await send(path, options, fresh.accessToken));
		useSessionStore.getState().expire();
	}
	return parse<T>(res);
}

async function send(path: string, { method = "GET", body, query, signal }: Options, token?: string) {
	const url = new URL(`${API_URL}/api/v1${path}`);
	for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
	const headers: Record<string, string> = { Accept: "application/json" };
	if (body !== undefined) headers["Content-Type"] = "application/json";
	if (token) headers.Authorization = `Bearer ${token}`;
	try {
		return await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal });
	} catch (error) {
		if ((error as Error)?.name === "AbortError") throw error;
		throw new ApiError("We couldn’t reach UseKollo. Check your connection and try again.", 0, "NETWORK");
	}
}

async function parse<T>(res: Response): Promise<T> {
	if (res.status === 204) return undefined as T;
	const json = (await res.json().catch(() => null)) as {
		message?: string;
		data?: T;
		error?: { code?: string; details?: unknown; retryAfterSeconds?: number };
	} | null;
	if (res.ok) return json?.data as T;
	const retryAfter = json?.error?.retryAfterSeconds ?? (Number(res.headers.get("Retry-After")) || undefined);
	throw new ApiError(
		friendlyMessage(res.status, json?.message, json?.error?.details, retryAfter),
		res.status,
		json?.error?.code ?? `HTTP_${res.status}`,
		json?.error?.details,
		retryAfter,
	);
}

function friendlyMessage(status: number, message: string | undefined, details: unknown, retryAfter?: number) {
	if (status === 429)
		return retryAfter
			? `Too many attempts. Try again in ${retryAfter} second${retryAfter === 1 ? "" : "s"}.`
			: "Too many attempts. Try again shortly.";
	if (status >= 500 && status !== 503) return "UseKollo hit a problem. Please try again in a moment.";
	// Validation failures: the first field message reads better than "Validation failed".
	if (message === "Validation failed" && Array.isArray(details) && typeof details[0] === "string") return capitalize(details[0]);
	return message || "Something went wrong. Please try again.";
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

let refreshing: Promise<AuthTokensDto | null> | null = null;

/** Swaps the refresh token for a new pair. Shared by parallel callers. */
export function refreshTokens() {
	refreshing ??= (async () => {
		const refreshToken = useSessionStore.getState().tokens?.refreshToken;
		if (!refreshToken) return null;
		try {
			const tokens = await parse<AuthTokensDto>(await send("/auth/refresh", { method: "POST", body: { refreshToken } }));
			useSessionStore.getState().setTokens(tokens);
			return tokens;
		} catch {
			return null;
		}
	})().finally(() => {
		refreshing = null;
	});
	return refreshing;
}

/** Every page of a paginated list (capped, so a huge history can't hang the screen). */
export async function apiAll<T>(path: string, { pageSize = 100, maxPages = 10 } = {}): Promise<T[]> {
	const items: T[] = [];
	for (let page = 0; page < maxPages; page++) {
		const { result, paginationMeta } = await api<{ result: T[]; paginationMeta: { nextPage: boolean } }>(path, {
			query: { limit: pageSize, offset: page * pageSize },
		});
		items.push(...result);
		if (!paginationMeta.nextPage) break;
	}
	return items;
}
