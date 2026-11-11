import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { PASSWORD_RULES, passwordStrength } from "@/features/auth/password";

/** "KEY INTEGRITY" panel (design): strength bar and the password rules, ticked live as the user types. */
export function KeyIntegrity({ password }: { password: string }) {
	const strength = passwordStrength(password);
	const tone = strength >= 0.85 ? "bg-success-400" : strength >= 0.7 ? "bg-primary-500" : "bg-error-400";
	return (
		<div className="rounded-2xl bg-page px-5 py-4 font-mono text-ink">
			<p className="text-[15px] font-medium tracking-[0.12em] uppercase">Key integrity</p>
			<div
				className="mt-3 h-1 overflow-hidden rounded-full bg-line"
				role="meter"
				aria-label="Password strength"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(strength * 100)}
			>
				<div
					className={cn("h-full rounded-full transition-[width] duration-300", tone)}
					style={{ width: `${strength * 100}%` }}
				/>
			</div>
			<ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
				{PASSWORD_RULES.map((rule) => {
					const met = rule.test(password);
					return (
						<li key={rule.id} className="flex items-center gap-2">
							{met ? (
								<CheckCircle2 className="size-[18px] text-primary-500" aria-hidden />
							) : (
								<Circle className="size-[18px]" aria-hidden />
							)}
							<span>
								{rule.label}
								<span className="sr-only">{met ? " (met)" : " (not met yet)"}</span>
							</span>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
