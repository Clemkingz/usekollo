"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/hooks";

/**
 * Visitors who are already signed in when sign-in / sign-up loads go straight on. Signing in *on* the page doesn't
 * trigger it: the form decides where to go next (e.g. Account Created after sign-up).
 */
export function useRedirectIfSignedIn(next: string) {
	const router = useRouter();
	const { ready, user } = useSession();
	const signedInOnArrival = useRef<boolean | null>(null);
	useEffect(() => {
		if (!ready) return;
		signedInOnArrival.current ??= !!user;
		if (signedInOnArrival.current && user) router.replace(next);
	}, [ready, user, next, router]);
}
