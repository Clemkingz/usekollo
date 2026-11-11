import { z } from "zod";
import { isValidAmount } from "@repo/domain/money";
import { todayISO } from "@repo/domain/goal-status";
import { ASSETS } from "@/lib/stellar/config";

const name = z.string().trim().min(1, "Give your goal a name").max(80, "Keep it under 80 characters");
const targetAmount = z.string().trim().refine(isValidAmount, "Enter an amount above 0, with at most 7 decimal places");
const targetDate = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
	.refine((d) => d >= todayISO(), "Pick today or a later date");

/** Create Savings Goal (PRD screen 5): name, asset, target amount, target date (API rules: name ≤ 80, date ≥ today). */
export const createGoalSchema = z.object({
	name,
	assetId: z.string().refine((id) => ASSETS.some((a) => a.id === id), "Choose an asset"),
	targetAmount,
	targetDate,
});

/** Edit goal: name and date any time; the target only until it's first reached. */
export const editGoalSchema = z.object({ name, targetAmount, targetDate });

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type EditGoalInput = z.infer<typeof editGoalSchema>;
