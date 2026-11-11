"use client";

import Link from "next/link";
import { Plus, SquareArrowOutUpRight, Target } from "lucide-react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { routes } from "@/lib/routes";
import { useCreateGoalAction } from "@/components/layouts/AppSidebar";
import { useConnectedWallet } from "@/features/wallet/hooks";
import { useGoals } from "@/features/goals/hooks";
import { useActivity } from "@/features/activity/hooks";
import { GoalRow } from "@/features/goals/components/GoalRow";
import { ActivityFeed } from "@/features/activity/components/ActivityFeed";
import { BalanceCard } from "@/features/dashboard/components/BalanceCard";

/** White content card of the app area (dashboard design: 30px radius on the grey canvas). */
export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
	return <section className={cn("rounded-[24px] bg-white p-5 md:rounded-[30px] md:p-7", className)}>{children}</section>;
}

/**
 * Dashboard (PRD screens 3 and 4, designs). Empty: "No Active Goals", worded for a missing wallet or a wallet with
 * no goals. With goals: total balance, ongoing goals and activity.
 */
export function DashboardView() {
	const { ready, address } = useConnectedWallet();
	const goals = useGoals(address);

	if (!ready) return <Panel className="skeleton-shimmer h-[300px] lg:h-auto lg:flex-1">{null}</Panel>;
	if (!address || goals.length === 0) return <EmptyGoals walletConnected={!!address} />;
	return <FilledDashboard address={address} />;
}

/** "No Active Goals" (dashboard and Savings Goals designs; each uses its own icon). */
export function EmptyGoals({ walletConnected, icon }: { walletConnected: boolean; icon?: React.ReactNode }) {
	const createGoal = useCreateGoalAction();
	return (
		<Panel className="flex flex-col items-center px-6 py-10 text-center md:py-[33px] md:pb-[33px] lg:flex-1 lg:justify-center">
			<span className="flex size-[70px] items-center justify-center rounded-full bg-[#f4f4f4]">
				{icon ?? <Target className="size-7 text-ink" strokeWidth={2.25} aria-hidden />}
			</span>
			<h1 className="mt-6 text-2xl text-ink">No Active Goals</h1>
			<p className="mt-2 max-w-[300px] text-[13px] leading-[1.35] text-neutral-900">
				{walletConnected
					? "You don’t have any savings goals yet. Create one to start setting aside assets and tracking your progress."
					: "You haven’t connected a wallet yet. Connect one to create your first savings goal and start tracking your progress."}
			</p>
			<Button className="mt-6 h-14 w-full max-w-[282px] text-[17px] md:h-[57px]" onClick={createGoal}>
				<Plus className="size-5" /> Create Savings Goal
			</Button>
		</Panel>
	);
}

/** "ONGOING GOALS (2)" · "SEE ALL ↗" (dashboard design). */
export function SectionHeader({ title, href, className }: { title: string; href?: string; className?: string }) {
	return (
		<div className={cn("flex items-center justify-between", className)}>
			<h2 className="text-sm text-ink uppercase md:text-[15px]">{title}</h2>
			{href && (
				<Link
					href={href}
					className="inline-flex items-center gap-2 text-sm text-ink uppercase hover:text-primary-500 md:text-[15px]"
				>
					See all <SquareArrowOutUpRight className="size-[18px]" aria-hidden />
				</Link>
			)}
		</div>
	);
}

/** Main dashboard (desktop + phone designs): balance card · ongoing goals · activity; phones add the CTA at the end. */
function FilledDashboard({ address }: { address: string }) {
	const goals = useGoals(address);
	const activity = useActivity(address);
	const createGoal = useCreateGoalAction();
	const names = new Map(goals.map((g) => [g.id, g.name]));
	const ongoing = goals.filter((g) => g.status !== "completed");
	// Unfinished goals first, then done ones, as many as the design's three rows.
	const listed = [...ongoing, ...goals.filter((g) => g.status === "completed")].slice(0, 3);

	return (
		<div className="flex flex-col gap-6 md:gap-7">
			<div className="grid gap-6 xl:grid-cols-[minmax(0,837fr)_minmax(0,958fr)] xl:gap-[14px]">
				<BalanceCard address={address} goals={goals} />
				<section>
					<SectionHeader title={`Ongoing goals (${ongoing.length})`} href={routes.goals} className="xl:-mt-0.5" />
					<div className="mt-3 flex flex-col gap-2.5 md:mt-3.5">
						{listed.map((g) => (
							<GoalRow key={g.id} goal={g} />
						))}
					</div>
				</section>
			</div>

			<section>
				<SectionHeader title="Activity" href={routes.activity} />
				<ActivityFeed items={activity} goalName={(id) => names.get(id)} pageSize={4} compact className="mt-3 md:mt-4" />
			</section>

			<Button className="h-[53px] text-base md:hidden" onClick={createGoal}>
				<Plus className="size-5" /> Create Savings Goal
			</Button>
		</div>
	);
}
