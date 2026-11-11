import type { GoalBadge } from "@repo/domain/goal-status";
import { formatFixed } from "@repo/domain/money";
import { cn } from "@repo/ui/lib/utils";
import { Badge } from "@/components/Badge";

/**
 * The big ring on Goal Details (design): tinted track, progress arc (red when urgent, blue otherwise), a dashed inner
 * circle, and "SAVED 0.00 · OF 500.00 USDC · 0% DONE" in the middle. An urgent goal at 0% shows a half red arc, as
 * the design does, so the urgency reads at a glance.
 */
export function GoalProgressRing({
	percent,
	badge,
	saved,
	target,
	code,
	className,
}: {
	percent: number;
	badge: GoalBadge;
	saved: string;
	target: string;
	code: string;
	className?: string;
}) {
	const r = 90;
	const c = 2 * Math.PI * r;
	const p = Math.min(Math.max(percent, 0), 100);
	const urgent = badge === "urgent";
	const share = badge === "done" ? 1 : urgent && p === 0 ? 0.5 : p / 100;
	const [whole, decimals] = formatFixed(saved).split(".");
	return (
		<div className={cn("relative size-[190px] shrink-0", className)} role="img" aria-label={`${percent}% of the target saved`}>
			<svg viewBox="0 0 200 200" className="absolute inset-0 size-full -rotate-90" aria-hidden>
				<circle cx="100" cy="100" r={r} fill="none" stroke={urgent ? "#fde3e3" : "var(--color-primary-100)"} strokeWidth="9" />
				<circle
					cx="100"
					cy="100"
					r={r}
					fill="none"
					stroke={urgent ? "#f23b3b" : "var(--color-primary-500)"}
					strokeWidth="9"
					strokeDasharray={`${share * c} ${c}`}
					className="transition-[stroke-dasharray] duration-700"
				/>
				<circle cx="100" cy="100" r="74" fill="none" stroke="#9e9e9e" strokeWidth="1" strokeDasharray="3 5" />
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center text-center text-ink" aria-hidden>
				<span className="text-[9px] uppercase">Saved</span>
				<span className="text-[22px] leading-tight tabular-nums">
					{whole}
					<span className="text-xs">.{decimals}</span>
				</span>
				{badge !== "done" && (
					<span className="text-[9px] uppercase tabular-nums">
						Of {formatFixed(target)} {code}
					</span>
				)}
				<Badge tone={urgent ? "red" : "blue"} className="mt-1.5 h-5 px-2 text-[10px] md:h-5 md:text-[10px]">
					{Math.min(percent, 999)}% Done
				</Badge>
			</div>
		</div>
	);
}
