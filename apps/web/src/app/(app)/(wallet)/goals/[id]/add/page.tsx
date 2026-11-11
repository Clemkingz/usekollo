import type { Metadata } from "next";
import { GoalTransferView } from "@/features/savings/components/GoalTransferView";

export const metadata: Metadata = { title: "Add Savings" };

export default async function AddSavingsPage({ params }: PageProps<"/goals/[id]/add">) {
	const { id } = await params;
	return <GoalTransferView id={id} kind="deposit" />;
}
