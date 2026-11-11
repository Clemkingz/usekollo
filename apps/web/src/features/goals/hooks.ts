"use client";

import { useMemo } from "react";
import { summarizeGoal, todayISO } from "@repo/domain/goal-status";
import type { GoalSummary } from "@repo/domain/types";
import { useGoalsStore } from "@/features/goals/store";
import type { CreateGoalInput } from "@/features/goals/schema";

/** The owner's goals with derived saved amount, progress and status, newest first. */
export function useGoals(owner: string | null): GoalSummary[] {
	const goals = useGoalsStore((s) => s.goals);
	const activity = useGoalsStore((s) => s.activity);
	return useMemo(() => {
		if (!owner) return [];
		const today = todayISO();
		return goals
			.filter((g) => g.owner === owner)
			.map((g) => summarizeGoal(g, activity, today))
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	}, [goals, activity, owner]);
}

/** One goal, or null when it doesn't exist or belongs to another wallet. */
export function useGoal(id: string, owner: string | null): GoalSummary | null {
	return useGoals(owner).find((g) => g.id === id) ?? null;
}

export function useCreateGoal() {
	const addGoal = useGoalsStore((s) => s.addGoal);
	return (owner: string, input: CreateGoalInput) => {
		const goal = { id: crypto.randomUUID(), owner, ...input, createdAt: new Date().toISOString() };
		addGoal(goal);
		return goal;
	};
}
