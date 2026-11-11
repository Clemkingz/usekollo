"use client";

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";

import { cn } from "./lib/utils";

function InputOTP({
	className,
	containerClassName,
	...props
}: React.ComponentProps<typeof OTPInput> & {
	containerClassName?: string;
}) {
	return (
		<OTPInput
			data-slot="input-otp"
			containerClassName={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)}
			className={cn("disabled:cursor-not-allowed", className)}
			{...props}
		/>
	);
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="input-otp-group" className={cn("flex items-center gap-2 sm:gap-2.5", className)} {...props} />;
}

function InputOTPSlot({
	index,
	className,
	...props
}: React.ComponentProps<"div"> & {
	index: number;
}) {
	const inputOTPContext = React.useContext(OTPInputContext);
	const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

	return (
		<div
			data-slot="input-otp-slot"
			data-active={isActive}
			className={cn(
				"relative flex h-14 w-11 items-center justify-center rounded-2xl border border-field bg-white font-sans text-xl text-ink transition-all outline-none min-[380px]:w-12 sm:h-16 sm:w-14 aria-invalid:border-error-400 data-[active=true]:z-10 data-[active=true]:border-primary-500 data-[active=true]:ring-4 data-[active=true]:ring-primary-500/10 data-[active=true]:aria-invalid:border-error-400 data-[active=true]:aria-invalid:ring-error-400/10",
				className,
			)}
			{...props}
		>
			{char}
			{hasFakeCaret && (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
				</div>
			)}
		</div>
	);
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
	return (
		<div data-slot="input-otp-separator" role="separator" {...props}>
			<MinusIcon />
		</div>
	);
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
