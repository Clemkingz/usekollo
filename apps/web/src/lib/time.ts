/** "just now", "5m ago", "2h ago", "3d ago", then a short date. Matches the notifications design ("2h ago"). */
export function timeAgo(iso: string, now = Date.now()) {
	const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
	if (seconds < 45) return "just now";
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.round(hours / 24);
	if (days < 7) return `${days}d ago`;
	return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Days left until a goal's target date: "12 days left", "Due today", or overdue. Dates are calendar days (YYYY-MM-DD). */
export function daysLeft(targetDate: string, now = new Date()) {
	const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
	const [y, m, d] = targetDate.split("-").map(Number);
	const days = Math.round((Date.UTC(y!, m! - 1, d!) - today) / 86_400_000);
	if (days < 0) return { days, overdue: true, label: `${-days} day${days === -1 ? "" : "s"} overdue` };
	if (days === 0) return { days, overdue: false, label: "Due today" };
	return { days, overdue: false, label: `${days} day${days === 1 ? "" : "s"} left` };
}

/** "11 Nov 2026, 14:05" for activity rows. */
export function formatDateTime(iso: string) {
	return new Date(iso).toLocaleString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}
