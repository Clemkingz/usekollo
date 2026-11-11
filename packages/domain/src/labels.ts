import type { ActivityKind, GoalStatus, TxStatus } from "./types";
import type { GoalBadge } from "./goal-status";

/**
 * User-facing words for statuses. Components take copy from here, never invent it. Plain language: the PRD asks
 * for no blockchain jargon where it can be avoided.
 */

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
	active: "In progress",
	completed: "Completed",
	overdue: "Past target date",
};

export const ACTIVITY_KIND_LABEL: Record<ActivityKind, string> = {
	deposit: "Savings added",
	withdrawal: "Withdrawal",
};

/** Dashboard design wording (shown uppercase in badges). */
export const TX_STATUS_LABEL: Record<TxStatus, string> = {
	pending: "Pending",
	confirmed: "Success",
	failed: "Failed",
	unknown: "Check status",
};

export const GOAL_BADGE_LABEL: Record<GoalBadge, string> = {
	running: "Running",
	urgent: "Urgent",
	done: "Done",
};
