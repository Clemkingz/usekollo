"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { routes } from "@/lib/routes";
import { safeNext } from "@/features/auth/hooks";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { useConnectedWallet } from "@/features/wallet/hooks";
import { ConnectWalletHeader } from "@/features/wallet/components/ConnectWalletDialog";
import { ConnectWalletPanel } from "@/features/wallet/components/ConnectWalletPanel";

/** Wallet connection flow as a page (PRD screen 2): the modal's card on the auth backdrop; `?next=` afterwards. */
export function ConnectView() {
	const router = useRouter();
	const next = safeNext(useSearchParams().get("next"));
	const { ready, address } = useConnectedWallet();

	// Already connected (e.g. a bookmarked /connect): straight on.
	useEffect(() => {
		if (ready && address) router.replace(next);
	}, [ready, address, next, router]);

	return (
		<AuthShell alt="none">
			<div className="animate-rise w-full max-w-[440px] overflow-hidden rounded-[24px] bg-white text-ink shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
				<ConnectWalletHeader title={<h1 className="text-lg">Connect Wallet</h1>} onClose={() => router.push(routes.dashboard)} />
				<ConnectWalletPanel onConnected={() => router.replace(next)} />
			</div>
		</AuthShell>
	);
}
