"use client";

import { useState } from "react";
import Link from "next/link";
import { Landmark, Lock, Plus, Target } from "lucide-react";
import type { Goal } from "@repo/domain/types";
import { GOAL_STATUS_LABEL } from "@repo/domain/labels";
import { compare, formatAmount, formatFixed, fromStroops, isValidAmount, sum, toStroops } from "@repo/domain/money";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { errorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { money } from "@/lib/money";
import type { PreparedTransactionDto } from "@/lib/api/types";
import { NETWORK_FEE_XLM } from "@/lib/stellar/config";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ErrorState } from "@/components/States";
import { useBalances, useConnectedWallet, useRequireWallet } from "@/features/wallet/hooks";
import { AssetReadiness, useAssetReadiness } from "@/features/wallet/components/AssetReadiness";
import { useGoal } from "@/features/goals/hooks";
import { goalsApi } from "@/features/goals/api";
import { GoalNotFound } from "@/features/goals/components/GoalDetailView";
import { useGoalTransaction } from "@/features/savings/hooks";
import { ReviewTransferDialog } from "@/features/savings/components/ReviewTransferDialog";
import { TransferResultDialog, type TransferKind } from "@/features/savings/components/TransferResultDialog";
import { SubmittingDialog } from "@/features/savings/components/SubmittingDialog";

const COPY = {
	deposit: { crumb: "Add Savings", label: "Amount to add", review: "Review Transaction" },
	withdrawal: { crumb: "Withdraw", label: "Amount to withdraw", review: "Review Withdrawal" },
} as const;

/**
 * Add Savings (PRD flow 3) and Withdraw (PRD flow 4); same design for both. Enter an amount (quick +50/+100/+200
 * or Max) → Review (UseKollo prepares the transaction and checks it) → Confirm (the wallet signs) → Submitting →
 * complete / failed / still processing. Deposits are limited by what the wallet can spend, withdrawals by what the
 * goal holds, and withdrawals unlock only once the goal reaches its target (API rule).
 */
export function GoalTransferView({ id, kind }: { id: string; kind: TransferKind }) {
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
	if (isPending || !goal) return <TransferSkeleton />;
	if (goal.status === "pending" || goal.status === "closed") return <Unavailable goal={goal} />;
	if (kind === "withdrawal" && !goal.canWithdraw) return <WithdrawLocked goal={goal} />;
	return <TransferForm goal={goal} kind={kind} />;
}

