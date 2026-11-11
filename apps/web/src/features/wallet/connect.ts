"use client";

import { NETWORK_PASSPHRASE } from "@/lib/stellar/config";
import { useWallet } from "@/features/wallet/store";
import type { WalletId } from "@/features/wallet/kit";

/**
 * Connecting a wallet: read the address from the wallet (it asks the user to approve) and check it's on Testnet.
 * No sign-in message, no backend. Real wallets go through Stellar Wallets Kit (`kit.ts`, loaded on first use).
 */
export async function connect(id: WalletId, options: { onAppMissed?: () => void } = {}) {
	const { connectWallet } = await import("@/features/wallet/kit");
	const address = await connectWallet(id, { onAppMissed: options.onAppMissed, networkPassphrase: NETWORK_PASSPHRASE });
	useWallet.getState().setConnected(address, id);
	return address;
}

/** Has the connected wallet sign a transaction (base64 XDR); resolves with the signed XDR. */
export async function sign(xdr: string) {
	const { address, walletId } = useWallet.getState();
	if (!address || !walletId) throw new Error("Connect your wallet first.");
	const { signWithWallet } = await import("@/features/wallet/kit");
	return signWithWallet(walletId, xdr, address, NETWORK_PASSPHRASE);
}

export async function disconnect() {
	useWallet.getState().clear();
	const { disconnectWallet } = await import("@/features/wallet/kit");
	await disconnectWallet();
}
