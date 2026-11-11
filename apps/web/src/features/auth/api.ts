"use client";

import { AuthError, type AuthUser, type CodePurpose, type CodeSent } from "@/features/auth/types";

/**
 * Account API (email + password, emailed one-time codes). docs/DECISIONS.md D7: UseKollo has no auth backend yet, so
 * this is an IN-BROWSER MOCK with the shape a real API would have. It is not security: everything lives in this
 * browser's localStorage. Replace `authApi` with HTTP calls when the backend exists; screens only use `authApi`.
 *
 * Mock rules (keep them when the real API lands): passwords salted + PBKDF2-hashed; codes are 6 digits, hashed, valid
 * 10 minutes, 5 attempts, a new one at most every 30 s; "forgot password" answers the same whether or not the email
 * exists.
 * Since no email is sent, the code is shown in a "Demo inbox" toast.
 */

export interface AuthApi {
	/** Creates the account (email unverified), signs it in, and emails a verification code. */
	signUp(email: string, password: string): Promise<{ user: AuthUser; sent: CodeSent }>;
	/** Unverified accounts can sign in too; the app keeps asking them to verify (Account Created design). */
	signIn(email: string, password: string): Promise<AuthUser>;
	/** Sends a code; within the 30 s resend window it returns the code already sent instead of sending another. */
	sendCode(email: string, purpose: CodePurpose): Promise<CodeSent>;
	verifyEmail(email: string, code: string): Promise<AuthUser>;
	requestPasswordReset(email: string): Promise<CodeSent>;
	/** Exchanges a reset code for a short-lived reset token. */
	verifyResetCode(email: string, code: string): Promise<{ resetToken: string }>;
	resetPassword(resetToken: string, password: string): Promise<void>;
}

const CODE_TTL_MS = 10 * 60_000;
const RESEND_AFTER_MS = 30_000;
const MAX_ATTEMPTS = 5;
const RESET_TOKEN_TTL_MS = 15 * 60_000;
const DB_KEY = "usekollo-mock-auth";

interface StoredUser extends AuthUser {
	salt: string;
	passwordHash: string;
}
interface StoredCode {
	email: string;
	purpose: CodePurpose;
	codeHash: string;
	expiresAt: number;
	resendAt: number;
	attempts: number;
}
interface Db {
	users: StoredUser[];
	codes: StoredCode[];
	resetTokens: { token: string; email: string; expiresAt: number }[];
}

const load = (): Db => {
	try {
		const raw = localStorage.getItem(DB_KEY);
		if (raw) return JSON.parse(raw) as Db;
	} catch {
		// fall through to an empty DB
	}
	return { users: [], codes: [], resetTokens: [] };
};
const save = (db: Db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

const normalize = (email: string) => email.trim().toLowerCase();
const wait = (ms = 600) => new Promise((r) => setTimeout(r, ms));
const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
const randomHex = (bytes: number) => hex(crypto.getRandomValues(new Uint8Array(bytes)).buffer);

async function hashPassword(password: string, salt: string) {
	const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
	const bits = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 210_000 },
		key,
		256,
	);
	return hex(bits);
}
const sha256 = async (value: string) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));

const publicUser = ({ id, email, emailVerified, createdAt }: StoredUser): AuthUser => ({ id, email, emailVerified, createdAt });

/** Mock delivery: no email service, so the code appears in a toast. */
async function deliver(email: string, code: string, purpose: CodePurpose) {
	const { notify } = await import("@/lib/use-toast");
	notify.info(
		`Demo inbox: your code is ${code}`,
		`${purpose === "verify_email" ? "Email verification" : "Password reset"} for ${email}. Emails aren’t sent yet.`,
		20_000,
	);
}

async function issueCode(db: Db, email: string, purpose: CodePurpose, { force = false } = {}): Promise<CodeSent> {
	const now = Date.now();
	const existing = db.codes.find((c) => c.email === email && c.purpose === purpose);
	if (existing && !force && existing.resendAt > now && existing.expiresAt > now)
		return {
			email,
			purpose,
			expiresAt: new Date(existing.expiresAt).toISOString(),
			resendAt: new Date(existing.resendAt).toISOString(),
		};
	const code = String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, "0");
	const entry: StoredCode = {
		email,
		purpose,
		codeHash: await sha256(`${purpose}:${email}:${code}`),
		expiresAt: now + CODE_TTL_MS,
		resendAt: now + RESEND_AFTER_MS,
		attempts: 0,
	};
	db.codes = [...db.codes.filter((c) => !(c.email === email && c.purpose === purpose)), entry];
	save(db);
	void deliver(email, code, purpose);
	return { email, purpose, expiresAt: new Date(entry.expiresAt).toISOString(), resendAt: new Date(entry.resendAt).toISOString() };
}

