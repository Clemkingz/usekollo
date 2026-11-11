"use client";

import { WalletCards, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@repo/ui/dialog";
import { useWalletDialog } from "@/features/wallet/dialog-store";
import { ConnectWalletPanel } from "@/features/wallet/components/ConnectWalletPanel";

/**
 * "Connect Wallet" modal (design): white card over a blurred page; on phones it docks near the top. Mounted once in
 * the root layout; opened with `useWalletDialog().show()` or `useRequireWallet()`.
 */
export function ConnectWalletDialog() {
	const { open, reason, close, resolve } = useWalletDialog();
	return (
		<Dialog open={open} onOpenChange={(next) => !next && close()}>
			<DialogContent
				showCloseButton={false}
				overlayClassName="bg-white/30 backdrop-blur-md"
				className="top-2 max-h-[94dvh] w-[calc(100%-1rem)] max-w-none translate-y-0 gap-0 overflow-hidden overflow-y-auto rounded-[24px] p-0 sm:top-1/2 sm:w-full sm:max-w-[480px] sm:-translate-y-1/2"
			>
				<ConnectWalletHeader
					title={<DialogTitle className="text-lg font-normal text-ink sm:text-2xl">Connect Wallet</DialogTitle>}
				/>
				<DialogDescription className={reason ? "-mt-2 px-6 pb-1 text-sm text-ink/70 sm:px-[34px]" : "sr-only"}>
					{reason ?? "Choose a Stellar Testnet wallet to connect."}
				</DialogDescription>
				{/* Remount per open so every visit starts clean. */}
				{open && <ConnectWalletPanel onConnected={resolve} />}
			</DialogContent>
		</Dialog>
	);
}

/** Wallet icon + title on the left, close on the right (design). In the dialog the close is Radix's. */
export function ConnectWalletHeader({ title, onClose }: { title: React.ReactNode; onClose?: () => void }) {
	const closeButton = (
		<button
			type="button"
			onClick={onClose}
			aria-label="Close"
			className="flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
		>
			<X className="size-5 sm:size-6" />
		</button>
	);
	return (
		<div className="flex items-center gap-2.5 px-6 pt-6 pb-4 sm:gap-3 sm:px-[34px] sm:pt-8">
			<WalletCards className="size-5 text-ink sm:size-6" aria-hidden />
			{title}
			<div className="ml-auto">{onClose ? closeButton : <DialogClose asChild>{closeButton}</DialogClose>}</div>
		</div>
	);
}
