"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Clock3, Search, SlidersHorizontal, SquareArrowOutUpRight, X } from "lucide-react";
import type { Activity, ActivityKind, TxStatus } from "@repo/domain/types";
import { TX_STATUS_LABEL } from "@repo/domain/labels";
import { formatFixed } from "@repo/domain/money";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { cn } from "@repo/ui/lib/utils";
import { assetById, explorer, shortKey } from "@/lib/stellar/config";
import { Badge, type BadgeTone } from "@/components/Badge";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/States";

/**
 * Activity (dashboard design). Desktop: search "hash, type, or asset", All / Success / Failed, a type filter, then the
 * table (TX / HASH · OPERATION · DATE / TIME · AMOUNT · STATUS · ACTION) and "Showing 1 to 4 of 10 transactions".
 * Phones: the same rows as cards. `compact` (dashboard on phones) hides the controls.
 */

type Segment = "all" | "success" | "failed";

const STATUS_TONE: Record<TxStatus, BadgeTone> = { confirmed: "blue", pending: "grey", failed: "red", unknown: "amber" };
const DOT: Record<TxStatus, string> = {
	confirmed: "bg-[#2dbd5a]",
	pending: "bg-[#2dbd5a]",
	failed: "bg-[#e5372f]",
	unknown: "bg-warning-500",
};

const code = (a: Activity) => assetById(a.assetId)?.code ?? a.assetId;
const amountText = (a: Activity) => `${a.kind === "withdrawal" ? "−" : "+"}${formatFixed(a.amount)} ${code(a)}`;

/** "Deposit to Laptop" / "Withdrawal" (desktop operation column). */
function operation(a: Activity, goalName?: string) {
	return a.kind === "deposit" ? `Deposit to ${goalName ?? "goal"}` : goalName ? `Withdrawal from ${goalName}` : "Withdrawal";
}

/** Phone card titles from the design: "Deposit to Laptop", "Deposit Pending", "Failed Deposit". */
function cardTitle(a: Activity, goalName?: string) {
	const kind = a.kind === "deposit" ? "Deposit" : "Withdrawal";
	if (a.status === "pending") return `${kind} Pending`;
	if (a.status === "failed") return `Failed ${kind}`;
	return operation(a, goalName);
}

const utc = (iso: string) =>
	`${new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" })} UTC`;
const local = (iso: string) => {
	const d = new Date(iso);
	return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
};

