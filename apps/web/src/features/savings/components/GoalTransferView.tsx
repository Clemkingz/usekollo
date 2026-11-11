"use client";

import { useState } from "react";
import Link from "next/link";
import { Landmark, Target } from "lucide-react";
import type { ActivityKind, GoalStatus } from "@repo/domain/types";
import { compare, formatAmount, formatFixed, fromStroops, isValidAmount, sum, toStroops } from "@repo/domain/money";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { routes } from "@/lib/routes";
import { assetById, NETWORK_FEE_XLM } from "@/lib/stellar/config";
import { useBalances } from "@/lib/stellar/horizon";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/States";
import { useConnectedWallet } from "@/features/wallet/hooks";
import { useGoal } from "@/features/goals/hooks";
import { useGoalTransaction } from "@/features/savings/hooks";
import { ReviewTransferDialog } from "@/features/savings/components/ReviewTransferDialog";
import { TransferResultDialog } from "@/features/savings/components/TransferResultDialog";
import { SubmittingDialog } from "@/features/savings/components/SubmittingDialog";

/** Goal card pill (design: "ONGOING"). */
const STATUS_PILL: Record<GoalStatus, string> = { active: "Ongoing", completed: "Completed", overdue: "Past due" };

/** Lumens kept back by "Max": the account's minimum balance and fees must stay in the wallet. */
const XLM_KEEP = "2";

const COPY = {
	deposit: { crumb: "Add Savings", label: "Amount to add", review: "Review Transaction" },
	withdrawal: { crumb: "Withdraw", label: "Amount to withdraw", review: "Review Withdrawal" },
} as const;

/**
 * Add Savings (PRD flow 3) and Withdraw (PRD flow 4); same design for both. Enter an amount (quick +50/+100/+200
 * or Max) → Review → Confirm (the wallet signs) → Submitting → complete / failed / unknown. Deposits are limited by
 * the wallet's balance, withdrawals by what the goal holds. Nothing moves until the wallet approves.
 */
