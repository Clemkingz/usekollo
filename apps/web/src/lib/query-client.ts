"use client";

import { QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError, isNetworkError } from "@/lib/api/client";
import { notify } from "@/lib/use-toast";

/**
 * The one query cache, shared by React (ReactQueryProvider) and code outside it (wallet connect, sign-out) so both
 * update the same goals and balances.
 */
export const queryClient = new QueryClient({
	// A background refresh failed while the screen still shows the last data: say so quietly, once. First loads show
	// their own error state instead. Offline is announced by <NetworkStatus />.
	queryCache: new QueryCache({
		onError: (error, query) => {
			if (query.state.data === undefined || isNetworkError(error)) return;
			if (error instanceof ApiError && error.status === 401) return;
			notify.warning("Couldn’t refresh", `${error.message} Showing the last known values.`, { id: `refresh-${query.queryHash}` });
		},
	}),
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			gcTime: 30 * 60_000,
			refetchOnWindowFocus: true,
			// Retry network blips, never a 4xx: the answer won't change.
			retry: (count, error) => count < 2 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
		},
		// Never auto-retry a write: a retried transaction could go out twice.
		mutations: { retry: false },
	},
});

/** Query keys in one place, so writes can refresh exactly what they change. */
export const keys = {
	wallet: ["wallet"] as const,
	goals: ["goals"] as const,
	goal: (id: string) => ["goals", id] as const,
	goalActivity: (id: string) => ["goals", id, "activity"] as const,
	activity: ["activity"] as const,
};

/** After a transaction settles: goals, activity and balances all moved. */
export function refreshAfterTransaction() {
	return Promise.all([
		queryClient.invalidateQueries({ queryKey: keys.goals }),
		queryClient.invalidateQueries({ queryKey: keys.activity }),
		queryClient.invalidateQueries({ queryKey: keys.wallet }),
	]);
}
