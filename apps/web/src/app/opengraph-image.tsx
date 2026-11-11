import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { OG_SIZE, OgCard } from "@repo/ui/og-card";
import { SITE_URL } from "@/lib/site";

/** The link preview (Open Graph; twitter-image.tsx reuses it): brand blue, wordmark, and a sample goal card. */
export const alt = "UseKollo: savings goals for your Stellar wallet. A sample goal, New Laptop, 50% saved.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
	// Literal paths: a dynamic path makes the build trace the whole repo.
	const [bold, medium, wordmark] = await Promise.all([
		readFile(join(process.cwd(), "../../packages/ui/src/assets/fonts/static/Roboto-Bold.ttf")),
		readFile(join(process.cwd(), "../../packages/ui/src/assets/fonts/static/Roboto-Medium.ttf")),
		readFile(join(process.cwd(), "public/images/wordmark-white.png")),
	]);

	return new ImageResponse(
		<OgCard
			wordmark={`data:image/png;base64,${wordmark.toString("base64")}`}
			eyebrow="Stellar Testnet · Non-custodial"
			title="Save for what matters, from your own wallet."
			subtitle="Set goals in XLM or USDC, track every deposit, and withdraw when you hit your target."
			domain={SITE_URL.hostname === "localhost" ? "Savings goals on Stellar" : SITE_URL.host}
		/>,
		{
			...size,
			fonts: [
				{ name: "Roboto", data: bold, weight: 700, style: "normal" },
				{ name: "Roboto", data: medium, weight: 500, style: "normal" },
			],
		},
	);
}
