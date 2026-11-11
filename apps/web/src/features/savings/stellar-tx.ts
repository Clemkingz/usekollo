"use client";

import type { Amount, Goal } from "@repo/domain/types";
import { getHorizon } from "@/lib/stellar/horizon";

/**
 * Stellar transactions for Add Savings and Withdraw (PRD 3 and 4). The user's wallet signs every transaction
 * (`features/wallet/connect.ts` → `sign`); this file builds the unsigned XDR and submits the signed one to Horizon.
 *
 * WHERE THE FUNDS GO is still open: docs/DECISIONS.md D1. Until it's decided, the two builders below throw, and the
 * Add Savings / Withdraw flows show that instead of pretending. Everything around them (signing, submitting,
 * recording activity, error handling) is shared and ready.
 */

export class PendingDecisionError extends Error {
	constructor(what: string) {
		super(`${what} isn’t available yet: how goal funds are held on Stellar is still being decided (DECISIONS D1).`);
	}
}

/** Unsigned transaction (base64 XDR) moving `amount` of the goal's asset from the owner's wallet into the goal. */
export async function buildDepositTx(goal: Goal, amount: Amount): Promise<string> {
	void goal;
	void amount;
	throw new PendingDecisionError("Adding savings");
}

/** Unsigned transaction (base64 XDR) moving `amount` from the goal back to the owner's wallet. */
export async function buildWithdrawTx(goal: Goal, amount: Amount): Promise<string> {
	void goal;
	void amount;
	throw new PendingDecisionError("Withdrawing");
}

export type SubmitResult = { status: "confirmed"; hash: string } | { status: "failed"; hash: string; reason: string };

/** Thrown when the submit's answer was lost: the transaction may or may not have landed. Never resend it. */
export class OutcomeUnknownError extends Error {
	constructor(readonly hash: string) {
		super("We couldn’t confirm the result. Check the transaction on the explorer before trying again.");
	}
}

/** Submits a wallet-signed transaction to Horizon and waits for the result. */
export async function submitSigned(signedXdr: string): Promise<SubmitResult> {
	const [{ TransactionBuilder }, { NETWORK_PASSPHRASE }, server] = await Promise.all([
		import("@stellar/stellar-sdk"),
		import("@/lib/stellar/config"),
		getHorizon(),
	]);
	const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
	const hash = Array.from(tx.hash(), (b) => b.toString(16).padStart(2, "0")).join("");
	try {
		const res = await server.submitTransaction(tx);
		return { status: "confirmed", hash: res.hash };
	} catch (error) {
		const response = (error as { response?: { status?: number; data?: { extras?: { result_codes?: unknown } } } })?.response;
		if (!response || response.status === 504) throw new OutcomeUnknownError(hash);
		return { status: "failed", hash, reason: horizonReason(response.data?.extras?.result_codes) };
	}
}

/** Horizon result codes → one plain sentence (no jargon in the UI). */
function horizonReason(codes: unknown) {
	const text = JSON.stringify(codes ?? "");
	if (/underfunded|insufficient/i.test(text)) return "Your wallet doesn’t have enough of this asset (keep some XLM for fees).";
	if (/no_trust|not_authorized/i.test(text)) return "Your wallet needs to add this asset (trustline) first.";
	if (/tx_bad_seq/i.test(text)) return "Your wallet’s transaction count changed. Please try again.";
	if (/tx_too_late/i.test(text)) return "The transaction expired before it was sent. Please try again.";
	if (/insufficient_fee|tx_insufficient_balance/i.test(text)) return "Not enough XLM to pay the network fee.";
	return "The network rejected the transaction.";
}
