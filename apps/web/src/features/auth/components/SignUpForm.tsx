"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { Checkbox } from "@repo/ui/checkbox";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import { notify } from "@/lib/use-toast";
import { TextField } from "@/components/forms/TextField";
import { authApi } from "@/features/auth/api";
import { safeNext } from "@/features/auth/hooks";
import { signUpSchema, type SignUpInput } from "@/features/auth/schema";
import type { CodeSent } from "@/features/auth/types";
import { CardFootnote } from "@/features/auth/components/AuthShell";
import { GoogleButton, OrDivider } from "@/features/auth/components/GoogleButton";
import { KeyIntegrity } from "@/features/auth/components/KeyIntegrity";
import { VerifyCodeDialog } from "@/features/auth/components/VerifyCodeDialog";
import { useRedirectIfSignedIn } from "@/features/auth/components/useRedirectIfSignedIn";

/**
 * Sign up (design): Google, or name + email + password with the KEY INTEGRITY panel and terms. Creates the account
 * and emails a code; confirming it in the OTP modal signs in and goes to Account Created.
 */
export function SignUpForm() {
	const router = useRouter();
	const next = safeNext(useSearchParams().get("next"));
	useRedirectIfSignedIn(next);
	const [sent, setSent] = useState<CodeSent | null>(null);
	const form = useForm<SignUpInput>({
		resolver: zodResolver(signUpSchema),
		defaultValues: { name: "", email: "", password: "", acceptTerms: false },
	});
	const password = useWatch({ control: form.control, name: "password" });

	const onSubmit = form.handleSubmit(async ({ name, email, password }) => {
		try {
			setSent(await authApi.signUp(name, email, password));
		} catch (error) {
			if (error instanceof ApiError && error.status === 409)
				form.setError("email", { message: "An account with this email already exists. Log in instead." });
			else notify.fromError(error);
		}
	});

	// Read through a variable: the React Compiler evaluates `sent.email` during render to memoize the callbacks.
	const email = sent?.email ?? "";

	return (
		<>
			<GoogleButton />
			<OrDivider />
			<form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
				<TextField control={form.control} name="name" label="Full Name" autoComplete="name" placeholder="Satoshi Nakamoto" />
				<TextField
					control={form.control}
					name="email"
					label="Email Address"
					type="email"
					inputMode="email"
					autoComplete="email"
					placeholder="satoshi@gmail.com"
				/>
				<TextField
					control={form.control}
					name="password"
					label="Password"
					type="password"
					autoComplete="new-password"
					placeholder="••••••••••••••"
				/>
				<KeyIntegrity password={password} />

				<Controller
					control={form.control}
					name="acceptTerms"
					render={({ field, fieldState }) => (
						<div>
							<div className="flex items-start gap-3">
								<Checkbox
									id="accept-terms"
									checked={field.value}
									onCheckedChange={(v) => field.onChange(v === true)}
									onBlur={field.onBlur}
									aria-invalid={fieldState.error ? true : undefined}
									aria-describedby={fieldState.error ? "accept-terms-error" : undefined}
									className="mt-0.5"
								/>
								<label htmlFor="accept-terms" className="text-[15px] leading-snug">
									I Accept the{" "}
									<Link href={routes.terms} className="text-primary-700 underline underline-offset-2" target="_blank">
										Terms Of Service
									</Link>{" "}
									And{" "}
									<Link href={routes.privacy} className="text-primary-700 underline underline-offset-2" target="_blank">
										Privacy Policy
									</Link>{" "}
									On Chain
								</label>
							</div>
							{fieldState.error && (
								<p id="accept-terms-error" role="alert" className="mt-2 text-sm text-error-400">
									{fieldState.error.message}
								</p>
							)}
						</div>
					)}
				/>

				<Button type="submit" className="mt-2" isLoading={form.formState.isSubmitting} loadingLabel="Creating account">
					Create Account
				</Button>
			</form>
			<CardFootnote text="Already Registered?" linkText="Log In" href={routes.signIn(next === routes.dashboard ? null : next)} />

			<VerifyCodeDialog
				sent={sent}
				onClose={() => setSent(null)}
				onVerify={async (code) => {
					await authApi.verifyEmail(email, code);
					notify.success("Email verified", "Your account is ready.");
					router.replace(routes.accountCreated(next));
				}}
				onResend={() => authApi.resendVerification(email)}
			/>
		</>
	);
}
