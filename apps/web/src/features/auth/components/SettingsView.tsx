"use client";

import { Copy, Link2, Plus, SquareArrowOutUpRight, WalletCards } from "lucide-react";
import { Button } from "@repo/ui/button";
import { shortKey } from "@/lib/stellar/config";
import { useBalances } from "@/lib/stellar/horizon";
import { notify } from "@/lib/use-toast";
import { Breadcrumb } from "@/components/Breadcrumb";
import { disconnect } from "@/features/wallet/connect";
import { useConnectedWallet } from "@/features/wallet/hooks";
import { useWalletDialog } from "@/features/wallet/dialog-store";

/** "12:04:32 UTC". */
const utcTime = (ms: number) => `${new Date(ms).toISOString().slice(11, 19)} UTC`;

/**
 * Profile Settings (designs: connected and not connected). Connected: the wallet address (copy), when its balances
 * were last read from the network, and Disconnect Wallet. Otherwise: "Nothing to see here yet" + Connect Wallet.
 * Log out and email verification live in the avatar menu and the app banner.
 */
export function SettingsView() {
	const { ready, address } = useConnectedWallet();
	const showWallet = useWalletDialog((s) => s.show);
	const balances = useBalances(address);

	if (!ready)
		return (
			<div className="flex flex-col gap-5 md:gap-6">
				<Breadcrumb current="Profile Settings" />
				<div className="skeleton-shimmer h-[280px] rounded-[20px]" />
			</div>
		);

	async function copy() {
		if (!address) return;
		try {
			await navigator.clipboard.writeText(address);
			notify.success("Address copied");
		} catch {
			notify.error("Couldn’t copy", "Select the address and copy it manually.");
		}
	}

	return (
		<div className="flex flex-col gap-5 md:gap-6">
			<Breadcrumb current="Profile Settings" />

			{address ? (
				<>
					<section aria-labelledby="connection-title" className="rounded-[20px] bg-white p-5 md:p-6">
						<div className="flex items-center justify-between gap-4">
							<h1 id="connection-title" className="text-xl text-ink md:text-2xl">
								Connection
							</h1>
							<Link2 className="size-6 text-primary-500" aria-label="Connected" />
						</div>

						<p className="mt-6 text-sm text-ink uppercase">Wallet address</p>
						<div className="mt-2 flex h-[60px] items-center gap-3 rounded-full bg-[#f4f4f4] pr-3 pl-5 md:h-[76px] md:pl-6">
							<WalletCards className="size-6 shrink-0 text-ink" aria-hidden />
							<span className="min-w-0 flex-1 truncate text-lg text-ink" title={address}>
								{shortKey(address, 4, 4).replace("…", "...")}
							</span>
							<button
								type="button"
								onClick={copy}
								aria-label="Copy wallet address"
								className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-white"
							>
								<Copy className="size-5" />
							</button>
						</div>

						<p className="mt-8 text-sm text-ink uppercase">Last sync</p>
						<p className="mt-1 text-sm text-ink tabular-nums">
							{balances.dataUpdatedAt ? utcTime(balances.dataUpdatedAt) : balances.isPending ? "Syncing…" : "Not synced yet"}
						</p>
					</section>

					<Button
						variant="outline"
						className="h-[59px] w-full text-lg sm:w-[358px]"
						onClick={async () => {
							await disconnect();
							notify.info("Wallet disconnected");
						}}
					>
						Disconnect Wallet <SquareArrowOutUpRight className="size-5" />
					</Button>
				</>
			) : (
				<section className="flex flex-col items-center rounded-[20px] bg-white px-6 py-10 text-center md:py-11">
					<span className="flex size-[72px] items-center justify-center rounded-full bg-[#ececec]">
						<WalletCards className="size-6 text-ink" strokeWidth={2.25} aria-hidden />
					</span>
					<h1 className="mt-5 text-xl text-ink">Nothing to see here yet</h1>
					<p className="mt-2 max-w-[330px] text-sm leading-snug text-ink/40">
						Connect your Stellar wallet to see its address and sync status here. UseKollo never holds your keys.
					</p>
					<button
						type="button"
						onClick={() => showWallet()}
						className="mt-6 flex h-[59px] items-center gap-4 rounded-full bg-[#ececec] px-8 text-lg text-ink transition-colors hover:bg-[#e2e2e2]"
					>
						<Plus className="size-5" aria-hidden /> Connect Wallet
					</button>
				</section>
			)}
		</div>
	);
}
