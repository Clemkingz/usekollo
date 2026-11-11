import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";
import { withBasePath } from "@/lib/site";

/**
 * The usekollo logo, extracted from the landing design (ink on transparent). TODO(design): swap in the SVG export.
 * - `full`: mark + wordmark (landing header and footer).
 * - `wordmark`: wordmark only, as on the auth pages.
 * `tone="light"` renders it white for dark or photo backgrounds.
 */
export function Logo({
	className,
	href = "/",
	variant = "full",
	tone = "dark",
}: {
	className?: string;
	href?: string;
	variant?: "full" | "wordmark";
	tone?: "dark" | "light";
}) {
	const src = variant === "full" ? "/images/logo.png" : "/images/wordmark.png";
	const [w, h] = variant === "full" ? [363, 68] : [276, 61];
	return (
		<Link href={href} aria-label="UseKollo home" className={cn("inline-flex shrink-0 items-center", className)}>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={withBasePath(src)}
				alt="usekollo"
				width={w}
				height={h}
				className={cn("h-7 w-auto md:h-[34px]", tone === "light" && "brightness-0 invert")}
			/>
		</Link>
	);
}
