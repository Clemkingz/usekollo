"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, ExternalLink, Link2, Link2Off, LogOut, Plus, SquareArrowOutUpRight, WalletCards } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@repo/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@repo/ui/dialog";
import { routes } from "@/lib/routes";
import { shortKey } from "@/lib/stellar/config";
import { notify } from "@/lib/use-toast";
import { Breadcrumb } from "@/components/Breadcrumb";
import { TextField } from "@/components/forms/TextField";
import { authApi } from "@/features/auth/api";
import { useSession } from "@/features/auth/hooks";
import { changePasswordSchema, profileSchema, type ChangePasswordInput, type ProfileInput } from "@/features/auth/schema";
import { KeyIntegrity } from "@/features/auth/components/KeyIntegrity";
import { disconnect, unlink } from "@/features/wallet/connect";
import { useConnectedWallet } from "@/features/wallet/hooks";
import { useWalletDialog } from "@/features/wallet/dialog-store";

/** "12:04:32 UTC". */
const utcTime = (ms: number) => `${new Date(ms).toISOString().slice(11, 19)} UTC`;

const card = "animate-rise rounded-[20px] bg-white p-5 md:p-6";

/**
 * Profile Settings (designs: connected and not connected). Connection: the linked wallet (copy, explorer, last sync),
 * disconnect in this browser, or unlink it from the account (refused while goals are open). Below the design's card:
 * the account (name, email), password, and signing out everywhere, all on the UseKollo API.
 */
export function SettingsView() {
	const { ready } = useConnectedWallet();
	if (!ready)
		return (
			<div className="flex flex-col gap-5 md:gap-6">
				<Breadcrumb current="Profile Settings" />
				<div className="skeleton-shimmer h-[280px] rounded-[20px]" />
			</div>
		);
	return (
		<div className="flex flex-col gap-5 md:gap-6">
			<Breadcrumb current="Profile Settings" />
			<WalletSection />
			<div className="grid gap-5 md:gap-6 xl:grid-cols-2">
				<ProfileSection />
				<PasswordSection />
			</div>
			<SessionsSection />
		</div>
	);
}

function WalletSection() {
	const { address, canSign, wallet } = useConnectedWallet();
	const showWallet = useWalletDialog((s) => s.show);
	const queryClient = useQueryClient();
	const [unlinking, setUnlinking] = useState(false);
	const updatedAt = queryClient.getQueryState(["wallet"])?.dataUpdatedAt;

	async function copy() {
		if (!address) return;
		try {
			await navigator.clipboard.writeText(address);
			notify.success("Address copied");
		} catch {
			notify.error("Couldn’t copy", "Select the address and copy it manually.");
		}
	}

	if (!address)
		return (
			<section className="animate-rise flex flex-col items-center rounded-[20px] bg-white px-6 py-10 text-center md:py-11">
				<span className="animate-pop flex size-[72px] items-center justify-center rounded-full bg-[#ececec]">
					<WalletCards className="size-6 text-ink" strokeWidth={2.25} aria-hidden />
				</span>
				<h1 className="mt-5 text-xl text-ink">Nothing to see here yet</h1>
				<p className="mt-2 max-w-[330px] text-sm leading-snug text-ink/40">
					Connect your Stellar wallet to see its address and sync status here. UseKollo never holds your keys.
				</p>
				<button
					type="button"
					onClick={() => showWallet()}
					className="mt-6 flex h-[59px] items-center gap-4 rounded-full bg-[#ececec] px-8 text-lg text-ink transition-colors hover:bg-[#e2e2e2]"
				>
					<Plus className="size-5" aria-hidden /> Connect Wallet
				</button>
			</section>
		);

	return (
		<>
			<section aria-labelledby="connection-title" className={card}>
				<div className="flex items-center justify-between gap-4">
					<h1 id="connection-title" className="text-xl text-ink md:text-2xl">
						Connection
					</h1>
					{canSign ? (
						<Link2 className="size-6 text-primary-500" aria-label="Connected" />
					) : (
						<span className="rounded-full bg-[#fde8e8] px-3 py-1 text-xs text-[#e5372f] uppercase">Disconnected here</span>
					)}
				</div>

				<p className="mt-6 text-sm text-ink uppercase">Wallet address</p>
				<div className="mt-2 flex h-[60px] items-center gap-2 rounded-full bg-[#f4f4f4] pr-3 pl-5 md:h-[76px] md:pl-6">
					<WalletCards className="size-6 shrink-0 text-ink" aria-hidden />
					<span className="min-w-0 flex-1 truncate pl-1 text-lg text-ink" title={address}>
						{shortKey(address, 4, 4).replace("…", "...")}
					</span>
					<button
						type="button"
						onClick={copy}
						aria-label="Copy wallet address"
						className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-white"
					>
						<Copy className="size-5" />
					</button>
					{wallet?.explorerUrl && (
						<a
							href={wallet.explorerUrl}
							target="_blank"
							rel="noreferrer"
							aria-label="View on Stellar Expert (opens in a new tab)"
							className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-white"
						>
							<ExternalLink className="size-5" />
						</a>
					)}
				</div>

				<div className="mt-8 grid grid-cols-2 gap-6">
					<div>
						<p className="text-sm text-ink uppercase">Last sync</p>
						<p className="mt-1 text-sm text-ink tabular-nums">{updatedAt ? utcTime(updatedAt) : "Syncing…"}</p>
					</div>
					{wallet?.linkedAt && (
						<div>
							<p className="text-sm text-ink uppercase">Linked</p>
							<p className="mt-1 text-sm text-ink">
								{new Date(wallet.linkedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
							</p>
						</div>
					)}
				</div>
			</section>

			<div className="flex flex-col gap-3 sm:flex-row">
				{canSign ? (
					<Button
						variant="outline"
						className="h-[59px] w-full text-lg sm:w-[358px]"
						onClick={async () => {
							await disconnect();
							notify.info(
								"Wallet disconnected",
								"It stays linked to your account. Reconnect it any time to approve transactions.",
							);
						}}
					>
						Disconnect Wallet <SquareArrowOutUpRight className="size-5" />
					</Button>
				) : (
					<Button
						className="h-[59px] w-full text-lg sm:w-[358px]"
						onClick={() => showWallet("Reconnect your wallet to approve transactions.")}
					>
						<WalletCards className="size-5" /> Reconnect Wallet
					</Button>
				)}
				<Button
					variant="ghost"
					className="h-[59px] w-full text-base text-error-400 hover:bg-error-50 hover:text-error-500 sm:w-auto sm:px-8"
					onClick={() => setUnlinking(true)}
				>
					<Link2Off className="size-5" /> Unlink from account
				</Button>
			</div>

			<UnlinkDialog open={unlinking} onOpenChange={setUnlinking} />
		</>
	);
}

function UnlinkDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
	const [busy, setBusy] = useState(false);
	async function run() {
		setBusy(true);
		try {
			await unlink();
			notify.success("Wallet unlinked", "Connect a wallet again whenever you want to save.");
			onOpenChange(false);
		} catch (error) {
			notify.fromError(error);
		} finally {
			setBusy(false);
		}
	}
	return (
		<Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
			<DialogContent className="gap-0 rounded-[28px] p-6 sm:max-w-[440px] sm:p-7">
				<DialogTitle className="font-display text-[26px] font-normal text-ink">Unlink this wallet?</DialogTitle>
				<DialogDescription className="mt-3 text-[15px] leading-6 text-ink/65">
					Your goals belong to this wallet, so it can only be unlinked once every goal is closed. Nothing moves on the network.
				</DialogDescription>
				<Button variant="destructive" className="mt-8 h-[56px] text-lg" onClick={run} isLoading={busy} loadingLabel="Unlinking">
					Unlink wallet
				</Button>
				<Button variant="outline" className="mt-3 h-[56px] text-lg" disabled={busy} onClick={() => onOpenChange(false)}>
					Cancel
				</Button>
			</DialogContent>
		</Dialog>
	);
}

function ProfileSection() {
	const { user } = useSession();
	const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), values: { name: user?.name ?? "" } });
	const onSubmit = form.handleSubmit(async ({ name }) => {
		try {
			await authApi.updateName(name);
			notify.success("Profile updated");
			form.reset({ name });
		} catch (error) {
			notify.fromError(error);
		}
	});
	return (
		<section aria-labelledby="profile-title" className={card} style={{ "--i": 1 } as React.CSSProperties}>
			<h2 id="profile-title" className="text-xl text-ink">
				Account
			</h2>
			<form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-5">
				<TextField control={form.control} name="name" label="Name" autoComplete="name" />
				<div className="flex flex-col gap-2.5">
					<span className="text-[15px] text-ink">Email Address</span>
					<p className="truncate rounded-full bg-page px-6 py-3.5 text-ink/60" title="Your email can’t be changed">
						{user?.email}
					</p>
				</div>
				<Button
					type="submit"
					size="md"
					className="self-start"
					disabled={!form.formState.isDirty}
					isLoading={form.formState.isSubmitting}
					loadingLabel="Saving"
				>
					Save changes
				</Button>
			</form>
		</section>
	);
}

