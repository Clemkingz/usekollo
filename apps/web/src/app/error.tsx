"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { Button } from "@repo/ui/button";
import { routes } from "@/lib/routes";

/** A page threw. Say so plainly, offer a retry (Next 16 passes `retry`) and a way home. Never shows stack traces. */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="app-container flex min-h-[70dvh] flex-col items-center justify-center py-16 text-center">
			<h1 className="font-display text-3xl font-bold md:text-4xl">Something went wrong</h1>
			<p className="mt-3 max-w-[440px] text-ink/65">
				This page hit a problem. Nothing was sent from your wallet. Try again, or go back to your dashboard.
			</p>
			{error.digest && <p className="mt-2 text-xs text-ink/40">Reference: {error.digest}</p>}
			<div className="mt-8 flex w-full max-w-[400px] flex-col gap-3 sm:flex-row">
				<Button onClick={retry} className="sm:flex-1">
					<RotateCw className="size-4" /> Try again
				</Button>
				<Button asChild variant="outline" className="sm:flex-1">
					<Link href={routes.dashboard}>Dashboard</Link>
				</Button>
			</div>
		</div>
	);
}
