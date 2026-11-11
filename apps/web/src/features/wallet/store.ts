"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { WalletId } from "@/features/wallet/kit";

interface WalletState {
	/** Public address (G…) of the connected wallet. Never a secret. */
	address: string | null;
	walletId: WalletId | null;
	/** Kept after a disconnect so the header can say "Wallet Disconnected" rather than "Connect Wallet". */
	lastWalletId: WalletId | null;
	setConnected: (address: string, walletId: WalletId) => void;
	clear: () => void;
}

/**
 * The connected wallet. There is no account and no backend session: "connected" means the user approved sharing
 * their public address. Every transaction is still approved and signed in the wallet itself (non-custodial).
 */
export const useWallet = create<WalletState>()(
	persist(
		(set) => ({
			address: null,
			walletId: null,
			lastWalletId: null,
			setConnected: (address, walletId) => set({ address, walletId, lastWalletId: walletId }),
			clear: () => set({ address: null, walletId: null }),
		}),
		{ name: "usekollo-wallet", storage: createJSONStorage(() => localStorage) },
	),
);
