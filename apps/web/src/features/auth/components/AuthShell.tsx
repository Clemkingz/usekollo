import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@repo/ui/button";
import { routes } from "@/lib/routes";
import { DOCS_URL, withBasePath } from "@/lib/site";
import { Logo } from "@/components/Logo";

/**
 * Auth page frame (sign-up / forgot / create-password designs): full-bleed stone photo, white wordmark + Home · Docs,
 * a white pill on the right (the design's "Connect Stellar Wallet" spot, which now leads to the other auth page), a
 * centred white card, and the footer line. `alt` picks that pill.
 */
export function AuthShell({ alt, children }: { alt: "sign-in" | "sign-up" | "none"; children: React.ReactNode }) {
	return (
		<div className="relative isolate flex min-h-dvh flex-col text-white">
			<div
				aria-hidden
				className="absolute inset-0 -z-10 bg-[#24365c] bg-cover bg-center"
				style={{ backgroundImage: `url(${withBasePath("/images/auth/background.webp")})` }}
			/>
			{/* The design's photo is darker and cooler than the original. */}
			<div aria-hidden className="absolute inset-0 -z-10 bg-[#0b1530]/35" />

			<header className="border-b border-white/40">
				<div className="flex h-16 items-center gap-4 px-4 sm:px-6 md:h-[78px] lg:px-6">
					<Logo variant="wordmark" tone="light" />
					<span aria-hidden className="mx-2 hidden h-6 w-px bg-white/60 sm:block md:mx-5" />
					<nav aria-label="Main" className="hidden items-center gap-8 text-lg sm:flex">
						<Link href={routes.home} className="transition-opacity hover:opacity-80">
							Home
						</Link>
						<Link href={DOCS_URL} className="transition-opacity hover:opacity-80">
							Docs
						</Link>
					</nav>
					{alt !== "none" && (
						<Button asChild variant="light" size="md" className="ml-auto h-10 px-5 md:h-11 md:px-6 md:text-base">
							{alt === "sign-in" ? (
								<Link href={routes.signIn()}>
									<LogIn /> Sign in
								</Link>
							) : (
								<Link href={routes.signUp()}>
									<UserPlus /> Sign up
								</Link>
							)}
						</Button>
					)}
				</div>
			</header>

			<main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16">{children}</main>

			<footer className="mx-4 border-t border-white/40 sm:mx-5">
				<div className="flex flex-col items-center gap-3 py-5 font-display text-base sm:flex-row sm:justify-between md:text-lg">
					<p>© {new Date().getFullYear()} – Usekollo</p>
					<nav aria-label="Legal" className="flex gap-8">
						<Link href={routes.cookies} className="hover:opacity-80">
							Cookies
						</Link>
						<Link href={routes.privacy} className="hover:opacity-80">
							Privacy
						</Link>
					</nav>
					<p>
						English US{" "}
						<span role="img" aria-label="United States flag">
							🇺🇸
						</span>
					</p>
				</div>
			</footer>
		</div>
	);
}

/** The white card in the middle of every auth page. */
export function AuthCard({ title, children }: { title?: string; children: React.ReactNode }) {
	return (
		<div className="animate-rise w-full max-w-[476px] rounded-[28px] bg-white px-5 py-8 text-ink shadow-[0_24px_80px_rgba(0,0,0,0.25)] sm:rounded-[40px] sm:px-9 sm:py-10">
			{title && <h1 className="mb-8 text-center font-display text-[26px] leading-tight sm:text-[28px]">{title}</h1>}
			{children}
		</div>
	);
}

/** "Already Registered? Log In" style footer line inside the card. */
export function CardFootnote({ text, linkText, href }: { text: string; linkText: string; href: string }) {
	return (
		<p className="mt-8 text-center text-[15px]">
			{text}{" "}
			<Link href={href} className="font-medium underline-offset-4 hover:text-primary-500 hover:underline">
				{linkText}
			</Link>
		</p>
	);
}
