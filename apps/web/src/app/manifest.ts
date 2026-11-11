import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, withBasePath } from "@/lib/site";

/** Installable app (Add to Home Screen): opens on the dashboard, in the brand blue. */
export default function manifest(): MetadataRoute.Manifest {
	return {
		name: `${SITE_NAME}: ${SITE_TAGLINE}`,
		short_name: SITE_NAME,
		description: SITE_DESCRIPTION,
		start_url: withBasePath("/dashboard"),
		scope: withBasePath("/"),
		display: "standalone",
		background_color: "#f9f9f9",
		theme_color: "#0329e9",
		categories: ["finance", "productivity"],
		icons: [
			{ src: withBasePath("/icons/icon-192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
			{ src: withBasePath("/icons/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
			{ src: withBasePath("/icons/maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
		],
	};
}
