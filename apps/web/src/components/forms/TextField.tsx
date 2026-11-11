"use client";

import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import InputField from "@repo/ui/input-field";

/** `InputField` bound to react-hook-form: value, blur and the field's error message. */
export function TextField<T extends FieldValues>({
	control,
	name,
	label,
	type = "text",
	placeholder,
	autoComplete,
	inputMode,
	description,
}: {
	control: Control<T>;
	name: FieldPath<T>;
	label: string;
	type?: string;
	placeholder?: string;
	autoComplete?: string;
	inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
	description?: string;
}) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<InputField
					name={field.name}
					label={label}
					type={type}
					placeholder={placeholder}
					autoComplete={autoComplete}
					inputMode={inputMode}
					description={description}
					value={field.value ?? ""}
					onChange={field.onChange}
					onBlur={field.onBlur}
					error={fieldState.error?.message}
				/>
			)}
		/>
	);
}
