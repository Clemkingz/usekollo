import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, AuthShell } from "@/features/auth/components/AuthShell";
import { SignInForm } from "@/features/auth/components/SignInForm";

export const metadata: Metadata = {
	title: "Log in",
	description: "Log in to UseKollo to track your savings goals and activity.",
	alternates: { canonical: "/sign-in" },
};

export default function SignInPage() {
	return (
		<AuthShell alt="sign-up">
			<AuthCard>
				<h1 className="sr-only">Log in to UseKollo</h1>
				<Suspense>
					<SignInForm />
				</Suspense>
			</AuthCard>
		</AuthShell>
	);
}
