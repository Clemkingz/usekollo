"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { DOCS_URL } from "@/lib/site";
import { Logo } from "@/components/Logo";
import { AuthButtons } from "@/features/landing/components/AuthButtons";

const NAV = [
	{ href: "/#product", label: "Product" },
	{ href: "/#how-it-works", label: "How it Works" },
	{ href: DOCS_URL, label: "Documentation" },
];

/** Landing header (design): logo, centred nav, Sign in + Sign up on the right; a menu on phones. */
export function MarketingHeader() {
	const [open, setOpen] = useState(false);
	return (
		<header className="sticky top-0 z-40 bg-white/95 backdrop-blur">
			<div className="app-container flex h-16 items-center md:h-[78px]">
				<Logo />
				<nav aria-label="Main" className="mx-auto hidden gap-8 text-[17px] text-ink lg:flex">
					{NAV.map((item) => (
						<Link key={item.label} href={item.href} className="transition-colors hover:text-primary-500">
							{item.label}
						</Link>
					))}
				</nav>
				<AuthButtons size="header" className="ml-auto hidden md:flex lg:ml-0" />
				<button
					type="button"
					onClick={() => setOpen((v) => !v)}
					aria-expanded={open}
					aria-controls="mobile-menu"
					aria-label={open ? "Close menu" : "Open menu"}
					className="ml-auto flex size-11 items-center justify-center rounded-full text-ink hover:bg-ink/5 md:ml-4 lg:hidden"
				>
					{open ? <X className="size-6" /> : <Menu className="size-6" />}
				</button>
			</div>
			{open && (
				<div id="mobile-menu" className="animate-rise border-t border-line bg-white lg:hidden">
					<nav aria-label="Mobile" className="app-container flex flex-col py-3">
						{NAV.map((item) => (
							<Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="py-3 text-lg text-ink">
								{item.label}
							</Link>
						))}
						<AuthButtons size="header" className="mt-3 pb-3 md:hidden [&>a]:flex-1" />
					</nav>
				</div>
			)}
		</header>
	);
}