function TransferForm({ goal, kind }: { goal: Goal; kind: TransferKind }) {
	const { address } = useConnectedWallet();
	const balances = useBalances();
	const readiness = useAssetReadiness(goal.assetId);
	const requireWallet = useRequireWallet();
	const tx = useGoalTransaction();
	const copy = COPY[kind];
	const deposit = kind === "deposit";
	const code = goal.assetCode;
	const usd = code === "USDC";
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [preparing, setPreparing] = useState(false);
	const [prepared, setPrepared] = useState<PreparedTransactionDto | null>(null);
	const [reviewing, setReviewing] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	// Deposits: what the wallet can spend now (XLM keeps its minimum balance and fees). Withdrawals: what the goal holds.
	const available = deposit ? balances.spendable(goal.assetId) : goal.savedAmount;
	const held = deposit ? balances.balance(goal.assetId) : goal.savedAmount;
	const valid = isValidAmount(amount);
	const shown = valid ? formatFixed(amount) : "0.00";
	const total =
		deposit && goal.assetId === "XLM" && valid ? `${formatFixed(sum([amount, NETWORK_FEE_XLM]), 5)} XLM` : `~${shown} ${code}`;
	const blocked = deposit && readiness.state !== "ready" && readiness.state !== "loading";

	function bump(by: string) {
		setError(null);
		setAmount(plain(fromStroops(toStroops(isValidAmount(amount) ? amount : "0") + toStroops(by))));
	}

	async function prepare() {
		const value = amount.trim();
		setPreparing(true);
		setError(null);
		try {
			const next = deposit ? await goalsApi.deposit(goal.id, value) : await goalsApi.withdraw(goal.id, value);
			tx.reset();
			setPrepared(next);
			setReviewing(true);
		} catch (e) {
			setError(errorMessage(e));
		} finally {
			setPreparing(false);
		}
	}

	function review() {
		if (!isValidAmount(amount)) return setError("Enter an amount above 0, with at most 7 decimal places.");
		if (available !== null && compare(amount, available) > 0)
			return setError(
				deposit
					? `You can add up to ${formatAmount(available)} ${code} from your wallet.`
					: `This goal holds ${formatAmount(available)} ${code}.`,
			);
		requireWallet(() => void prepare(), "Reconnect your wallet to approve this.");
	}

	function confirm() {
		if (!prepared) return;
		tx.mutate(
			{
				goalId: goal.id,
				prepared,
				onSigned: () => {
					setReviewing(false);
					setSubmitting(true);
				},
			},
			{
				onSuccess: (outcome) => {
					if (outcome.status === "confirmed") setAmount("");
				},
				onSettled: () => {
					setReviewing(false);
					setSubmitting(false);
					setPrepared(null);
				},
			},
		);
	}

	const outcome = tx.isSuccess ? tx.data : tx.isError ? { status: "error" as const, error: tx.error } : null;

	return (
		<div className="flex flex-col gap-6 md:gap-8">
			<Breadcrumb current={copy.crumb} back={routes.goal(goal.id)} backLabel="Home" />

			<div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,445px)] lg:gap-6">
				<div className="flex flex-col gap-5">
					<GoalCard goal={goal} />

					{/* Summary */}
					<section
						aria-label="Summary"
						className="animate-rise rounded-[20px] bg-white px-5 py-5 text-ink"
						style={{ "--i": 1 } as React.CSSProperties}
					>
						<dl className="text-sm">
							<div className="flex justify-between gap-4">
								<dt className="uppercase">Amount</dt>
								<dd className="tabular-nums">
									{shown} {code}
								</dd>
							</div>
							<div className="mt-2 flex justify-between gap-4 border-b border-line pb-3 text-ink/70">
								<dt className="uppercase">Network fee</dt>
								<dd className="tabular-nums">{NETWORK_FEE_XLM} XLM</dd>
							</div>
							<div className="mt-3 flex justify-between gap-4 text-lg">
								<dt className="uppercase">Total</dt>
								<dd className="tabular-nums">{total}</dd>
							</div>
						</dl>
					</section>
				</div>

				{/* Amount form */}
				<form
					noValidate
					onSubmit={(e) => {
						e.preventDefault();
						review();
					}}
					className="animate-rise flex flex-col"
					style={{ "--i": 2 } as React.CSSProperties}
				>
					<label htmlFor="transfer-amount" className="text-sm text-ink uppercase">
						{copy.label} ({code})
					</label>
					<div
						className={cn(
							"mt-4 flex items-center gap-4 rounded-[18px] border border-transparent bg-white px-4 py-6 transition-colors focus-within:border-primary-500",
							error && "animate-shake border-error-400",
						)}
					>
						<span className="text-xl text-ink/40">{code}</span>
						<input
							id="transfer-amount"
							inputMode="decimal"
							autoComplete="off"
							placeholder="0.00"
							value={amount}
							onChange={(e) => {
								setAmount(e.target.value.replace(/[^\d.]/g, ""));
								setError(null);
							}}
							aria-invalid={error ? true : undefined}
							aria-describedby={error ? "transfer-error" : undefined}
							className="w-full min-w-0 flex-1 bg-transparent font-display text-[40px] leading-none text-ink tabular-nums placeholder:text-ink/25 focus:outline-none md:text-[46px]"
						/>
					</div>
					{error && (
						<p id="transfer-error" role="alert" className="animate-pop mt-2 px-2 text-sm text-error-400">
							{error}
						</p>
					)}

					<div className="mt-3 grid grid-cols-4 gap-2">
						{["50", "100", "200"].map((n) => (
							<button
								key={n}
								type="button"
								onClick={() => bump(n)}
								className="h-[30px] rounded-full bg-white text-sm text-ink transition-[background-color,transform] hover:bg-primary-50 active:scale-95"
							>
								{usd ? `+$${n}` : `+${n}`}
							</button>
						))}
						<button
							type="button"
							disabled={!available || toStroops(available) === 0n}
							onClick={() => {
								setError(null);
								setAmount(plain(available!));
							}}
							className="h-[30px] rounded-full bg-white text-sm text-ink transition-[background-color,transform] hover:bg-primary-50 active:scale-95 disabled:text-ink/30"
							title={
								deposit && goal.assetId === "XLM" ? "Keeps enough XLM for your wallet’s minimum balance and fees" : undefined
							}
						>
							Max
						</button>
					</div>

					{deposit && <AssetReadiness assetId={goal.assetId} className="mt-5" />}

					<div className="mt-5 flex items-center gap-4 rounded-[18px] bg-white p-4">
						<span className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
							{deposit ? <Landmark className="size-6" aria-hidden /> : <Target className="size-6" aria-hidden />}
						</span>
						<div className="min-w-0 flex-1">
							<p className="text-[11px] text-ink/70 uppercase">{deposit ? "From wallet" : "From goal"}</p>
							<p className="truncate text-lg text-ink">{deposit ? "Stellar Account" : goal.name}</p>
						</div>
						<div className="text-right">
							<p className="text-[11px] text-ink/70 uppercase">Available</p>
							<p className="text-lg text-ink tabular-nums">
								{deposit && balances.isPending ? (
									<span className="skeleton-shimmer inline-block h-5 w-20 rounded-full align-middle" />
								) : (
									`${formatFixed((deposit ? available : held) ?? "0")} ${code}`
								)}
							</p>
						</div>
					</div>

					<Button
						type="submit"
						className="mt-5 h-[59px] text-lg"
						disabled={blocked}
						isLoading={preparing}
						loadingLabel="Preparing"
					>
						{copy.review}
					</Button>
					<Button asChild variant="outline" className="mt-3 h-[59px] text-lg text-error-400 hover:text-error-400">
						<Link href={routes.goal(goal.id)}>Cancel</Link>
					</Button>
				</form>
			</div>

			<ReviewTransferDialog
				kind={kind}
				open={reviewing}
				onClose={() => !tx.isPending && setReviewing(false)}
				onConfirm={confirm}
				pending={tx.isPending}
				amount={formatFixed(prepared?.amount ?? amount ?? "0")}
				code={code}
				goalName={goal.name}
				address={address ?? ""}
				summary={prepared?.summary}
				expiresAt={prepared?.expiresAt}
			/>

			<SubmittingDialog
				kind={kind}
				open={submitting}
				amount={formatFixed(prepared?.amount || amount || "0")}
				code={code}
				goalName={goal.name}
			/>

			<TransferResultDialog
				kind={kind}
				outcome={outcome}
				amount={formatAmount(tx.variables?.prepared.amount ?? (amount || "0"))}
				code={code}
				goalName={goal.name}
				goalHref={routes.goal(goal.id)}
				onRetry={() => {
					tx.reset();
					review();
				}}
				onClose={() => tx.reset()}
			/>
		</div>
	);
}

