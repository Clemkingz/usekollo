import type { Metadata } from "next";
import { Suspense } from "react";
import { ConnectView } from "@/features/wallet/components/ConnectView";

export const metadata: Metadata = { title: "Connect wallet" };

export default function ConnectPage() {
	return (
		<Suspense>
			<ConnectView />
		</Suspense>
	);
}
