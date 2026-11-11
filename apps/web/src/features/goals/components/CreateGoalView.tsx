"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Info, Plus } from "lucide-react";
import { formatFixed, isValidAmount } from "@repo/domain/money";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { routes } from "@/lib/routes";
import { keys, queryClient } from "@/lib/query-client";
import { ASSETS, assetById } from "@/lib/stellar/config";
import { notify } from "@/lib/use-toast";
import { Badge } from "@/components/Badge";
import { Breadcrumb } from "@/components/Breadcrumb";
import { TextField } from "@/components/forms/TextField";
import { goalsApi } from "@/features/goals/api";
import { createGoalSchema, type CreateGoalInput } from "@/features/goals/schema";
import { PillField, pillInput } from "@/features/goals/components/PillField";
import { signAndSubmit, WalletDeclinedError } from "@/features/savings/hooks";
import { TxSteps, type TxStage } from "@/features/savings/components/TxSteps";
import { AssetReadiness, useAssetReadiness } from "@/features/wallet/components/AssetReadiness";
import { useConnectedWallet, useRequireWallet } from "@/features/wallet/hooks";

const FORM_ID = "create-goal";
const USDC = ASSETS.find((a) => a.code === "USDC")!;

/** XLM the goal's account keeps as its minimum balance (API: 1.5 for XLM goals, 2 for issued assets). */
const reserveFor = (assetId: string) => (assetById(assetId)?.issuer ? "2" : "1.5");

/** "2026-12-31" → "31/12/2026"; empty → the design's "--/--/----". */
const previewDate = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split("-").reverse().join("/") : "--/--/----");

/**
 * Create Savings Goal (PRD screen 5, design): a live preview card beside the form, and "Create New Goal" below.
 * Creating a goal opens its own Stellar account, owned by the user's wallet: the wallet approves it, and the account's
 * minimum balance (shown) comes back when the goal is closed. If the wallet declines, the goal waits on its page.
 */