async function checkCode(db: Db, email: string, purpose: CodePurpose, code: string) {
	const entry = db.codes.find((c) => c.email === email && c.purpose === purpose);
	if (!entry) throw new AuthError("code_expired", "That code has expired. Ask for a new one.", "code");
	if (entry.expiresAt < Date.now()) throw new AuthError("code_expired", "That code has expired. Ask for a new one.", "code");
	if (entry.attempts >= MAX_ATTEMPTS) throw new AuthError("too_many_attempts", "Too many tries. Ask for a new code.", "code");
	if (entry.codeHash !== (await sha256(`${purpose}:${email}:${code}`))) {
		entry.attempts += 1;
		save(db);
		const left = MAX_ATTEMPTS - entry.attempts;
		throw new AuthError(
			left > 0 ? "invalid_code" : "too_many_attempts",
			left > 0 ? `That code isn’t right. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many tries. Ask for a new code.",
			"code",
		);
	}
	db.codes = db.codes.filter((c) => c !== entry);
	save(db);
}

export const authApi: AuthApi = {
	async signUp(rawEmail, password) {
		await wait();
		const email = normalize(rawEmail);
		const db = load();
		const existing = db.users.find((u) => u.email === email);
		if (existing?.emailVerified)
			throw new AuthError("email_taken", "An account with this email already exists. Log in instead.", "email");
		const salt = randomHex(16);
		const user: StoredUser = {
			id: existing?.id ?? crypto.randomUUID(),
			email,
			emailVerified: false,
			createdAt: existing?.createdAt ?? new Date().toISOString(),
			salt,
			passwordHash: await hashPassword(password, salt),
		};
		db.users = [...db.users.filter((u) => u.email !== email), user];
		save(db);
		return { user: publicUser(user), sent: await issueCode(db, email, "verify_email", { force: true }) };
	},

	async signIn(rawEmail, password) {
		await wait();
		const email = normalize(rawEmail);
		const db = load();
		const user = db.users.find((u) => u.email === email);
		// Same answer for an unknown email and a wrong password.
		if (!user || user.passwordHash !== (await hashPassword(password, user.salt)))
			throw new AuthError("invalid_credentials", "That email and password don’t match an account.");
		return publicUser(user);
	},

	async sendCode(rawEmail, purpose) {
		await wait(400);
		const email = normalize(rawEmail);
		const db = load();
		if (!db.users.some((u) => u.email === email)) {
			// Unknown email: look the same as a real send (no account enumeration).
			const now = Date.now();
			return {
				email,
				purpose,
				expiresAt: new Date(now + CODE_TTL_MS).toISOString(),
				resendAt: new Date(now + RESEND_AFTER_MS).toISOString(),
			};
		}
		return issueCode(db, email, purpose);
	},

	async verifyEmail(rawEmail, code) {
		await wait();
		const email = normalize(rawEmail);
		const db = load();
		await checkCode(db, email, "verify_email", code);
		const user = db.users.find((u) => u.email === email);
		if (!user) throw new AuthError("code_expired", "That code has expired. Ask for a new one.", "code");
		user.emailVerified = true;
		save(db);
		return publicUser(user);
	},

	async requestPasswordReset(rawEmail) {
		return this.sendCode(rawEmail, "reset_password");
	},

	async verifyResetCode(rawEmail, code) {
		await wait();
		const email = normalize(rawEmail);
		const db = load();
		await checkCode(db, email, "reset_password", code);
		const resetToken = randomHex(24);
		db.resetTokens = [
			...db.resetTokens.filter((t) => t.email !== email),
			{ token: resetToken, email, expiresAt: Date.now() + RESET_TOKEN_TTL_MS },
		];
		save(db);
		return { resetToken };
	},

	async resetPassword(resetToken, password) {
		await wait();
		const db = load();
		const entry = db.resetTokens.find((t) => t.token === resetToken);
		const user = entry && db.users.find((u) => u.email === entry.email);
		if (!entry || !user || entry.expiresAt < Date.now())
			throw new AuthError("reset_expired", "This reset has expired. Start again from “Forgot password”.");
		user.salt = randomHex(16);
		user.passwordHash = await hashPassword(password, user.salt);
		// Proving access to the inbox also confirms the email.
		user.emailVerified = true;
		db.resetTokens = db.resetTokens.filter((t) => t !== entry);
		save(db);
	},
};
