import type { Metadata } from "next";
import { SettingsView } from "@/features/auth/components/SettingsView";

export const metadata: Metadata = { title: "Profile settings" };

export default function SettingsPage() {
	return <SettingsView />;
}
