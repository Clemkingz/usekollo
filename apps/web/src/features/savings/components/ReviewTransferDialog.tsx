"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Timer, WalletCards } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@repo/ui/dialog";
import { NETWORK_FEE_XLM, shortKey } from "@/lib/stellar/config";
import type { TransferKind } from "@/features/savings/components/TransferResultDialog";

/**
 * Review Deposit / Review Withdrawal (designs): the amount, the goal, the wallet it comes from (deposit) or goes to
 * (withdrawal), and the fee, plus UseKollo's plain summary of the prepared transaction and how long it stays valid.
 * Confirm opens the wallet to sign.
 */
export function ReviewTransferDialog({
	kind,
	open,
	onClose,
	onConfirm,
	pending,
	amount,
	code,
	goalName,
	address,
	summary,
	expiresAt,
}: {
	kind: TransferKind;
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	pending: boolean;
	amount: string;
	code: string;
	goalName: string;
	address: string;
	summary?: string;
	expiresAt?: string;
}) {
	const deposit = kind === "deposit";
	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent
				showCloseButton={false}
				overlayClassName="bg-black/35 backdrop-blur-[6px]"
				onInteractOutside={(e) => pending && e.preventDefault()}
				onEscapeKeyDown={(e) => pending && e.preventDefault()}
				className="gap-0 rounded-[28px] p-6 sm:max-w-[480px] sm:p-7"
			>
				<DialogTitle className="font-display text-[28px] font-normal text-ink md:text-[30px]">
					{deposit ? "Review Deposit" : "Review Withdrawal"}
				</DialogTitle>

				<div className="mt-8 border-b border-line pb-7">
					<p className="font-display text-2xl text-ink tabular-nums md:text-[26px]">
						{deposit ? "Adding" : "Withdrawing"} {amount} {code}
					</p>
					{deposit ? (
						<DialogDescription className="mt-1 flex items-center gap-2 text-base text-ink">
							<ArrowRight className="size-4" aria-hidden />
							<span className="sr-only">to</span> {goalName}
						</DialogDescription>
					) : (
						<DialogDescription className="mt-1 text-base text-ink/40">From {goalName}</DialogDescription>
					)}
				</div>

				<p className="mt-7 text-sm text-ink/40 uppercase">{deposit ? "Source wallet" : "Destination wallet"}</p>
				<div className="mt-3 flex h-[60px] items-center gap-4 rounded-full bg-[#f2f2f2] px-6 text-base text-ink">
					<WalletCards className="size-5" aria-hidden />
					<span className="text-[15px]" title={address}>
						{shortKey(address, 4, 4).replace("…", "...")}
					</span>
				</div>

				<div className="mt-5 flex justify-between gap-4 text-base">
					<span className="text-ink/40 uppercase">Network fee</span>
					<span className="text-ink tabular-nums">{NETWORK_FEE_XLM} XLM</span>
				</div>
				{summary && <p className="mt-4 rounded-2xl bg-page px-4 py-3 text-sm leading-6 text-ink/70">{summary}</p>}
				{open && expiresAt && <ExpiresIn iso={expiresAt} />}

				<Button className="mt-10 h-[59px] text-lg" onClick={onConfirm} isLoading={pending} loadingLabel="Waiting for your wallet">
					{deposit ? "Confirm Transaction" : "Confirm Withdrawal"}
				</Button>
				<Button
					variant="outline"
					className="mt-3 h-[59px] text-lg text-error-400 hover:text-error-400"
					onClick={onClose}
					disabled={pending}
				>
					Cancel
				</Button>
				{pending && (
					<p role="status" className="mt-4 text-center text-sm text-ink/60">
						Approve the transaction in your wallet. UseKollo never sees your keys.
					</p>
				)}
			</DialogContent>
		</Dialog>
	);
}

/** "Valid for 4:32": the prepared transaction must be signed before it expires; after that, review again. */
function ExpiresIn({ iso }: { iso: string }) {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);
	const left = Math.max(0, Math.round((new Date(iso).getTime() - now) / 1000));
	return (
		<p className="mt-3 flex items-center gap-2 text-xs text-ink/45" aria-live="off">
			<Timer className="size-3.5" aria-hidden />
			{left > 0 ? (
				<span className="tabular-nums">
					Valid for {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
				</span>
			) : (
				<span className="text-error-400">Expired. Close this and review again.</span>
			)}
		</p>
	);
}
