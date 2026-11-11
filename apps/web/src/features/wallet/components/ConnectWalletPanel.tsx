"use client";

import { useState } from "react";
import { ArrowRight, Check, ExternalLink, Fingerprint, QrCode, Sailboat, Wallet, type LucideIcon } from "lucide-react";
import BtnLoader from "@repo/ui/btn-loader";
import { cn } from "@repo/ui/lib/utils";
import { shortKey } from "@/lib/stellar/config";
import { notify } from "@/lib/use-toast";
import { connect } from "@/features/wallet/connect";
import { useIsPhone } from "@/features/wallet/device";
import {
	availableWallets,
	cancelWalletPairing,
	installLink,
	isWalletDismissal,
	openWalletApp,
	walletErrorMessage,
	WalletNotInstalledError,
	type WalletId,
} from "@/features/wallet/kit";

/**
 * The wallet picker (PRD screen 2; "Connect Wallet" modal design): one pill row per wallet with a blue icon on a
 * lavender circle and an arrow, then the "Non-Custodial Security" note. Shared by the dialog and /connect.
 * States: idle → connecting (row spinner, other rows locked) → connected (tick, toast, `onConnected`) | declined |
 * not installed (install link) | phone app didn't open (open again / install) | wrong network | other error.
 */

/** The design's three rows, in its order. xBull / LOBSTR stay supported by the kit (LOBSTR via WalletConnect). */
const SHOWN: WalletId[] = ["freighter", "albedo", "walletconnect"];

const ICONS: Record<WalletId, LucideIcon> = {
	freighter: Sailboat,
	albedo: Fingerprint,
	walletconnect: QrCode,
	xbull: Wallet,
	lobstr: Wallet,
};

type Problem =
	| { kind: "declined" }
	| { kind: "not_installed"; message: string; walletId: WalletId }
	| { kind: "app_missed"; walletId: WalletId }
	| { kind: "error"; message: string };

export function ConnectWalletPanel({ onConnected }: { onConnected: (address: string) => void }) {
	const phone = useIsPhone();
	const [busy, setBusy] = useState<WalletId | null>(null);
	const [done, setDone] = useState<WalletId | null>(null);
	const [problem, setProblem] = useState<Problem | null>(null);
	const [lastTried, setLastTried] = useState<WalletId | null>(null);

	const available = availableWallets(phone);
	const rows = SHOWN.flatMap((id) => available.filter((w) => w.id === id)).map((w) => ({ ...w, Icon: ICONS[w.id] }));

	async function start(id: WalletId) {
		setProblem(null);
		setBusy(id);
		setLastTried(id);
		try {
			const address = await connect(id, { onAppMissed: () => setProblem({ kind: "app_missed", walletId: id }) });
			setDone(id);
			notify.success("Wallet connected", `${shortKey(address)} · Stellar Testnet`);
			// Let the tick land before moving on.
			setTimeout(() => onConnected(address), 650);
		} catch (error) {
			setProblem(toProblem(error, id));
			setBusy(null);
		}
	}

	function cancel() {
		cancelWalletPairing();
		setBusy(null);
		setProblem(null);
	}

	return (
		<div className="flex min-w-0 flex-col">
			<div className="px-4 sm:px-6 sm:pt-4">
				{problem && <ProblemBanner problem={problem} phone={phone} onRetry={() => lastTried && start(lastTried)} />}

				<ul className="mt-2 flex flex-col gap-3" aria-label="Wallets">
					{rows.map(({ id, name, Icon }, i) => {
						const isBusy = busy === id;
						const isDone = done === id;
						return (
							<li key={id} className="animate-rise" style={{ "--i": i } as React.CSSProperties}>
								<button
									type="button"
									onClick={() => start(id)}
									disabled={!!busy || !!done}
									aria-busy={isBusy || undefined}
									className="group flex min-h-[66px] w-full min-w-0 items-center gap-4 rounded-full bg-[#f7f8fc] py-3 pr-5 pl-3 text-left sm:min-h-[88px] sm:gap-6 sm:pl-4 transition-colors hover:bg-primary-50 focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:outline-none disabled:cursor-default disabled:hover:bg-[#f7f8fc]"
								>
									<span
										className={cn(
											"flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-500 sm:size-[58px]",
											isBusy && "animate-signal",
										)}
									>
										<Icon className="size-5 sm:size-6" aria-hidden />
									</span>
									<span className="min-w-0 flex-1">
										<span className="block text-[15px] text-ink sm:text-lg">{name}</span>
										{isBusy && (
											<span aria-live="polite" className="block text-xs text-ink/55">
												Approve the connection in your wallet…
											</span>
										)}
									</span>
									{isBusy ? (
										<BtnLoader className="size-5 shrink-0 text-primary-500" label={`Connecting ${name}`} />
									) : isDone ? (
										<span className="animate-pop flex size-6 shrink-0 items-center justify-center rounded-full bg-success-400 text-white">
											<Check className="size-4" strokeWidth={3} aria-label="Connected" />
										</span>
									) : (
										<ArrowRight
											className="size-5 shrink-0 text-ink/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-500"
											aria-hidden
										/>
									)}
								</button>
							</li>
						);
					})}
				</ul>

				{busy && !done && (
					<button
						type="button"
						onClick={cancel}
						className="mx-auto mt-3 block min-h-11 px-4 text-sm text-ink/70 underline-offset-4 hover:text-ink hover:underline"
					>
						Cancel
					</button>
				)}
			</div>

			<div className="mt-5 bg-page px-6 py-5 sm:px-[34px] sm:py-6">
				<p className="text-[13px] text-ink sm:text-base">Non-Custodial Security</p>
				<p className="mt-1 text-xs leading-5 text-ink/50">
					UseKollo is a non-custodial protocol. We never store, request, or have access to your private keys. Your assets remain
					under your control.
				</p>
			</div>
		</div>
	);
}

