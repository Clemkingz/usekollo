"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { routes } from "@/lib/routes";
import { notify } from "@/lib/use-toast";
import { TextField } from "@/components/forms/TextField";
import { authApi } from "@/features/auth/api";
import { newPasswordSchema, type NewPasswordInput } from "@/features/auth/schema";
import { useResetStore } from "@/features/auth/store";
import { AuthError } from "@/features/auth/types";
import { CardFootnote } from "@/features/auth/components/AuthShell";
import { KeyIntegrity } from "@/features/auth/components/KeyIntegrity";

/** Create New password (design). Only reachable with a verified reset code; otherwise it asks to start again. */
export function NewPasswordForm() {
	const router = useRouter();
	const token = useResetStore((s) => s.token);
	const form = useForm<NewPasswordInput>({
		resolver: zodResolver(newPasswordSchema),
		defaultValues: { password: "", confirmPassword: "" },
	});
	const password = useWatch({ control: form.control, name: "password" });

	const onSubmit = form.handleSubmit(async ({ password }) => {
		try {
			await authApi.resetPassword(token!, password);
			useResetStore.getState().clear();
			notify.success("Password updated", "Log in with your new password.");
			router.replace(routes.signIn());
		} catch (error) {
			if (error instanceof AuthError && error.code === "reset_expired") useResetStore.getState().clear();
			notify.fromError(error);
		}
	});

	if (!token)
		return (
			<div className="text-center">
				<p className="text-[15px] leading-6 text-ink/70">
					For your security, this step needs a fresh reset code. Start again and we’ll email you one.
				</p>
				<Button asChild className="mt-8">
					<Link href={routes.forgotPassword}>Start again</Link>
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
