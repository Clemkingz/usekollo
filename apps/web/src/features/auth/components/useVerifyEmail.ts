"use client";

import { useState } from "react";
import { notify } from "@/lib/use-toast";
import { authApi } from "@/features/auth/api";
import { useSessionStore } from "@/features/auth/store";
import type { CodeSent } from "@/features/auth/types";

/**
 * Opens the OTP modal for the signed-in user's email (Account Created page, app banner). Reuses the code sent at
 * sign-up while it's fresh; otherwise asks for one. Spread `dialogProps` onto <VerifyCodeDialog>.
 */
export function useVerifyEmail(onVerified?: () => void) {
	const [sent, setSent] = useState<CodeSent | null>(null);
	const [opening, setOpening] = useState(false);

	async function open() {
		const { user, pendingCode } = useSessionStore.getState();
		if (!user) return;
		if (pendingCode?.email === user.email && new Date(pendingCode.expiresAt).getTime() > Date.now()) return setSent(pendingCode);
		setOpening(true);
		try {
			const next = await authApi.sendCode(user.email, "verify_email");
			useSessionStore.getState().setPendingCode(next);
			setSent(next);
		} catch (error) {
			notify.fromError(error);
		} finally {
			setOpening(false);
		}
	}

	// Read through a variable: the React Compiler evaluates `sent.email` during render to memoize the callbacks.
	const email = sent?.email ?? "";

	const dialogProps = {
		sent,
		onClose: () => setSent(null),
		onVerify: async (code: string) => {
			const user = await authApi.verifyEmail(email, code);
			const store = useSessionStore.getState();
			store.setUser(user);
			store.setPendingCode(null);
			setSent(null);
			notify.success("Email verified", "Thanks for confirming your email address.");
			onVerified?.();
		},
		onResend: async () => {
			const next = await authApi.sendCode(email, "verify_email");
			useSessionStore.getState().setPendingCode(next);
			return next;
		},
	};

	return { open, opening, dialogProps };
}
