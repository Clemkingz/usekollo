"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { Button } from "@repo/ui/button";
import { routes } from "@/lib/routes";
import { StatusArt } from "@/components/StatusArt";

/**
 * A page inside the app threw. The header and sidebar stay, so the user can move on; the panel explains, reassures
 * that no funds moved, and offers a retry and the dashboard.
 */
export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<section className="flex flex-1 flex-col items-center justify-center rounded-[24px] bg-white px-6 py-14 text-center md:rounded-[30px]">
			<StatusArt variant="error" className="animate-pop scale-90" />
			<h1 className="animate-rise mt-6 text-2xl text-ink" style={{ "--i": 1 } as React.CSSProperties}>
				This page couldn’t load
			</h1>
			<p className="animate-rise mt-2 max-w-[400px] text-sm leading-6 text-ink/55" style={{ "--i": 2 } as React.CSSProperties}>
				Something went wrong on our side. Your goals and funds are safe; nothing was sent from your wallet.
			</p>
			{error.digest && <p className="mt-2 font-mono text-xs text-ink/35">Reference: {error.digest}</p>}
			<div className="animate-rise mt-7 flex flex-wrap justify-center gap-3" style={{ "--i": 3 } as React.CSSProperties}>
				<Button size="md" className="min-w-[150px]" onClick={retry}>
					<RotateCw className="size-4" /> Try again
				</Button>
				<Button asChild size="md" variant="outline" className="min-w-[150px]">
					<Link href={routes.dashboard}>Dashboard</Link>
				</Button>
			</div>
		</section>
	);
}
