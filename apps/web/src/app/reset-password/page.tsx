import type { Metadata } from "next";
import { AuthCard, AuthShell } from "@/features/auth/components/AuthShell";
import { NewPasswordForm } from "@/features/auth/components/NewPasswordForm";

export const metadata: Metadata = { title: "Create new password" };

export default function ResetPasswordPage() {
	return (
		<AuthShell alt="sign-in">
			<AuthCard title="Create New password">
				<NewPasswordForm />
			</AuthCard>
		</AuthShell>
	);
}