function PasswordSection() {
	const form = useForm<ChangePasswordInput>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
	});
	const password = useWatch({ control: form.control, name: "password" });
	const onSubmit = form.handleSubmit(async ({ currentPassword, password }) => {
		try {
			await authApi.changePassword(currentPassword, password);
			notify.success("Password changed", "Your other sessions were signed out.");
			form.reset();
		} catch (error) {
			const message = error instanceof Error ? error.message : "";
			if (/current password/i.test(message)) form.setError("currentPassword", { message });
			else notify.fromError(error);
		}
	});
	return (
		<section aria-labelledby="password-title" className={card} style={{ "--i": 2 } as React.CSSProperties}>
			<h2 id="password-title" className="text-xl text-ink">
				Password
			</h2>
			<form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-5">
				<TextField
					control={form.control}
					name="currentPassword"
					label="Current Password"
					type="password"
					autoComplete="current-password"
				/>
				<TextField control={form.control} name="password" label="New Password" type="password" autoComplete="new-password" />
				<TextField
					control={form.control}
					name="confirmPassword"
					label="Confirm New Password"
					type="password"
					autoComplete="new-password"
				/>
				{password && <KeyIntegrity password={password} />}
				<Button type="submit" size="md" className="self-start" isLoading={form.formState.isSubmitting} loadingLabel="Updating">
					Change password
				</Button>
			</form>
		</section>
	);
}

function SessionsSection() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [busy, setBusy] = useState(false);
	async function run() {
		setBusy(true);
		try {
			await authApi.signOutEverywhere();
			queryClient.clear();
			notify.success("Signed out everywhere");
			router.push(routes.signIn());
		} catch (error) {
			notify.fromError(error);
			setBusy(false);
		}
	}
	return (
		<section
			className={`${card} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}
			style={{ "--i": 3 } as React.CSSProperties}
		>
			<div>
				<h2 className="text-xl text-ink">Sessions</h2>
				<p className="mt-1 text-sm text-ink/55">Signed in on a device you don’t use any more? Sign out of every session.</p>
			</div>
			<Button variant="outline" size="md" className="shrink-0" onClick={run} isLoading={busy} loadingLabel="Signing out">
				<LogOut className="size-4" /> Sign out everywhere
			</Button>
		</section>
	);
}
