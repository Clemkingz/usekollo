import { MarketingHeader } from "@/components/layouts/MarketingHeader";
import { SiteFooter } from "@/components/layouts/SiteFooter";

/** Landing / Welcome: public, no wallet needed. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-dvh flex-col bg-white">
			<MarketingHeader />
			<main className="min-w-0 flex-1">{children}</main>
			<SiteFooter />
		</div>
	);
}
