import Link from "next/link";
import { CheckCheck } from "lucide-react";
import type { GoalSummary } from "@repo/domain/types";
import { GOAL_BADGE_LABEL } from "@repo/domain/labels";
import { goalBadge, todayISO, type GoalBadge } from "@repo/domain/goal-status";
import { formatAmount } from "@repo/domain/money";
import { cn } from "@repo/ui/lib/utils";
import { routes } from "@/lib/routes";
import { assetById } from "@/lib/stellar/config";
import { Badge } from "@/components/Badge";

/** Progress ring (dashboard design): blue running, red urgent, full blue with a double tick when done. */
export function GoalRing({ percent, badge, className }: { percent: number; badge: GoalBadge; className?: string }) {
	const r = 18;
	const c = 2 * Math.PI * r;
	const p = Math.min(Math.max(percent, 0), 100);
	const color = badge === "urgent" ? "#f03d3d" : "var(--color-primary-500)";
	return (
		<span className={cn("relative flex size-10 shrink-0 items-center justify-center md:size-12", className)}>
			<svg viewBox="0 0 44 44" className="absolute inset-0 size-full -rotate-90" aria-hidden>
				<circle cx="22" cy="22" r={r} fill="none" stroke="#e8e8e8" strokeWidth="3.5" />
				<circle
					cx="22"
					cy="22"
					r={r}
					fill="none"
					stroke={color}
					strokeWidth="3.5"
					strokeLinecap="round"
					strokeDasharray={`${(badge === "done" ? 1 : p / 100) * c} ${c}`}
					className="transition-[stroke-dasharray] duration-700"
				/>
			</svg>
			{badge === "done" ? (
				<CheckCheck className="relative size-5 text-ink" aria-hidden />
			) : (
				<span className="relative text-[10px] text-ink tabular-nums md:text-[11px]">{Math.min(percent, 999)}%</span>
			)}
		</span>
	);
}

const TONE = { running: "blue", urgent: "red", done: "blue" } as const;

/** Goal row (dashboard design): ring · name · "250 / 500 USDC" · RUNNING / URGENT / DONE. */
export function GoalRow({ goal, className }: { goal: GoalSummary; className?: string }) {
	const badge = goalBadge(goal, todayISO());
	const code = assetById(goal.assetId)?.code ?? goal.assetId;
	return (
		<Link
			href={routes.goal(goal.id)}
			className={cn(
				"flex min-h-[68px] items-center gap-4 rounded-2xl bg-white px-3.5 py-3 transition-shadow hover:shadow-[0_6px_20px_rgba(1,14,82,0.08)] md:min-h-[68px]",
				className,
			)}
		>
			<GoalRing percent={goal.progress} badge={badge} />
			<span className="min-w-0 flex-1">
				<span className="block truncate text-base text-ink md:text-[17px]">{goal.name}</span>
				<span className="block truncate text-sm text-[#b3b3b3] tabular-nums">
					{formatAmount(goal.savedAmount)} / {formatAmount(goal.targetAmount)} {code}
				</span>
			</span>
			<Badge tone={TONE[badge]}>{GOAL_BADGE_LABEL[badge]}</Badge>
		</Link>
	);
}
