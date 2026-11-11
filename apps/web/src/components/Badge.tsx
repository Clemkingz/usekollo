import { cn } from "@repo/ui/lib/utils";

/** Status pill from the dashboard design: small uppercase label on a tinted pill. */
export type BadgeTone = "blue" | "red" | "grey" | "amber";

const TONES: Record<BadgeTone, string> = {
	blue: "bg-primary-100/70 text-primary-700",
	red: "bg-[#ffe6e6] text-[#e5372f]",
	grey: "bg-[#ececec] text-ink",
	amber: "bg-warning-100 text-warning-800",
};

export function Badge({ tone, children, className }: { tone: BadgeTone; children: React.ReactNode; className?: string }) {
	return (
		<span
			className={cn(
				"inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[11px] whitespace-nowrap uppercase md:h-[26px] md:px-3 md:text-xs",
				TONES[tone],
				className,
			)}
		>
			{children}
		</span>
	);
}
