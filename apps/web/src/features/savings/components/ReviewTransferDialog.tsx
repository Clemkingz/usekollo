"use client";

import { ArrowRight, WalletCards } from "lucide-react";
import type { ActivityKind } from "@repo/domain/types";
import { Button } from "@repo/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@repo/ui/dialog";
import { NETWORK_FEE_XLM, shortKey } from "@/lib/stellar/config";

/**
 * Review Deposit / Review Withdrawal (designs): the amount, the goal, the wallet it comes from (deposit) or goes to
 * (withdrawal), and the fee. Confirm opens the wallet to sign.
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
}: {
	kind: ActivityKind;
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	pending: boolean;
	amount: string;
	code: string;
	goalName: string;
	address: string;
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
