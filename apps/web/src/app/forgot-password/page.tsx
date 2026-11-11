import type { Metadata } from "next";
import { AuthCard, AuthShell } from "@/features/auth/components/AuthShell";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
	return (
		<AuthShell alt="sign-in">
			<AuthCard title="Forgot Password?">
				<ForgotPasswordForm />
			</AuthCard>
		</AuthShell>
	);
}
