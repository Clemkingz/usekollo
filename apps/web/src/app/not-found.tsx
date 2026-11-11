import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Logo } from "@/components/Logo";
import { routes } from "@/lib/routes";

/** 404. TODO(design). */
export default function NotFound() {
	return (
		<div className="flex min-h-dvh flex-col">
			<header className="app-container flex h-16 items-center">
				<Logo />
			</header>
			<main className="app-container flex flex-1 flex-col items-center justify-center pb-24 text-center">
				<p className="font-display text-[96px] leading-none font-bold text-primary-500 md:text-[160px]">404</p>
				<h1 className="mt-4 font-display text-2xl font-bold md:text-4xl">This page isn’t here</h1>
				<p className="mt-3 max-w-[460px] text-ink/65">The link may be mistyped, or the page has moved.</p>
				<Button asChild className="mt-8 max-w-[260px]">
					<Link href={routes.home}>Go home</Link>
				</Button>
			</main>
		</div>
	);
}
