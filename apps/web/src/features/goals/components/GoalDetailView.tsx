"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Clock3, Lock, Pencil, Plus, SquareArrowOutUpRight, Trash2, WalletCards } from "lucide-react";
import type { Goal } from "@repo/domain/types";
import { goalBadge, monthlyPace, todayISO } from "@repo/domain/goal-status";
import { formatFixed, sum, toStroops } from "@repo/domain/money";
import { Button } from "@repo/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@repo/ui/dialog";
import { cn } from "@repo/ui/lib/utils";
import { routes } from "@/lib/routes";
import { money } from "@/lib/money";
import { keys, queryClient } from "@/lib/query-client";
import { assetById, shortKey } from "@/lib/stellar/config";
import { notify } from "@/lib/use-toast";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EmptyState, ErrorState } from "@/components/States";
import { useConnectedWallet, useRequireWallet } from "@/features/wallet/hooks";
import { useGoal } from "@/features/goals/hooks";
import { goalsApi } from "@/features/goals/api";
import { useActivity } from "@/features/activity/hooks";
import { ActivityFeed } from "@/features/activity/components/ActivityFeed";
import { SectionHeader } from "@/features/dashboard/components/DashboardView";
import { GoalProgressRing } from "@/features/goals/components/GoalProgressRing";
import { EditGoalDialog } from "@/features/goals/components/EditGoalDialog";
import { GoalActionDialog } from "@/features/savings/components/GoalActionDialog";

/** "DEC 2026" from "2026-12-31". */
const monthYear = (iso: string) =>
	new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase();

const fullDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const short = (key: string) => shortKey(key, 4, 4).replace("…", "...");

/**
 * Goal Details (PRD screen 6; designs for a new goal, a goal in progress and a completed goal). Top card: progress
 * ring · saved of target · monthly pace · due date · quick actions. Withdrawals unlock once the target is reached
 * (API rule); a reached goal shows its summary, and can be closed to return everything, reserve included. A goal
 * still waiting to open, and a closed goal, get their own cards.
 */
export function GoalDetailView({ id }: { id: string }) {
	const { goal, isPending, isError, error, notFound, refetch, isFetching } = useGoal(id);

	if (notFound) return <GoalNotFound />;
	if (isError)
		return (
			<ErrorState
				className="bg-white"
				title="We couldn’t load this goal"
				message={error.message}
				onRetry={() => refetch()}
				retrying={isFetching}
			/>
		);
	if (isPending || !goal) return <GoalDetailSkeleton />;
	return <GoalDetail goal={goal} />;
}

export function GoalNotFound() {
	return (
		<EmptyState
			className="bg-white"
			title="Goal not found"
			description="It may have been deleted, or it belongs to a different account."
			action={
				<Button asChild size="md">
					<Link href={routes.dashboard}>Back to dashboard</Link>
				</Button>
			}
		/>
	);
}

function GoalDetail({ goal }: { goal: Goal }) {
	const { activity, isPending: activityPending } = useActivity(goal.id);
	const [editing, setEditing] = useState(false);
	const editable = goal.status !== "closed";

	return (
		<div className="flex flex-col gap-6 md:gap-8">
			<div className="flex items-center justify-between gap-3">
				<Breadcrumb current={goal.name} />
				{editable && (
					<Button variant="ghost" size="sm" className="shrink-0 bg-white" onClick={() => setEditing(true)}>
						<Pencil className="size-4" /> Edit
					</Button>
				)}
			</div>

			{goal.status === "pending" ? (
				<PendingGoalCard goal={goal} />
			) : goal.status === "closed" ? (
				<ClosedGoalCard goal={goal} />
			) : (
				<OpenGoalCard goal={goal} />
			)}

			{goal.targetReached && goal.status !== "closed" && <GoalSummary goal={goal} disbursed={disbursed(goal, activity)} />}

			{goal.status !== "pending" && (
				<section>
					<SectionHeader title="Goal activity" href={routes.activity} />
					{activityPending ? (
						<div className="skeleton-shimmer mt-4 h-[200px] rounded-[20px]" aria-label="Loading activity" />
					) : activity.filter((a) => a.kind !== "open").length === 0 ? (
						<div className="animate-rise mt-4 flex flex-col items-center rounded-[20px] bg-white px-6 py-10 text-center md:py-9">
							<span className="flex size-[72px] items-center justify-center rounded-full bg-[#f4f4f4]">
								<Clock3 className="size-6 text-ink" strokeWidth={2.25} aria-hidden />
							</span>
							<h2 className="mt-6 text-xl text-ink">No Activity Yet</h2>
							<p className="mt-2 max-w-[300px] text-sm leading-snug text-neutral-900">
								You haven’t added any savings to this goal yet. Add some to start tracking your progress.
							</p>
						</div>
					) : (
						<ActivityFeed items={activity} pageSize={4} className="mt-4" />
					)}
				</section>
			)}

			{editable && <EditGoalDialog goal={goal} open={editing} onOpenChange={setEditing} />}
		</div>
	);
}

