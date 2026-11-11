/** One plain sentence from anything thrown (Error, wallet `{ code, message }` objects, strings). */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
	if (typeof error === "string" && error) return error;
	if (error instanceof Error && error.message) return error.message;
	if (error && typeof error === "object" && "message" in error && typeof error.message === "string" && error.message)
		return error.message;
	return fallback;
}
