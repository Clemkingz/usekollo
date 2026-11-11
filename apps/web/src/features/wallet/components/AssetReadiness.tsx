"use client";

import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { assetById } from "@/lib/stellar/config";
import { notify } from "@/lib/use-toast";
import { addTrustline, WalletDeclinedError } from "@/features/savings/hooks";
import { useBalances, useRequireWallet } from "@/features/wallet/hooks";

/**
 * Whether the linked wallet can use an asset yet, and the fix when it can't:
 * - not funded on the network: it needs some XLM first (from the wallet app; UseKollo doesn't hand out test XLM).
 * - an issued asset (USDC) without a trustline: "Add USDC to your wallet" (the wallet signs; sets aside 0.5 XLM).
 * Renders nothing when the asset is ready. `ready` tells the parent whether to allow the action.
 */
export function useAssetReadiness(assetId: string) {
	const balances = useBalances();
	const asset = assetById(assetId);
	if (balances.isPending) return { state: "loading" as const };
	if (!balances.exists) return { state: "unfunded" as const };
	if (asset?.issuer && !balances.trusted(assetId)) return { state: "untrusted" as const, code: asset.code };
	return { state: "ready" as const };
}

export function AssetReadiness({ assetId, className }: { assetId: string; className?: string }) {
	const readiness = useAssetReadiness(assetId);
	const requireWallet = useRequireWallet();
	const [busy, setBusy] = useState(false);

	if (readiness.state === "ready" || readiness.state === "loading") return null;

	async function trust(code: string) {
		setBusy(true);
		try {
			await addTrustline(assetId);
			notify.success(`${code} added to your wallet`, `You can now save in ${code}.`);
		} catch (error) {
			if (error instanceof WalletDeclinedError) notify.info("Nothing changed", "You declined in your wallet.");
			else notify.fromError(error);
		} finally {
			setBusy(false);
		}
	}

	return (
		<div
			role="status"
			className={cn(
				"animate-pop flex flex-col gap-3 rounded-[18px] border border-warning-500/30 bg-warning-500/10 p-4 text-sm text-warning-800",
				className,
			)}
		>
			<p className="flex gap-2.5 leading-6">
				<CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
				{readiness.state === "unfunded" ? (
					<span>
						Your wallet isn’t active on Stellar Testnet yet. Add some test XLM to it from your wallet app, then come back.
					</span>
				) : (
					<span>
						Your wallet can’t hold {readiness.code} yet. Add {readiness.code} to it once (your wallet sets aside 0.5 XLM for
						this).
					</span>
				)}
			</p>
			{readiness.state === "untrusted" && (
				<Button
					type="button"
					size="md"
					className="self-start"
					isLoading={busy}
					loadingLabel="Waiting for your wallet"
					onClick={() => requireWallet(() => void trust(readiness.code))}
				>
					Add {readiness.code} to your wallet
				</Button>
			)}
		</div>
	);
}
