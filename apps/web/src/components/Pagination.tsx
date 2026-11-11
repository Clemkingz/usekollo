import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

/** "‹ 1 2 3 ›" (dashboard design): the current page is a black circle. Shows up to 5 pages around the current one. */
export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
	if (pages <= 1) return null;
	const start = Math.max(1, Math.min(page - 2, pages - 4));
	const shown = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i);
	const arrow =
		"flex size-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 disabled:opacity-30";
	return (
		<nav aria-label="Pagination" className="flex items-center gap-1">
			<button type="button" className={arrow} onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous page">
				<ChevronLeft className="size-4" />
			</button>
			{shown.map((n) => (
				<button
					key={n}
					type="button"
					onClick={() => onChange(n)}
					aria-current={n === page ? "page" : undefined}
					className={cn(
						"flex size-8 items-center justify-center rounded-full text-sm tabular-nums transition-colors",
						n === page ? "bg-ink text-white" : "text-ink hover:bg-ink/5",
					)}
				>
					{n}
				</button>
			))}
			<button type="button" className={arrow} onClick={() => onChange(page + 1)} disabled={page === pages} aria-label="Next page">
				<ChevronRight className="size-4" />
			</button>
		</nav>
	);
}
