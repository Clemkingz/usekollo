"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { WalletId } from "@/features/wallet/kit";

interface WalletState {
	/** Public address (G…) this browser's wallet session is for. Never a secret. */
	address: string | null;
	/** Which wallet (Freighter, Albedo…) signs for it. */
	walletId: WalletId | null;
	/** Kept after a disconnect so the header can say "Wallet Disconnected" rather than "Connect Wallet". */
	lastWalletId: WalletId | null;
	setConnected: (address: string, walletId: WalletId) => void;
	clear: () => void;
	forget: () => void;
}

/**
 * This browser's wallet session: which wallet app signs for the account's linked wallet. The account's linked
 * wallet itself lives on the API (`GET /wallet`). Every transaction is approved and signed in the wallet (non-custodial).
 */
export const useWallet = create<WalletState>()(
	persist(
		(set) => ({
			address: null,
			walletId: null,
			lastWalletId: null,
			setConnected: (address, walletId) => set({ address, walletId, lastWalletId: walletId }),
			clear: () => set({ address: null, walletId: null }),
			forget: () => set({ address: null, walletId: null, lastWalletId: null }),
		}),
		{ name: "usekollo-wallet", storage: createJSONStorage(() => localStorage) },
	),
);
