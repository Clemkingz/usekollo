import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Public pages only; the app (goals, activity, settings) needs an account and isn't indexed. */
export default function sitemap(): MetadataRoute.Sitemap {
	const url = (path: string) => new URL(path.replace(/^\//, ""), SITE_URL).toString();
	const now = new Date();
	return [
		{ url: url("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
		{ url: url("/sign-up"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
		{ url: url("/sign-in"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
		{ url: url("/legal/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
		{ url: url("/legal/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
		{ url: url("/legal/cookies"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
	];
}
