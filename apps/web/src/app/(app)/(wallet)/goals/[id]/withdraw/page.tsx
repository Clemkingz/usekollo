import type { Metadata } from "next";
import { GoalTransferView } from "@/features/savings/components/GoalTransferView";

export const metadata: Metadata = { title: "Withdraw" };

export default async function WithdrawPage({ params }: PageProps<"/goals/[id]/withdraw">) {
	const { id } = await params;
	return <GoalTransferView id={id} kind="withdrawal" />;
}
