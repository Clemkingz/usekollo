/**
 * UseKollo's core model (PRD "Savings Goals", "Goal Details & Activity"). Shared by the web app and, later, whatever
 * stores goals (see docs/DECISIONS.md D1/D2). Amounts are decimal strings, never floats.
 */

/** A decimal amount string with at most 7 decimals ("250", "12.5000000"). Math goes through `money.ts`. */
export type Amount = string;

/** "XLM" for lumens, "CODE:ISSUER" for an issued asset (e.g. Testnet USDC). Never add amounts of different assets. */
export type AssetId = string;

export interface Asset {
	id: AssetId;
	code: string;
	/** Null for XLM. */
	issuer: string | null;
	/** Display name, e.g. "Stellar Lumens". */
	name: string;
}

/** Derived, never stored: see `goal-status.ts`. */
export type GoalStatus = "active" | "completed" | "overdue";

export interface Goal {
	id: string;
	/** Public address (G…) of the wallet that owns the goal. */
	owner: string;
	name: string;
	assetId: AssetId;
	targetAmount: Amount;
	/** Calendar date, YYYY-MM-DD. */
	targetDate: string;
	createdAt: string;
}

export type ActivityKind = "deposit" | "withdrawal";

/**
 * pending: signed and sent, not yet confirmed by the network. failed: rejected or never sent.
 * unknown: the submit response was lost; check the hash on the explorer, never resend.
 */
export type TxStatus = "pending" | "confirmed" | "failed" | "unknown";

export interface Activity {
	id: string;
	goalId: string;
	kind: ActivityKind;
	amount: Amount;
	assetId: AssetId;
	status: TxStatus;
	/** Stellar transaction hash once the transaction was built and signed. */
	txHash: string | null;
	createdAt: string;
	/** Plain-language reason when status is failed. */
	error?: string;
}

/** A goal with its derived numbers, as the screens show it. */
export interface GoalSummary extends Goal {
	savedAmount: Amount;
	/** Whole percent; may exceed 100. */
	progress: number;
	status: GoalStatus;
}
