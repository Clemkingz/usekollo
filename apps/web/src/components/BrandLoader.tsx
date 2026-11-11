import { cn } from "@repo/ui/lib/utils";

/**
 * Full-page loader: an orbiting ring with a short status line. Used by every `loading.tsx` and while the app checks
 * the wallet. TODO(design): put the logo mark inside the ring once it exists.
 */
export function BrandLoader({ label = "Loading", className }: { label?: string; className?: string }) {
	return (
		<div
			role="status"
			aria-live="polite"
			className={cn("flex min-h-[60vh] flex-col items-center justify-center gap-5", className)}
		>
			<svg viewBox="0 0 80 80" className="animate-orbit size-16" aria-hidden>
				<circle cx="40" cy="40" r="36" fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="4" />
				<circle
					cx="40"
					cy="40"
					r="36"
					fill="none"
					stroke="currentColor"
					strokeWidth="4"
					strokeLinecap="round"
					strokeDasharray="60 170"
					className="text-primary-500"
				/>
			</svg>
			<p className="text-sm text-ink/60">{label}…</p>
		</div>
	);
}
