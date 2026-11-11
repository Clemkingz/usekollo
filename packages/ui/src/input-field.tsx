"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "./lib/utils";

interface InputProps {
	name: string;
	label?: string;
	type?: string;
	placeholder?: string;
	value: string | number | undefined;
	readonly?: boolean;
	error?: string | null;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	min?: number;
	max?: number;
	autoComplete?: string;
	inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
	disabled?: boolean;
	description?: string;
	className?: string;
}

/**
 * Labelled pill input (auth design): 60px pill, #BDBDBD border, blue focus. Password fields get the lock icon and a
 * show/hide toggle. `error` shows under the field and is announced with it.
 */
const InputField: React.FC<InputProps> = ({
	placeholder,
	disabled,
	name,
	readonly,
	label,
	type = "text",
	value,
	onChange,
	onBlur,
	error,
	min,
	max,
	autoComplete,
	inputMode,
	description,
	className = "",
}) => {
	const [view, setView] = useState(false);
	const uid = useId();
	const id = `${name}-${uid}`;
	const isPassword = type === "password";
	const hintId = description ? `${id}-hint` : undefined;
	const errorId = error ? `${id}-error` : undefined;

	return (
		<div className="flex flex-col gap-2.5">
			{label && (
				<Label htmlFor={id} className="text-[15px] font-normal text-ink">
					{label}
				</Label>
			)}

			<div className="relative">
				{isPassword && (
					<LockKeyhole
						aria-hidden
						className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-neutral-800"
					/>
				)}
				<Input
					id={id}
					name={name}
					type={isPassword && view ? "text" : type}
					placeholder={placeholder}
					value={value}
					onChange={onChange}
					onBlur={onBlur}
					disabled={disabled}
					readOnly={readonly}
					min={min}
					max={max}
					autoComplete={autoComplete}
					inputMode={inputMode}
					aria-invalid={error ? true : undefined}
					aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
					className={cn(
						"h-[52px] rounded-full border-field bg-white px-6 text-base text-ink shadow-none caret-primary-500 placeholder:text-field focus-visible:border-primary-500 focus-visible:ring-4 focus-visible:ring-primary-500/10 md:text-base",
						isPassword && "pr-14 pl-13",
						error && "border-error-400 focus-visible:border-error-400 focus-visible:ring-error-400/10",
						readonly && "cursor-not-allowed bg-page",
						className,
					)}
				/>

				{isPassword && (
					<button
						type="button"
						onClick={() => setView((v) => !v)}
						aria-label={view ? "Hide password" : "Show password"}
						aria-pressed={view}
						className="absolute top-1/2 right-4 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-neutral-800 transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:outline-none"
					>
						{view ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
					</button>
				)}
			</div>

			{description && (
				<p id={hintId} className="px-2 text-sm text-neutral-900">
					{description}
				</p>
			)}
			{error && (
				<p id={errorId} role="alert" className="px-2 text-sm text-error-400">
					{error}
				</p>
			)}
		</div>
	);
};

export default InputField;
