import type { Activity, Amount, Goal, GoalStatus, GoalSummary } from "./types";
import { compare, fromStroops, progressPercent, toStroops } from "./money";

/**
 * Goal numbers are derived from its activity, never stored: only CONFIRMED transactions count. Pending ones are
 * shown as pending, never as saved; failed and unknown ones never move the balance.
 */

export const countsTowardSaved = (a: Activity) => a.status === "confirmed";

/** Confirmed deposits minus confirmed withdrawals for one goal. Never negative. */
export function savedAmount(goalId: string, activity: Activity[]): Amount {
	let total = 0n;
	for (const a of activity) {
		if (a.goalId !== goalId || !countsTowardSaved(a)) continue;
		total += a.kind === "deposit" ? toStroops(a.amount) : -toStroops(a.amount);
	}
	return fromStroops(total < 0n ? 0n : total);
}

/**
 * completed: saved reaches the target. overdue: the target date has passed without reaching it. Otherwise active.
 * `today` is a YYYY-MM-DD calendar date (string comparison is safe in that format). See DECISIONS D3.
 */
export function goalStatus(saved: Amount, target: Amount, targetDate: string, today: string): GoalStatus {
	if (compare(saved, target) >= 0) return "completed";
	if (targetDate < today) return "overdue";
	return "active";
}

export function summarizeGoal(goal: Goal, activity: Activity[], today: string): GoalSummary {
	const saved = savedAmount(goal.id, activity);
	return {
		...goal,
		savedAmount: saved,
		progress: progressPercent(saved, goal.targetAmount) ?? 0,
		status: goalStatus(saved, goal.targetAmount, goal.targetDate, today),
	};
}

/** Today's local calendar date as YYYY-MM-DD. */
export function todayISO(now = new Date()) {
	const p = (n: number) => String(n).padStart(2, "0");
	return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** Whole calendar days from `today` to `targetDate` (both YYYY-MM-DD); negative when past. */
export function daysUntil(targetDate: string, today: string) {
	const toUtc = (d: string) => {
		const [y, m, day] = d.split("-").map(Number);
		return Date.UTC(y!, m! - 1, day!);
	};
	return Math.round((toUtc(targetDate) - toUtc(today)) / 86_400_000);
}

/** Days before the target date when an unfinished goal turns "Urgent" (dashboard design). DECISIONS D3. */
export const URGENT_WITHIN_DAYS = 14;

/** The dashboard badge: Done, Urgent (overdue or due within 14 days), or Running. */
export type GoalBadge = "running" | "urgent" | "done";

export function goalBadge(goal: Pick<GoalSummary, "status" | "targetDate">, today: string): GoalBadge {
	if (goal.status === "completed") return "done";
	if (goal.status === "overdue" || daysUntil(goal.targetDate, today) <= URGENT_WITHIN_DAYS) return "urgent";
	return "running";
}

/**
 * Balance card: saved vs target across the unfinished goals in ONE asset (never mixes assets), and how much is left
 * on the goal closest to completion ("$550.00 to Next Goal"). Null when there are no unfinished goals in that asset.
 */
export function ongoingProgress(goals: GoalSummary[], assetId: string) {
	const open = goals.filter((g) => g.assetId === assetId && g.status !== "completed");
	if (open.length === 0) return null;
	const saved = open.reduce((acc, g) => acc + toStroops(g.savedAmount), 0n);
	const target = open.reduce((acc, g) => acc + toStroops(g.targetAmount), 0n);
	const nextLeft = open.reduce<bigint | null>((min, g) => {
		const left = toStroops(g.targetAmount) - toStroops(g.savedAmount);
		return min === null || left < min ? left : min;
	}, null)!;
	return {
		percent: target === 0n ? 0 : Number((saved * 100n) / target),
		nextGoalRemaining: fromStroops(nextLeft < 0n ? 0n : nextLeft),
	};
}

/**
 * Goal Details "MONTHLY PACE": what the goal has actually gathered per month since it was created (confirmed
 * savings ÷ months elapsed, at least one month). Assumption, DECISIONS D3.
 */
export function monthlyPace(goal: Pick<GoalSummary, "savedAmount" | "createdAt">, today: string): Amount {
	const months = Math.max(1, daysUntil(today, goal.createdAt.slice(0, 10)) / 30.4375);
	const perMonth = (toStroops(goal.savedAmount) * 10_000n) / BigInt(Math.round(months * 10_000));
	return fromStroops(perMonth);
}
