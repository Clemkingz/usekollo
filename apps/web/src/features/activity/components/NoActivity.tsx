import { Clock3 } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

/** "No Activity Yet" (Goal Details and Activity designs): clock in a grey circle, title, one line of help. */
export function NoActivity({ description, className }: { description: string; className?: string }) {
	return (
		<div className={cn("flex flex-col items-center rounded-[20px] bg-white px-6 py-10 text-center md:py-[72px]", className)}>
			<span className="flex size-[72px] items-center justify-center rounded-full bg-[#f4f4f4]">
				<Clock3 className="size-6 text-ink" strokeWidth={2.25} aria-hidden />
			</span>
			<h2 className="mt-6 text-xl text-ink">No Activity Yet</h2>
			<p className="mt-2 max-w-[360px] text-sm leading-snug text-ink/40">{description}</p>
		</div>
	);
}
