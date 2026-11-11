"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import { notify } from "@/lib/use-toast";
import { TextField } from "@/components/forms/TextField";
import { authApi, EmailNotVerifiedError } from "@/features/auth/api";
import { safeNext } from "@/features/auth/hooks";
import { signInSchema, type SignInInput } from "@/features/auth/schema";
import { useSessionStore } from "@/features/auth/store";
import type { CodeSent } from "@/features/auth/types";
import { CardFootnote } from "@/features/auth/components/AuthShell";
import { GoogleButton, OrDivider } from "@/features/auth/components/GoogleButton";
import { VerifyCodeDialog } from "@/features/auth/components/VerifyCodeDialog";
import { useRedirectIfSignedIn } from "@/features/auth/components/useRedirectIfSignedIn";

/**
 * Sign in (built from the sign-up card, same parts). An account whose email isn't confirmed yet gets a fresh code from
 * the API; the OTP modal opens and confirming it finishes signing in.
 */
export function SignInForm() {
	const router = useRouter();
	const next = safeNext(useSearchParams().get("next"));
	useRedirectIfSignedIn(next);
	const [formError, setFormError] = useState<string | null>(null);
	const [sent, setSent] = useState<CodeSent | null>(null);
	const form = useForm<SignInInput>({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "" } });

	// The session ended on its own (refresh refused): say so once.
	useEffect(() => {
		if (!useSessionStore.getState().expired) return;
		useSessionStore.setState({ expired: false });
		notify.info("You’ve been signed out", "Your session ended. Log in again to continue.");
	}, []);

	const onSubmit = form.handleSubmit(async ({ email, password }) => {
		setFormError(null);
		try {
			await authApi.signIn(email, password);
			router.replace(next);
		} catch (error) {
			if (error instanceof EmailNotVerifiedError) {
				setSent(error.sent);
				notify.info("Confirm your email", "We’ve sent a new 6-digit code to your inbox.");
			} else if (error instanceof ApiError && error.status === 401) setFormError(error.message);
			else notify.fromError(error);
		}
	});

	const email = sent?.email ?? "";

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
					<p role="alert" className="animate-pop rounded-2xl bg-error-50 px-4 py-3 text-sm text-error-500">
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

			<VerifyCodeDialog
				sent={sent}
				onClose={() => setSent(null)}
				onVerify={async (code) => {
					await authApi.verifyEmail(email, code);
					notify.success("Email verified", "You’re signed in.");
					router.replace(next);
				}}
				onResend={() => authApi.resendVerification(email)}
			/>
		</>
	);
}
