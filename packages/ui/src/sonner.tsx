"use client";

import { CircleCheckIcon, InfoIcon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import BtnLoader from "./btn-loader";

/**
 * Toasts in the UseKollo light style: white card, thin #E6E6E6 border, soft shadow, coloured icon per kind, the dot-ring loader for
 * `toast.loading` / `toast.promise` (e.g. "Waiting for your wallet…").
 */
const Toaster = ({ ...props }: ToasterProps) => {
	return (
		<Sonner
			theme="light"
			className="toaster group"
			icons={{
				success: <CircleCheckIcon className="size-5 text-success-400" />,
				info: <InfoIcon className="size-5 text-primary-500" />,
				warning: <TriangleAlertIcon className="size-5 text-warning-600" />,
				error: <OctagonXIcon className="size-5 text-error-400" />,
				loading: <BtnLoader className="size-5 text-primary-500" />,
			}}
			toastOptions={{
				classNames: {
					toast:
						"!bg-white !border !border-line !text-ink !rounded-2xl !shadow-[0_16px_40px_rgba(1,14,82,0.12)] !font-sans !gap-3",
					title: "!text-[15px] !font-medium",
					description: "!text-ink/65 !text-sm",
					actionButton: "!bg-primary-500 !text-white !rounded-full",
					cancelButton: "!bg-page !text-ink !rounded-full",
					closeButton: "!bg-white !border-line !text-ink/60",
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
export { toast } from "sonner";
