"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { History, House, Plus, Target, UserRound, type LucideIcon } from "lucide-react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { routes } from "@/lib/routes";
import { useRequireWallet } from "@/features/wallet/hooks";

const NAV: { href: string; label: string; Icon: LucideIcon; match: (p: string) => boolean }[] = [
	{ href: routes.dashboard, label: "Dashboard", Icon: House, match: (p) => p.startsWith("/dashboard") },
	{ href: routes.goals, label: "Savings Goals", Icon: Target, match: (p) => p.startsWith("/goals") },
	{ href: routes.activity, label: "Activity Register", Icon: History, match: (p) => p.startsWith("/activity") },
	{ href: routes.settings, label: "Profile Settings", Icon: UserRound, match: (p) => p.startsWith("/settings") },
];

/** "Create New Goal" asks for a wallet first when none is connected, then continues to the form. */
export function useCreateGoalAction() {
	const router = useRouter();
	const requireWallet = useRequireWallet();
	return () => requireWallet(() => router.push(routes.newGoal), "Connect a Stellar Testnet wallet to create your savings goal.");
}

/** Sidebar card (dashboard design): nav with the active item highlighted, "Create New Goal" at the bottom. */
export function AppSidebar() {
	const pathname = usePathname();
	const createGoal = useCreateGoalAction();
	return (
		<aside className="sticky top-[90px] hidden h-[calc(100dvh-105px)] w-[292px] shrink-0 flex-col rounded-[30px] bg-white p-3 lg:flex">
			<nav aria-label="App" className="flex flex-col gap-1">
				{NAV.map(({ href, label, Icon, match }) => {
					const active = match(pathname);
					return (
						<Link
							key={href}
							href={href}
							aria-current={active ? "page" : undefined}
							className={cn(
								"flex h-8 items-center gap-3 rounded-full px-3 text-[15px] text-neutral-900 transition-colors hover:text-ink",
								active && "bg-page text-primary-500 hover:text-primary-500",
							)}
						>
							<Icon className="size-[18px]" aria-hidden />
							{label}
						</Link>
					);
				})}
			</nav>
			<Button size="sm" className="mt-auto h-[30px] w-full text-[15px]" onClick={createGoal}>
				<Plus className="size-4" /> Create New Goal
			</Button>
		</aside>
	);
}

const TABS = [
	{ href: routes.dashboard, label: "Home", Icon: House, match: (p: string) => p.startsWith("/dashboard") },
	{ href: routes.goals, label: "Goals", Icon: Target, match: (p: string) => p.startsWith("/goals") },
	{ href: routes.activity, label: "Activity", Icon: History, match: (p: string) => p.startsWith("/activity") },
	{ href: routes.settings, label: "Profile", Icon: UserRound, match: (p: string) => p.startsWith("/settings") },
];

/** Phone tab bar (mobile dashboard design): Home · Goals · Activity · Profile; the active tab sits on a lavender pill. */
export function BottomTabBar() {
	const pathname = usePathname();
	return (
		<nav
			aria-label="App"
			className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 gap-1 border-t border-line bg-white px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
		>
			{TABS.map(({ href, label, Icon, match }) => {
				const active = match(pathname);
				return (
					<Link
						key={href}
						href={href}
						aria-current={active ? "page" : undefined}
						className={cn(
							"flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-full text-[11px] transition-colors",
							active ? "bg-primary-50 text-primary-500" : "text-neutral-800 hover:text-ink",
						)}
					>
						<Icon className="size-[22px]" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
						{label}
					</Link>
				);
			})}
		</nav>
	);
}
