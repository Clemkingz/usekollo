"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Activity, Goal } from "@repo/domain/types";

/**
 * Where goals and their activity live for now: this browser's localStorage, keyed by owner address inside each record.
 * INTERIM (docs/DECISIONS.md D2): if goals move on-chain (Soroban contract) or to a backend, only this file and
 * `hooks.ts` change; screens use the hooks. Bump `version` (and add a `migrate`) when the stored shape changes.
 */
interface GoalsState {
	goals: Goal[];
	activity: Activity[];
	addGoal: (goal: Goal) => void;
	addActivity: (entry: Activity) => void;
	updateActivity: (id: string, patch: Partial<Pick<Activity, "status" | "txHash" | "error">>) => void;
}

export const useGoalsStore = create<GoalsState>()(
	persist(
		(set) => ({
			goals: [],
			activity: [],
			addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal] })),
			addActivity: (entry) => set((s) => ({ activity: [entry, ...s.activity] })),
			updateActivity: (id, patch) => set((s) => ({ activity: s.activity.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
		}),
		{ name: "usekollo-goals", version: 1, storage: createJSONStorage(() => localStorage) },
	),
);
