"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthUser, CodeSent } from "@/features/auth/types";

interface SessionState {
	user: AuthUser | null;
	/** The last verification code sent this session, so "Verify Email Address" reopens it instead of sending another. */
	pendingCode: CodeSent | null;
	setUser: (user: AuthUser) => void;
	setPendingCode: (sent: CodeSent | null) => void;
	clear: () => void;
}

/** The signed-in account (D7: a real backend will add a session token; screens read `user` only). */
export const useSessionStore = create<SessionState>()(
	persist(
		(set) => ({
			user: null,
			pendingCode: null,
			setUser: (user) => set({ user }),
			setPendingCode: (pendingCode) => set({ pendingCode }),
			clear: () => set({ user: null, pendingCode: null }),
		}),
		{ name: "usekollo-session", storage: createJSONStorage(() => localStorage), partialize: (s) => ({ user: s.user }) },
	),
);

/**
 * The reset token between "Create new password" and the code step. Memory only: a reload starts the reset again,
 * which is the safe default for a credential.
 */
export const useResetStore = create<{
	email: string | null;
	token: string | null;
	set: (email: string, token: string) => void;
	clear: () => void;
}>()((set) => ({
	email: null,
	token: null,
	set: (email, token) => set({ email, token }),
	clear: () => set({ email: null, token: null }),
}));
