"use client";

/**
 * Last-resort boundary (the root layout itself failed), so it brings its own <html> and inline styles: the app's
 * CSS and fonts may not have loaded. Same brand as the rest: light page, ink text, the blue pill button.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
	return (
		<html lang="en">
			<head>
				<title>Something went wrong | UseKollo</title>
			</head>
			<body
				style={{
					margin: 0,
					minHeight: "100dvh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "#f9f9f9",
					color: "#212121",
					fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif",
					textAlign: "center",
					padding: 24,
				}}
			>
				<div style={{ maxWidth: 440 }}>
					<div
						aria-hidden
						style={{
							width: 96,
							height: 96,
							margin: "0 auto",
							borderRadius: "50%",
							border: "8px solid #dfe5fd",
							borderTopColor: "#f23b3b",
							borderRightColor: "#f23b3b",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: 36,
							color: "#f23b3b",
						}}
					>
						!
					</div>
					<h1 style={{ fontSize: 30, fontWeight: 500, margin: "28px 0 0", color: "#010e52" }}>UseKollo is having trouble</h1>
					<p style={{ color: "rgba(33,33,33,0.6)", lineHeight: 1.6, margin: "12px 0 0" }}>
						Something went wrong while loading the app. Your funds are safe in your wallet and nothing was sent. Please try again.
					</p>
					{error.digest && (
						<p style={{ color: "rgba(33,33,33,0.35)", fontSize: 12, fontFamily: "monospace", margin: "8px 0 0" }}>
							Reference: {error.digest}
						</p>
					)}
					<button
						onClick={retry}
						style={{
							marginTop: 28,
							height: 52,
							padding: "0 36px",
							border: 0,
							borderRadius: 999,
							background: "#0329e9",
							color: "#fff",
							fontSize: 16,
							cursor: "pointer",
						}}
					>
						Try again
					</button>
				</div>
			</body>
		</html>
	);
}
