"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { Button } from "@repo/ui/button";
import { routes } from "@/lib/routes";
import { Logo } from "@/components/Logo";
import { StatusArt } from "@/components/StatusArt";

/**
 * A page outside the app area threw. Says so plainly, reassures that no funds moved, and offers a retry (Next 16
 * passes `retry`) and a way home. Never shows stack traces; the digest is a support reference.
 */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex min-h-dvh flex-col bg-page">
			<header className="app-container flex h-16 items-center md:h-20">
				<Logo />
			</header>
			<main className="app-container flex flex-1 flex-col items-center justify-center pb-20 text-center">
				<StatusArt variant="error" className="animate-pop" />
				<h1 className="animate-rise mt-8 font-display text-3xl text-ink md:text-4xl" style={{ "--i": 1 } as React.CSSProperties}>
					Something went wrong
				</h1>
				<p className="animate-rise mt-3 max-w-[440px] text-ink/60" style={{ "--i": 2 } as React.CSSProperties}>
					This page hit a problem on our side. Your funds are safe in your wallet and nothing was sent. Try again in a moment.
				</p>
				{error.digest && <p className="mt-2 font-mono text-xs text-ink/35">Reference: {error.digest}</p>}
				<div
					className="animate-rise mt-8 flex w-full max-w-[420px] flex-col gap-3 sm:flex-row"
					style={{ "--i": 3 } as React.CSSProperties}
				>
					<Button onClick={retry} className="sm:flex-1">
						<RotateCw className="size-4" /> Try again
					</Button>
					<Button asChild variant="outline" className="sm:flex-1">
						<Link href={routes.home}>Back home</Link>
					</Button>
				</div>
			</main>
		</div>
	);
}