export function CreateGoalView() {
	const router = useRouter();
	const { canSign } = useConnectedWallet();
	const requireWallet = useRequireWallet();
	const [stage, setStage] = useState<TxStage | null>(null);
	const form = useForm<CreateGoalInput>({
		resolver: zodResolver(createGoalSchema),
		defaultValues: { name: "", assetId: USDC.id, targetAmount: "", targetDate: "" },
	});
	const [name, targetAmount, assetId, targetDate] = useWatch({
		control: form.control,
		name: ["name", "targetAmount", "assetId", "targetDate"],
	});
	const readiness = useAssetReadiness(assetId);
	const title = name.trim() || "Untitled Goal";
	const code = assetById(assetId)?.code ?? "";
	const busy = stage !== null && stage !== "failed";

	async function create(values: CreateGoalInput) {
		setStage("prepare");
		let goalId: string | null = null;
		try {
			const { goal, transaction } = await goalsApi.create({
				name: values.name,
				asset: values.assetId,
				targetAmount: values.targetAmount.trim(),
				targetDate: values.targetDate,
			});
			goalId = goal.id;
			void queryClient.invalidateQueries({ queryKey: keys.goals });
			setStage("approve");
			const outcome = await signAndSubmit(goal.id, transaction, () => setStage("confirm"));
			if (outcome.status === "confirmed") notify.success("Goal created", `${values.name} is open. Start adding savings.`);
			else if (outcome.status === "pending")
				notify.info("Opening your goal", "The network is taking a moment; it opens on its own.");
			else notify.error("Your goal couldn’t be opened", outcome.reason);
			router.push(routes.goal(goal.id));
		} catch (error) {
			setStage(null);
			if (goalId) {
				// The goal exists but isn't open: its page offers to finish.
				notify.info(
					"Goal saved, not opened yet",
					error instanceof WalletDeclinedError
						? "You declined in your wallet. Open it from the goal page whenever you’re ready."
						: "Open it from the goal page whenever you’re ready.",
				);
				router.push(routes.goal(goalId));
			} else notify.fromError(error);
		}
	}

	const onSubmit = form.handleSubmit((values) => {
		if (canSign) return create(values);
		requireWallet(() => void create(values), "Connect your wallet to open this goal.");
	});

	return (
		<div className="flex flex-col gap-6 md:gap-8">
			<Breadcrumb current={title} back={routes.goals} backLabel="Home" />

			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,455px)] lg:gap-4">
				{/* Preview */}
				<section aria-label="Preview" className="animate-rise flex flex-col rounded-[20px] bg-white p-6 md:p-6">
					<h1 className="truncate border-b border-line pb-2.5 text-xl text-ink">{title}</h1>
					<p className="mt-6 text-xs text-ink uppercase">Target amount</p>
					<p className="mt-1 flex items-baseline gap-2.5 border-b border-line pb-8 text-ink">
						<span className="truncate text-[40px] leading-tight font-light tabular-nums md:text-[46px]">
							{isValidAmount(targetAmount ?? "") ? formatFixed(targetAmount) : "0.00"}
						</span>
						<span className="font-mono text-base">{code}</span>
					</p>
					<div className="mt-3 flex items-end justify-between gap-4">
						<div>
							<p className="text-xs text-ink uppercase">Target date</p>
							<p className="mt-1.5 font-mono text-lg text-ink tabular-nums">{previewDate(targetDate)}</p>
						</div>
						<Badge tone="blue">Draft</Badge>
					</div>
					<p className="mt-auto flex gap-2.5 pt-8 text-[13px] leading-5 text-ink/55">
						<Info className="mt-0.5 size-4 shrink-0 text-primary-500" aria-hidden />
						<span>
							Your goal gets its own Stellar account that only your wallet controls. Opening it sets aside{" "}
							<strong className="font-medium text-ink">{reserveFor(assetId)} XLM</strong> from your wallet, returned when you
							close the goal.
						</span>
					</p>
				</section>

				{/* Form */}
				<form
					id={FORM_ID}
					onSubmit={onSubmit}
					noValidate
					className="animate-rise flex flex-col gap-6 rounded-[20px] bg-white p-6"
					style={{ "--i": 1 } as React.CSSProperties}
				>
					<TextField control={form.control} name="name" label="Goal Name" placeholder="e.g. New Laptop" />
					<TextField control={form.control} name="targetAmount" label="Target Amount" inputMode="decimal" placeholder="0.00" />
					<Controller
						control={form.control}
						name="assetId"
						render={({ field, fieldState }) => (
							<PillField label="Asset" id="goal-asset" error={fieldState.error?.message}>
								<select
									id="goal-asset"
									value={field.value}
									onChange={field.onChange}
									onBlur={field.onBlur}
									className={cn(pillInput(), "appearance-none pr-12")}
								>
									{ASSETS.map((a) => (
										<option key={a.id} value={a.id}>
											{a.code}
										</option>
									))}
								</select>
								<ChevronDown
									className="pointer-events-none absolute top-1/2 right-5 size-5 -translate-y-1/2 text-ink/60"
									aria-hidden
								/>
							</PillField>
						)}
					/>
					<AssetReadiness assetId={assetId} />
					<Controller
						control={form.control}
						name="targetDate"
						render={({ field, fieldState }) => (
							<PillField label="Target Date" id="goal-date" error={fieldState.error?.message}>
								<input
									id="goal-date"
									type="date"
									value={field.value}
									onChange={field.onChange}
									onBlur={field.onBlur}
									aria-invalid={fieldState.error ? true : undefined}
									className={cn(pillInput(!!fieldState.error), !field.value && "text-field")}
								/>
							</PillField>
						)}
					/>
				</form>
			</div>

			{stage && stage !== "failed" && (
				<TxSteps stage={stage} className="animate-rise rounded-[20px] bg-white p-5 sm:max-w-[455px]" />
			)}

			<Button
				type="submit"
				form={FORM_ID}
				size="lg"
				className="h-[55px] w-full text-lg sm:w-auto sm:min-w-[242px] sm:self-start lg:text-lg"
				disabled={readiness.state === "unfunded" || readiness.state === "untrusted"}
				isLoading={busy}
				loadingLabel={stage === "approve" ? "Approve in your wallet" : "Creating goal"}
			>
				<Plus className="size-5" /> Create New Goal
			</Button>
		</div>
	);
}
