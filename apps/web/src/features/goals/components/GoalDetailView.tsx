"use client";

import Link from "next/link";
import { Clock3, Plus, SquareArrowOutUpRight, WalletCards } from "lucide-react";
import { goalBadge, monthlyPace, todayISO } from "@repo/domain/goal-status";
import { formatFixed, sum } from "@repo/domain/money";
import { Button } from "@repo/ui/button";
import { routes } from "@/lib/routes";
import { money } from "@/lib/money";
import { assetById, shortKey } from "@/lib/stellar/config";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/States";
import { useConnectedWallet } from "@/features/wallet/hooks";
import { useGoal } from "@/features/goals/hooks";
import { useActivity } from "@/features/activity/hooks";
import { ActivityFeed } from "@/features/activity/components/ActivityFeed";
import { SectionHeader } from "@/features/dashboard/components/DashboardView";
import { GoalProgressRing } from "@/features/goals/components/GoalProgressRing";

/** "DEC 2026" from "2026-12-31". */
const monthYear = (iso: string) =>
	new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase();

/**
 * Goal Details (PRD screen 6; designs for a new goal, a goal in progress and a completed goal). Top card: progress
 * ring · saved of target · monthly pace · due date · quick actions. Below: the goal's activity (or "No Activity
 * Yet"); a completed goal shows its summary instead, with Withdraw first and "Back to Dashboard".
 */
export function GoalDetailView({ id }: { id: string }) {
	const { address } = useConnectedWallet();
	const goal = useGoal(id, address);
	const activity = useActivity(address, id);

	if (!goal)
		return (
			<EmptyState
				className="bg-white"
				title="Goal not found"
				description="It may belong to a different wallet, or was created in another browser."
				action={
					<Button asChild size="md">
						<Link href={routes.dashboard}>Back to dashboard</Link>
					</Button>
				}
			/>
		);

	const today = todayISO();
	const badge = goalBadge(goal, today);
	const done = badge === "done";
	const code = assetById(goal.assetId)?.code ?? goal.assetId;
	const hasSavings = Number(goal.savedAmount) > 0;
	const disbursed = sum(activity.filter((a) => a.kind === "withdrawal" && a.status === "confirmed").map((a) => a.amount));

	return (
		<div className="flex flex-col gap-6 md:gap-8">
			<Breadcrumb current={goal.name} />

			<section className="grid items-center gap-8 rounded-[20px] bg-white p-6 md:p-8 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,400px)] lg:gap-10">
				<GoalProgressRing
					percent={goal.progress}
					badge={badge}
					saved={goal.savedAmount}
					target={goal.targetAmount}
					code={code}
					className="mx-auto lg:mx-0"
				/>

				<div className="min-w-0 lg:max-w-[330px]">
					<p className="text-sm text-ink uppercase">{done ? "Goal complete" : "Saved of target"}</p>
					<p className="mt-1 flex flex-wrap items-baseline gap-x-2 border-b border-line pb-5 text-ink">
						<span className="text-[40px] leading-tight tracking-[-0.02em] tabular-nums md:text-[46px]">
							{money(goal.savedAmount, code)}
						</span>
						<span className="text-lg text-ink/55 tabular-nums">/ {money(goal.targetAmount, code)}</span>
					</p>
					<dl className="mt-5 grid grid-cols-2 gap-6">
						<div>
							<dt className="text-sm text-ink uppercase">Monthly pace</dt>
							<dd className="mt-1 text-xl text-ink tabular-nums">{money(monthlyPace(goal, today), code)}</dd>
						</div>
						<div>
							<dt className="text-sm text-ink uppercase">Due date</dt>
							<dd className="mt-1 text-xl text-ink">{monthYear(goal.targetDate)}</dd>
						</div>
					</dl>
				</div>

				<div>
					<p className="text-sm text-ink uppercase">Quick actions</p>
					<div className="mt-4 flex flex-col gap-2.5">
						{done ? (
							<>
								<Button asChild className="h-[59px] text-lg">
									<Link href={routes.withdraw(goal.id)}>
										<WalletCards className="size-6" /> Withdraw
									</Link>
								</Button>
								<Button asChild variant="outline" className="h-[59px] text-lg">
									<Link href={routes.dashboard}>
										Back to Dashboard <SquareArrowOutUpRight className="size-5" />
									</Link>
								</Button>
							</>
						) : (
							<>
								<Button asChild className="h-[59px] text-lg">
									<Link href={routes.addSavings(goal.id)}>
										<Plus className="size-6" /> Add Savings
									</Link>
								</Button>
								{hasSavings ? (
									<Button asChild variant="outline" className="h-[59px] text-lg">
										<Link href={routes.withdraw(goal.id)}>Withdraw</Link>
									</Button>
								) : (
									<Button
										variant="outline"
										className="h-[59px] border-line text-lg text-ink/30"
										disabled
										title="Nothing saved yet"
									>
										Withdraw
									</Button>
								)}
							</>
						)}
					</div>
				</div>
			</section>

			{done ? (
				<section aria-label="Goal summary" className="overflow-hidden rounded-[20px] bg-white text-sm text-ink md:text-base">
					<dl className="divide-y divide-line">
						{[
							["Target name", goal.name.toUpperCase()],
							["Recipient address", address ? shortKey(address, 4, 4).replace("…", "...") : "—"],
							["Settlement asset", assetLabel(goal.assetId, code)],
							["Total disbursed", `${formatFixed(disbursed)} ${code}`],
						].map(([label, value]) => (
							<div key={label} className="flex items-center justify-between gap-4 px-6 py-5 md:px-7">
								<dt className="uppercase">{label}</dt>
								<dd className="text-right tabular-nums">{value}</dd>
							</div>
						))}
					</dl>
				</section>
			) : (
				<section>
					<SectionHeader title="Goal activity" href={routes.activity} />
					{activity.length === 0 ? (
						<div className="mt-4 flex flex-col items-center rounded-[20px] bg-white px-6 py-10 text-center md:py-9">
							<span className="flex size-[72px] items-center justify-center rounded-full bg-[#f4f4f4]">
								<Clock3 className="size-6 text-ink" strokeWidth={2.25} aria-hidden />
							</span>
							<h2 className="mt-6 text-xl text-ink">No Activity Yet</h2>
							<p className="mt-2 max-w-[300px] text-sm leading-snug text-neutral-900">
								You haven’t added any savings to this goal yet. Add some to start tracking your progress.
							</p>
						</div>
					) : (
						<ActivityFeed items={activity} goalName={() => goal.name} pageSize={4} className="mt-4" />
					)}
				</section>
			)}
		</div>
	);
}

/** "XLM (NATIVE)" for lumens; issued assets show their issuer briefly so lookalikes stand out. */
function assetLabel(assetId: string, code: string) {
	if (assetId === "XLM") return "XLM (NATIVE)";
	const issuer = assetById(assetId)?.issuer;
	return issuer ? `${code} (${shortKey(issuer, 4, 4).replace("…", "...")})` : code;
}
