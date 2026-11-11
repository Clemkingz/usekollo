/**
 * Inside the app (header and sidebar stay put) while a page's code loads: a neutral page shape (breadcrumb, a main
 * card, a list) so the switch feels instant. Pages then show their own data skeletons.
 */
export default function Loading() {
	return (
		<div role="status" aria-label="Loading" className="flex flex-col gap-6 md:gap-8">
			<span className="skeleton-shimmer block h-5 w-48 rounded-full" />
			<div className="flex h-[240px] items-center gap-8 rounded-[20px] bg-white p-6 md:p-8">
				<span className="skeleton-shimmer hidden size-[150px] shrink-0 rounded-full md:block" />
				<div className="flex-1 space-y-4">
					<span className="skeleton-shimmer block h-3 w-28 rounded-full" />
					<span className="skeleton-shimmer block h-10 w-2/3 max-w-[320px] rounded-full" />
					<span className="skeleton-shimmer block h-4 w-1/3 rounded-full" />
				</div>
			</div>
			<div className="space-y-2.5">
				{[0, 1, 2].map((i) => (
					<span key={i} className="skeleton-shimmer block h-[64px] rounded-2xl bg-white" />
				))}
			</div>
		</div>
	);
}
