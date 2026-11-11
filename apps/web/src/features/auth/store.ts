"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthTokensDto } from "@/lib/api/types";
import type { AuthUser } from "@/features/auth/types";

interface Tokens {
	accessToken: string;
	refreshToken: string;
}

interface SessionState {
	user: AuthUser | null;
	tokens: Tokens | null;
	/** Set when the session ended on its own (refresh refused), so sign-in can say why. Not persisted. */
	expired: boolean;
	signIn: (tokens: AuthTokensDto, user: AuthUser) => void;
	setTokens: (tokens: AuthTokensDto) => void;
	setUser: (user: AuthUser) => void;
	expire: () => void;
	clear: () => void;
}

/**
 * The session: the API's token pair and the signed-in user. Kept in this browser's localStorage (there is no
 * cookie session on the API). The refresh token is single use; `lib/api/client.ts` rotates it.
 */
export const useSessionStore = create<SessionState>()(
	persist(
		(set) => ({
			user: null,
			tokens: null,
			expired: false,
			signIn: ({ accessToken, refreshToken }, user) => set({ tokens: { accessToken, refreshToken }, user, expired: false }),
			setTokens: ({ accessToken, refreshToken }) => set({ tokens: { accessToken, refreshToken } }),
			setUser: (user) => set({ user }),
			expire: () => set({ user: null, tokens: null, expired: true }),
			clear: () => set({ user: null, tokens: null, expired: false }),
		}),
		{
			name: "usekollo-session",
			version: 2,
			storage: createJSONStorage(() => localStorage),
			partialize: (s) => ({ user: s.user, tokens: s.tokens }),
			// v1 was the in-browser mock (no tokens): start signed out.
			migrate: () => ({ user: null, tokens: null }),
		},
	),
);

/**
 * "Create New password": the email and reset code from the Forgot Password modal, held until the new password is
 * sent with them (the API checks the code then). Memory only: a reload starts the reset again.
 */
export const useResetStore = create<{
	email: string | null;
	code: string | null;
	set: (email: string, code: string) => void;
	clear: () => void;
}>()((set) => ({
	email: null,
	code: null,
	set: (email, code) => set({ email, code }),
	clear: () => set({ email: null, code: null }),
}));
