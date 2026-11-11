/** The UseKollo API (REST, OpenAPI docs at `${API_URL}/docs`). Override with NEXT_PUBLIC_API_URL. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://usekollo-backend-production-152c5e65.up.railway.app").replace(
	/\/+$/,
	"",
);
