"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleCheck, CircleCheckBig } from "lucide-react";
import { Button } from "@repo/ui/button";
import { routes } from "@/lib/routes";
import { BrandLoader } from "@/components/BrandLoader";
import { safeNext, useSession } from "@/features/auth/hooks";

/**
 * Account Created (design): big tick and "Go to Dashboard". Reached after the sign-up code is confirmed, so the email
 * is verified and the user is signed in (the API only signs in verified accounts).
 */
export function AccountCreatedView() {
	const router = useRouter();
	const next = safeNext(useSearchParams().get("next"));
	const { ready, user } = useSession();

	useEffect(() => {
		if (ready && !user) router.replace(routes.signUp());
	}, [ready, user, router]);

	if (!ready || !user) return <BrandLoader className="min-h-0 py-10" />;

	const firstName = user.name.split(" ")[0];

	return (
		<div className="flex flex-col items-center text-center">
			<h1 className="animate-rise font-display text-[26px] leading-tight sm:text-[28px]">Account Created</h1>
			<p className="animate-rise mt-2 text-[15px] text-ink/65" style={{ "--i": 1 } as React.CSSProperties}>
				Welcome to UseKollo{firstName ? `, ${firstName}` : ""}.
			</p>
			<CircleCheckBig className="animate-pop my-12 size-[104px] text-primary-600 sm:my-14" strokeWidth={1.25} aria-hidden />
			<Button asChild className="animate-rise" style={{ "--i": 2 } as React.CSSProperties}>
				<Link href={next}>Go to Dashboard</Link>
			</Button>
			<p className="mt-6 inline-flex items-center gap-2 text-base text-success-500">
				<CircleCheck className="size-5" aria-hidden /> Email address verified
			</p>
		</div>
	);
}
