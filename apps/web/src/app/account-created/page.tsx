import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, AuthShell } from "@/features/auth/components/AuthShell";
import { AccountCreatedView } from "@/features/auth/components/AccountCreatedView";

export const metadata: Metadata = { title: "Account created" };

export default function AccountCreatedPage() {
	return (
		<AuthShell alt="sign-in">
			<AuthCard>
				<Suspense>
					<AccountCreatedView />
				</Suspense>
			</AuthCard>
		</AuthShell>
	);
}
