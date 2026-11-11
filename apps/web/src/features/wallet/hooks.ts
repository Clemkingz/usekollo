"use client";

import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { keys } from "@/lib/query-client";
import { useSession } from "@/features/auth/hooks";
import { walletApi } from "@/features/wallet/api";
import { useWallet } from "@/features/wallet/store";
import { useWalletDialog } from "@/features/wallet/dialog-store";

const subscribe = (cb: () => void) => useWallet.persist.onFinishHydration(cb);
const hydrated = () => useWallet.persist.hasHydrated();

/** The account's linked wallet with live balances (`GET /wallet`). */
export function useWalletInfo() {
	const { user } = useSession();
	return useQuery({ queryKey: keys.wallet, queryFn: walletApi.get, enabled: !!user, staleTime: 15_000 });
}

/**
 * The account's wallet, safe for SSR. `address` is the LINKED wallet (goals belong to it; null when none is linked).
 * `canSign` says whether this browser has a wallet session for it; without one, viewing works and signing asks to
 * reconnect first. `ready` turns true once both the session and the API have answered.
 */
export function useConnectedWallet() {
	const hydratedLocal = useSyncExternalStore(subscribe, hydrated, () => false);
	const { ready: sessionReady, user } = useSession();
	const info = useWalletInfo();
	const local = useWallet((s) => s.address);
	const walletId = useWallet((s) => s.walletId);
	const ready = hydratedLocal && sessionReady && (!user || info.isSuccess || info.isError);
	const address = info.data?.linked ? info.data.address : null;
	return {
		ready,
		address,
		walletId: ready ? walletId : null,
		canSign: !!address && local === address,
		wallet: info.data ?? null,
		error: info.error,
	};
}

/** Balance and spendable amount per asset id, from the linked wallet. */
export function useBalances() {
	const info = useWalletInfo();
	const assets = info.data?.assets ?? [];
	return {
		isPending: info.isPending,
		exists: info.data?.exists ?? false,
		balance: (assetId: string) => assets.find((a) => a.id === assetId)?.balance ?? null,
		spendable: (assetId: string) => assets.find((a) => a.id === assetId)?.spendable ?? null,
		trusted: (assetId: string) => assets.find((a) => a.id === assetId)?.trusted ?? false,
		updatedAt: info.dataUpdatedAt,
		refetch: info.refetch,
	};
}

/** Runs `action` with the wallet address, asking to connect (or reconnect) first when this browser can't sign. */
export function useRequireWallet() {
	const show = useWalletDialog((s) => s.show);
	const { address, canSign } = useConnectedWallet();
	return (action: (address: string) => void, reason?: string) => {
		if (address && canSign) action(address);
		else show(reason ?? (address ? "Reconnect your wallet to continue." : undefined), action);
	};
}
