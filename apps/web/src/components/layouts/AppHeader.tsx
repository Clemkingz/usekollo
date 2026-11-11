"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Copy, ExternalLink, LogOut, Search, Unplug, UserRound, WalletCards } from "lucide-react";
import { formatAmount } from "@repo/domain/money";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { routes } from "@/lib/routes";
import { ASSETS, explorer, shortKey } from "@/lib/stellar/config";
import { useBalances } from "@/lib/stellar/horizon";
import { notify } from "@/lib/use-toast";
import { Logo } from "@/components/Logo";
import { useSession, useSignOut } from "@/features/auth/hooks";
import { useGoalsStore } from "@/features/goals/store";
import { disconnect } from "@/features/wallet/connect";
import { useWalletDialog } from "@/features/wallet/dialog-store";
import { useConnectedWallet } from "@/features/wallet/hooks";
import { useWallet } from "@/features/wallet/store";

const menuItem = "cursor-pointer focus:bg-primary-50 focus:text-ink";

/**
 * App header (dashboard designs). Desktop: wordmark | transaction search · wallet pill (balance | address) · avatar.
 * Phones: wordmark · bell · profile (the balance is on the dashboard card).
 */
export function AppHeader() {
	return (
		<header className="sticky top-0 z-30 bg-white">
			<div className="flex h-16 items-center gap-3 px-4 md:h-[75px] md:gap-5 lg:px-[22px]">
				<Logo variant="wordmark" href={routes.dashboard} className="[&_img]:h-6 md:[&_img]:h-[30px]" />
				<span aria-hidden className="hidden h-6 w-px bg-ink/30 md:block" />
				<TxSearch />
				<div className="ml-auto flex items-center gap-2 md:gap-4">
					<WalletPill />
					<NotificationsButton />
					<AccountAvatar />
				</div>
			</div>
		</header>
	);
}

/** "Txn Hash or ID…": finds a goal by id, or the goal a transaction hash belongs to; unknown hashes open the explorer. */
function TxSearch() {
	const router = useRouter();
	const [query, setQuery] = useState("");
	function submit(event: React.FormEvent) {
		event.preventDefault();
		const q = query.trim();
		if (!q) return;
		const { goals, activity } = useGoalsStore.getState();
		const goal =
			goals.find((g) => g.id === q) ??
			goals.find((g) => g.id === activity.find((a) => a.txHash?.toLowerCase() === q.toLowerCase())?.goalId);
		if (goal) {
			setQuery("");
			router.push(routes.goal(goal.id));
		} else if (/^[0-9a-f]{64}$/i.test(q)) {
			window.open(explorer.tx(q.toLowerCase()), "_blank", "noopener,noreferrer");
		} else {
			notify.info("Nothing found", "Paste a goal ID or a 64-character transaction hash.");
		}
	}
	return (
		<form role="search" onSubmit={submit} className="hidden max-w-[720px] flex-1 md:block">
			<label className="flex h-9 items-center gap-3 rounded-full border border-ink/80 px-4 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10">
				<Search className="size-5 shrink-0 text-ink" aria-hidden />
				<span className="sr-only">Search by transaction hash or goal ID</span>
				<input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Txn Hash or ID..."
					className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink focus:outline-none"
					spellCheck={false}
					autoComplete="off"
				/>
			</label>
		</form>
	);
}

