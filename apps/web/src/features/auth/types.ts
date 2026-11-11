/** The signed-in account (API `GET /auth/me`). Only verified accounts can sign in. */
export interface AuthUser {
	id: string;
	email: string;
	name: string;
	/** The Stellar wallet linked to this account, or null before one is linked. */
	walletAddress: string | null;
	createdAt: string;
}

/** What a one-time code is for: confirming a new account's email, or resetting a password. */
export type CodePurpose = "verify_email" | "reset_password";

/** When the code was sent: drives the "Resend in 0:59" countdown and the expiry note. */
export interface CodeSent {
	email: string;
	purpose: CodePurpose;
	expiresAt: string;
	resendAt: string;
}
