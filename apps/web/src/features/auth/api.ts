"use client";

import { api, ApiError } from "@/lib/api/client";
import type { AuthTokensDto, MeDto, OtpIssuedDto, RegisterResultDto } from "@/lib/api/types";
import { useSessionStore } from "@/features/auth/store";
import type { AuthUser, CodePurpose, CodeSent } from "@/features/auth/types";

/**
 * Accounts on the UseKollo API (DECISIONS D7): email + password, emailed 6-digit codes (10 minutes, five tries, a new
 * one every 60 s). Sign-up doesn't sign in: confirming the email code does. Unverified accounts can't sign in; the
 * API emails them a fresh code and answers 403, which `signIn` turns into `EmailNotVerifiedError`.
 */

/** Sign-in with the right password on an account whose email isn't confirmed yet. A code is on its way. */
export class EmailNotVerifiedError extends Error {
	/** The code the API just emailed (10 minutes; a new one after 60 s). */
	readonly sent: CodeSent;
	constructor(readonly email: string) {
		super("Confirm your email to finish signing in. We’ve sent you a new code.");
		this.sent = sentInfo(email, "verify_email", { otpExpiresInSeconds: 600, resendAfterSeconds: 60 });
	}
}

const toUser = (me: MeDto): AuthUser => ({
	id: me.id,
	email: me.email,
	name: me.name,
	walletAddress: me.walletAddress,
	createdAt: me.createdAt,
});

const sentInfo = (email: string, purpose: CodePurpose, issued: OtpIssuedDto): CodeSent => ({
	email,
	purpose,
	expiresAt: new Date(Date.now() + issued.otpExpiresInSeconds * 1000).toISOString(),
	resendAt: new Date(Date.now() + issued.resendAfterSeconds * 1000).toISOString(),
});

const normalize = (email: string) => email.trim().toLowerCase();

/** Stores the tokens, loads the profile, and signs in. */
async function startSession(tokens: AuthTokensDto) {
	const store = useSessionStore.getState();
	store.setTokens(tokens);
	try {
		const user = toUser(await api<MeDto>("/auth/me"));
		store.signIn(tokens, user);
		return user;
	} catch (error) {
		store.clear();
		throw error;
	}
}

export const authApi = {
	async signUp(name: string, email: string, password: string): Promise<CodeSent> {
		const res = await api<RegisterResultDto>("/auth/register", {
			method: "POST",
			auth: false,
			body: { name: name.trim(), email: normalize(email), password },
		});
		return sentInfo(res.email, "verify_email", res);
	},

	/** Confirms the sign-up code and signs in. */
	async verifyEmail(email: string, otp: string) {
		const tokens = await api<AuthTokensDto>("/auth/verify-email", {
			method: "POST",
			auth: false,
			body: { email: normalize(email), otp },
		});
		return startSession(tokens);
	},

	async signIn(email: string, password: string) {
		try {
			const tokens = await api<AuthTokensDto>("/auth/login", {
				method: "POST",
				auth: false,
				body: { email: normalize(email), password },
			});
			return await startSession(tokens);
		} catch (error) {
			if (error instanceof ApiError && error.status === 403) throw new EmailNotVerifiedError(normalize(email));
			if (error instanceof ApiError && error.status === 401)
				throw new ApiError("That email and password don’t match an account.", 401, error.code);
			throw error;
		}
	},

	/** A new sign-up code (always answers the same, so it doesn't reveal which emails have accounts). */
	async resendVerification(email: string): Promise<CodeSent> {
		const res = await api<OtpIssuedDto>("/auth/resend-otp", { method: "POST", auth: false, body: { email: normalize(email) } });
		return sentInfo(normalize(email), "verify_email", res);
	},

	/** Emails a reset code to a verified account (same answer whether or not it exists). */
	async requestPasswordReset(email: string): Promise<CodeSent> {
		const res = await api<OtpIssuedDto>("/auth/forgot-password", {
			method: "POST",
			auth: false,
			body: { email: normalize(email) },
		});
		return sentInfo(normalize(email), "reset_password", res);
	},

	/** Sets the new password with the emailed code. Signs out every session. */
	async resetPassword(email: string, otp: string, newPassword: string) {
		await api("/auth/reset-password", { method: "POST", auth: false, body: { email: normalize(email), otp, newPassword } });
	},

	async me() {
		const user = toUser(await api<MeDto>("/auth/me"));
		useSessionStore.getState().setUser(user);
		return user;
	},

	async updateName(name: string) {
		const user = toUser(await api<MeDto>("/auth/me", { method: "PATCH", body: { name: name.trim() } }));
		useSessionStore.getState().setUser(user);
		return user;
	},

	/** Signs out every other session. */
	async changePassword(currentPassword: string, newPassword: string) {
		await api("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
	},

	/** Ends this session on the server (always succeeds locally). */
	async signOut() {
		const refreshToken = useSessionStore.getState().tokens?.refreshToken;
		useSessionStore.getState().clear();
		if (refreshToken) await api("/auth/logout", { method: "POST", auth: false, body: { refreshToken } }).catch(() => undefined);
	},

	async signOutEverywhere() {
		await api("/auth/logout-all", { method: "POST" });
		useSessionStore.getState().clear();
	},
};