/** Goal card (design): name, status pill, saved amount, progress bar. */
function GoalCard({ goal }: { goal: Goal }) {
	const code = goal.assetCode;
	return (
		<section aria-label="Goal" className="animate-rise rounded-[20px] bg-primary-500 p-6 text-white md:rounded-[24px] md:p-7">
			<div className="flex items-start justify-between gap-4">
				<h1 className="truncate text-xl md:text-2xl">{goal.name}</h1>
				<span className="inline-flex h-6 shrink-0 items-center rounded-full bg-white px-2.5 text-[11px] text-primary-700 uppercase">
					{GOAL_STATUS_LABEL[goal.status]}
				</span>
			</div>
			<p className="mt-6 flex flex-wrap items-baseline gap-x-3 md:mt-8">
				<span className="font-display text-[44px] leading-none font-light tracking-[-0.02em] tabular-nums md:text-[56px]">
					{formatFixed(goal.savedAmount)}
				</span>
				<span className="text-base md:text-lg">{code}</span>
			</p>
			<div className="mt-8 flex justify-between text-sm md:mt-10">
				<span>Progress</span>
				<span className="tabular-nums">{goal.progress}%</span>
			</div>
			<div
				className="mt-3 h-3 overflow-hidden rounded-full bg-primary-50"
				role="progressbar"
				aria-label="Goal progress"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={goal.progress}
			>
				<div
					className="animate-grow h-full rounded-full bg-primary-200 transition-[width] duration-700"
					style={{ width: `${goal.progress}%` }}
				/>
			</div>
			<div className="mt-3 flex justify-between text-sm tabular-nums">
				<span>
					{formatAmount(goal.savedAmount)} {code}
				</span>
				<span>
					{formatAmount(goal.targetAmount)} {code}
				</span>
			</div>
		</section>
	);
}

