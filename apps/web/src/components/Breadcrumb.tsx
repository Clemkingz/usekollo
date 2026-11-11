import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { routes } from "@/lib/routes";

/** "← Home / Untitled Goal" (goal designs): the back circle and Home go to `back` (the dashboard by default). */
export function Breadcrumb({
	current,
	back = routes.dashboard,
	backLabel = "Home",
}: {
	current: string;
	back?: string;
	backLabel?: string;
}) {
	return (
		<nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-3 text-base md:text-lg">
			<Link
				href={back}
				aria-label={`Back to ${backLabel}`}
				className="flex size-[26px] shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink/40 transition-colors hover:border-ink/40 hover:text-ink"
			>
				<ArrowLeft className="size-3.5" />
			</Link>
			<ol className="flex min-w-0 items-center gap-3">
				<li>
					<Link href={back} className="text-ink/40 transition-colors hover:text-ink">
						{backLabel}
					</Link>
				</li>
				<li aria-hidden className="text-ink/20">
					/
				</li>
				<li aria-current="page" className="truncate text-ink">
					{current}
				</li>
			</ol>
		</nav>
	);
}
