"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Goal } from "@repo/domain/types";
import { compare } from "@repo/domain/money";
import { Button } from "@repo/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@repo/ui/dialog";
import { toGoal } from "@/lib/api/map";
import { keys, queryClient } from "@/lib/query-client";
import { notify } from "@/lib/use-toast";
import { TextField } from "@/components/forms/TextField";
import { goalsApi } from "@/features/goals/api";
import { editGoalSchema, type EditGoalInput } from "@/features/goals/schema";
import { PillField, pillInput } from "@/features/goals/components/PillField";

/**
 * Edit a goal (API rules): name and target date any time before it's closed; the target amount only until it's first
 * reached (after that withdrawals are open and the target is fixed). Nothing on the network changes.
 */
export function EditGoalDialog({ goal, open, onOpenChange }: { goal: Goal; open: boolean; onOpenChange: (o: boolean) => void }) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="gap-0 rounded-[28px] p-6 sm:max-w-[480px] sm:p-7">
				<DialogTitle className="font-display text-[26px] font-normal text-ink md:text-[28px]">Edit goal</DialogTitle>
				<DialogDescription className="mt-2 text-[15px] text-ink/60">Changes here don’t move any funds.</DialogDescription>
				{open && <EditGoalForm goal={goal} onDone={() => onOpenChange(false)} />}
			</DialogContent>
		</Dialog>
	);
}

function EditGoalForm({ goal, onDone }: { goal: Goal; onDone: () => void }) {
	const form = useForm<EditGoalInput>({
		resolver: zodResolver(editGoalSchema),
		defaultValues: { name: goal.name, targetAmount: trim(goal.targetAmount), targetDate: goal.targetDate },
	});

	const onSubmit = form.handleSubmit(async (values) => {
		const body: { name?: string; targetAmount?: string; targetDate?: string } = {};
		if (values.name !== goal.name) body.name = values.name;
		if (values.targetDate !== goal.targetDate) body.targetDate = values.targetDate;
		if (!goal.targetReached && compare(values.targetAmount, goal.targetAmount) !== 0) body.targetAmount = values.targetAmount;
		if (Object.keys(body).length === 0) return onDone();
		try {
			const updated = toGoal(await goalsApi.update(goal.id, body));
			queryClient.setQueryData(keys.goal(goal.id), updated);
			void queryClient.invalidateQueries({ queryKey: keys.goals });
			notify.success("Goal updated", updated.name);
			onDone();
		} catch (error) {
			notify.fromError(error);
		}
	});

	return (
		<form onSubmit={onSubmit} noValidate className="mt-7 flex flex-col gap-5">
			<TextField control={form.control} name="name" label="Goal Name" />
			{goal.targetReached ? (
				<div className="flex flex-col gap-2.5">
					<span className="text-[15px] text-ink">Target Amount</span>
					<p className="rounded-full bg-page px-6 py-3.5 text-ink/60">
						{trim(goal.targetAmount)} {goal.assetCode} · fixed once reached
					</p>
				</div>
			) : (
				<TextField control={form.control} name="targetAmount" label={`Target Amount (${goal.assetCode})`} inputMode="decimal" />
			)}
			<Controller
				control={form.control}
				name="targetDate"
				render={({ field, fieldState }) => (
					<PillField label="Target Date" id="edit-goal-date" error={fieldState.error?.message}>
						<input id="edit-goal-date" type="date" {...field} className={pillInput(!!fieldState.error)} />
					</PillField>
				)}
			/>
			<Button type="submit" className="mt-3 h-[56px] text-lg" isLoading={form.formState.isSubmitting} loadingLabel="Saving">
				Save changes
			</Button>
		</form>
	);
}

/** "500.0000000" → "500". */
const trim = (v: string) => (v.includes(".") ? v.replace(/\.?0+$/, "") : v);