export function ActivityFeed({
	items,
	goalName,
	pageSize = 10,
	compact = false,
	controls = true,
	className,
}: {
	items: Activity[];
	goalName?: (goalId: string) => string | undefined;
	pageSize?: number;
	compact?: boolean;
	/** Search, status tabs and filter (off on Savings Goals, which has its own filters). */
	controls?: boolean;
	className?: string;
}) {
	const [query, setQuery] = useState("");
	const [segment, setSegment] = useState<Segment>("all");
	const [kinds, setKinds] = useState<Record<ActivityKind, boolean>>({ deposit: true, withdrawal: true });
	const [page, setPage] = useState(1);

	const q = query.trim().toLowerCase();
	const filtered = items.filter((a) => {
		if (segment === "success" && a.status !== "confirmed") return false;
		if (segment === "failed" && a.status !== "failed") return false;
		if (!kinds[a.kind]) return false;
		if (!q) return true;
		const name = goalName?.(a.goalId);
		return [a.txHash ?? "", operation(a, name), a.kind, code(a), TX_STATUS_LABEL[a.status]].some((v) =>
			v.toLowerCase().includes(q),
		);
	});
	const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
	const current = Math.min(page, pages);
	const shown = filtered.slice((current - 1) * pageSize, current * pageSize);
	const reset =
		<T,>(set: (v: T) => void) =>
		(v: T) => {
			set(v);
			setPage(1);
		};

	if (items.length === 0)
		return (
			<EmptyState
				className={cn("bg-white", className)}
				title="No activity yet"
				description="Savings you add and withdrawals show up here."
			/>
		);

	return (
		<div className={className}>
			<div className={cn("flex flex-col gap-3 md:flex-row md:items-center", compact && "max-md:hidden", !controls && "hidden")}>
				<label className="flex h-[38px] flex-1 items-center gap-2.5 rounded-full bg-white px-4 focus-within:ring-2 focus-within:ring-primary-500/20">
					<Search className="size-4 shrink-0 text-ink/40" aria-hidden />
					<span className="sr-only">Search activity</span>
					<input
						value={query}
						onChange={(e) => reset(setQuery)(e.target.value)}
						placeholder="Search hash, type, or asset..."
						className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
					/>
					{query && (
						<button
							type="button"
							onClick={() => reset(setQuery)("")}
							aria-label="Clear search"
							className="text-ink/40 hover:text-ink"
						>
							<X className="size-4" />
						</button>
					)}
				</label>
				<div className="flex items-center gap-2 md:ml-auto md:gap-3">
					<div role="tablist" aria-label="Status" className="flex rounded-full bg-white p-1">
						{(["all", "success", "failed"] as const).map((s) => (
							<button
								key={s}
								type="button"
								role="tab"
								aria-selected={segment === s}
								onClick={() => reset(setSegment)(s)}
								className={cn(
									"h-[30px] rounded-full px-3.5 text-sm capitalize transition-colors",
									segment === s ? "bg-ink text-white" : "text-ink/45 hover:text-ink",
								)}
							>
								{s}
							</button>
						))}
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="flex h-[38px] items-center gap-2 rounded-full bg-white px-4 text-sm text-ink/45 transition-colors hover:text-ink"
							>
								<SlidersHorizontal className="size-4 text-ink" aria-hidden /> Filter
								{!(kinds.deposit && kinds.withdrawal) && (
									<span className="size-1.5 rounded-full bg-primary-500" aria-label="(active)" />
								)}
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-52 border-line bg-white text-ink">
							<DropdownMenuLabel className="text-xs font-normal text-ink/55">Type</DropdownMenuLabel>
							{(["deposit", "withdrawal"] as const).map((k) => (
								<DropdownMenuCheckboxItem
									key={k}
									checked={kinds[k]}
									onCheckedChange={(v) => reset(setKinds)({ ...kinds, [k]: v === true })}
									className="cursor-pointer focus:bg-primary-50"
								>
									{k === "deposit" ? "Deposits" : "Withdrawals"}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{filtered.length === 0 ? (
				<p className="mt-3 rounded-[18px] bg-white px-6 py-10 text-center text-sm text-ink/55">No transactions match.</p>
			) : (
				<>
					{/* Desktop table */}
					<div className="mt-3 hidden overflow-x-auto rounded-[18px] bg-white md:block">
						<table className="w-full min-w-[760px] text-left text-sm text-ink">
							<thead>
								<tr className="text-[11px] text-ink/40 uppercase">
									<th className="px-6 py-3.5 font-normal">Tx / Hash</th>
									<th className="px-3 py-3.5 font-normal">Operation</th>
									<th className="px-3 py-3.5 font-normal">Date / Time</th>
									<th className="px-3 py-3.5 text-right font-normal">Amount</th>
									<th className="px-6 py-3.5 font-normal">Status</th>
									<th className="px-6 py-3.5 text-right font-normal">Action</th>
								</tr>
							</thead>
							<tbody>
								{shown.map((a) => (
									<tr key={a.id} className="border-t border-line">
										<td className="px-6 py-3.5">
											<span className="flex items-center gap-2.5">
												<span className={cn("size-2 shrink-0 rounded-full", DOT[a.status])} aria-hidden />
												<span className="tabular-nums" title={a.txHash ?? undefined}>
													{a.txHash ? shortKey(a.txHash, 6, 4).replace("…", "...") : "—"}
												</span>
											</span>
										</td>
										<td className="px-3 py-3.5">{operation(a, goalName?.(a.goalId))}</td>
										<td className="px-3 py-3.5 whitespace-nowrap">{utc(a.createdAt)}</td>
										<td
											className={cn(
												"px-3 py-3.5 text-right whitespace-nowrap tabular-nums",
												a.status === "pending" && "text-primary-500",
											)}
										>
											{amountText(a)}
										</td>
										<td className="px-6 py-3.5">
											<Badge tone={STATUS_TONE[a.status]}>{TX_STATUS_LABEL[a.status]}</Badge>
										</td>
										<td className="px-6 py-3.5 text-right">
											{a.txHash ? (
												<a
													href={explorer.tx(a.txHash)}
													target="_blank"
													rel="noreferrer"
													aria-label="View transaction on Stellar Expert (opens in a new tab)"
													className="inline-flex size-8 items-center justify-center rounded-full text-ink/35 transition-colors hover:bg-ink/5 hover:text-ink"
												>
													<SquareArrowOutUpRight className="size-[18px]" />
												</a>
											) : null}
										</td>
									</tr>
								))}
							</tbody>
						</table>
						<Footer total={filtered.length} from={(current - 1) * pageSize + 1} to={(current - 1) * pageSize + shown.length}>
							<Pagination page={current} pages={pages} onChange={setPage} />
						</Footer>
					</div>

					{/* Phone cards */}
					<ul className="mt-3 flex flex-col gap-2.5 md:hidden">
						{shown.map((a) => (
							<li key={a.id}>
								<ActivityCard a={a} goalName={goalName?.(a.goalId)} />
							</li>
						))}
					</ul>
					{!compact && (
						<div className="mt-3 flex flex-col items-center gap-2 md:hidden">
							<Pagination page={current} pages={pages} onChange={setPage} />
						</div>
					)}
				</>
			)}
		</div>
	);
}

function Footer({ total, from, to, children }: { total: number; from: number; to: number; children: React.ReactNode }) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-3 text-sm text-ink">
			<p>
				Showing {from} to {to} of {total} transaction{total === 1 ? "" : "s"}
			</p>
			{children}
		</div>
	);
}

/** Phone row (design): icon circle · title + date · amount + status. */
function ActivityCard({ a, goalName }: { a: Activity; goalName?: string }) {
	const icon =
		a.status === "failed" ? (
			<span className="flex size-[34px] items-center justify-center rounded-full bg-[#ffe6e6] text-[#d81b1b]">
				<X className="size-4" strokeWidth={3} />
			</span>
		) : a.status === "pending" || a.status === "unknown" ? (
			<span className="flex size-[34px] items-center justify-center rounded-full bg-warning-50 text-warning-700">
				<Clock3 className="size-4" strokeWidth={2.5} />
			</span>
		) : a.kind === "deposit" ? (
			<span className="flex size-[34px] items-center justify-center rounded-full bg-primary-100/70 text-primary-700">
				<ArrowDownLeft className="size-4" strokeWidth={3} />
			</span>
		) : (
			<span className="flex size-[34px] items-center justify-center rounded-full bg-[#ececec] text-ink">
				<ArrowUpRight className="size-4" strokeWidth={3} />
			</span>
		);
	const color = a.status === "failed" ? "text-[#e5372f]" : a.kind === "deposit" ? "text-primary-500" : "text-ink";
	const body = (
		<div className="flex items-center gap-3.5 rounded-2xl bg-white px-4 py-3.5">
			<span aria-hidden>{icon}</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-[15px] text-ink">{cardTitle(a, goalName)}</span>
				<span className="block text-xs text-[#b3b3b3]">{local(a.createdAt)}</span>
			</span>
			<span className="flex shrink-0 flex-col items-end gap-1">
				<span className={cn("text-[15px] tabular-nums", color)}>{amountText(a)}</span>
				<Badge tone={STATUS_TONE[a.status]} className="h-5 text-[10px]">
					{TX_STATUS_LABEL[a.status]}
				</Badge>
			</span>
		</div>
	);
	return a.txHash ? (
		<a
			href={explorer.tx(a.txHash)}
			target="_blank"
			rel="noreferrer"
			className="block"
			aria-label={`${cardTitle(a, goalName)}: view on Stellar Expert`}
		>
			{body}
		</a>
	) : (
		body
	);
}
