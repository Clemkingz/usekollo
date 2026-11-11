import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@repo/ui/sonner";
import { ScrollReveal, ScrollRevealScript } from "@repo/ui/scroll-reveal";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { ConnectWalletDialog } from "@/features/wallet/components/ConnectWalletDialog";
import { SHARE_DESCRIPTION, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TAGLINE, SITE_URL, THEME_COLOR } from "@/lib/site";
import "./globals.css";

/** Design typefaces: DM Sans (headings, marketing copy), Inter (UI), JetBrains Mono (password panel). See globals.css. */
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains", display: "swap" });

const TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

/**
 * App metadata. Icons and link previews come from file conventions in this folder (icon.png · apple-icon.png ·
 * opengraph-image.tsx · twitter-image.tsx). Pages set `title` → "%s | UseKollo".
 */
export const metadata: Metadata = {
	metadataBase: SITE_URL,
	title: { default: TITLE, template: `%s | ${SITE_NAME}` },
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	keywords: SITE_KEYWORDS,
	// Amounts, dates and wallet addresses must not turn into tap-to-call or map links.
	formatDetection: { telephone: false, email: false, address: false, date: false },
	openGraph: { type: "website", locale: "en_US", siteName: SITE_NAME, title: TITLE, description: SHARE_DESCRIPTION, url: "/" },
	twitter: { card: "summary_large_image", title: TITLE, description: SHARE_DESCRIPTION },
};

export const viewport: Viewport = {
	themeColor: THEME_COLOR,
	// Shrink the layout viewport when the keyboard opens instead of covering inputs.
	interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" className={`${dmSans.variable} ${inter.variable} ${jetbrains.variable} antialiased`} suppressHydrationWarning>
			<head>
				<ScrollRevealScript />
			</head>
			<body>
				<ScrollReveal />
				<ReactQueryProvider>
					{children}
					{/* Mounted once; opened from anywhere with useWalletDialog / useRequireWallet. */}
					<ConnectWalletDialog />
					<Toaster
						position="top-right"
						closeButton
						offset={{ top: 80, right: 24 }}
						mobileOffset={{ top: 72, left: 12, right: 12 }}
					/>
				</ReactQueryProvider>
			</body>
		</html>
	);
}
