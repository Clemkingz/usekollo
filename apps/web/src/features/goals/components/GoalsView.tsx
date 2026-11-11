"use client";

import { useState } from "react";
import { Box, ChevronDown, Scan } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { useNow } from "@/lib/use-now";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useConnectedWallet } from "@/features/wallet/hooks";
import { useGoals } from "@/features/goals/hooks";
import { useActivity } from "@/features/activity/hooks";
import { GoalRow } from "@/features/goals/components/GoalRow";
import { ActivityFeed } from "@/features/activity/components/ActivityFeed";
import { BalanceCard } from "@/features/dashboard/components/BalanceCard";
import { EmptyGoals } from "@/features/dashboard/components/DashboardView";

const PERIODS = [
	{ value: "7", label: "Last 7 days" },
	{ value: "30", label: "Last 30 days" },
	{ value: "90", label: "Last 90 days" },
	{ value: "all", label: "All time" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

/** The design's box-in-a-scan-frame empty icon. */
function ScanBoxIcon() {
	return (
		<span className="relative flex size-8 items-center justify-center text-ink" aria-hidden>
			<Scan className="absolute inset-0 size-8" strokeWidth={2} />
			<Box className="size-4" strokeWidth={2.25} />
		</span>
	);
}

/**
 * Savings Goals (sidebar / tab bar; designs for active goals and the empty state). Header: breadcrumb and the
 * LAST 30 DAYS / ALL GOALS filters. Body: balance card, the goals, and their activity. The period filters the
 * activity; the goal filter narrows goals and activity to one goal. Works without a wallet (empty state asks for one).
 */
export function GoalsView() {
	const { ready, address } = useConnectedWallet();
	const goals = useGoals(address);
	const activity = useActivity(address);
	const [period, setPeriod] = useState<Period>("30");
	const [goalId, setGoalId] = useState<string>("all");
	const now = useNow();

	if (!ready) return <div className="skeleton-shimmer h-[300px] rounded-[30px]" />;
	if (!address || goals.length === 0) return <EmptyGoals walletConnected={!!address} icon={<ScanBoxIcon />} />;

	const names = new Map(goals.map((g) => [g.id, g.name]));
	const shownGoals = goalId === "all" ? goals : goals.filter((g) => g.id === goalId);
	// `now` is 0 until hydrated (shared minute clock): show everything until then.
	const since = period === "all" || now === 0 ? 0 : now - Number(period) * 86_400_000;
	const shownActivity = activity.filter(
		(a) => (goalId === "all" || a.goalId === goalId) && new Date(a.createdAt).getTime() >= since,
	);

	return (
		<div className="flex flex-col gap-5 md:gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Breadcrumb current="SAVINGS GOALS" />
				<div className="flex gap-3 md:gap-4">
					<FilterMenu
						label={PERIODS.find((p) => p.value === period)!.label}
						value={period}
						onChange={(v) => setPeriod(v as Period)}
						options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
					/>
					<FilterMenu
						label={goalId === "all" ? "All goals" : (names.get(goalId) ?? "All goals")}
						value={goalId}
						onChange={setGoalId}
						options={[{ value: "all", label: "All goals" }, ...goals.map((g) => ({ value: g.id, label: g.name }))]}
					/>
				</div>
			</div>

			<div className="grid gap-5 xl:grid-cols-[minmax(0,837fr)_minmax(0,935fr)] xl:gap-4">
				<BalanceCard address={address} goals={goals} pillInline />
				<div className="flex flex-col gap-2.5 xl:max-h-[407px] xl:overflow-y-auto">
					{shownGoals.map((g) => (
						<GoalRow key={g.id} goal={g} className="md:min-h-[80px]" />
					))}
				</div>
			</div>

			<ActivityFeed
				key={`${period}-${goalId}`}
				items={shownActivity}
				goalName={(id) => names.get(id)}
				pageSize={4}
				controls={false}
			/>
		</div>
	);
}

/** "LAST 30 DAYS ▾" white pill with a menu (design). */
function FilterMenu({
	label,
	value,
	onChange,
	options,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: { value: string; label: string }[];
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex h-10 max-w-[200px] items-center gap-3 rounded-full bg-white px-5 text-sm text-ink uppercase transition-colors hover:bg-primary-50 md:h-[37px] md:px-6 md:text-[15px]"
				>
					<span className="truncate">{label}</span>
					<ChevronDown className="size-4 shrink-0" aria-hidden />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56 border-line bg-white text-ink">
				<DropdownMenuRadioGroup value={value} onValueChange={onChange}>
					{options.map((o) => (
						<DropdownMenuRadioItem key={o.value} value={o.value} className="cursor-pointer focus:bg-primary-50">
							{o.label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
