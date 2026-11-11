import type { GoalStatus, TxStatus } from "@repo/domain/types";
import { GOAL_STATUS_LABEL, TX_STATUS_LABEL } from "@repo/domain/labels";
import { cn } from "@repo/ui/lib/utils";

/** Goal and transaction status pills. Copy from @repo/domain/labels; colour by meaning. TODO(design). */
const GOAL_TONE: Record<GoalStatus, string> = {
	active: "bg-info-400/10 text-info-500 ring-info-400/25",
	completed: "bg-success-400/10 text-success-500 ring-success-400/25",
	overdue: "bg-warning-400/10 text-warning-800 ring-warning-400/25",
};

const TX_TONE: Record<TxStatus, string> = {
	pending: "bg-info-400/10 text-info-500 ring-info-400/25",
	confirmed: "bg-success-400/10 text-success-500 ring-success-400/25",
	failed: "bg-error-400/10 text-error-400 ring-error-400/25",
	unknown: "bg-warning-400/10 text-warning-800 ring-warning-400/25",
};

const pill = "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs whitespace-nowrap ring-1 ring-inset";

export function GoalStatusBadge({ status, className }: { status: GoalStatus; className?: string }) {
	return (
		<span className={cn(pill, GOAL_TONE[status], className)}>
			<span aria-hidden className="size-1.5 rounded-full bg-current" />
			{GOAL_STATUS_LABEL[status]}
		</span>
	);
}

export function TxStatusBadge({ status, className }: { status: TxStatus; className?: string }) {
	return (
		<span className={cn(pill, TX_TONE[status], className)}>
			<span aria-hidden className="size-1.5 rounded-full bg-current" />
			{TX_STATUS_LABEL[status]}
		</span>
	);
}
