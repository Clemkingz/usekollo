import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, AuthShell } from "@/features/auth/components/AuthShell";
import { SignUpForm } from "@/features/auth/components/SignUpForm";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
	return (
		<AuthShell alt="sign-in">
			<AuthCard>
				<h1 className="sr-only">Create your UseKollo account</h1>
				<Suspense>
					<SignUpForm />
				</Suspense>
			</AuthCard>
		</AuthShell>
	);
}