const disbursed = (goal: Goal, activity: ReturnType<typeof useActivity>["activity"]) =>
	sum(activity.filter((a) => a.goalId === goal.id && a.kind === "withdrawal" && a.status === "confirmed").map((a) => a.amount));

/** Ring, numbers and quick actions for an open goal. */
function OpenGoalCard({ goal }: { goal: Goal }) {
	const badge = goalBadge(goal);
	const done = goal.targetReached;
	const code = goal.assetCode;
	const [closing, setClosing] = useState(false);
	const requireWallet = useRequireWallet();
	const empty = toStroops(goal.savedAmount) === 0n;

	return (
		<section className="animate-rise grid items-center gap-8 rounded-[20px] bg-white p-6 md:p-8 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,400px)] lg:gap-10">
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
						<dd className="mt-1 text-xl text-ink tabular-nums">{money(monthlyPace(goal, todayISO()), code)}</dd>
					</div>
					<div>
						<dt className="text-sm text-ink uppercase">Due date</dt>
						<dd className={cn("mt-1 text-xl", goal.status === "overdue" ? "text-[#e5372f]" : "text-ink")}>
							{monthYear(goal.targetDate)}
						</dd>
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
								<Link href={routes.addSavings(goal.id)}>
									<Plus className="size-5" /> Add Savings
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
							<Button
								variant="outline"
								className="h-[59px] border-line text-lg text-ink/35"
								disabled
								aria-describedby="withdraw-lock"
							>
								<Lock className="size-5" /> Withdraw
							</Button>
							<p id="withdraw-lock" className="px-2 text-center text-xs text-ink/50">
								Withdrawals unlock when this goal reaches its target ({money(goal.remainingAmount, code)} to go).
							</p>
						</>
					)}
					{goal.canClose && (done || empty) && (
						<button
							type="button"
							onClick={() => requireWallet(() => setClosing(true), "Reconnect your wallet to close this goal.")}
							className="mt-1 inline-flex items-center justify-center gap-2 self-center rounded-full px-4 py-2 text-sm text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
						>
							<Archive className="size-4" aria-hidden /> Close goal
						</button>
					)}
				</div>
			</div>

			<GoalActionDialog
				open={closing}
				onOpenChange={setClosing}
				goalId={goal.id}
				title="Close this goal?"
				description={
					<>
						Everything in <strong className="font-medium text-ink">{goal.name}</strong> ({money(goal.savedAmount, code)}) plus the{" "}
						{formatFixed(goal.reserveXlm, 1)} XLM it set aside goes back to your wallet, and the goal is closed for good. Your
						wallet approves this.
					</>
				}
				confirmLabel="Close goal"
				destructive
				prepare={() => goalsApi.close(goal.id)}
				success={{ title: "Goal closed", description: "Everything is back in your wallet." }}
			/>
		</section>
	);
}

