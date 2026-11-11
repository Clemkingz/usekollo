import { z } from "zod";
import { passwordMeetsRules } from "@/features/auth/password";

const email = z.string().trim().min(1, "Enter your email address").email("Enter a valid email address");
const newPassword = z.string().refine(passwordMeetsRules, "Use at least 8 characters, including a number");

export const signUpSchema = z.object({
	email,
	password: newPassword,
	acceptTerms: z.boolean().refine((v) => v, "Accept the Terms of Service and Privacy Policy to continue"),
});

export const signInSchema = z.object({
	email,
	password: z.string().min(1, "Enter your password"),
});

export const forgotPasswordSchema = z.object({ email });

export const newPasswordSchema = z
	.object({ password: newPassword, confirmPassword: z.string().min(1, "Confirm your new password") })
	.refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "The passwords don’t match" });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

export const OTP_LENGTH = 6;