/** Withdraw before the target is reached (API: 403). Explains the rule and offers the way forward. */
function WithdrawLocked({ goal }: { goal: Goal }) {
	return (
		<div className="flex flex-col gap-6 md:gap-8">
			<Breadcrumb current="Withdraw" back={routes.goal(goal.id)} backLabel="Home" />
			<div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,445px)] lg:gap-6">
				<GoalCard goal={goal} />
				<section
					className="animate-rise flex flex-col items-center rounded-[20px] bg-white px-6 py-10 text-center"
					style={{ "--i": 1 } as React.CSSProperties}
				>
					<span className="animate-pop flex size-[72px] items-center justify-center rounded-full bg-primary-50 text-primary-500">
						<Lock className="size-7" aria-hidden />
					</span>
					<h2 className="mt-6 text-xl text-ink">Withdrawals unlock at your target</h2>
					<p className="mt-2 max-w-[340px] text-sm leading-6 text-ink/60">
						You’ve saved {money(goal.savedAmount, goal.assetCode)} of {money(goal.targetAmount, goal.assetCode)}. Once this goal
						reaches its target, you can withdraw everything in it, any time.
					</p>
					<Button asChild className="mt-7 h-[56px] text-lg">
						<Link href={routes.addSavings(goal.id)}>
							<Plus className="size-5" /> Add Savings
						</Link>
					</Button>
					<Button asChild variant="outline" className="mt-3 h-[56px] text-lg">
						<Link href={routes.goal(goal.id)}>Back to goal</Link>
					</Button>
				</section>
			</div>
		</div>
	);
}

/** A goal that isn't open (waiting to open, or closed) can't take savings or withdrawals. */
function Unavailable({ goal }: { goal: Goal }) {
	const pending = goal.status === "pending";
	return (
		<ErrorState
			className="bg-white"
			title={pending ? "This goal isn’t open yet" : "This goal is closed"}
			message={
				pending ? "Open it from the goal page first; your wallet approves it." : "Everything it held is back in your wallet."
			}
			action={
				<Button asChild size="md">
					<Link href={routes.goal(goal.id)}>Go to goal</Link>
				</Button>
			}
		/>
	);
}

function TransferSkeleton() {
	return (
		<div role="status" aria-label="Loading" className="flex flex-col gap-6 md:gap-8">
			<span className="skeleton-shimmer block h-5 w-56 rounded-full" />
			<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,445px)] lg:gap-6">
				<span className="block h-[260px] rounded-[24px] bg-primary-500/85" />
				<div className="space-y-4">
					<span className="skeleton-shimmer block h-[100px] rounded-[18px]" />
					<span className="skeleton-shimmer block h-[30px] rounded-full" />
					<span className="skeleton-shimmer block h-[84px] rounded-[18px]" />
					<span className="skeleton-shimmer block h-[59px] rounded-full" />
				</div>
			</div>
		</div>
	);
}

/** "150.0000000" → "150.00", "0.1250000" → "0.125": what a person would type. */
function plain(value: string) {
	const [whole, frac = ""] = fromStroops(toStroops(value)).split(".");
	return `${whole}.${frac.replace(/0+$/, "").padEnd(2, "0")}`;
}