/** A goal whose account isn't open yet: the wallet still has to approve it. Open it, or delete the draft. */
function PendingGoalCard({ goal }: { goal: Goal }) {
	const router = useRouter();
	const requireWallet = useRequireWallet();
	const [opening, setOpening] = useState(false);
	const [deleting, setDeleting] = useState(false);

	return (
		<section className="animate-rise flex flex-col items-center rounded-[20px] bg-white px-6 py-10 text-center md:py-12">
			<span className="animate-signal flex size-[72px] items-center justify-center rounded-full bg-warning-50 text-warning-700">
				<Clock3 className="size-7" strokeWidth={2.25} aria-hidden />
			</span>
			<h1 className="mt-6 text-2xl text-ink">Finish opening this goal</h1>
			<p className="mt-2 max-w-[420px] text-[15px] leading-6 text-ink/60">
				{goal.name} ({money(goal.targetAmount, goal.assetCode)} by {fullDate(goal.targetDate)}) needs your wallet’s approval to
				open. Opening sets aside {formatFixed(goal.reserveXlm, 1)} XLM from your wallet, returned when you close the goal.
			</p>
			<div className="mt-8 flex w-full max-w-[420px] flex-col gap-3">
				<Button
					className="h-[56px] text-lg"
					onClick={() => requireWallet(() => setOpening(true), "Connect your wallet to open this goal.")}
				>
					Open goal
				</Button>
				<Button
					variant="outline"
					className="h-[56px] text-lg text-error-400 hover:text-error-400"
					onClick={() => setDeleting(true)}
				>
					<Trash2 className="size-5" /> Delete goal
				</Button>
			</div>

			<GoalActionDialog
				open={opening}
				onOpenChange={setOpening}
				goalId={goal.id}
				title="Open your goal"
				description={`Your wallet approves creating ${goal.name}'s own account. ${formatFixed(goal.reserveXlm, 1)} XLM moves into it as its minimum balance.`}
				confirmLabel="Open goal"
				prepare={() => goalsApi.open(goal.id)}
				success={{ title: "Goal opened", description: "Start adding savings whenever you’re ready." }}
			/>
			<DeleteGoalDialog goal={goal} open={deleting} onOpenChange={setDeleting} onDeleted={() => router.push(routes.goals)} />
		</section>
	);
}

function DeleteGoalDialog({
	goal,
	open,
	onOpenChange,
	onDeleted,
}: {
	goal: Goal;
	open: boolean;
	onOpenChange: (o: boolean) => void;
	onDeleted: () => void;
}) {
	const [busy, setBusy] = useState(false);
	async function remove() {
		setBusy(true);
		try {
			await goalsApi.remove(goal.id);
			queryClient.removeQueries({ queryKey: keys.goal(goal.id) });
			await queryClient.invalidateQueries({ queryKey: keys.goals });
			notify.success("Goal deleted", goal.name);
			onDeleted();
		} catch (error) {
			notify.fromError(error);
		} finally {
			setBusy(false);
		}
	}
	return (
		<Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
			<DialogContent className="gap-0 rounded-[28px] p-6 sm:max-w-[440px] sm:p-7">
				<DialogTitle className="font-display text-[26px] font-normal text-ink">Delete this goal?</DialogTitle>
				<DialogDescription className="mt-3 text-[15px] leading-6 text-ink/65">
					{goal.name} was never opened, so no funds are involved. This can’t be undone.
				</DialogDescription>
				<Button variant="destructive" className="mt-8 h-[56px] text-lg" onClick={remove} isLoading={busy} loadingLabel="Deleting">
					Delete goal
				</Button>
				<Button variant="outline" className="mt-3 h-[56px] text-lg" disabled={busy} onClick={() => onOpenChange(false)}>
					Cancel
				</Button>
			</DialogContent>
		</Dialog>
	);
}

