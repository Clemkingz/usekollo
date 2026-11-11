"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { routes } from "@/lib/routes";
import { notify } from "@/lib/use-toast";
import { TextField } from "@/components/forms/TextField";
import { authApi } from "@/features/auth/api";
import { safeNext } from "@/features/auth/hooks";
import { signInSchema, type SignInInput } from "@/features/auth/schema";
import { useSessionStore } from "@/features/auth/store";
import { AuthError } from "@/features/auth/types";
import { CardFootnote } from "@/features/auth/components/AuthShell";
import { GoogleButton, OrDivider } from "@/features/auth/components/GoogleButton";
import { useRedirectIfSignedIn } from "@/features/auth/components/useRedirectIfSignedIn";

/** Sign in (built from the sign-up card, same parts). Unverified accounts get the app's "verify your email" banner. */
export function SignInForm() {
	const router = useRouter();
	const next = safeNext(useSearchParams().get("next"));
	useRedirectIfSignedIn(next);
	const [formError, setFormError] = useState<string | null>(null);
	const form = useForm<SignInInput>({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "" } });

	const onSubmit = form.handleSubmit(async ({ email, password }) => {
		setFormError(null);
		try {
			useSessionStore.getState().setUser(await authApi.signIn(email, password));
			router.replace(next);
		} catch (error) {
			if (error instanceof AuthError) setFormError(error.message);
			else notify.fromError(error);
		}
	});

	return (
		<>
			<GoogleButton />
			<OrDivider />
			<form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
				<TextField
					control={form.control}
					name="email"
					label="Email Address"
					type="email"
					inputMode="email"
					autoComplete="email"
					placeholder="satoshi@gmail.com"
				/>
				<div className="flex flex-col gap-2">
					<TextField
						control={form.control}
						name="password"
						label="Password"
						type="password"
						autoComplete="current-password"
						placeholder="••••••••••••••"
					/>
					<Link
						href={routes.forgotPassword}
						className="self-end px-2 text-sm text-primary-700 underline-offset-4 hover:underline"
					>
						Forgot password?
					</Link>
				</div>
				{formError && (
					<p role="alert" className="rounded-2xl bg-error-50 px-4 py-3 text-sm text-error-500">
						{formError}
					</p>
				)}
				<Button type="submit" className="mt-2" isLoading={form.formState.isSubmitting} loadingLabel="Signing in">
					Log In
				</Button>
			</form>
			<CardFootnote
				text="New to UseKollo?"
				linkText="Create Account"
				href={routes.signUp(next === routes.dashboard ? null : next)}
			/>
		</>
	);
}
