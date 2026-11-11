"use client";

import Link from "next/link";
import { CircleX, Clock3 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@repo/ui/dialog";
import { ApiError, isNetworkError } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { explorer, shortKey } from "@/lib/stellar/config";
import { WalletNotConnectedError } from "@/features/wallet/connect";
import { WalletDeclinedError, type TxOutcome } from "@/features/savings/hooks";

export type TransferKind = "deposit" | "withdrawal";

export type TransferOutcome = TxOutcome | { status: "error"; error: unknown } | null;

const shortHash = (hash: string) => shortKey(hash, 6, 4).replace("…", "...");

/** The red mono label on the failed design ("SIGNATURE REJECTED") for each way a transfer can fail. */
function failureCode(outcome: TransferOutcome) {
	if (outcome?.status === "failed") return "Network rejected";
	if (outcome?.status !== "error") return "Not sent";
	const e = outcome.error;
	if (e instanceof WalletDeclinedError) return "Signature rejected";
	if (e instanceof WalletNotConnectedError) return "Wallet not connected";
	if (e instanceof ApiError && e.status === 409) return "Expired";
	if (isNetworkError(e)) return "Connection lost";
	return "Not sent";
}

/**
 * After Confirm (designs: Transfer Complete, Withdrawal Complete, Withdrawal Failed; the deposit failure and the
 * processing state reuse them). Complete → "View Goal Progress". Failed (wallet declined, network rejected, expired,
 * not sent) → reason code, the sentence, the attempted action, "Retry …" / "Back to Dashboard". Processing (the
 * network didn't answer in time) → UseKollo settles it in the background; never resent automatically.
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
	kind: TransferKind;
	outcome: TransferOutcome;
	amount: string;
	code: string;
	goalName: string;
	goalHref: string;
	onRetry: () => void;
	onClose: () => void;
}) {
	const deposit = kind === "deposit";
	const state = outcome?.status === "confirmed" ? "done" : outcome?.status === "pending" ? "processing" : "failed";
	const hash = outcome && outcome.status !== "error" ? outcome.hash : null;
	const reason = outcome?.status === "failed" ? outcome.reason : outcome?.status === "error" ? errorMessage(outcome.error) : "";
	const attempted = deposit ? `Add ${amount} ${code} to ${goalName}` : `Withdraw ${amount} ${code} from ${goalName}`;
	const reached = outcome?.status === "confirmed" && deposit && outcome.goal.targetReached;

	const copy = {
		done: deposit
			? {
					title: reached ? "Goal Reached!" : "Transfer Complete",
					text: reached
						? "You’ve hit your target. Withdrawals are now unlocked for this goal."
						: "Funds have been successfully allocated to your goal.",
				}
			: { title: "Withdrawal Complete", text: "Funds have been successfully withdrawn to your wallet." },
		failed: {
			title: deposit ? "Transfer Failed" : "Withdrawal Failed",
			text: "The wallet declined the signing request, or the transaction could not be processed. No funds were moved.",
		},
		processing: {
			title: "Still Processing",
			text: "The network is taking longer than usual. UseKollo keeps checking and updates your goal on its own. Don’t send it again.",
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
						"animate-pop mx-auto flex size-[130px] items-center justify-center rounded-full",
						state === "done" ? "bg-primary-50" : state === "failed" ? "bg-[#fdeeee]" : "bg-warning-100",
					)}
					aria-hidden
				>
					{state === "done" ? (
						<span className="flex size-[62px] items-center justify-center rounded-full bg-primary-700 text-white">
							<svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth={3}>
								<path d="M5 12.5l4.5 4.5L19 7.5" className="animate-check" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</span>
					) : state === "failed" ? (
						<CircleX className="size-[60px] text-[#f04242]" strokeWidth={1.5} />
					) : (
						<Clock3 className="size-[60px] text-warning-800 motion-safe:animate-pulse" strokeWidth={1.5} />
					)}
				</span>

				<DialogTitle className="mt-10 font-display text-[28px] font-normal text-ink md:text-[30px]">{copy.title}</DialogTitle>
				<DialogDescription className="mx-auto mt-2 max-w-[330px] text-base leading-snug text-ink/40">
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
						{reason && <p className="mt-3 text-base leading-snug text-ink md:text-lg">{reason}</p>}
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
								<Button asChild variant="outline" className="h-[59px] text-lg">
									<a href={explorer.tx(hash)} target="_blank" rel="noreferrer">
										Check on Explorer
									</a>
								</Button>
							)}
							<Button asChild className="h-[59px] text-lg">
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
