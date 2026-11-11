import type { Metadata } from "next";
import { AppShell } from "@/components/layouts/AppShell";
import { RequireAccount } from "@/features/auth/components/RequireAccount";

/**
 * The app area (dashboard design): header, sidebar and content. Needs an account (→ /sign-in). The wallet is asked
 * for where it's needed: goal and activity routes (`(wallet)/layout.tsx`) and the "Create Savings Goal" buttons.
 */
/** Personal pages: never indexed, never shared as previews. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<RequireAccount>
			<AppShell>{children}</AppShell>
		</RequireAccount>
	);
}
