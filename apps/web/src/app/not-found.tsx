import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Logo } from "@/components/Logo";
import { StatusArt } from "@/components/StatusArt";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** 404: an empty goal ring, "0% found", and the two ways forward (dashboard for members, home for visitors). */
export default function NotFound() {
	return (
		<div className="flex min-h-dvh flex-col bg-page">
			<header className="app-container flex h-16 items-center md:h-20">
				<Logo />
			</header>
			<main className="app-container flex flex-1 flex-col items-center justify-center pb-20 text-center">
				<StatusArt variant="not-found" className="animate-pop" />
				<h1
					className="animate-rise mt-8 font-display text-3xl text-navy md:text-[44px]"
					style={{ "--i": 1 } as React.CSSProperties}
				>
					This page isn’t part of any goal
				</h1>
				<p className="animate-rise mt-3 max-w-[460px] text-ink/60" style={{ "--i": 2 } as React.CSSProperties}>
					The link may be mistyped, or the page has moved. Your savings are right where you left them.
				</p>
				<div
					className="animate-rise mt-8 flex w-full max-w-[420px] flex-col gap-3 sm:flex-row"
					style={{ "--i": 3 } as React.CSSProperties}
				>
					<Button asChild className="sm:flex-1">
						<Link href={routes.dashboard}>Go to dashboard</Link>
					</Button>
					<Button asChild variant="outline" className="sm:flex-1">
						<Link href={routes.home}>Back home</Link>
					</Button>
				</div>
			</main>
		</div>
	);
}
