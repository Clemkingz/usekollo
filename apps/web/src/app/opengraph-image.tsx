import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { OG_SIZE, OgCard } from "@repo/ui/og-card";

/** The link preview (Open Graph; twitter-image.tsx reuses it). TODO(design): logo and illustration. */
export const alt = "UseKollo: savings goals for your Stellar wallet.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
	// Literal paths: a dynamic path makes the build trace the whole repo.
	const [bold, medium] = await Promise.all([
		readFile(join(process.cwd(), "../../packages/ui/src/assets/fonts/static/Roboto-Bold.ttf")),
		readFile(join(process.cwd(), "../../packages/ui/src/assets/fonts/static/Roboto-Medium.ttf")),
	]);

	return new ImageResponse(
		<OgCard
			eyebrow="Stellar Testnet"
			title="Save for what matters, from your own wallet."
			subtitle="Set goals, track progress, stay in control of your funds."
			domain="usekollo.com"
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
