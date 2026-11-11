"use client";

import { useMutation } from "@tanstack/react-query";
import type { Activity, Goal } from "@repo/domain/types";
import { toActivity, toGoal } from "@/lib/api/map";
import type { PreparedTransactionDto, WalletDto } from "@/lib/api/types";
import { keys, queryClient, refreshAfterTransaction } from "@/lib/query-client";
import { goalsApi } from "@/features/goals/api";
import { walletApi } from "@/features/wallet/api";
import { sign } from "@/features/wallet/connect";
import { isWalletDismissal } from "@/features/wallet/kit";

/** The wallet popup was closed or the request rejected: nothing was signed or sent. */
export class WalletDeclinedError extends Error {
	constructor() {
		super("The wallet declined the signing request. No funds were moved.");
	}
}

/**
 * How a signed transaction ended. confirmed: on the ledger. pending: the network didn't answer in time; the API
 * settles it in the background (never resent automatically). failed: rejected, with a plain reason.
 */
export type TxOutcome =
	| { status: "confirmed"; hash: string | null; goal: Goal; activity: Activity | null }
	| { status: "pending"; hash: string | null; goal: Goal; activity: Activity | null }
	| { status: "failed"; hash: string | null; reason: string; goal: Goal; activity: Activity | null };

/** Signs with the wallet, failing with `WalletDeclinedError` when the user closes or rejects the popup. */
async function signOrDecline(xdr: string, networkPassphrase: string) {
	try {
		return await sign(xdr, networkPassphrase);
	} catch (error) {
		if (isWalletDismissal(error)) throw new WalletDeclinedError();
		throw error;
	}
}

/**
 * A prepared goal transaction (open, deposit, withdrawal, close): the wallet signs it → `onSigned` → the API checks
 * and submits it. A closed wallet popup records nothing; an unanswered submit is left to the API, never retried here.
 */
export async function signAndSubmit(goalId: string, prepared: PreparedTransactionDto, onSigned?: () => void): Promise<TxOutcome> {
	const signed = await signOrDecline(prepared.xdr, prepared.networkPassphrase);
	onSigned?.();
	try {
		const result = await goalsApi.submit(goalId, prepared.activityId, signed);
		const goal = toGoal(result.goal);
		queryClient.setQueryData(keys.goal(goalId), goal);
		const activity = toActivity(result.activity);
		const hash = result.activity.txHash ?? prepared.hash;
		if (result.activity.status === "success") return { status: "confirmed", hash, goal, activity };
		if (result.activity.status === "failed")
			return {
				status: "failed",
				hash,
				goal,
				activity,
				reason: result.activity.failureReason ?? "The network rejected the transaction.",
			};
		return { status: "pending", hash, goal, activity };
	} finally {
		void refreshAfterTransaction();
	}
}

/** `signAndSubmit` as a mutation, for screens that show its progress. */
export function useGoalTransaction() {
	return useMutation({
		mutationFn: ({ goalId, prepared, onSigned }: { goalId: string; prepared: PreparedTransactionDto; onSigned?: () => void }) =>
			signAndSubmit(goalId, prepared, onSigned),
	});
}

/** Lets the linked wallet hold an issued asset (e.g. USDC): prepare → the wallet signs → submit. Sets aside 0.5 XLM. */
export async function addTrustline(assetId: string) {
	const prepared = await walletApi.trustline(assetId);
	const signed = await signOrDecline(prepared.xdr, prepared.networkPassphrase);
	const wallet = await walletApi.submitTrustline(signed);
	queryClient.setQueryData<WalletDto>(keys.wallet, wallet);
	return wallet;
}
