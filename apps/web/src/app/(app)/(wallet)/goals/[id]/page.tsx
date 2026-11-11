import type { Metadata } from "next";
import { GoalDetailView } from "@/features/goals/components/GoalDetailView";

export const metadata: Metadata = { title: "Goal" };

export default async function GoalPage({ params }: PageProps<"/goals/[id]">) {
	const { id } = await params;
	return <GoalDetailView id={id} />;
}
