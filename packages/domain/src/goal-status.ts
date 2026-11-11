import type { Amount, Goal } from "./types";
import { fromStroops, toStroops } from "./money";

/**
 * Presentation rules on top of the goal numbers the API reports. The API decides status, progress and what can be
 * withdrawn; these only decide how a goal reads on screen. See DECISIONS D3.
 */

/** Goals still being saved into or waiting to be emptied: not closed, not waiting to be opened. */
export const isOpen = (goal: Pick<Goal, "status">) =>
	goal.status === "active" || goal.status === "completed" || goal.status === "overdue";

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

/** The goal badge: Done, Urgent (overdue or due within 14 days), Running, plus Setup (pending) and Closed. */
export type GoalBadge = "running" | "urgent" | "done" | "setup" | "closed";

export function goalBadge(goal: Pick<Goal, "status" | "daysLeft" | "targetReached">): GoalBadge {
	if (goal.status === "pending") return "setup";
	if (goal.status === "closed") return "closed";
	if (goal.targetReached || goal.status === "completed") return "done";
	if (goal.status === "overdue" || goal.daysLeft <= URGENT_WITHIN_DAYS) return "urgent";
	return "running";
}

/**
 * Balance card: saved vs target across the unfinished open goals in ONE asset (never mixes assets), and how much is
 * left on the goal closest to completion ("$550.00 to Next Goal"). Null when there are none in that asset.
 */
export function ongoingProgress(goals: Goal[], assetId: string) {
	const open = goals.filter((g) => g.assetId === assetId && isOpen(g) && !g.targetReached);
	if (open.length === 0) return null;
	const saved = open.reduce((acc, g) => acc + toStroops(g.savedAmount), 0n);
	const target = open.reduce((acc, g) => acc + toStroops(g.targetAmount), 0n);
	const nextLeft = open.reduce<bigint | null>((min, g) => {
		const left = toStroops(g.remainingAmount);
		return min === null || left < min ? left : min;
	}, null)!;
	return {
		percent: target === 0n ? 0 : Number((saved * 100n) / target),
		nextGoalRemaining: fromStroops(nextLeft < 0n ? 0n : nextLeft),
	};
}

/**
 * Goal Details "MONTHLY PACE": what the goal has gathered per month since it was created (saved ÷ months elapsed, at
 * least one month). Assumption, DECISIONS D3.
 */
export function monthlyPace(goal: Pick<Goal, "savedAmount" | "createdAt">, today: string): Amount {
	const months = Math.max(1, daysUntil(today, goal.createdAt.slice(0, 10)) / 30.4375);
	const perMonth = (toStroops(goal.savedAmount) * 10_000n) / BigInt(Math.round(months * 10_000));
	return fromStroops(perMonth);
}
