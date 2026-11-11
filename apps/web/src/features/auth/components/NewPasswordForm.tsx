"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import { notify } from "@/lib/use-toast";
import { TextField } from "@/components/forms/TextField";
import { authApi } from "@/features/auth/api";
import { newPasswordSchema, type NewPasswordInput } from "@/features/auth/schema";
import { useResetStore } from "@/features/auth/store";
import { CardFootnote } from "@/features/auth/components/AuthShell";
import { KeyIntegrity } from "@/features/auth/components/KeyIntegrity";

/**
 * Create New password (design). Sends the new password with the reset code from the previous step; the API checks
 * the code here, so a wrong or expired code sends the user back to ask for a new one.
 */
export function NewPasswordForm() {
	const router = useRouter();
	const email = useResetStore((s) => s.email);
	const code = useResetStore((s) => s.code);
	const [badCode, setBadCode] = useState(false);
	const form = useForm<NewPasswordInput>({
		resolver: zodResolver(newPasswordSchema),
		defaultValues: { password: "", confirmPassword: "" },
	});
	const password = useWatch({ control: form.control, name: "password" });

	const onSubmit = form.handleSubmit(async ({ password }) => {
		if (!email || !code) return;
		try {
			await authApi.resetPassword(email, code, password);
			useResetStore.getState().clear();
			notify.success("Password updated", "Log in with your new password.");
			router.replace(routes.signIn());
		} catch (error) {
			if (error instanceof ApiError && error.status === 400 && /code/i.test(error.message)) {
				useResetStore.getState().clear();
				setBadCode(true);
			} else notify.fromError(error);
		}
	});

	if (badCode || !email || !code)
		return (
			<div className="animate-rise text-center">
				<p className="text-[15px] leading-6 text-ink/70">
					{badCode
						? "That reset code is wrong or has expired. Ask for a new one and try again."
						: "For your security, this step needs a fresh reset code. Start again and we’ll email you one."}
				</p>
				<Button asChild className="mt-8">
					<Link href={routes.forgotPassword}>Get a new code</Link>
				</Button>
				<CardFootnote text="Already Registered?" linkText="Log In" href={routes.signIn()} />
			</div>
		);

	return (
		<>
			<form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
				<TextField
					control={form.control}
					name="password"
					label="New Password"
					type="password"
					autoComplete="new-password"
					placeholder="••••••••••••••"
				/>
				<TextField
					control={form.control}
					name="confirmPassword"
					label="Confirm New Password"
					type="password"
					autoComplete="new-password"
					placeholder="••••••••••••••"
				/>
				<KeyIntegrity password={password} />
				<Button type="submit" isLoading={form.formState.isSubmitting} loadingLabel="Updating password">
					Update Password
				</Button>
			</form>
			<CardFootnote text="Already Registered?" linkText="Log In" href={routes.signIn()} />
		</>
	);
}
