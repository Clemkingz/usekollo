import { RequireWallet } from "@/features/wallet/components/RequireWallet";

/** Goals and activity belong to a wallet: no connected wallet → /connect, then back here. */
export default function WalletLayout({ children }: { children: React.ReactNode }) {
	return <RequireWallet>{children}</RequireWallet>;
}
