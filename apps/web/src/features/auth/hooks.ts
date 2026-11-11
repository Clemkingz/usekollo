"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";
import { useSessionStore } from "@/features/auth/store";

const subscribe = (cb: () => void) => useSessionStore.persist.onFinishHydration(cb);
const hydrated = () => useSessionStore.persist.hasHydrated();

/** The signed-in user, safe for SSR (null until the persisted store has loaded; check `ready`). */
export function useSession() {
	const ready = useSyncExternalStore(subscribe, hydrated, () => false);
	const user = useSessionStore((s) => s.user);
	return { ready, user: ready ? user : null };
}

export function useSignOut() {
	const router = useRouter();
	return () => {
		useSessionStore.getState().clear();
		router.push(routes.home);
	};
}

/** Only same-site paths: `next` comes from the URL. */
export const safeNext = (next: string | null | undefined, fallback: string = routes.dashboard) =>
	next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
