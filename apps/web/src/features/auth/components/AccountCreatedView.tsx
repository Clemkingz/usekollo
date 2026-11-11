"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleCheck, CircleCheckBig, SquareArrowOutUpRight } from "lucide-react";
import { Button } from "@repo/ui/button";
import { routes } from "@/lib/routes";
import { BrandLoader } from "@/components/BrandLoader";
import { safeNext, useSession } from "@/features/auth/hooks";
import { VerifyCodeDialog } from "@/features/auth/components/VerifyCodeDialog";
import { useVerifyEmail } from "@/features/auth/components/useVerifyEmail";

/** Account Created (design): big tick, "Go to Dashboard", and "Verify Email Address", which opens the OTP modal. */
export function AccountCreatedView() {
	const router = useRouter();
	const next = safeNext(useSearchParams().get("next"));
	const { ready, user } = useSession();
	const verify = useVerifyEmail();

	useEffect(() => {
		if (ready && !user) router.replace(routes.signUp());
	}, [ready, user, router]);

	if (!ready || !user) return <BrandLoader className="min-h-0 py-10" />;

	return (
		<div className="flex flex-col items-center text-center">
			<h1 className="font-display text-[26px] leading-tight sm:text-[28px]">Account Created</h1>
			<CircleCheckBig className="animate-pop my-14 size-[104px] text-primary-600 sm:my-16" strokeWidth={1.25} aria-hidden />
			<Button asChild>
				<Link href={next}>Go to Dashboard</Link>
			</Button>
			{user.emailVerified ? (
				<p className="mt-6 inline-flex items-center gap-2 text-base text-success-500">
					<CircleCheck className="size-5" aria-hidden /> Email address verified
				</p>
			) : (
				<button
					type="button"
					onClick={verify.open}
					disabled={verify.opening}
					className="mt-6 inline-flex items-center gap-2.5 text-base underline-offset-4 hover:text-primary-500 hover:underline disabled:opacity-60"
				>
					{verify.opening ? "Sending code…" : "Verify Email Address"} <SquareArrowOutUpRight className="size-5" aria-hidden />
				</button>
			)}
			<VerifyCodeDialog {...verify.dialogProps} />
		</div>
	);
}
