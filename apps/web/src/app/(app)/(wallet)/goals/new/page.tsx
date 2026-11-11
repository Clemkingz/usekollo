import type { Metadata } from "next";
import { CreateGoalView } from "@/features/goals/components/CreateGoalView";

export const metadata: Metadata = { title: "New goal" };

export default function NewGoalPage() {
	return <CreateGoalView />;
}
