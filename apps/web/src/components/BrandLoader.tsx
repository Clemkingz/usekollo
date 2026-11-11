import { cn } from "@repo/ui/lib/utils";
import { withBasePath } from "@/lib/site";

const R = 36;
const C = 2 * Math.PI * R;

/**
 * Full-page loader: the leaf mark inside a savings ring that fills, settles and starts again, like a goal being
 * reached. Used by `loading.tsx` and while the app checks the session. Reduced motion: a still, full ring.
 */
export function BrandLoader({ label = "Loading", className }: { label?: string; className?: string }) {
	return (
		<div
			role="status"
			aria-live="polite"
			className={cn("flex min-h-[60vh] flex-col items-center justify-center gap-5", className)}
		>
			<span className="relative flex size-[84px] items-center justify-center">
				<svg viewBox="0 0 80 80" className="animate-orbit absolute inset-0 size-full [animation-duration:6s]" aria-hidden>
					<circle cx="40" cy="40" r={R} fill="none" stroke="var(--color-primary-100)" strokeWidth="4" />
					<circle
						cx="40"
						cy="40"
						r={R}
						fill="none"
						stroke="var(--color-primary-500)"
						strokeWidth="4"
						strokeLinecap="round"
						strokeDasharray={C}
						transform="rotate(-90 40 40)"
						className="animate-fill"
						style={{ "--c": C } as React.CSSProperties}
					/>
				</svg>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={withBasePath("/images/logo-mark.png")} alt="" width={34} height={34} className="animate-breathe size-[34px]" />
			</span>
			<p className="text-sm text-ink/60">{label}…</p>
		</div>
	);
}
