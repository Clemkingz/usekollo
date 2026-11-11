import type { ReactNode } from "react";
import { CloudOff, Inbox } from "lucide-react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";

/** Empty and error states (every list has a clear empty state; errors always offer a way forward). */

export function EmptyState({
	icon,
	title,
	description,
	action,
	className,
}: {
	icon?: ReactNode;
	title: string;
	description?: ReactNode;
	action?: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("animate-rise flex flex-col items-center rounded-[20px] px-6 py-14 text-center", className)}>
			<span className="animate-pop flex size-[72px] items-center justify-center rounded-full bg-[#f4f4f4] text-ink">
				{icon ?? <Inbox className="size-6" strokeWidth={2.25} aria-hidden />}
			</span>
			<h2 className="mt-6 text-xl text-ink">{title}</h2>
			{description && <p className="mt-2 max-w-[380px] text-sm leading-6 text-ink/55">{description}</p>}
			{action && <div className="mt-6">{action}</div>}
		</div>
	);
}

/**
 * Something couldn't load. Plain sentence (the API's messages are written for people), a retry, and optionally
 * another way forward. Never shows codes or stack traces.
 */
export function ErrorState({
	title = "Something went wrong",
	message,
	onRetry,
	retrying,
	action,
	className,
}: {
	title?: string;
	message: string;
	onRetry?: () => void;
	retrying?: boolean;
	action?: ReactNode;
	className?: string;
}) {
	return (
		<div
			role="alert"
			className={cn("animate-rise flex flex-col items-center justify-center rounded-[20px] px-6 py-14 text-center", className)}
		>
			<span className="animate-pop flex size-[72px] items-center justify-center rounded-full bg-[#fdeeee] text-[#e5372f]">
				<CloudOff className="size-7" strokeWidth={2} aria-hidden />
			</span>
			<h2 className="mt-6 text-xl text-ink">{title}</h2>
			<p className="mt-2 max-w-[380px] text-sm leading-6 text-ink/60">{message}</p>
			{(onRetry || action) && (
				<div className="mt-7 flex flex-wrap justify-center gap-3">
					{onRetry && (
						<Button size="md" className="min-w-[140px]" onClick={onRetry} isLoading={retrying} loadingLabel="Retrying">
							Try again
						</Button>
					)}
					{action}
				</div>
			)}
		</div>
	);
}