function ClosedGoalCard({ goal }: { goal: Goal }) {
	return (
		<section className="animate-rise flex flex-col items-center rounded-[20px] bg-white px-6 py-10 text-center md:py-12">
			<span className="flex size-[72px] items-center justify-center rounded-full bg-[#ececec]">
				<Archive className="size-7 text-ink" strokeWidth={2} aria-hidden />
			</span>
			<h1 className="mt-6 text-2xl text-ink">Goal closed</h1>
			<p className="mt-2 max-w-[420px] text-[15px] leading-6 text-ink/60">
				{goal.closedAt ? `Closed on ${fullDate(goal.closedAt)}. ` : ""}Everything it held went back to your wallet.
			</p>
			<dl className="mt-8 grid w-full max-w-[460px] grid-cols-2 gap-4 rounded-[18px] bg-page p-5 text-left">
				<div>
					<dt className="text-xs text-ink/50 uppercase">Target</dt>
					<dd className="mt-1 text-lg text-ink tabular-nums">{money(goal.targetAmount, goal.assetCode)}</dd>
				</div>
				<div>
					<dt className="text-xs text-ink/50 uppercase">Reached</dt>
					<dd className="mt-1 text-lg text-ink">{goal.targetReached ? "Yes" : "No"}</dd>
				</div>
			</dl>
			<Button asChild variant="outline" className="mt-8 h-[52px] max-w-[260px] text-base">
				<Link href={routes.goals}>Back to goals</Link>
			</Button>
		</section>
	);
}

/** Completed design: target name, wallet, goal account, settlement asset, total disbursed. */
function GoalSummary({ goal, disbursed }: { goal: Goal; disbursed: string }) {
	const { address } = useConnectedWallet();
	const rows: [string, React.ReactNode][] = [
		["Target name", goal.name.toUpperCase()],
		["Recipient address", short(address ?? goal.ownerAddress)],
		[
			"Goal account",
			<a
				key="acct"
				href={goal.explorerUrl}
				target="_blank"
				rel="noreferrer"
				className="inline-flex items-center gap-1.5 text-primary-500 underline-offset-4 hover:underline"
			>
				{short(goal.accountAddress)} <SquareArrowOutUpRight className="size-3.5" aria-hidden />
			</a>,
		],
		["Settlement asset", assetLabel(goal)],
		["Total disbursed", `${formatFixed(disbursed)} ${goal.assetCode}`],
	];
	return (
		<section
			aria-label="Goal summary"
			className="animate-rise overflow-hidden rounded-[20px] bg-white text-sm text-ink md:text-base"
		>
			<dl className="divide-y divide-line">
				{rows.map(([label, value]) => (
					<div key={label} className="flex items-center justify-between gap-4 px-6 py-5 md:px-7">
						<dt className="uppercase">{label}</dt>
						<dd className="text-right tabular-nums">{value}</dd>
					</div>
				))}
			</dl>
		</section>
	);
}

/** "XLM (NATIVE)" for lumens; issued assets show their issuer briefly so lookalikes stand out. */
function assetLabel(goal: Goal) {
	if (goal.assetId === "XLM") return "XLM (NATIVE)";
	const issuer = assetById(goal.assetId)?.issuer ?? goal.assetId.split(":")[1];
	return issuer ? `${goal.assetCode} (${short(issuer)})` : goal.assetCode;
}

function GoalDetailSkeleton() {
	return (
		<div role="status" aria-label="Loading goal" className="flex flex-col gap-6 md:gap-8">
			<span className="skeleton-shimmer block h-5 w-56 rounded-full" />
			<div className="grid items-center gap-8 rounded-[20px] bg-white p-6 md:p-8 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,400px)] lg:gap-10">
				<span className="skeleton-shimmer mx-auto size-[190px] rounded-full lg:mx-0" />
				<div className="space-y-4">
					<span className="skeleton-shimmer block h-3 w-28 rounded-full" />
					<span className="skeleton-shimmer block h-10 w-64 rounded-full" />
					<span className="skeleton-shimmer block h-6 w-40 rounded-full" />
				</div>
				<div className="space-y-2.5">
					<span className="skeleton-shimmer block h-[59px] rounded-full" />
					<span className="skeleton-shimmer block h-[59px] rounded-full" />
				</div>
			</div>
			<span className="skeleton-shimmer block h-[200px] rounded-[20px]" />
		</div>
	);
}
