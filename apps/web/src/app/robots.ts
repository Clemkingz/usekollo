import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** The landing, auth and legal pages are indexable; the signed-in app and one-off flows are not. */
export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: [
				"/dashboard",
				"/goals",
				"/activity",
				"/settings",
				"/connect",
				"/account-created",
				"/reset-password",
				"/forgot-password",
			],
		},
		sitemap: new URL("sitemap.xml", SITE_URL).toString(),
	};
}
