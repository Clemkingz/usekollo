"use client";

import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@repo/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@repo/ui/input-otp";
import { cn } from "@repo/ui/lib/utils";
import { errorMessage } from "@/lib/errors";
import { notify } from "@/lib/use-toast";
import { OTP_LENGTH } from "@/features/auth/schema";
import type { CodeSent } from "@/features/auth/types";

const COPY = {
	verify_email: { title: "Verify your email", cta: "Verify email", busy: "Verifying" },
	reset_password: { title: "Enter your reset code", cta: "Continue", busy: "Checking code" },
} as const;

/**
 * The OTP modal: six digit boxes (paste and the phone's "from Messages/Mail" autofill work), auto-submits on the
 * sixth digit, shakes on a wrong code, and offers "Resend" after a countdown. The page owns the API calls:
 * `onVerify` throws to show an error; `onResend` returns the new send info.
 */
export function VerifyCodeDialog({
	sent,
	onClose,
	onVerify,
	onResend,
}: {
	/** Open while set. */
	sent: CodeSent | null;
	onClose: () => void;
	onVerify: (code: string) => Promise<void>;
	onResend: () => Promise<CodeSent>;
}) {
	return (
		<Dialog open={!!sent} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-h-[92dvh] w-full overflow-y-auto px-5 py-9 sm:max-w-[476px] sm:px-9">
				{/* Remount per open so every code entry starts clean. */}
				{sent && <VerifyCodeBody key={sent.resendAt} sent={sent} onClose={onClose} onVerify={onVerify} onResend={onResend} />}
			</DialogContent>
		</Dialog>
	);
}

function VerifyCodeBody({
	sent: initial,
	onClose,
	onVerify,
	onResend,
}: {
	sent: CodeSent;
	onClose: () => void;
	onVerify: (code: string) => Promise<void>;
	onResend: () => Promise<CodeSent>;
}) {
	const copy = COPY[initial.purpose];
	const [sent, setSent] = useState(initial);
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [shake, setShake] = useState(0);
	const [busy, setBusy] = useState(false);
	const [resending, setResending] = useState(false);
	const secondsLeft = useSecondsUntil(sent.resendAt);

	async function submit(value = code) {
		if (value.length !== OTP_LENGTH || busy) return;
		setBusy(true);
		setError(null);
		try {
			await onVerify(value);
		} catch (e) {
			setError(errorMessage(e));
			setShake((n) => n + 1);
			setCode("");
			setBusy(false);
		}
	}

	async function resend() {
		setResending(true);
		setError(null);
		try {
			setSent(await onResend());
			setCode("");
			notify.success("New code sent", `Check ${sent.email}.`);
		} catch (e) {
			setError(errorMessage(e));
		} finally {
			setResending(false);
		}
	}

	return (
		<div className="flex flex-col items-center text-center">
			<span className="flex size-16 items-center justify-center rounded-full bg-primary-50 text-primary-500">
				<MailCheck className="size-7" aria-hidden />
			</span>
			<DialogTitle className="mt-5 font-display text-[26px] font-normal text-ink sm:text-[28px]">{copy.title}</DialogTitle>
			<DialogDescription className="mt-2 text-[15px] leading-6 text-ink/70">
				We sent a {OTP_LENGTH}-digit code to <span className="font-medium break-all text-ink">{sent.email}</span>. It expires in
				10 minutes.
			</DialogDescription>

			<form
				className="mt-7 flex w-full flex-col items-center"
				noValidate
				onSubmit={(e) => {
					e.preventDefault();
					void submit();
				}}
			>
				<div key={shake} className={cn(shake > 0 && "animate-shake")}>
					<InputOTP
						maxLength={OTP_LENGTH}
						value={code}
						onChange={(v) => {
							setCode(v);
							if (error) setError(null);
						}}
						onComplete={(v: string) => void submit(v)}
						pattern="^[0-9]+$"
						inputMode="numeric"
						autoComplete="one-time-code"
						autoFocus
						disabled={busy}
						aria-label={`${OTP_LENGTH}-digit code`}
						aria-invalid={error ? true : undefined}
					>
						<InputOTPGroup>
							{Array.from({ length: OTP_LENGTH }, (_, i) => (
								<InputOTPSlot key={i} index={i} aria-invalid={error ? true : undefined} />
							))}
						</InputOTPGroup>
					</InputOTP>
				</div>
				<p role="alert" className="mt-3 min-h-5 text-sm text-error-400">
					{error}
				</p>

				<Button type="submit" className="mt-4" disabled={code.length !== OTP_LENGTH} isLoading={busy} loadingLabel={copy.busy}>
					{copy.cta}
				</Button>
			</form>

			<p className="mt-6 text-[15px] text-ink/80" aria-live="polite">
				Didn’t get a code?{" "}
				{secondsLeft > 0 ? (
					<span className="text-ink/60 tabular-nums">
						Resend in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
					</span>
				) : (
					<button
						type="button"
						onClick={resend}
						disabled={resending}
						className="font-medium text-primary-500 underline-offset-4 hover:underline disabled:opacity-60"
					>
						{resending ? "Sending…" : "Resend code"}
					</button>
				)}
			</p>
			<button
				type="button"
				onClick={onClose}
				className="mt-2 text-sm text-ink/60 underline-offset-4 hover:text-ink hover:underline"
			>
				Wrong email? Change it
			</button>
		</div>
	);
}

/** Whole seconds until `iso`, ticking each second; 0 once passed. */
function useSecondsUntil(iso: string) {
	const target = new Date(iso).getTime();
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);
	return Math.max(0, Math.ceil((target - now) / 1000));
}
