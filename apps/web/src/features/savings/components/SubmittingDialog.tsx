"use client";

import { Clock3 } from "lucide-react";
import type { ActivityKind } from "@repo/domain/types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@repo/ui/dialog";

/**
 * Submitting (design): shown after the wallet has signed, while Horizon answers. It can't be dismissed: closing it
 * wouldn't stop the transaction, and the result dialog follows on its own.
 */
export function SubmittingDialog({
	kind,
	open,
	amount,
	code,
	goalName,
}: {
	kind: ActivityKind;
	open: boolean;
	amount: string;
	code: string;
	goalName: string;
}) {
	const deposit = kind === "deposit";
	return (
		<Dialog open={open}>
			<DialogContent
				showCloseButton={false}
				overlayClassName="bg-black/35 backdrop-blur-[6px]"
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
				className="gap-0 rounded-[28px] px-5 pt-10 pb-8 text-center sm:max-w-[500px] sm:px-6"
			>
				<span className="mx-auto flex size-[122px] items-center justify-center rounded-full bg-[#f2f2f4]" aria-hidden>
					<Clock3 className="size-9 animate-pulse text-ink motion-reduce:animate-none" strokeWidth={2.25} />
				</span>
				<DialogTitle className="mt-8 font-display text-[26px] font-normal text-ink md:text-[28px]">
					Submitting to Stellar Testnet
				</DialogTitle>
				<DialogDescription className="mx-auto mt-2 max-w-[330px] font-display text-base leading-snug text-ink/40">
					Sending your signed transaction to the Stellar network. Please keep this open.
				</DialogDescription>

				<div className="mt-7 rounded-[18px] bg-page px-5 py-5 text-left" role="status" aria-live="polite">
					<p className="font-display text-sm text-ink/40">{deposit ? "Pending Deposit" : "Pending Withdrawal"}</p>
					<p className="mt-2 flex items-baseline gap-2 text-ink">
						<span className="font-display text-[44px] leading-none tracking-[-0.02em] tabular-nums md:text-[52px]">
							{deposit ? "+" : "−"}
							{amount}
						</span>
						<span className="text-base">{code}</span>
					</p>
					<p className="mt-3 truncate font-display text-base text-ink">
						{deposit ? "To" : "From"} {goalName}
					</p>
				</div>

				<p className="mt-16 flex items-center justify-center gap-2 text-[15px] text-ink">
					<Clock3 className="size-4 text-navy" aria-hidden /> This usually takes 5–10 seconds
				</p>
			</DialogContent>
		</Dialog>
	);
}
