export interface AuthUser {
	id: string;
	email: string;
	emailVerified: boolean;
	createdAt: string;
}

/** What a one-time code is for: confirming a new account's email, or resetting a password. */
export type CodePurpose = "verify_email" | "reset_password";

/** When the code was sent: drives the "Resend in 0:30" countdown and the expiry note. */
export interface CodeSent {
	email: string;
	purpose: CodePurpose;
	expiresAt: string;
	resendAt: string;
}

export type AuthErrorCode =
	"email_taken" | "invalid_credentials" | "invalid_code" | "code_expired" | "too_many_attempts" | "reset_expired";

/** An auth failure with a plain sentence; `field` says which form field to show it beside, if any. */
export class AuthError extends Error {
	constructor(
		readonly code: AuthErrorCode,
		message: string,
		readonly field?: "email" | "password" | "code",
	) {
		super(message);
	}
}
