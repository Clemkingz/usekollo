/** Brand copy for metadata, link previews and the web manifest. */
const SITE_NAME = "UseKollo";
const SITE_TAGLINE = "Savings goals for your Stellar wallet";
const SITE_DESCRIPTION =
	"Set savings goals in XLM or USDC, add to them from your own Stellar wallet, and watch your progress. Non-custodial: every goal is an account only your wallet controls. Built on Stellar Testnet.";
const SHARE_DESCRIPTION = "Set savings goals, add to them from your own Stellar wallet, and watch your progress.";

const SITE_KEYWORDS = [
	"UseKollo",
	"savings goals",
	"Stellar",
	"Stellar Testnet",
	"non-custodial",
	"self-custody savings",
	"XLM",
	"USDC",
	"Freighter",
	"crypto savings tracker",
];

/** Mirrors the page background token (--color-page) in packages/ui globals.css. */
const THEME_COLOR = "#f9f9f9";

const ORIGIN =
	process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ?? "http://localhost:3000";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix app-local assets when this app is mounted below the site root. */
function withBasePath(src: string) {
	return BASE_PATH && src.startsWith("/") && !src.startsWith(`${BASE_PATH}/`) ? `${BASE_PATH}${src}` : src;
}

/** "See Docs" / "Documentation". TODO: the docs site; until then the landing's How it Works section. */
const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL || "/#how-it-works";

const SITE_URL = new URL(`${BASE_PATH}/`, ORIGIN);

export {
	SITE_NAME,
	SITE_TAGLINE,
	SITE_DESCRIPTION,
	SHARE_DESCRIPTION,
	SITE_KEYWORDS,
	THEME_COLOR,
	SITE_URL,
	BASE_PATH,
	withBasePath,
	DOCS_URL,
};
