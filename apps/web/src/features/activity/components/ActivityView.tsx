"use client";

import { useActivity } from "@/features/activity/hooks";
import { useConnectedWallet } from "@/features/wallet/hooks";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ErrorState } from "@/components/States";
import { ActivityFeed } from "@/features/activity/components/ActivityFeed";
import { NoActivity } from "@/features/activity/components/NoActivity";

/**
 * Activity Register (PRD screen 9; designs for the list and the empty state): every transaction across goals, with
 * search, status tabs, type filter and pages of four.
 */
export function ActivityView() {
	const { ready } = useConnectedWallet();
	const { activity, isPending, isError, error, refetch, isFetching } = useActivity();
	return (
		<div className="flex flex-col gap-5 md:gap-6">
			<Breadcrumb current="Activity" />
			{!ready || isPending ? (
				<div className="skeleton-shimmer h-[300px] rounded-[20px]" aria-label="Loading activity" />
			) : isError ? (
				<ErrorState
					className="bg-white"
					title="We couldn’t load your activity"
					message={error.message}
					onRetry={() => refetch()}
					retrying={isFetching}
				/>
			) : activity.length === 0 ? (
				<NoActivity description="You haven’t allocated any funds to specific saving targets yet. Goals help you organize your assets." />
			) : (
				<ActivityFeed items={activity} pageSize={4} />
			)}
		</div>
	);
}
