"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandLoader } from "@/components/BrandLoader";
import { routes } from "@/lib/routes";
import { useSession } from "@/features/auth/hooks";

/** Guards the app area: not signed in → /sign-in, coming back here afterwards. */
export function RequireAccount({ children }: { children: React.ReactNode }) {
	const { ready, user } = useSession();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (ready && !user) router.replace(routes.signIn(pathname));
	}, [ready, user, pathname, router]);

	if (!ready || !user) return <BrandLoader label="Checking your account" />;
	return <>{children}</>;
}
