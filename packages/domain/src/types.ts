/**
 * UseKollo's core model, as the screens use it. The UseKollo API is the source of truth (docs/DECISIONS.md D1, D2):
 * each goal is its own Stellar account owned by the user's wallet, and the API reports its numbers. The web app maps
 * the API's DTOs onto these types in `apps/web/src/lib/api`. Amounts are decimal strings, never floats.
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

/**
 * pending: created, waiting for the wallet to approve opening its account. active: open, target not reached yet.
 * completed: target reached (withdrawals unlocked), still open. overdue: past the target date, not reached.
 * closed: everything was returned to the wallet and the goal's account removed.
 */
export type GoalStatus = "pending" | "active" | "completed" | "overdue" | "closed";

export interface Goal {
	id: string;
	name: string;
	assetId: AssetId;
	assetCode: string;
	targetAmount: Amount;
	/** On the goal's account, as of `syncedAt`. Can exceed the target. */
	savedAmount: Amount;
	/** "0" once reached. */
	remainingAmount: Amount;
	/** Whole percent, capped at 100. */
	progress: number;
	/** Calendar date, YYYY-MM-DD. */
	targetDate: string;
	/** Negative once the date has passed. */
	daysLeft: number;
	status: GoalStatus;
	/** The target has been reached at least once: withdrawals stay unlocked from then on. */
	targetReached: boolean;
	canWithdraw: boolean;
	canClose: boolean;
	/** The goal's own Stellar account; only the owner's wallet can sign for it. */
	accountAddress: string;
	ownerAddress: string;
	explorerUrl: string;
	/** XLM locked in the goal's account as its minimum balance; returned on close. */
	reserveXlm: Amount;
	syncedAt: string | null;
	reachedAt: string | null;
	closedAt: string | null;
	createdAt: string;
}

/** @deprecated Goals arrive with their numbers from the API; kept as an alias for older imports. */
export type GoalSummary = Goal;

/** open: the goal's account was created. close: everything (reserve included) went back to the wallet. */
export type ActivityKind = "open" | "deposit" | "withdrawal" | "close";

/**
 * pending: sent, not settled yet (the network didn't answer in time; the API settles it in the background).
 * confirmed: on the ledger. failed: rejected; nothing moved. Prepared-but-never-signed transactions aren't activity.
 */
export type TxStatus = "pending" | "confirmed" | "failed";

export interface Activity {
	id: string;
	goalId: string;
	goalName: string;
	kind: ActivityKind;
	/** In `assetCode`. "0" for open; for close, what came back. */
	amount: Amount;
	assetCode: string;
	status: TxStatus;
	txHash: string | null;
	explorerUrl: string | null;
	/** Sent straight to the goal's account from outside UseKollo. */
	external: boolean;
	/** Plain-language reason when status is failed. */
	failureReason: string | null;
	createdAt: string;
	confirmedAt: string | null;
}
