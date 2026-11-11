/** Password rules shown in the "KEY INTEGRITY" panel (design). The schema enforces the same rules. */
export const PASSWORD_RULES = [
	{ id: "length", label: "8+ characters", test: (p: string) => p.length >= 8 },
	{ id: "number", label: "1+ number", test: (p: string) => /\d/.test(p) },
] as const;

export const passwordMeetsRules = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

/** 0–1 for the strength bar: the rules first, then length and variety as a bonus. */
export function passwordStrength(p: string) {
	if (!p) return 0;
	const rules = PASSWORD_RULES.filter((r) => r.test(p)).length / PASSWORD_RULES.length;
	const bonus =
		(p.length >= 12 ? 0.5 : 0) + (/[A-Z]/.test(p) && /[a-z]/.test(p) ? 0.25 : 0) + (/[^A-Za-z0-9]/.test(p) ? 0.25 : 0);
	return Math.min(1, rules * 0.7 + bonus * 0.3);
}
