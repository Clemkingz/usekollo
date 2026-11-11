"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { routes } from "@/lib/routes";
import { notify } from "@/lib/use-toast";
import { TextField } from "@/components/forms/TextField";
import { authApi } from "@/features/auth/api";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/features/auth/schema";
import { useResetStore } from "@/features/auth/store";
import type { CodeSent } from "@/features/auth/types";
import { CardFootnote } from "@/features/auth/components/AuthShell";
import { VerifyCodeDialog } from "@/features/auth/components/VerifyCodeDialog";

/**
 * Forgot Password? (design): email → "Reset Password" → reset code in the OTP modal → Create New password. The API
 * checks the code together with the new password, so the modal only collects it. The answer is the same whether or
 * not an account exists, so the form can't be used to probe emails.
 */
export function ForgotPasswordForm() {
	const router = useRouter();
	const [sent, setSent] = useState<CodeSent | null>(null);
	const form = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

	const onSubmit = form.handleSubmit(async ({ email }) => {
		try {
			setSent(await authApi.requestPasswordReset(email));
		} catch (error) {
			notify.fromError(error);
		}
	});

	// Read through a variable: the React Compiler evaluates `sent.email` during render to memoize the callbacks.
	const email = sent?.email ?? "";

	return (
		<>
			<form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
				<TextField
					control={form.control}
					name="email"
					label="Email Address"
					type="email"
					inputMode="email"
					autoComplete="email"
					placeholder="satoshi@gmail.com"
				/>
				<Button type="submit" isLoading={form.formState.isSubmitting} loadingLabel="Sending code">
					Reset Password
				</Button>
			</form>
			<CardFootnote text="Already Registered?" linkText="Log In" href={routes.signIn()} />

			<VerifyCodeDialog
				sent={sent}
				onClose={() => setSent(null)}
				onVerify={async (code) => {
					useResetStore.getState().set(email, code);
					router.push(routes.resetPassword);
				}}
				onResend={() => authApi.requestPasswordReset(email)}
			/>
		</>
	);
}
