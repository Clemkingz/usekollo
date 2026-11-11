"use client";

import Link from "next/link";
import { LayoutDashboard, UserPlus } from "lucide-react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { routes } from "@/lib/routes";
import { useSession } from "@/features/auth/hooks";

/**
 * Sign up + Sign in, wherever the design had "Connect Wallet". Signed in: one "Go to dashboard" button instead.
 * `tone="onBlue"` is for the blue CTA banner; `size="header"` for the top bar.
 */
export function AuthButtons({
	size = "hero",
	tone = "default",
	className,
}: {
	size?: "header" | "hero";
	tone?: "default" | "onBlue";
	className?: string;
}) {
	const { ready, user } = useSession();
	const header = size === "header";
	const btn = header ? "md" : "lg";
	// Hero / CTA (mobile design): full-width stacked buttons on phones, side by side from `sm`.
	const width = header ? "" : "w-full sm:w-auto sm:min-w-[200px]";

	if (ready && user)
		return (
			<div className={cn("flex", className)}>
				<Button asChild size={btn} variant={tone === "onBlue" ? "light" : "default"} className={width}>
					<Link href={routes.dashboard}>
						<LayoutDashboard /> {header ? "Dashboard" : "Go to dashboard"}
					</Link>
				</Button>
			</div>
		);

	return (
		<div className={cn("flex items-center gap-3", header ? "flex-wrap" : "flex-col gap-3 sm:flex-row sm:gap-4", className)}>
			<Button
				asChild
				size={btn}
				variant={tone === "onBlue" ? "light" : "default"}
				className={cn(width, tone === "onBlue" && "bg-primary-50")}
			>
				<Link href={routes.signUp()}>{!header && <UserPlus />} Sign up</Link>
			</Button>
			<Button asChild size={btn} variant={tone === "onBlue" ? "outline-light" : "outline"} className={width}>
				<Link href={routes.signIn()}>Sign in</Link>
			</Button>
		</div>
	);
}
