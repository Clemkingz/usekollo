"use client";

import { NETWORK_PASSPHRASE } from "@/lib/stellar/config";
import { keys, queryClient } from "@/lib/query-client";
import type { WalletDto } from "@/lib/api/types";
import { walletApi } from "@/features/wallet/api";
import { useWallet } from "@/features/wallet/store";
import type { WalletId } from "@/features/wallet/kit";

/**
 * Connecting a wallet: the wallet shares its address (the user approves), then, unless the account already has that
 * wallet linked, the wallet signs the API's link challenge to prove it holds the key. Nothing is sent to the network.
 * Real wallets go through Stellar Wallets Kit (`kit.ts`, loaded on first use). UseKollo never sees keys.
 */
export async function connect(id: WalletId, options: { onAppMissed?: () => void; onLinking?: () => void } = {}) {
	const { connectWallet, signWithWallet } = await import("@/features/wallet/kit");
	const address = await connectWallet(id, { onAppMissed: options.onAppMissed, networkPassphrase: NETWORK_PASSPHRASE });

	const current = await queryClient.fetchQuery({ queryKey: keys.wallet, queryFn: walletApi.get, staleTime: 0 });
	if (!(current.linked && current.address === address)) {
		options.onLinking?.();
		const challenge = await walletApi.challenge(address);
		const signed = await signWithWallet(id, challenge.xdr, address, challenge.networkPassphrase);
		const linked = await walletApi.link(signed);
		queryClient.setQueryData<WalletDto>(keys.wallet, linked);
		// A different wallet sees different goals.
		void queryClient.invalidateQueries({ queryKey: keys.goals });
		void queryClient.invalidateQueries({ queryKey: keys.activity });
	}

	useWallet.getState().setConnected(address, id);
	return address;
}

/** Thrown when signing is needed but this browser has no wallet session for the linked address. */
export class WalletNotConnectedError extends Error {
	constructor() {
		super("Reconnect your wallet to approve this.");
	}
}

/** Has the connected wallet sign a transaction (base64 XDR); resolves with the signed XDR. */
export async function sign(xdr: string, networkPassphrase = NETWORK_PASSPHRASE) {
	const { address, walletId } = useWallet.getState();
	const linked = queryClient.getQueryData<WalletDto>(keys.wallet)?.address;
	if (!address || !walletId || (linked && linked !== address)) throw new WalletNotConnectedError();
	const { signWithWallet } = await import("@/features/wallet/kit");
	return signWithWallet(walletId, xdr, address, networkPassphrase);
}

/** Ends this browser's wallet session. The wallet stays linked to the account. */
export async function disconnect() {
	useWallet.getState().clear();
	const { disconnectWallet } = await import("@/features/wallet/kit");
	await disconnectWallet();
}

/** Removes the wallet from the account (refused while goals are open), then disconnects it here. */
export async function unlink() {
	await walletApi.unlink();
	await disconnect();
	useWallet.getState().forget();
	await queryClient.invalidateQueries({ queryKey: keys.wallet });
	queryClient.removeQueries({ queryKey: keys.goals });
	queryClient.removeQueries({ queryKey: keys.activity });
}
