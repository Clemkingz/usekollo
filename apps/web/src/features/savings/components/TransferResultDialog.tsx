"use client";

import Link from "next/link";
import { Check, CircleHelp, CircleX } from "lucide-react";
import type { ActivityKind } from "@repo/domain/types";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@repo/ui/dialog";
import { errorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { explorer, shortKey } from "@/lib/stellar/config";
import type { SubmitResult } from "@/features/savings/stellar-tx";
import { OutcomeUnknownError, PendingDecisionError } from "@/features/savings/stellar-tx";
import { WalletDeclinedError } from "@/features/savings/hooks";

export type TransferOutcome = SubmitResult | { status: "error"; error: unknown } | null;

const shortHash = (hash: string) => shortKey(hash, 6, 4).replace("…", "...");

/** The red mono label on the failed design ("SIGNATURE REJECTED") for each way a transfer can fail. */
function failureCode(outcome: TransferOutcome) {
	if (outcome?.status === "failed") return "Network rejected";
	if (outcome?.status !== "error") return "Not sent";
	if (outcome.error instanceof WalletDeclinedError) return "Signature rejected";
	if (outcome.error instanceof PendingDecisionError) return "Not available yet";
	return "Not sent";
}

/**
 * After Confirm (designs: Transfer Complete, Withdrawal Complete, Withdrawal Failed; the deposit failure and the
 * unknown outcome reuse them). Complete → "View Goal Progress". Failed (wallet declined, network rejected, not sent)
 * → reason code, the sentence, the attempted action, "Retry …" / "Back to Dashboard". Unknown (the answer was lost)
 * → check the explorer first; never retried automatically.
 */
export function TransferResultDialog({
	kind,
	outcome,
	amount,
	code,
	goalName,
	goalHref,
	onRetry,
	onClose,
}: {
	kind: ActivityKind;
	outcome: TransferOutcome;
	amount: string;
	code: string;
	goalName: string;
	goalHref: string;
	onRetry: () => void;
	onClose: () => void;
}) {
	const deposit = kind === "deposit";
	const state =
		outcome?.status === "confirmed"
			? "done"
			: outcome?.status === "error" && outcome.error instanceof OutcomeUnknownError
				? "unknown"
				: "failed";
	const hash =
		outcome?.status === "confirmed" || outcome?.status === "failed"
			? outcome.hash
			: outcome?.status === "error" && outcome.error instanceof OutcomeUnknownError
				? outcome.error.hash
				: null;
	const reason = outcome?.status === "failed" ? outcome.reason : outcome?.status === "error" ? errorMessage(outcome.error) : "";
	const attempted = deposit ? `Add ${amount} ${code} to ${goalName}` : `Withdraw ${amount} ${code} from ${goalName}`;

	const copy = {
		done: deposit
			? { title: "Transfer Complete", text: "Funds have been successfully allocated to your goal." }
			: { title: "Withdrawal Complete", text: "Funds have been successfully withdrawn to your wallet." },
		failed: {
			title: deposit ? "Transfer Failed" : "Withdrawal Failed",
			text: "The wallet declined the signing request, or the transaction could not be processed.",
		},
		unknown: {
			title: "Status Unknown",
			text: "We couldn’t confirm the result. Check the transaction on the explorer before trying again.",
		},
	}[state];

	return (
		<Dialog open={outcome !== null} onOpenChange={(o) => !o && onClose()}>
			<DialogContent
				showCloseButton={false}
				overlayClassName="bg-black/35 backdrop-blur-[6px]"
				className="gap-0 rounded-[28px] px-5 pt-12 pb-5 text-center sm:max-w-[520px] sm:pt-14"
			>
				<span
					className={cn(
						"mx-auto flex size-[130px] items-center justify-center rounded-full",
						state === "done" ? "bg-primary-50" : state === "failed" ? "bg-[#fdeeee]" : "bg-warning-100",
					)}
					aria-hidden
				>
					{state === "done" ? (
						<span className="flex size-[62px] items-center justify-center rounded-full bg-primary-700 text-white">
							<Check className="size-8" strokeWidth={3} />
						</span>
					) : state === "failed" ? (
						<CircleX className="size-[60px] text-[#f04242]" strokeWidth={1.5} />
					) : (
						<CircleHelp className="size-[60px] text-warning-800" strokeWidth={1.5} />
					)}
				</span>

				<DialogTitle className="mt-10 font-display text-[28px] font-normal text-ink md:text-[30px]">{copy.title}</DialogTitle>
				<DialogDescription className="mx-auto mt-2 max-w-[310px] text-base leading-snug text-ink/40">
					{copy.text}
				</DialogDescription>

				{state === "done" ? (
					<dl className="mt-12 divide-y divide-line text-left text-sm text-ink uppercase md:text-base">
						<Row label={deposit ? "Amount added" : "Amount withdrawn"}>
							<span className={cn("tabular-nums", deposit && "text-primary-500")}>
								{amount} {code}
							</span>
						</Row>
						<Row label={deposit ? "Destination goal" : "Source goal"}>{goalName}</Row>
						{hash && (
							<Row label="Transaction ID">
								<HashLink hash={hash} className={deposit ? "text-primary-500" : "text-ink/80"} />
							</Row>
						)}
					</dl>
				) : (
					<div className="mt-12 px-1 text-left md:px-3">
						{state === "failed" && (
							<p className="font-mono text-sm tracking-wide text-[#f04242] uppercase md:text-base">{failureCode(outcome)}</p>
						)}
						<p className="mt-3 text-base leading-snug text-ink md:text-lg">{reason}</p>
						<dl className="mt-5 grid gap-2 border-t border-line pt-4 text-xs md:text-sm">
							<div className="flex gap-4">
								<dt className="shrink-0 text-ink/60 uppercase">Attempted action:</dt>
								<dd className="min-w-0 text-ink">{attempted}</dd>
							</div>
							{hash && (
								<div className="flex gap-4">
									<dt className="shrink-0 text-ink/60 uppercase">Transaction:</dt>
									<dd>
										<HashLink hash={hash} className="text-primary-500" />
									</dd>
								</div>
							)}
						</dl>
					</div>
				)}

				<div className="mt-12 flex flex-col gap-3">
					{state === "done" ? (
						<Button asChild variant={deposit ? "default" : "outline"} className="h-[59px] text-lg">
							<Link href={goalHref}>View Goal Progress</Link>
						</Button>
					) : state === "failed" ? (
						<>
							<Button className="h-[59px] text-lg" onClick={onRetry}>
								{deposit ? "Retry Deposit" : "Retry Withdrawal"}
							</Button>
							<Button asChild variant="outline" className="h-[59px] text-lg">
								<Link href={routes.dashboard}>Back to Dashboard</Link>
							</Button>
						</>
					) : (
						<>
							{hash && (
								<Button asChild className="h-[59px] text-lg">
									<a href={explorer.tx(hash)} target="_blank" rel="noreferrer">
										Check on Explorer
									</a>
								</Button>
							)}
							<Button asChild variant="outline" className="h-[59px] text-lg">
								<Link href={goalHref}>Back to Goal</Link>
							</Button>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

function HashLink({ hash, className }: { hash: string; className?: string }) {
	return (
		<a
			href={explorer.tx(hash)}
			target="_blank"
			rel="noreferrer"
			className={cn("normal-case tabular-nums underline-offset-4 hover:underline", className)}
			title={`${hash} (opens the explorer)`}
		>
			{shortHash(hash)}
		</a>
	);
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-4 px-4 py-5 md:px-6">
			<dt>{label}</dt>
			<dd className="truncate text-right">{children}</dd>
		</div>
	);
}
