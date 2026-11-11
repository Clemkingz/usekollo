"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandLoader } from "@/components/BrandLoader";
import { routes } from "@/lib/routes";
import { useConnectedWallet } from "@/features/wallet/hooks";

/** Guards the app area: no connected wallet → /connect, coming back here afterwards. */
export function RequireWallet({ children }: { children: React.ReactNode }) {
	const { ready, address } = useConnectedWallet();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (ready && !address) router.replace(routes.connect(pathname));
	}, [ready, address, pathname, router]);

	if (!ready || !address) return <BrandLoader label="Checking your wallet" className="min-h-[260px]" />;
	return <>{children}</>;
}
