"use client";

import { useGoals } from "@/features/goals/hooks";
import { useActivity } from "@/features/activity/hooks";
import { useConnectedWallet } from "@/features/wallet/hooks";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ActivityFeed } from "@/features/activity/components/ActivityFeed";
import { NoActivity } from "@/features/activity/components/NoActivity";

/**
 * Activity Register (PRD screen 9; designs for the list and the empty state): every transaction across goals, with
 * search, status tabs, type filter and pages of four.
 */
export function ActivityView() {
	const { ready, address } = useConnectedWallet();
	const goals = useGoals(address);
	const activity = useActivity(address);
	const names = new Map(goals.map((g) => [g.id, g.name]));
	return (
		<div className="flex flex-col gap-5 md:gap-6">
			<Breadcrumb current="Activity" />
			{!ready ? (
				<div className="skeleton-shimmer h-[300px] rounded-[20px]" />
			) : activity.length === 0 ? (
				<NoActivity description="You haven’t allocated any funds to specific saving targets yet. Goals help you organize your assets." />
			) : (
				<ActivityFeed items={activity} goalName={(id) => names.get(id)} pageSize={4} />
			)}
		</div>
	);
}
