import { Logo } from "@/components/Logo";
import { landing } from "@/features/landing/content";

/** Landing footer (design): big logo, one-line promise, copyright. */
export function SiteFooter() {
	return (
		<footer className="bg-white">
			<div className="app-container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
				<Logo className="[&_img]:h-9 md:[&_img]:h-10" />
				<p className="max-w-[300px] text-sm leading-5 text-ink">{landing.footer}</p>
				<p className="text-base text-ink">© {new Date().getFullYear()} UseKollo</p>
			</div>
		</footer>
	);
}
