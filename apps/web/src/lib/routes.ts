/** Every route in one place (PRD "Key Screens"). Pages and links use these, never hand-written strings. */
export const routes = {
	/** 1. Landing / Welcome */
	home: "/",
	/** Account (auth designs). `next` is where to go once signed in. */
	signUp: (next?: string | null) => (next ? `/sign-up?next=${encodeURIComponent(next)}` : "/sign-up"),
	signIn: (next?: string | null) => (next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in"),
	/** After sign-up: "Account Created" with Go to Dashboard and Verify Email Address (OTP modal). */
	accountCreated: (next?: string | null) =>
		next && next !== "/dashboard" ? `/account-created?next=${encodeURIComponent(next)}` : "/account-created",
	forgotPassword: "/forgot-password",
	/** "Create New password": reached only after the reset code is verified. */
	resetPassword: "/reset-password",
	terms: "/legal/terms",
	privacy: "/legal/privacy",
	cookies: "/legal/cookies",
	/** 2. Wallet connection flow; `next` is where to go once connected. */
	connect: (next?: string | null) => (next ? `/connect?next=${encodeURIComponent(next)}` : "/connect"),
	/** 3–4. Dashboard (empty state when there are no goals) */
	dashboard: "/dashboard",
	/** All goals (sidebar "Savings Goals"). */
	goals: "/goals",
	/** Account: email, verification, sign out (sidebar "Profile Settings"). */
	settings: "/settings",
	/** 5. Create Savings Goal */
	newGoal: "/goals/new",
	/** 6. Goal Details (+ its activity) */
	goal: (id: string) => `/goals/${id}`,
	/** 7. Add Savings flow */
	addSavings: (id: string) => `/goals/${id}/add`,
	/** 8. Withdrawal flow */
	withdraw: (id: string) => `/goals/${id}/withdraw`,
	/** 9. Transaction / Activity History (all goals) */
	activity: "/activity",
} as const;