function toProblem(error: unknown, id: WalletId): Problem {
	if (error instanceof WalletNotInstalledError) return { kind: "not_installed", message: error.message, walletId: id };
	if (isWalletDismissal(error)) return { kind: "declined" };
	return { kind: "error", message: walletErrorMessage(error) };
}

const linkClass = "font-medium text-primary-500 underline-offset-4 hover:underline";

function ProblemBanner({ problem, phone, onRetry }: { problem: Problem; phone: boolean; onRetry: () => void }) {
	let body: React.ReactNode;
	if (problem.kind === "declined") {
		body = <p>You declined the request. You can try again any time.</p>;
	} else if (problem.kind === "not_installed") {
		const link = installLink(problem.walletId, phone);
		body = (
			<>
				<p>{problem.message}</p>
				{link && (
					<a href={link.href} target="_blank" rel="noreferrer" className={cn("mt-1 inline-flex items-center gap-1", linkClass)}>
						Get it from the {link.store} <ExternalLink className="size-3.5" />
					</a>
				)}
			</>
		);
	} else if (problem.kind === "app_missed") {
		const link = installLink(problem.walletId, true);
		body = (
			<>
				<p>The wallet app didn’t open. Is it installed?</p>
				<div className="mt-1 flex flex-wrap gap-x-4">
					<button type="button" onClick={() => openWalletApp(problem.walletId)} className={linkClass}>
						Open again
					</button>
					{link && (
						<a href={link.href} target="_blank" rel="noreferrer" className={linkClass}>
							Get it from the {link.store}
						</a>
					)}
				</div>
			</>
		);
	} else {
		body = (
			<p>
				{problem.message}{" "}
				<button type="button" onClick={onRetry} className={linkClass}>
					Try again
				</button>
			</p>
		);
	}
	return (
		<div
			role="alert"
			className={cn(
				"animate-pop mb-3 rounded-2xl border px-4 py-3 text-sm leading-6",
				problem.kind === "declined"
					? "border-line bg-ink/5 text-ink/85"
					: "border-warning-500/30 bg-warning-500/10 text-warning-800",
			)}
		>
			{body}
		</div>
	);
}
