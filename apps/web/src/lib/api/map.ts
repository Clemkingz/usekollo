import type { Activity, Goal, TxStatus } from "@repo/domain/types";
import type { ActivityDto, GoalDto, TxStatusDto } from "@/lib/api/types";

/** API goal → the screens' Goal. */
export function toGoal(dto: GoalDto): Goal {
	return {
		id: dto.id,
		name: dto.name,
		assetId: dto.asset.id,
		assetCode: dto.asset.code,
		targetAmount: dto.targetAmount,
		savedAmount: dto.savedAmount,
		remainingAmount: dto.remainingAmount,
		progress: dto.progressPercent,
		targetDate: dto.targetDate,
		daysLeft: dto.daysLeft,
		status: dto.status,
		targetReached: dto.targetReached,
		canWithdraw: dto.canWithdraw,
		canClose: dto.canClose,
		accountAddress: dto.accountAddress,
		ownerAddress: dto.ownerAddress,
		explorerUrl: dto.explorerUrl,
		reserveXlm: dto.reserveXlm,
		syncedAt: dto.syncedAt,
		reachedAt: dto.reachedAt,
		closedAt: dto.closedAt,
		createdAt: dto.createdAt,
	};
}

/**
 * success → confirmed, submitted → pending (settled by the API in the background), failed → failed. Prepared and
 * expired transactions were never signed: nothing happened, so they aren't activity (PRD: a closed wallet popup
 * records nothing).
 */
const STATUS: Partial<Record<TxStatusDto, TxStatus>> = { success: "confirmed", submitted: "pending", failed: "failed" };

export function toActivity(dto: ActivityDto): Activity | null {
	const status = STATUS[dto.status];
	if (!status) return null;
	return {
		id: dto.id,
		goalId: dto.goalId,
		goalName: dto.goalName,
		kind: dto.kind,
		amount: dto.amount,
		assetCode: dto.assetCode,
		status,
		txHash: dto.txHash,
		explorerUrl: dto.explorerUrl,
		external: dto.external,
		failureReason: dto.failureReason,
		createdAt: dto.createdAt,
		confirmedAt: dto.confirmedAt,
	};
}

export const toActivities = (dtos: ActivityDto[]) => dtos.map(toActivity).filter((a): a is Activity => a !== null);
