import type { MetadataRoute } from "next";

/** The landing page is indexable; the wallet-only app routes are not. */
export default function robots(): MetadataRoute.Robots {
	return { rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/goals", "/activity", "/connect"] } };
}
