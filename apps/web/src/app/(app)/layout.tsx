import { AppShell } from "@/components/layouts/AppShell";
import { RequireAccount } from "@/features/auth/components/RequireAccount";

/**
 * The app area (dashboard design): header, sidebar and content. Needs an account (→ /sign-in). The wallet is asked
 * for where it's needed: goal and activity routes (`(wallet)/layout.tsx`) and the "Create Savings Goal" buttons.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<RequireAccount>
			<AppShell>{children}</AppShell>
		</RequireAccount>
	);
}
