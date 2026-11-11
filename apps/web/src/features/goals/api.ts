"use client";

import { api, apiAll } from "@/lib/api/client";
import type { ActivityDto, GoalDto, GoalWithTransactionDto, PreparedTransactionDto, SubmitResultDto } from "@/lib/api/types";

/**
 * Goals on the UseKollo API. Each goal is its own Stellar account whose only signer is the user's wallet. Every move
 * of funds is prepared by the API, signed by the wallet, then submitted back through the API.
 */
export const goalsApi = {
	/** Every goal, closed and waiting-to-open ones included, newest first. */
	list: () => api<GoalDto[]>("/goals", { query: { status: "all" } }),

	/** Refreshed from the network first (falls back to the last known values). */
	get: (id: string) => api<GoalDto>(`/goals/${id}`),

	/** Creates a pending goal and prepares the transaction that opens its account. */
	create: (body: { name: string; asset: string; targetAmount: string; targetDate: string }) =>
		api<GoalWithTransactionDto>("/goals", { method: "POST", body }),

	update: (id: string, body: { name?: string; targetAmount?: string; targetDate?: string }) =>
		api<GoalDto>(`/goals/${id}`, { method: "PATCH", body }),

	/** Only goals that were never opened. */
	remove: (id: string) => api(`/goals/${id}`, { method: "DELETE" }),

	/** A fresh opening transaction for a pending goal whose first one expired or failed. */
	open: (id: string) => api<PreparedTransactionDto>(`/goals/${id}/open`, { method: "POST" }),

	deposit: (id: string, amount: string) =>
		api<PreparedTransactionDto>(`/goals/${id}/deposits`, { method: "POST", body: { amount } }),

	/** Locked until the target is reached. Leave out `amount` to withdraw everything saved. */
	withdraw: (id: string, amount?: string) =>
		api<PreparedTransactionDto>(`/goals/${id}/withdrawals`, { method: "POST", body: amount ? { amount } : {} }),

	/** Sends everything, reserve included, back to the wallet and removes the goal's account. */
	close: (id: string) => api<PreparedTransactionDto>(`/goals/${id}/close`, { method: "POST" }),

	submit: (goalId: string, activityId: string, signedXdr: string) =>
		api<SubmitResultDto>(`/goals/${goalId}/transactions/${activityId}/submit`, { method: "POST", body: { signedXdr } }),

	activity: (id: string) => apiAll<ActivityDto>(`/goals/${id}/activity`),

	allActivity: () => apiAll<ActivityDto>("/activity"),
};
