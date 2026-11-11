"use client";

import { useQuery } from "@tanstack/react-query";
import type { Amount, AssetId } from "@repo/domain/types";
import { HORIZON_URL } from "@/lib/stellar/config";

/**
 * Reads from Horizon (Testnet). The SDK is imported on first use: it's large and only needed in the browser.
 */
let serverPromise: Promise<import("@stellar/stellar-sdk").Horizon.Server> | null = null;

export function getHorizon() {
	serverPromise ??= import("@stellar/stellar-sdk").then(({ Horizon }) => new Horizon.Server(HORIZON_URL));
	return serverPromise;
}

export interface AccountBalances {
	/** False when the account hasn't been funded on Testnet yet (Friendbot fixes that). */
	exists: boolean;
	/** Spendable balance per asset id ("XLM", "CODE:ISSUER"). Assets without a trustline are absent. */
	balances: Record<AssetId, Amount>;
}

export async function fetchBalances(address: string): Promise<AccountBalances> {
	const server = await getHorizon();
	try {
		const account = await server.loadAccount(address);
		const balances: Record<AssetId, Amount> = {};
		for (const b of account.balances) {
			if (b.asset_type === "native") balances.XLM = b.balance;
			else if (b.asset_type === "credit_alphanum4" || b.asset_type === "credit_alphanum12")
				balances[`${b.asset_code}:${b.asset_issuer}`] = b.balance;
		}
		return { exists: true, balances };
	} catch (error) {
		if ((error as { response?: { status?: number } })?.response?.status === 404) return { exists: false, balances: {} };
		throw error;
	}
}

/** The connected wallet's balances (PRD Dashboard: "relevant asset balances"). */
export function useBalances(address: string | null) {
	return useQuery({
		queryKey: ["stellar", "balances", address],
		enabled: !!address,
		staleTime: 15_000,
		queryFn: () => fetchBalances(address!),
	});
}
