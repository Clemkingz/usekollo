"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Plus } from "lucide-react";
import { formatFixed, isValidAmount } from "@repo/domain/money";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { routes } from "@/lib/routes";
import { ASSETS, assetById } from "@/lib/stellar/config";
import { notify } from "@/lib/use-toast";
import { Badge } from "@/components/Badge";
import { Breadcrumb } from "@/components/Breadcrumb";
import { TextField } from "@/components/forms/TextField";
import { useConnectedWallet } from "@/features/wallet/hooks";
import { useCreateGoal } from "@/features/goals/hooks";
import { createGoalSchema, type CreateGoalInput } from "@/features/goals/schema";

const FORM_ID = "create-goal";
const USDC = ASSETS.find((a) => a.code === "USDC")!;

/** "2026-12-31" → "31/12/2026"; empty → the design's "--/--/----". */
const previewDate = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split("-").reverse().join("/") : "--/--/----");

/**
 * Create Savings Goal (PRD screen 5, design): a live preview card (name, target amount + asset, target date, DRAFT)
 * beside the form, and "Create New Goal" below. Creating a goal moves no funds and needs no signature.
 */
export function CreateGoalView() {
	const router = useRouter();
	const { address } = useConnectedWallet();
	const createGoal = useCreateGoal();
	const form = useForm<CreateGoalInput>({
		resolver: zodResolver(createGoalSchema),
		defaultValues: { name: "", assetId: USDC.id, targetAmount: "", targetDate: "" },
	});
	const [name, targetAmount, assetId, targetDate] = useWatch({
		control: form.control,
		name: ["name", "targetAmount", "assetId", "targetDate"],
	});
	const title = name.trim() || "Untitled Goal";
	const code = assetById(assetId)?.code ?? "";

	const onSubmit = form.handleSubmit((values) => {
		if (!address) return;
		const goal = createGoal(address, values);
		notify.success("Goal created", values.name);
		router.push(routes.goal(goal.id));
	});

	return (
		<div className="flex flex-col gap-6 md:gap-8">
			<Breadcrumb current={title} back={routes.goals} backLabel="Home" />

			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,455px)] lg:gap-4">
				{/* Preview */}
				<section aria-label="Preview" className="rounded-[20px] bg-white p-6 md:p-6">
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
				</section>

				{/* Form */}
				<form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-6 rounded-[20px] bg-white p-6">
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
									className="h-[52px] w-full appearance-none rounded-full border border-field bg-white px-6 pr-12 text-base text-ink focus-visible:border-primary-500 focus-visible:ring-4 focus-visible:ring-primary-500/10 focus-visible:outline-none"
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
									className={cn(
										"h-[52px] w-full rounded-full border border-field bg-white px-6 text-base focus-visible:border-primary-500 focus-visible:ring-4 focus-visible:ring-primary-500/10 focus-visible:outline-none",
										field.value ? "text-ink" : "text-field",
										fieldState.error && "border-error-400",
									)}
								/>
							</PillField>
						)}
					/>
				</form>
			</div>

			<Button
				type="submit"
				form={FORM_ID}
				size="lg"
				className="h-[55px] w-full text-lg sm:w-auto sm:min-w-[242px] sm:self-start lg:text-lg"
				isLoading={form.formState.isSubmitting}
				loadingLabel="Creating goal"
			>
				<Plus className="size-5" /> Create New Goal
			</Button>
		</div>
	);
}

/** Label + pill control + error, matching `InputField` for controls it doesn't cover (select, date). */
function PillField({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-2.5">
			<label htmlFor={id} className="text-[15px] text-ink">
				{label}
			</label>
			<div className="relative">{children}</div>
			{error && (
				<p role="alert" className="px-2 text-sm text-error-400">
					{error}
				</p>
			)}
		</div>
	);
}
