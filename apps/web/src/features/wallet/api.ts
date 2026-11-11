"use client";

import { api } from "@/lib/api/client";
import type { WalletDto, WalletTransactionDto } from "@/lib/api/types";

/**
 * The account's linked wallet on the UseKollo API. One wallet per account; a wallet can't belong to two accounts, and
 * it can't be switched or unlinked while goals are open (they belong to it). Balances are read live from the network.
 */
export const walletApi = {
	get: () => api<WalletDto>("/wallet"),

	/** A transaction for the wallet to sign that proves it holds the key. It can never be submitted and moves nothing. */
	challenge: (address: string) => api<WalletTransactionDto>("/wallet/challenge", { method: "POST", body: { address } }),

	link: (signedXdr: string) => api<WalletDto>("/wallet/link", { method: "POST", body: { signedXdr } }),

	unlink: () => api("/wallet", { method: "DELETE" }),

	/** Prepares the trustline that lets the wallet hold an issued asset (sets aside 0.5 XLM). */
	trustline: (asset: string) => api<WalletTransactionDto>("/wallet/trustline", { method: "POST", body: { asset } }),

	submitTrustline: (signedXdr: string) => api<WalletDto>("/wallet/trustline/submit", { method: "POST", body: { signedXdr } }),
};