export function GoalTransferView({ id, kind }: { id: string; kind: ActivityKind }) {
	const { address } = useConnectedWallet();
	const goal = useGoal(id, address);
	const balances = useBalances(address);
	const tx = useGoalTransaction(kind);
	const copy = COPY[kind];
	const deposit = kind === "deposit";
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [reviewing, setReviewing] = useState(false);
	const [submitting, setSubmitting] = useState(false);

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

	const code = assetById(goal.assetId)?.code ?? goal.assetId;
	const usd = code === "USDC";
	const held = balances.data?.balances[goal.assetId] ?? null;
	// Deposits: the wallet's balance (XLM keeps its reserve). Withdrawals: what the goal holds.
	const available = !deposit
		? goal.savedAmount
		: held === null
			? null
			: goal.assetId === "XLM"
				? clampZero(held, XLM_KEEP)
				: held;
	const valid = isValidAmount(amount);
	const shown = valid ? formatFixed(amount) : "0.00";
	const total =
		deposit && goal.assetId === "XLM" && valid ? `${formatFixed(sum([amount, NETWORK_FEE_XLM]), 5)} XLM` : `~${shown} ${code}`;

	function bump(by: string) {
		setError(null);
		setAmount(plain(fromStroops(toStroops(isValidAmount(amount) ? amount : "0") + toStroops(by))));
	}

	function review() {
		if (!isValidAmount(amount)) return setError("Enter an amount above 0, with at most 7 decimal places.");
		if (deposit && balances.data && !balances.data.exists)
			return setError("This wallet isn’t active on Testnet yet. Fund it with test XLM first.");
		if (available !== null && compare(amount, available) > 0)
			return setError(
				deposit
					? `You have ${formatAmount(available)} ${code} available.`
					: `This goal holds ${formatAmount(available)} ${code}.`,
			);
		setError(null);
		tx.reset();
		setReviewing(true);
	}

	function confirm() {
		tx.mutate(
			{
				goal: goal!,
				amount: amount.trim(),
				onSigned: () => {
					setReviewing(false);
					setSubmitting(true);
				},
			},
			{
				onSettled: () => {
					setReviewing(false);
					setSubmitting(false);
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
					{/* Goal card */}
					<section aria-label="Goal" className="rounded-[20px] bg-primary-500 p-6 text-white md:rounded-[24px] md:p-7">
						<div className="flex items-start justify-between gap-4">
							<h1 className="truncate text-xl md:text-2xl">{goal.name}</h1>
							<span className="inline-flex h-6 shrink-0 items-center rounded-full bg-white px-2.5 text-[11px] text-primary-700 uppercase">
								{STATUS_PILL[goal.status]}
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
							<span className="tabular-nums">{Math.min(goal.progress, 999)}%</span>
						</div>
						<div
							className="mt-3 h-3 overflow-hidden rounded-full bg-primary-50"
							role="progressbar"
							aria-label="Goal progress"
							aria-valuemin={0}
							aria-valuemax={100}
							aria-valuenow={Math.min(goal.progress, 100)}
						>
							<div
								className="h-full rounded-full bg-primary-200 transition-[width] duration-700"
								style={{ width: `${Math.min(goal.progress, 100)}%` }}
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

					{/* Summary */}
					<section aria-label="Summary" className="rounded-[20px] bg-white px-5 py-5 text-ink">
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
					className="flex flex-col"
				>
					<label htmlFor="transfer-amount" className="text-sm text-ink uppercase">
						{copy.label} ({code})
					</label>
					<div
						className={cn(
							"mt-4 flex items-center gap-4 rounded-[18px] border border-transparent bg-white px-4 py-6 focus-within:border-primary-500",
							error && "border-error-400",
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
						<p id="transfer-error" role="alert" className="mt-2 px-2 text-sm text-error-400">
							{error}
						</p>
					)}

					<div className="mt-3 grid grid-cols-4 gap-2">
						{["50", "100", "200"].map((n) => (
							<button
								key={n}
								type="button"
								onClick={() => bump(n)}
								className="h-[30px] rounded-full bg-white text-sm text-ink transition-colors hover:bg-primary-50"
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
							className="h-[30px] rounded-full bg-white text-sm text-ink transition-colors hover:bg-primary-50 disabled:text-ink/30"
							title={
								deposit && goal.assetId === "XLM"
									? `Keeps ${XLM_KEEP} XLM for your account’s minimum balance and fees`
									: undefined
							}
						>
							Max
						</button>
					</div>

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
								{deposit && balances.isPending ? "…" : `${formatFixed((deposit ? held : goal.savedAmount) ?? "0")} ${code}`}
							</p>
						</div>
					</div>

					<Button type="submit" className="mt-5 h-[59px] text-lg">
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
				amount={formatFixed(amount || "0")}
				code={code}
				goalName={goal.name}
				address={address ?? ""}
			/>

			<SubmittingDialog kind={kind} open={submitting} amount={formatFixed(amount || "0")} code={code} goalName={goal.name} />

			<TransferResultDialog
				kind={kind}
				outcome={outcome}
				amount={formatAmount(amount || "0")}
				code={code}
				goalName={goal.name}
				goalHref={routes.goal(goal.id)}
				onRetry={() => {
					tx.reset();
					setReviewing(true);
				}}
				onClose={() => tx.reset()}
			/>
		</div>
	);
}

/** "150.0000000" → "150.00", "0.1250000" → "0.125": what a person would type. */
function plain(value: string) {
	const [whole, frac = ""] = fromStroops(toStroops(value)).split(".");
	return `${whole}.${frac.replace(/0+$/, "").padEnd(2, "0")}`;
}

/** `a − b`, never below zero. */
function clampZero(a: string, b: string) {
	const d = toStroops(a) - toStroops(b);
	return fromStroops(d > 0n ? d : 0n);
}
