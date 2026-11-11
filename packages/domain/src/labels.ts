import type { ActivityKind, GoalStatus, TxStatus } from "./types";
import type { GoalBadge } from "./goal-status";

/**
 * User-facing words for statuses. Components take copy from here, never invent it. Plain language: the PRD asks
 * for no blockchain jargon where it can be avoided.
 */

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
	pending: "Waiting to open",
	active: "Ongoing",
	completed: "Completed",
	overdue: "Past due",
	closed: "Closed",
};

export const ACTIVITY_KIND_LABEL: Record<ActivityKind, string> = {
	open: "Goal opened",
	deposit: "Deposit",
	withdrawal: "Withdrawal",
	close: "Goal closed",
};

/** Dashboard design wording (shown uppercase in badges). */
export const TX_STATUS_LABEL: Record<TxStatus, string> = {
	pending: "Processing",
	confirmed: "Success",
	failed: "Failed",
};

export const GOAL_BADGE_LABEL: Record<GoalBadge, string> = {
	running: "Running",
	urgent: "Urgent",
	done: "Done",
	setup: "Setup",
	closed: "Closed",
};
