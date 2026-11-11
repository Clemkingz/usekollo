import { toast } from "@repo/ui/sonner";
import { errorMessage } from "@/lib/errors";

/**
 * Toasts (sonner; <Toaster /> sits in the root layout, styled in @repo/ui/sonner). Use these, not `toast` directly,
 * so wording stays consistent: success for settled results, `fromError` for failures, `loading` for waits on a
 * wallet or the network (update it in place with the returned id).
 */
export const notify = {
	success: (message: string, description?: string) => toast.success(message, { description }),
	error: (message: string, description?: string) => toast.error(message, { description }),
	fromError: (error: unknown, fallback?: string) => toast.error(errorMessage(error, fallback)),
	warning: (message: string, description?: string, options?: { id?: string; duration?: number }) =>
		toast.warning(message, { description, ...options }),
	info: (message: string, description?: string, duration?: number) => toast.info(message, { description, duration }),
	loading: (message: string, description?: string) => toast.loading(message, { description }),
	dismiss: (id?: string | number) => toast.dismiss(id),
};
