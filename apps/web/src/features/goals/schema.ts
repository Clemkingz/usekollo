import { z } from "zod";
import { isValidAmount } from "@repo/domain/money";
import { todayISO } from "@repo/domain/goal-status";
import { ASSETS } from "@/lib/stellar/config";

/** Create Savings Goal (PRD screen 5): name, asset, target amount, target date. */
export const createGoalSchema = z.object({
	name: z.string().trim().min(1, "Give your goal a name").max(40, "Keep it under 40 characters"),
	assetId: z.string().refine((id) => ASSETS.some((a) => a.id === id), "Choose an asset"),
	targetAmount: z.string().trim().refine(isValidAmount, "Enter an amount above 0, with at most 7 decimal places"),
	targetDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
		.refine((d) => d > todayISO(), "Pick a date in the future"),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
