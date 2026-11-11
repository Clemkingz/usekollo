import { X } from "lucide-react";
import BtnLoader from "@repo/ui/btn-loader";
import { cn } from "@repo/ui/lib/utils";

/** Where a wallet-signed transaction is: the API prepares it, the wallet approves it, the network confirms it. */
export type TxStage = "prepare" | "approve" | "confirm" | "done" | "failed";

const STEPS = [
	{ id: "prepare", label: "Preparing", hint: "UseKollo builds the transaction" },
	{ id: "approve", label: "Approve in your wallet", hint: "Only your wallet can sign" },
	{ id: "confirm", label: "Confirming on Stellar", hint: "Usually 5–10 seconds" },
] as const;

const ORDER = ["prepare", "approve", "confirm", "done"] as const;

/**
 * The three steps with a live marker: a dot-ring on the current one, a drawn tick on finished ones, a cross where it
 * stopped. `failedAt` marks the step that failed.
 */
export function TxSteps({ stage, failedAt, className }: { stage: TxStage; failedAt?: TxStage; className?: string }) {
	const current = stage === "failed" ? (failedAt ?? "prepare") : stage;
	const at = ORDER.indexOf(current as (typeof ORDER)[number]);
	return (
		<ol className={cn("flex flex-col gap-3 text-left", className)} aria-live="polite">
			{STEPS.map((step, i) => {
				const state = stage === "failed" && i === at ? "failed" : i < at ? "done" : i === at ? "active" : "todo";
				return (
					<li key={step.id} className="flex items-center gap-3.5">
						<span
							className={cn(
								"flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
								state === "done" && "bg-primary-500 text-white",
								state === "active" && "animate-signal bg-primary-50 text-primary-500",
								state === "failed" && "bg-[#fdeeee] text-[#f04242]",
								state === "todo" && "bg-[#f2f2f2] text-ink/30",
							)}
							aria-hidden
						>
							{state === "done" ? (
								<svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3}>
									<path d="M5 12.5l4.5 4.5L19 7.5" className="animate-check" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							) : state === "active" ? (
								<BtnLoader className="size-4" label={step.label} />
							) : state === "failed" ? (
								<X className="size-4" strokeWidth={3} />
							) : (
								<span className="text-xs tabular-nums">{i + 1}</span>
							)}
						</span>
						<span className="min-w-0">
							<span className={cn("block text-[15px]", state === "todo" ? "text-ink/40" : "text-ink")}>{step.label}</span>
							<span className="block text-xs text-ink/45">{step.hint}</span>
						</span>
					</li>
				);
			})}
		</ol>
	);
}
