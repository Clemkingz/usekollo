import { describe, expect, it } from "vitest";
import type { Goal } from "./types";
import { formatAmount, isValidAmount, progressPercent, subtract, sum, toStroops } from "./money";
import { goalBadge, isOpen, monthlyPace, ongoingProgress } from "./goal-status";

const USDC = "USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

const goal = (over: Partial<Goal>): Goal => ({
	id: "g1",
	name: "New Laptop",
	assetId: USDC,
	assetCode: "USDC",
	targetAmount: "500",
	savedAmount: "0",
	remainingAmount: "500",
	progress: 0,
	targetDate: "2026-12-31",
	daysLeft: 50,
	status: "active",
	targetReached: false,
	canWithdraw: false,
	canClose: true,
	accountAddress: "GGOAL",
	ownerAddress: "GOWNER",
	explorerUrl: "",
	reserveXlm: "2",
	syncedAt: null,
	reachedAt: null,
	closedAt: null,
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
	it("treats only active, completed and overdue goals as open", () => {
		expect(isOpen(goal({ status: "active" }))).toBe(true);
		expect(isOpen(goal({ status: "completed" }))).toBe(true);
		expect(isOpen(goal({ status: "overdue" }))).toBe(true);
		expect(isOpen(goal({ status: "pending" }))).toBe(false);
		expect(isOpen(goal({ status: "closed" }))).toBe(false);
	});
});

describe("dashboard", () => {
	it("badges goals: setup, closed, done, urgent within 14 days or overdue, else running", () => {
		expect(goalBadge(goal({ status: "pending" }))).toBe("setup");
		expect(goalBadge(goal({ status: "closed", targetReached: true }))).toBe("closed");
		expect(goalBadge(goal({ status: "completed", targetReached: true, daysLeft: 1 }))).toBe("done");
		expect(goalBadge(goal({ status: "active", targetReached: true, daysLeft: 1 }))).toBe("done");
		expect(goalBadge(goal({ status: "active", daysLeft: 9 }))).toBe("urgent");
		expect(goalBadge(goal({ status: "overdue", daysLeft: -10 }))).toBe("urgent");
		expect(goalBadge(goal({ status: "active", daysLeft: 50 }))).toBe("running");
	});
	it("sums progress per asset and finds the next goal's remaining amount", () => {
		const a = goal({ savedAmount: "250", remainingAmount: "250" });
		const b = goal({ id: "g2", targetAmount: "3000", savedAmount: "2700", remainingAmount: "300" });
		const xlm = goal({ id: "g3", assetId: "XLM", assetCode: "XLM" });
		const closed = goal({ id: "g4", status: "closed", targetAmount: "99999" });
		const p = ongoingProgress([a, b, xlm, closed], USDC)!;
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
