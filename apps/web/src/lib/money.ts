import { formatFixed } from "@repo/domain/money";

/**
 * Amount with its asset, as the goal designs show it: USDC as dollars ("$500.00"), anything else with its code
 * ("120.50 XLM"). Display only; math stays in @repo/domain/money.
 */
export function money(amount: string, code: string) {
	return code === "USDC" ? `$${formatFixed(amount)}` : `${formatFixed(amount)} ${code}`;
}
