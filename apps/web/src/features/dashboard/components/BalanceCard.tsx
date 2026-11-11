"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import type { GoalSummary } from "@repo/domain/types";
import { ongoingProgress } from "@repo/domain/goal-status";
import { formatFixed } from "@repo/domain/money";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { cn } from "@repo/ui/lib/utils";
import { ASSETS } from "@/lib/stellar/config";
import { useBalances } from "@/lib/stellar/horizon";
import { useCreateGoalAction } from "@/components/layouts/AppSidebar";

/**
 * TOTAL BALANCE card (dashboard design): the wallet's balance in one asset (switch with the USDC ▾ pill), the
 * progress of unfinished goals in that asset, and what's left on the goal closest to done. Never mixes assets.
 */
export function BalanceCard({
	address,
	goals,
	pillInline = false,
	className,
}: {
	address: string;
	goals: GoalSummary[];
	/** Savings Goals design: the asset pill sits right after the amount instead of at the card's edge. */
	pillInline?: boolean;
	className?: string;
}) {
	const balances = useBalances(address);
	const createGoal = useCreateGoalAction();
	const usdc = ASSETS.find((a) => a.code === "USDC")!;
	const [picked, setPicked] = useState<string | null>(null);
	// Default: the asset most unfinished goals are saved in; else USDC when the wallet holds it; else XLM.
	const counts = new Map<string, number>();
	for (const g of goals) if (g.status !== "completed") counts.set(g.assetId, (counts.get(g.assetId) ?? 0) + 1);
	const goalAsset = [...counts.entries()].sort((x, y) => y[1] - x[1])[0]?.[0];
	const assetId = picked ?? goalAsset ?? (balances.data?.balances[usdc.id] !== undefined ? usdc.id : ASSETS[0]!.id);
	const asset = ASSETS.find((a) => a.id === assetId)!;
	const amount = balances.data?.balances[assetId];
	const progress = ongoingProgress(goals, assetId);

	return (
		<section
			aria-label="Total balance"
			className={cn("flex flex-col rounded-[18px] bg-primary-500 p-5 text-white md:rounded-[20px] md:p-6", className)}
		>
			<div className={cn("flex items-start gap-3", pillInline ? "flex-wrap" : "justify-between")}>
				<div className="min-w-0">
					<p className="text-xs uppercase md:text-[13px]">Total balance</p>
					<p className="mt-1 truncate text-[40px] leading-tight font-light tracking-[-0.02em] tabular-nums md:text-[46px]">
						{balances.isPending ? "…" : amount ? formatFixed(amount) : "0.00"}
					</p>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className={cn(
								"flex h-7 shrink-0 items-center gap-1 rounded-full bg-primary-700 px-3.5 text-xs transition-colors hover:bg-[#01147a] md:h-[27px]",
								pillInline ? "mt-8 self-start md:mt-11 md:h-[30px] md:px-4 md:text-sm" : "mt-6 md:mt-7",
							)}
							aria-label={`Showing ${asset.code}. Change asset`}
						>
							{asset.code} <ChevronDown className="size-3.5" aria-hidden />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48 border-line bg-white text-ink">
						<DropdownMenuRadioGroup value={assetId} onValueChange={setPicked}>
							{ASSETS.map((a) => (
								<DropdownMenuRadioItem key={a.id} value={a.id} className="cursor-pointer focus:bg-primary-50">
									{a.code} · {a.name}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="mt-auto pt-8 md:pt-9">
				<div
					className="h-2.5 overflow-hidden rounded-full bg-white md:h-[11px]"
					role="progressbar"
					aria-label={`Ongoing goals in ${asset.code}`}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={Math.min(progress?.percent ?? 0, 100)}
				>
					<div
						className="h-full rounded-full bg-primary-200 transition-[width] duration-700"
						style={{ width: `${Math.min(progress?.percent ?? 0, 100)}%` }}
					/>
				</div>
				<div className="mt-2 flex justify-between gap-3 text-[11px] md:uppercase">
					<span>{progress ? "Ongoing goals" : `No ongoing ${asset.code} goals`}</span>
					{progress && (
						<span className="text-right tabular-nums">
							{formatFixed(progress.nextGoalRemaining)} {asset.code} to next goal
						</span>
					)}
				</div>
			</div>

			<button
				type="button"
				onClick={createGoal}
				className="mt-6 hidden h-[46px] w-full items-center justify-center gap-3 rounded-full bg-white text-[17px] text-ink transition-colors hover:bg-primary-50 md:flex"
			>
				<Plus className="size-5" aria-hidden /> Create Savings Goal
			</button>
		</section>
	);
}
