import { describe, expect, it } from "vitest";
import type { Activity, Goal } from "./types";
import { formatAmount, isValidAmount, progressPercent, subtract, sum, toStroops } from "./money";
import { goalBadge, goalStatus, monthlyPace, ongoingProgress, savedAmount, summarizeGoal } from "./goal-status";

const goal: Goal = {
	id: "g1",
	owner: "GABC",
	name: "New Laptop",
	assetId: "USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
	targetAmount: "500",
	targetDate: "2026-12-31",
	createdAt: "2026-11-11T00:00:00.000Z",
};

const tx = (over: Partial<Activity>): Activity => ({
	id: Math.random().toString(36),
	goalId: "g1",
	kind: "deposit",
	amount: "100",
	assetId: goal.assetId,
	status: "confirmed",
	txHash: "hash",
	createdAt: "2026-11-11T00:00:00.000Z",
	...over,
});

describe("money", () => {
	it("is exact", () => {
		expect(sum(["0.1", "0.2"])).toBe("0.3000000");
		expect(subtract("1", "2")).toBe("0.0000000");
		expect(toStroops("1.0000001")).toBe(10000001n);
	});
	it("validates amounts", () => {
		expect(isValidAmount("250")).toBe(true);
		expect(isValidAmount("0")).toBe(false);
		expect(isValidAmount("1.12345678")).toBe(false);
		expect(isValidAmount("-1")).toBe(false);
	});
	it("formats and computes progress", () => {
		expect(formatAmount("1250.5")).toBe("1,250.5");
		expect(progressPercent("250", "500")).toBe(50);
	});
});

describe("goals", () => {
	it("counts only confirmed activity", () => {
		const activity = [
			tx({ amount: "300" }),
			tx({ amount: "50", kind: "withdrawal" }),
			tx({ amount: "999", status: "pending" }),
			tx({ amount: "999", status: "failed" }),
			tx({ amount: "999", status: "unknown" }),
			tx({ amount: "999", goalId: "other" }),
		];
		expect(savedAmount("g1", activity)).toBe("250.0000000");
	});
	it("matches the PRD example: 250 / 500 USDC is 50%", () => {
		const s = summarizeGoal(goal, [tx({ amount: "250" })], "2026-11-11");
		expect(s.progress).toBe(50);
		expect(s.status).toBe("active");
	});
	it("derives status", () => {
		expect(goalStatus("500", "500", "2026-12-31", "2027-01-05")).toBe("completed");
		expect(goalStatus("10", "500", "2026-12-31", "2027-01-05")).toBe("overdue");
		expect(goalStatus("10", "500", "2026-12-31", "2026-12-31")).toBe("active");
	});
});

describe("dashboard", () => {
	it("badges goals: done, urgent within 14 days or overdue, else running", () => {
		expect(goalBadge({ status: "completed", targetDate: "2026-11-12" }, "2026-11-11")).toBe("done");
		expect(goalBadge({ status: "active", targetDate: "2026-11-20" }, "2026-11-11")).toBe("urgent");
		expect(goalBadge({ status: "overdue", targetDate: "2026-11-01" }, "2026-11-11")).toBe("urgent");
		expect(goalBadge({ status: "active", targetDate: "2026-12-31" }, "2026-11-11")).toBe("running");
	});
	it("sums progress per asset and finds the next goal's remaining amount", () => {
		const today = "2026-11-11";
		const a = summarizeGoal(goal, [tx({ amount: "250" })], today);
		const b = summarizeGoal({ ...goal, id: "g2", targetAmount: "3000" }, [tx({ goalId: "g2", amount: "2700" })], today);
		const xlm = summarizeGoal({ ...goal, id: "g3", assetId: "XLM" }, [], today);
		const p = ongoingProgress([a, b, xlm], goal.assetId)!;
		expect(p.percent).toBe(84);
		expect(p.nextGoalRemaining).toBe("250.0000000");
		expect(ongoingProgress([a], "XLM")).toBeNull();
	});
});

describe("goal details", () => {
	it("monthly pace is saved per month since creation, at least one month", () => {
		expect(monthlyPace({ savedAmount: "0", createdAt: "2026-11-01T00:00:00Z" }, "2026-11-11")).toBe("0.0000000");
		expect(monthlyPace({ savedAmount: "300", createdAt: "2026-11-01T00:00:00Z" }, "2026-11-11")).toBe("300.0000000");
		const p = Number(monthlyPace({ savedAmount: "300", createdAt: "2026-08-11T00:00:00Z" }, "2026-11-11"));
		expect(p).toBeGreaterThan(98);
		expect(p).toBeLessThan(101);
	});
});
