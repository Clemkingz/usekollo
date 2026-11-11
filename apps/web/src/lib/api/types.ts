/**
 * The UseKollo API's shapes (OpenAPI at `${API_URL}/docs`). Only `lib/api` and the feature `api.ts` files see these;
 * screens use the domain types (`@repo/domain/types`) the hooks map them to.
 */

export interface PaginationMeta {
	nextPage: boolean;
	previousPage: boolean;
	currentPage: number;
	totalPage: number;
	totalCount: number;
	pageCount: number;
}

export interface Paginated<T> {
	result: T[];
	paginationMeta: PaginationMeta;
}

export interface AuthTokensDto {
	accessToken: string;
	refreshToken: string;
	tokenType: "Bearer";
	/** Access token lifetime in seconds. */
	expiresIn: number;
}

export interface OtpIssuedDto {
	otpExpiresInSeconds: number;
	resendAfterSeconds: number;
}

export interface RegisterResultDto extends OtpIssuedDto {
	email: string;
}

export interface MeDto {
	id: string;
	email: string;
	name: string;
	walletAddress: string | null;
	createdAt: string;
}

export interface AssetDto {
	id: string;
	code: string;
	issuer: string | null;
	native: boolean;
}

export interface WalletAssetDto extends AssetDto {
	trusted: boolean;
	balance: string | null;
	/** What can be moved into a goal now (XLM: minus the minimum balance and a fee margin). */
	spendable: string;
}

export interface WalletDto {
	linked: boolean;
	address: string | null;
	shortAddress: string | null;
	/** False until the wallet has been funded on the network. */
	exists: boolean;
	explorerUrl: string | null;
	assets: WalletAssetDto[];
	linkedAt: string | null;
}

export interface WalletTransactionDto {
	xdr: string;
	networkPassphrase: string;
	expiresAt: string;
}

export type GoalStatusDto = "pending" | "active" | "completed" | "overdue" | "closed";

export interface GoalDto {
	id: string;
	name: string;
	asset: AssetDto;
	targetAmount: string;
	savedAmount: string;
	remainingAmount: string;
	progressPercent: number;
	targetDate: string;
	daysLeft: number;
	status: GoalStatusDto;
	targetReached: boolean;
	canWithdraw: boolean;
	canClose: boolean;
	reachedAt: string | null;
	accountAddress: string;
	ownerAddress: string;
	explorerUrl: string;
	reserveXlm: string;
	syncedAt: string | null;
	closedAt: string | null;
	createdAt: string;
}

export type TxKindDto = "open" | "deposit" | "withdrawal" | "close";
export type TxStatusDto = "prepared" | "submitted" | "success" | "failed" | "expired";

export interface ActivityDto {
	id: string;
	goalId: string;
	goalName: string;
	kind: TxKindDto;
	status: TxStatusDto;
	amount: string;
	assetCode: string;
	txHash: string | null;
	explorerUrl: string | null;
	external: boolean;
	failureReason: string | null;
	createdAt: string;
	confirmedAt: string | null;
}

/** A transaction the API prepared for the wallet to sign; submit it before `expiresAt`. */
export interface PreparedTransactionDto {
	activityId: string;
	kind: TxKindDto;
	xdr: string;
	networkPassphrase: string;
	hash: string;
	expiresAt: string;
	amount: string;
	assetCode: string;
	/** Plain-language summary for the confirm screen. */
	summary: string;
}

export interface GoalWithTransactionDto {
	goal: GoalDto;
	transaction: PreparedTransactionDto;
}

export interface SubmitResultDto {
	activity: ActivityDto;
	goal: GoalDto;
}
