import { AppHeader } from "@/components/layouts/AppHeader";
import { AppSidebar, BottomTabBar } from "@/components/layouts/AppSidebar";
import { VerifyEmailBanner } from "@/features/auth/components/VerifyEmailBanner";

/** Dashboard design: white header, then a floating white sidebar card and the page on a light grey canvas. */
export function AppShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-dvh flex-col bg-canvas">
			<AppHeader />
			<VerifyEmailBanner />
			<div className="flex flex-1 gap-4 px-4 pt-4 pb-28 sm:px-5 lg:gap-4 lg:px-[22px] lg:py-[15px]">
				<AppSidebar />
				<main className="flex min-w-0 flex-1 flex-col">{children}</main>
			</div>
			<BottomTabBar />
		</div>
	);
}
