/** Re-mounts per route, so every page enters with the same short fade-and-lift (reduced motion: none). */
export default function Template({ children }: { children: React.ReactNode }) {
	return <div className="animate-page flex flex-1 flex-col">{children}</div>;
}
