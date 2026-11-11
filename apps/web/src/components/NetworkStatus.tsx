"use client";

import { useEffect } from "react";
import { notify } from "@/lib/use-toast";

const OFFLINE_TOAST = "network-offline";

/**
 * Says when the connection drops (a toast that stays until it's back) and when it returns. Wallet requests and
 * saving need the network; nothing is sent while offline.
 */
export function NetworkStatus() {
	useEffect(() => {
		const offline = () =>
			notify.warning("You’re offline", "Nothing will be sent until you’re back online.", {
				id: OFFLINE_TOAST,
				duration: Infinity,
			});
		const online = () => {
			notify.dismiss(OFFLINE_TOAST);
			notify.success("Back online");
		};
		window.addEventListener("offline", offline);
		window.addEventListener("online", online);
		return () => {
			window.removeEventListener("offline", offline);
			window.removeEventListener("online", online);
		};
	}, []);
	return null;
}
