"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { toGoal } from "@/lib/api/map";
import { keys } from "@/lib/query-client";
import { goalsApi } from "@/features/goals/api";
import { useConnectedWallet } from "@/features/wallet/hooks";

/**
 * The account's goals (newest first), from the API. Waits for the linked wallet: goals belong to it. Screens get
 * `goals` (empty while loading) plus the query's state for skeletons and errors.
 */
export function useGoals() {
	const { address } = useConnectedWallet();
	const query = useQuery({
		queryKey: keys.goals,
		queryFn: async () => (await goalsApi.list()).map(toGoal),
		enabled: !!address,
	});
	return { ...query, goals: query.data ?? [] };
}

/** One goal, refreshed from the network on each view. `notFound` when the API says it doesn't exist. */
export function useGoal(id: string) {
	const { address } = useConnectedWallet();
	const query = useQuery({
		queryKey: keys.goal(id),
		queryFn: async () => toGoal(await goalsApi.get(id)),
		enabled: !!address,
		staleTime: 10_000,
	});
	const notFound = query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 400);
	return { ...query, goal: query.data ?? null, notFound };
}
