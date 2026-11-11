"use client";

import { Button } from "@repo/ui/button";
import { notify } from "@/lib/use-toast";

/**
 * "Continue with Google". Needs an OAuth client and a backend (DECISIONS D7), so for now it says so instead of
 * pretending. Google's multicolour "G" per its sign-in branding guidelines.
 */
export function GoogleButton() {
	return (
		<Button
			type="button"
			variant="outline"
			onClick={() => notify.info("Google sign-in is coming soon", "Use your email address for now.")}
		>
			<svg viewBox="0 0 48 48" className="size-6" aria-hidden>
				<path
					fill="#FFC107"
					d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
				/>
				<path
					fill="#FF3D00"
					d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
				/>
				<path
					fill="#4CAF50"
					d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
				/>
				<path
					fill="#1976D2"
					d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.4-.4-3.5z"
				/>
			</svg>
			Continue with Google
		</Button>
	);
}

/** The "OR EMAIL" divider under the Google button. */
export function OrDivider({ label = "OR EMAIL" }: { label?: string }) {
	return (
		<div className="my-7 flex items-center gap-5 px-3 text-[15px] text-ink" role="separator" aria-label={label}>
			<span className="h-px flex-1 bg-line" />
			{label}
			<span className="h-px flex-1 bg-line" />
		</div>
	);
}