/** Wallet pill (design): balance | short address; a menu to copy, view on the explorer or disconnect. */
function WalletPill() {
	const { ready, address } = useConnectedWallet();
	const show = useWalletDialog((s) => s.show);
	const balances = useBalances(address);
	const wasConnected = useWallet((s) => s.lastWalletId !== null);
	const pill = "flex h-9 items-center gap-2.5 rounded-full bg-[#ececec] px-3 text-sm md:px-4 md:text-base";

	if (!ready) return <span className="skeleton-shimmer hidden h-9 w-[150px] rounded-full md:block" aria-hidden />;
	if (!address)
		// Reconnect design: a red "Wallet Disconnected" pill once a wallet has been used here; otherwise "Connect Wallet".
		return wasConnected ? (
			<button
				type="button"
				onClick={() => show("Reconnect your wallet to see your goals and balances.")}
				className="flex h-9 items-center gap-2 rounded-full bg-[#fde8e8] px-3 text-sm text-[#e5372f] transition-colors hover:bg-[#fbd5d5] md:px-4 md:text-base"
			>
				<WalletCards className="size-5" aria-hidden />
				<span className="max-sm:sr-only">Wallet Disconnected</span>
			</button>
		) : (
			<button type="button" onClick={() => show()} className={`${pill} text-navy transition-colors hover:bg-primary-50`}>
				<WalletCards className="size-5" aria-hidden /> <span className="max-sm:sr-only">Connect Wallet</span>
			</button>
		);

	// The design shows one balance: USDC when the wallet holds it, else XLM.
	const usdc = ASSETS.find((a) => a.code === "USDC")!;
	const held = balances.data?.balances[usdc.id] !== undefined ? usdc : ASSETS[0]!;
	const amount = balances.data?.balances[held.id];

	async function copy() {
		try {
			await navigator.clipboard.writeText(address!);
			notify.success("Address copied");
		} catch {
			notify.error("Couldn’t copy. Select the address and copy it manually.");
		}
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className={`${pill} hidden transition-colors hover:bg-[#e3e3e3] md:flex`}
					aria-label={`Wallet ${address}. Open wallet menu`}
				>
					<WalletCards className="size-5 text-ink" aria-hidden />
					<span className="text-navy tabular-nums">
						{balances.isPending ? "…" : amount ? formatAmount(amount) : "0.00"} {held.code}
					</span>
					<span aria-hidden className="hidden h-5 w-px bg-ink/30 sm:block" />
					<span className="hidden text-ink/40 sm:inline">{shortKey(address, 4, 4).replace("…", "...")}</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-64 border-line bg-white text-ink">
				<DropdownMenuLabel className="py-2">
					<span className="block text-xs font-normal text-ink/55">Stellar Testnet wallet</span>
					<span className="block font-mono text-xs break-all">{address}</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator className="bg-line" />
				<DropdownMenuItem onSelect={copy} className={menuItem}>
					<Copy className="size-4" /> Copy address
				</DropdownMenuItem>
				<DropdownMenuItem asChild className={menuItem}>
					<a href={explorer.account(address)} target="_blank" rel="noreferrer">
						<ExternalLink className="size-4" /> View on Stellar Expert
					</a>
				</DropdownMenuItem>
				<DropdownMenuSeparator className="bg-line" />
				<DropdownMenuItem
					onSelect={async () => {
						await disconnect();
						notify.info("Wallet disconnected");
					}}
					className="cursor-pointer text-error-400 focus:bg-error-50 focus:text-error-500"
				>
					<Unplug className="size-4" /> Disconnect wallet
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** Avatar (design shows a photo; accounts have none yet, so initials). Menu: settings, log out. */
function AccountAvatar() {
	const { user } = useSession();
	const signOut = useSignOut();
	if (!user) return null;
	const initials = user.email.slice(0, 2).toUpperCase();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label="Account menu"
					className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:outline-none md:bg-primary-500 md:text-sm md:font-medium md:text-white"
				>
					<UserRound className="size-5 md:hidden" aria-hidden />
					<span className="max-md:hidden">{initials}</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-64 border-line bg-white text-ink">
				<DropdownMenuLabel className="py-2">
					<span className="block text-xs font-normal text-ink/55">Signed in as</span>
					<span className="block truncate text-sm font-medium">{user.email}</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator className="bg-line" />
				<DropdownMenuItem asChild className={menuItem}>
					<Link href={routes.settings}>
						<UserRound className="size-4" /> Profile Settings
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem onSelect={signOut} className={menuItem}>
					<LogOut className="size-4" /> Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** Bell (mobile design). There are no notifications yet, so it says so. */
function NotificationsButton() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label="Notifications"
					className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:outline-none md:hidden"
				>
					<Bell className="size-5" aria-hidden />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-64 border-line bg-white p-4 text-sm text-ink/70">
				You’re all caught up. Updates about your goals will appear here.
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
