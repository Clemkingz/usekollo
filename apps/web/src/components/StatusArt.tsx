import { cn } from "@repo/ui/lib/utils";

/**
 * Illustrations for the 404 and error pages, drawn in the product's own language: a goal ring.
 * - `not-found`: a dashed, empty ring reading "404" with a "0% found" badge.
 * - `error`: a ring that broke partway, with a small warning mark in the gap.
 * Decorative only (aria-hidden); the page's heading says what happened.
 */
export function StatusArt({ variant, className }: { variant: "not-found" | "error"; className?: string }) {
	const r = 78;
	const c = 2 * Math.PI * r;
	return (
		<div className={cn("relative size-[200px] md:size-[230px]", className)} aria-hidden>
			<span className="absolute inset-6 rounded-full bg-primary-50" />
			<svg viewBox="0 0 200 200" className="absolute inset-0 size-full -rotate-90">
				<circle cx="100" cy="100" r={r} fill="none" stroke="var(--color-primary-100)" strokeWidth="10" />
				{variant === "error" ? (
					<circle
						cx="100"
						cy="100"
						r={r}
						fill="none"
						stroke="#f23b3b"
						strokeWidth="10"
						strokeLinecap="round"
						strokeDasharray={`${0.62 * c} ${c}`}
						className="animate-ring-in"
					/>
				) : (
					<circle cx="100" cy="100" r="62" fill="none" stroke="#9e9e9e" strokeWidth="1.5" strokeDasharray="4 7" />
				)}
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center text-center">
				{variant === "not-found" ? (
					<>
						<span className="font-display text-[52px] leading-none font-light tracking-[-0.03em] text-navy md:text-[60px]">
							404
						</span>
						<span className="mt-2 rounded-full bg-white px-3 py-1 text-[11px] text-primary-700 uppercase shadow-sm">
							0% found
						</span>
					</>
				) : (
					<span className="flex size-16 items-center justify-center rounded-full bg-white font-display text-4xl text-[#f23b3b] shadow-sm">
						!
					</span>
				)}
			</div>
			{/* Two leaves drifting off the ring. */}
			<Leaf className="animate-float absolute -top-1 right-4 size-7 text-primary-500" />
			<Leaf className="animate-float absolute bottom-3 -left-1 size-5 rotate-[200deg] text-primary-300 [animation-delay:1.2s]" />
		</div>
	);
}

function Leaf({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" className={className} fill="currentColor">
			<path d="M20 4C11 4 5 8.5 5 15c0 1.6.5 3 1.3 4.2L4 21.5 5.5 23l2.3-2.3C9 21.5 10.4 22 12 22c6.5 0 11-6 8-18Z" />
		</svg>
	);
}
