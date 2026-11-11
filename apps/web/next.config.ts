import type { NextConfig } from "next";

/**
 * UseKollo has no backend: the browser talks to Stellar Testnet directly (Horizon for reads and submits, the user's
 * wallet for signing). `BASE_PATH` mounts the app below the site root when needed (default: the root).
 */
const BASE_PATH = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
	basePath: BASE_PATH,
	env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH, NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "" },
	// One-off verification builds (`NEXT_DIST_DIR=.next-verify next build`) never overwrite a running dev server's `.next`.
	distDir: process.env.NEXT_DIST_DIR || ".next",
	images: { unoptimized: true },
	reactCompiler: true,
	transpilePackages: ["@repo/ui", "@repo/domain"],
	allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
};

export default nextConfig;
