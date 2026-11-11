import { cn } from "@repo/ui/lib/utils";

/**
 * The dashboard's shape while goals load: balance card, three goal rows, the activity table. Matches the real layout
 * so nothing jumps when data lands.
 */
export function DashboardSkeleton({ className }: { className?: string }) {
	return (
		<div role="status" aria-label="Loading your goals" className={cn("flex flex-col gap-6 md:gap-7", className)}>
			<div className="grid gap-6 xl:grid-cols-[minmax(0,837fr)_minmax(0,958fr)] xl:gap-[14px]">
				<div className="flex h-[250px] flex-col justify-between rounded-[18px] bg-primary-500/90 p-6 md:h-[300px] md:rounded-[20px]">
					<div className="space-y-3">
						<span className="skeleton-shimmer block h-3 w-24 rounded-full bg-white/25" />
						<span className="skeleton-shimmer block h-10 w-48 rounded-full bg-white/25" />
					</div>
					<span className="skeleton-shimmer block h-2.5 w-full rounded-full bg-white/25" />
				</div>
				<div className="flex flex-col gap-2.5">
					<span className="skeleton-shimmer block h-4 w-40 rounded-full" />
					{[0, 1, 2].map((i) => (
						<div key={i} className="flex h-[68px] items-center gap-4 rounded-2xl bg-white px-3.5">
							<span className="skeleton-shimmer size-10 rounded-full md:size-12" />
							<span className="flex-1 space-y-2">
								<span className="skeleton-shimmer block h-3.5 w-1/2 rounded-full" />
								<span className="skeleton-shimmer block h-3 w-1/3 rounded-full" />
							</span>
							<span className="skeleton-shimmer h-6 w-16 rounded-full" />
						</div>
					))}
				</div>
			</div>
			<div className="space-y-3">
				<span className="skeleton-shimmer block h-4 w-24 rounded-full" />
				<div className="space-y-px overflow-hidden rounded-[18px] bg-white">
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className="flex items-center gap-4 px-6 py-4">
							<span className="skeleton-shimmer size-2 rounded-full" />
							<span className="skeleton-shimmer h-3 w-28 rounded-full" />
							<span className="skeleton-shimmer ml-auto h-3 w-20 rounded-full" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
