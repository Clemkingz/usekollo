import { cn } from "@repo/ui/lib/utils";

/** Classes for a native control (select, date) styled as the design's 52px pill input. */
export const pillInput = (invalid = false) =>
	cn(
		"h-[52px] w-full rounded-full border border-field bg-white px-6 text-base text-ink focus-visible:border-primary-500 focus-visible:ring-4 focus-visible:ring-primary-500/10 focus-visible:outline-none",
		invalid && "border-error-400",
	);

/** Label + pill control + error, matching `InputField` for controls it doesn't cover (select, date). */
export function PillField({
	label,
	id,
	error,
	children,
}: {
	label: string;
	id: string;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2.5">
			<label htmlFor={id} className="text-[15px] text-ink">
				{label}
			</label>
			<div className="relative">{children}</div>
			{error && (
				<p role="alert" className="animate-pop px-2 text-sm text-error-400">
					{error}
				</p>
			)}
		</div>
	);
}
