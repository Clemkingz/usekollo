"use client";

import { useMemo } from "react";
import type { Activity } from "@repo/domain/types";
import { useGoalsStore } from "@/features/goals/store";

/** Activity for the owner's goals (or one goal), newest first (PRD screen 9 and Goal Details). */
export function useActivity(owner: string | null, goalId?: string): Activity[] {
	const goals = useGoalsStore((s) => s.goals);
	const activity = useGoalsStore((s) => s.activity);
	return useMemo(() => {
		if (!owner) return [];
		const mine = new Set(goals.filter((g) => g.owner === owner).map((g) => g.id));
		return activity
			.filter((a) => mine.has(a.goalId) && (!goalId || a.goalId === goalId))
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	}, [goals, activity, owner, goalId]);
}
