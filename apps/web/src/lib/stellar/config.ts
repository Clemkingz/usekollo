import type { Asset } from "@repo/domain/types";

/**
 * Stellar Testnet constants (PRD: Testnet only, Testnet assets only). The app talks to Horizon directly; there is
 * no UseKollo backend.
 */
export const STELLAR_NETWORK = "testnet" as const;

export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

export const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org";

/** Funds a new Testnet account with test XLM (shown to users whose account doesn't exist yet). */
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

const EXPLORER = "https://stellar.expert/explorer/testnet";

/** Explorer links (PRD: transaction hashes as evidence). */
export const explorer = {
	tx: (hash: string, base = EXPLORER) => `${base}/tx/${hash}`,
	account: (address: string, base = EXPLORER) => `${base}/account/${address}`,
};

/** One operation at the base fee (100 stroops), shown on review screens. */
export const NETWORK_FEE_XLM = "0.00001";

/** Circle's Testnet USDC issuer. */
const USDC_TESTNET_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

/** The assets a goal can be saved in. TODO(D4): confirm the list with product. */
export const ASSETS: Asset[] = [
	{ id: "XLM", code: "XLM", issuer: null, name: "Stellar Lumens" },
	{ id: `USDC:${USDC_TESTNET_ISSUER}`, code: "USDC", issuer: USDC_TESTNET_ISSUER, name: "USD Coin (Testnet)" },
];

export const assetById = (id: string) => ASSETS.find((a) => a.id === id) ?? null;

/** "GBC4BO…ZFGIE" for tight spaces; full values stay copyable. */
export function shortKey(value: string, head = 6, tail = 5) {
	return value.length > head + tail + 1 ? `${value.slice(0, head)}…${value.slice(-tail)}` : value;
}

/** A Stellar public key (G…, 56 chars). Secret keys (S…) and muxed (M…) addresses are refused. */
export const isPublicKey = (v: string) => /^G[A-Z2-7]{55}$/.test(v.trim());
