/**
 * The social preview card (1200×630) rendered through `next/og` in the app's `opengraph-image.tsx`. UseKollo brand:
 * primary #0329E9 with a navy (#010E52) wash, white type, and a sample goal card (ring, saved of target, progress) so
 * the preview shows what the product does. Inline styles only: the renderer supports a subset of CSS and needs
 * `display: flex` on any element with more than one child.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;

export interface OgCardProps {
	/** Data URL of the white wordmark (PNG). */
	wordmark?: string;
	eyebrow: string;
	title: string;
	subtitle: string;
	/** Footer line, usually the site's host. */
	domain: string;
	/** Sample goal on the right. */
	goal?: { name: string; saved: string; target: string; percent: number };
}

const BLUE = "#0329e9";
const NAVY = "#010e52";
const INK = "#212121";

export function OgCard({
	wordmark,
	eyebrow,
	title,
	subtitle,
	domain,
	goal = { name: "New Laptop", saved: "$250.00", target: "$500.00", percent: 50 },
}: OgCardProps) {
	const r = 54;
	const c = 2 * Math.PI * r;
	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				position: "relative",
				backgroundColor: BLUE,
				backgroundImage: `radial-gradient(circle at 100% 100%, ${NAVY} 0%, rgba(1,14,82,0) 55%), radial-gradient(circle at 0% 0%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 40%)`,
				fontFamily: "Roboto",
				color: "#ffffff",
			}}
		>
			<div
				style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: 700 }}
			>
				{wordmark ? (
					<img src={wordmark} height={44} width={199} alt="" />
				) : (
					<span style={{ fontSize: 40, fontWeight: 700 }}>usekollo</span>
				)}

				<div style={{ display: "flex", flexDirection: "column" }}>
					<div
						style={{
							display: "flex",
							alignSelf: "flex-start",
							fontSize: 20,
							fontWeight: 500,
							padding: "8px 18px",
							borderRadius: 999,
							color: "#ffffff",
							border: "1px solid rgba(255,255,255,0.45)",
							backgroundColor: "rgba(255,255,255,0.12)",
						}}
					>
						{eyebrow}
					</div>
					<div style={{ display: "flex", fontSize: 60, fontWeight: 700, lineHeight: 1.08, marginTop: 26, letterSpacing: -1 }}>
						{title}
					</div>
					<div
						style={{
							display: "flex",
							fontSize: 26,
							fontWeight: 500,
							marginTop: 20,
							color: "rgba(255,255,255,0.78)",
							lineHeight: 1.35,
						}}
					>
						{subtitle}
					</div>
				</div>

				<div style={{ display: "flex", fontSize: 22, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>{domain}</div>
			</div>

			{/* Sample goal card */}
			<div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", paddingRight: 64 }}>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						width: 380,
						padding: 32,
						borderRadius: 32,
						backgroundColor: "#ffffff",
						color: INK,
						boxShadow: "0 30px 80px rgba(1,14,82,0.45)",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<span style={{ fontSize: 28, fontWeight: 700 }}>{goal.name}</span>
						<span
							style={{
								display: "flex",
								fontSize: 15,
								fontWeight: 500,
								padding: "6px 14px",
								borderRadius: 999,
								backgroundColor: "#dfe5fd",
								color: "#011a96",
							}}
						>
							RUNNING
						</span>
					</div>
					<div style={{ display: "flex", alignItems: "center", marginTop: 28, gap: 26 }}>
						<div style={{ display: "flex", position: "relative", width: 128, height: 128 }}>
							<svg width="128" height="128" viewBox="0 0 128 128" style={{ transform: "rotate(-90deg)" }}>
								<circle cx="64" cy="64" r={r} fill="none" stroke="#e8e8e8" strokeWidth="12" />
								<circle
									cx="64"
									cy="64"
									r={r}
									fill="none"
									stroke={BLUE}
									strokeWidth="12"
									strokeLinecap="round"
									strokeDasharray={`${(goal.percent / 100) * c} ${c}`}
								/>
							</svg>
							<div
								style={{
									display: "flex",
									position: "absolute",
									top: 0,
									left: 0,
									width: 128,
									height: 128,
									alignItems: "center",
									justifyContent: "center",
									fontSize: 28,
									fontWeight: 700,
								}}
							>
								{`${goal.percent}%`}
							</div>
						</div>
						<div style={{ display: "flex", flexDirection: "column" }}>
							<span style={{ fontSize: 16, color: "rgba(33,33,33,0.55)" }}>SAVED</span>
							<span style={{ fontSize: 38, fontWeight: 700, marginTop: 4 }}>{goal.saved}</span>
							<span style={{ fontSize: 18, color: "rgba(33,33,33,0.55)", marginTop: 2 }}>{`of ${goal.target}`}</span>
						</div>
					</div>
					<div style={{ display: "flex", marginTop: 30, height: 12, borderRadius: 999, backgroundColor: "#eef1fe" }}>
						<div style={{ display: "flex", width: `${goal.percent}%`, borderRadius: 999, backgroundColor: BLUE }} />
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							marginTop: 14,
							fontSize: 16,
							color: "rgba(33,33,33,0.55)",
						}}
					>
						<span>From your own wallet</span>
						<span>Stellar Testnet</span>
					</div>
				</div>
			</div>
		</div>
	);
}
