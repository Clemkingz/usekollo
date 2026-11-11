import type { Metadata } from "next";
import { Suspense } from "react";
import { ConnectView } from "@/features/wallet/components/ConnectView";

export const metadata: Metadata = {
	title: "Connect wallet",
	description: "Connect your Stellar Testnet wallet to UseKollo. We never see your keys.",
	robots: { index: false },
};

export default function ConnectPage() {
	return (
		<Suspense>
			<ConnectView />
		</Suspense>
	);
}
