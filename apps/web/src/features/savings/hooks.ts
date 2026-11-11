"use client";

import { useMutation } from "@tanstack/react-query";
import type { ActivityKind, Amount, Goal } from "@repo/domain/types";
import { useGoalsStore } from "@/features/goals/store";
import { sign } from "@/features/wallet/connect";
import { isWalletDismissal } from "@/features/wallet/kit";
import { buildDepositTx, buildWithdrawTx, OutcomeUnknownError, submitSigned } from "@/features/savings/stellar-tx";

/** The wallet popup was closed or the request rejected: nothing was signed or sent. */
export class WalletDeclinedError extends Error {
	constructor() {
		super("The linked wallet declined the signing request. No funds were moved.");
	}
}

/**
 * Add Savings / Withdraw (PRD flows 3 and 4): build → the user approves and signs in their wallet → submit → record.
 * Activity is recorded as pending once signed, then confirmed / failed / unknown. A closed wallet popup is never
 * success and records nothing; an unknown outcome is never retried automatically.
 */
export function useGoalTransaction(kind: ActivityKind) {
	const { addActivity, updateActivity } = useGoalsStore.getState();
	return useMutation({
		mutationFn: async ({ goal, amount, onSigned }: { goal: Goal; amount: Amount; onSigned?: () => void }) => {
			const unsigned = kind === "deposit" ? await buildDepositTx(goal, amount) : await buildWithdrawTx(goal, amount);
			let signed: string;
			try {
				signed = await sign(unsigned);
			} catch (error) {
				if (isWalletDismissal(error)) throw new WalletDeclinedError();
				throw error;
			}
			onSigned?.();
			const id = crypto.randomUUID();
			addActivity({
				id,
				goalId: goal.id,
				kind,
				amount,
				assetId: goal.assetId,
				status: "pending",
				txHash: null,
				createdAt: new Date().toISOString(),
			});
			try {
				const result = await submitSigned(signed);
				if (result.status === "confirmed") updateActivity(id, { status: "confirmed", txHash: result.hash });
				else updateActivity(id, { status: "failed", txHash: result.hash, error: result.reason });
				return { activityId: id, ...result };
			} catch (error) {
				if (error instanceof OutcomeUnknownError) updateActivity(id, { status: "unknown", txHash: error.hash });
				else updateActivity(id, { status: "failed", error: "The transaction couldn’t be sent." });
				throw error;
			}
		},
	});
}
