"use client";

import { MailWarning } from "lucide-react";
import { useSession } from "@/features/auth/hooks";
import { VerifyCodeDialog } from "@/features/auth/components/VerifyCodeDialog";
import { useVerifyEmail } from "@/features/auth/components/useVerifyEmail";

/** Inside the app: a quiet reminder until the account's email is verified. TODO(design): app screens. */
export function VerifyEmailBanner() {
	const { user } = useSession();
	const verify = useVerifyEmail();
	if (!user || user.emailVerified) return null;
	return (
		<div className="border-b border-primary-100 bg-primary-50">
			<div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm text-navy lg:px-[22px]">
				<MailWarning className="size-4 shrink-0 text-primary-500" aria-hidden />
				<span>Verify your email address ({user.email}) to keep your account secure.</span>
				<button
					type="button"
					onClick={verify.open}
					disabled={verify.opening}
					className="font-medium text-primary-500 underline-offset-4 hover:underline disabled:opacity-60"
				>
					{verify.opening ? "Sending code…" : "Verify now"}
				</button>
			</div>
			<VerifyCodeDialog {...verify.dialogProps} />
		</div>
	);
}
