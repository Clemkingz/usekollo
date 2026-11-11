"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { routes } from "@/lib/routes";
import { authApi } from "@/features/auth/api";
import { useSessionStore } from "@/features/auth/store";

const subscribe = (cb: () => void) => useSessionStore.persist.onFinishHydration(cb);
const hydrated = () => useSessionStore.persist.hasHydrated();

/** The signed-in user, safe for SSR (null until the persisted store has loaded; check `ready`). */
export function useSession() {
	const ready = useSyncExternalStore(subscribe, hydrated, () => false);
	const user = useSessionStore((s) => s.user);
	const signedIn = useSessionStore((s) => !!s.tokens);
	return { ready, user: ready && signedIn ? user : null };
}

/** Ends the session (server and browser), forgets every cached goal and balance, and goes home. */
export function useSignOut() {
	const router = useRouter();
	const queryClient = useQueryClient();
	return async () => {
		await authApi.signOut();
		queryClient.clear();
		router.push(routes.home);
	};
}

/** Only same-site paths: `next` comes from the URL. */
export const safeNext = (next: string | null | undefined, fallback: string = routes.dashboard) =>
	next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
