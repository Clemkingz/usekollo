"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "./lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			className={cn(
				"peer size-5 shrink-0 rounded-[4px] border border-field bg-white transition-colors outline-none data-[state=checked]:border-primary-500 data-[state=checked]:bg-primary-500 data-[state=checked]:text-white focus-visible:ring-4 focus-visible:ring-primary-500/15 aria-invalid:border-error-400 disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		>
			<CheckboxPrimitive.Indicator
				data-slot="checkbox-indicator"
				className="grid place-content-center text-current transition-none"
			>
				<CheckIcon className="size-3.5" strokeWidth={3} />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
