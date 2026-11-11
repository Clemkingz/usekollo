"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@repo/ui/dialog";
import { errorMessage } from "@/lib/errors";
import type { PreparedTransactionDto } from "@/lib/api/types";
import { notify } from "@/lib/use-toast";
import { signAndSubmit, WalletDeclinedError, type TxOutcome } from "@/features/savings/hooks";
import { TxSteps, type TxStage } from "@/features/savings/components/TxSteps";

/**
 * Confirm-then-run dialog for one-step goal transactions (open a goal, close a goal): explains what will happen,
 * then walks the three steps in place. Can't be dismissed while the wallet or the network is working.
 */
export function GoalActionDialog({
	open,
	onOpenChange,
	goalId,
	title,
	description,
	confirmLabel,
	destructive = false,
	prepare,
	success,
	onDone,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	goalId: string;
	title: string;
	description: React.ReactNode;
	confirmLabel: string;
	destructive?: boolean;
	prepare: () => Promise<PreparedTransactionDto>;
	/** Toast once confirmed. */
	success: { title: string; description?: string };
	onDone?: (outcome: TxOutcome) => void;
}) {
	const [stage, setStage] = useState<TxStage | null>(null);
	const [failedAt, setFailedAt] = useState<TxStage | undefined>();
	const [error, setError] = useState<string | null>(null);
	const busy = stage === "prepare" || stage === "approve" || stage === "confirm";

	function reset() {
		setStage(null);
		setFailedAt(undefined);
		setError(null);
	}

	async function run() {
		setError(null);
		setStage("prepare");
		let step: TxStage = "prepare";
		try {
			const prepared = await prepare();
			step = "approve";
			setStage("approve");
			const outcome = await signAndSubmit(goalId, prepared, () => {
				step = "confirm";
				setStage("confirm");
			});
			if (outcome.status === "failed") {
				setFailedAt("confirm");
				setStage("failed");
				setError(outcome.reason);
				return;
			}
			setStage("done");
			if (outcome.status === "pending")
				notify.info("Still confirming", "The network is taking a moment. Your goal updates on its own.");
			else notify.success(success.title, success.description);
			onDone?.(outcome);
			onOpenChange(false);
			reset();
		} catch (e) {
			setFailedAt(step);
			setStage("failed");
			setError(e instanceof WalletDeclinedError ? "You declined in your wallet. Nothing was sent." : errorMessage(e));
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (busy) return;
				onOpenChange(o);
				if (!o) reset();
			}}
		>
			<DialogContent
				showCloseButton={!busy}
				overlayClassName="bg-black/35 backdrop-blur-[6px]"
				onInteractOutside={(e) => busy && e.preventDefault()}
				onEscapeKeyDown={(e) => busy && e.preventDefault()}
				className="gap-0 rounded-[28px] p-6 sm:max-w-[480px] sm:p-7"
			>
				<DialogTitle className="font-display text-[26px] font-normal text-ink md:text-[28px]">{title}</DialogTitle>
				<DialogDescription asChild>
					<div className="mt-3 text-[15px] leading-6 text-ink/65">{description}</div>
				</DialogDescription>

				{stage && <TxSteps stage={stage} failedAt={failedAt} className="animate-rise mt-7 rounded-[18px] bg-page p-5" />}
				{error && (
					<p role="alert" className="animate-pop mt-4 rounded-2xl bg-error-50 px-4 py-3 text-sm text-error-500">
						{error}
					</p>
				)}

				<Button
					className="mt-8 h-[56px] text-lg"
					variant={destructive ? "destructive" : "default"}
					onClick={run}
					isLoading={busy}
					loadingLabel={stage === "approve" ? "Waiting for your wallet" : "Working"}
				>
					{stage === "failed" ? "Try again" : confirmLabel}
				</Button>
				<Button
					variant="outline"
					className="mt-3 h-[56px] text-lg"
					disabled={busy}
					onClick={() => {
						onOpenChange(false);
						reset();
					}}
				>
					Cancel
				</Button>
			</DialogContent>
		</Dialog>
	);
}
