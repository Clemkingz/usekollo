"use client";

import { useQuery } from "@tanstack/react-query";
import { toActivities } from "@/lib/api/map";
import { keys } from "@/lib/query-client";
import { goalsApi } from "@/features/goals/api";
import { useConnectedWallet } from "@/features/wallet/hooks";

/**
 * Activity across every goal, or one goal's, newest first (PRD screen 9 and Goal Details). Polls while anything is
 * still processing: the API settles slow transactions in the background.
 */
export function useActivity(goalId?: string) {
	const { address } = useConnectedWallet();
	const query = useQuery({
		queryKey: goalId ? keys.goalActivity(goalId) : keys.activity,
		queryFn: async () => toActivities(await (goalId ? goalsApi.activity(goalId) : goalsApi.allActivity())),
		enabled: !!address,
		refetchInterval: (q) => (q.state.data?.some((a) => a.status === "pending") ? 8_000 : false),
	});
	return { ...query, activity: query.data ?? [] };
}
