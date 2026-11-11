# Decisions

Open questions the PRD doesn't settle, and the assumptions the code makes meanwhile. Don't invent product rules in
code: add them here as **PENDING** and link them from the code.

## D1 — Where goal funds are held · **settled by the API: goal accounts (option A)**

Each goal is its own Stellar account whose only signer is the user's wallet. The API prepares every transaction
(open, deposit, withdrawal, close, trustline), the wallet signs it, and the API checks and submits it
(`POST /goals/{id}/transactions/{activityId}/submit`). Reserve: 1.5 XLM per XLM goal, 2 XLM per USDC goal, returned
when the goal is closed. A Soroban contract (option B) stays a possible later upgrade.

## D2 — Where goal details live · **settled: the UseKollo API**

Goals, activity and the linked wallet live on the API (Postgres); the app no longer stores goals in localStorage.

## D8 — Product rules that came with the API · **adopted (11 Nov 2026)**

- **Withdrawals are locked until a goal reaches its target** (API 403 before). Once reached they stay unlocked and
  everything saved can come out; saving past the target is allowed. The UI shows a locked Withdraw button with the
  amount still to go, and a "Withdrawals unlock at your target" page.
- **Unverified accounts can't sign in.** The Account Created design's "Verify Email Address" step moved before it: the
  sign-up OTP modal confirms the email and signs in. Sign-in with an unverified email opens the same modal (the API
  emails a fresh code). The in-app "verify your email" banner is gone.
- **Sign-up asks for a name** (API requires it; the design has no field): added "Full Name" above email.
- **Reset password**: the API checks the code together with the new password, so a wrong code is reported on
  "Create New password", with "Get a new code".
- **One wallet per account**; linking signs a challenge. It can't be switched or unlinked while goals are open.
- **Creating a goal needs a wallet signature** (opens its account and sets aside the reserve). If the wallet declines,
  the goal waits as "pending" on its page (Open goal / Delete goal).
- **Close / edit / delete** are in the UI: close once reached or while empty; edit name and date any time, target only
  until reached; delete only never-opened goals.
- **No Friendbot button.** An unfunded wallet is told to add test XLM from its wallet app. USDC goals need a trustline
  first: "Add USDC to your wallet" (signed in the wallet).
- **Activity filters run in the browser** over every page of `/activity` (the API has no filter params). PENDING:
  ask the backend for `kind`, `status`, `goalId` and `q` if histories grow.

## D3 — Goal status · assumption

Status comes from the API (pending · active · completed · overdue · closed). The dashboard badge (`goalBadge`) shows **Done**, **Urgent** (overdue, or due within 14 days:
`URGENT_WITHIN_DAYS`) or **Running**. The 14 days is our assumption; confirm with design/product.

Goal Details "MONTHLY PACE" = confirmed savings ÷ months since the goal was created (at least one month)
(`monthlyPace`). "TOTAL DISBURSED" = confirmed withdrawals. "Settlement asset" shows "XLM (NATIVE)" for lumens and
the issuer for issued assets (the design's "USDC (NATIVE)" would be wrong on Stellar). Withdraw is locked until the target is reached (D8). An urgent goal at 0% shows a half red arc, as in the new-goal design.

Add Savings: "Max" uses the API's `spendable` (XLM keeps its minimum balance + fees); the fee shown is the base fee
(0.00001 XLM, one operation). The Submitting modal's copy drops the design's "Horizon & Soroban VM engine" (jargon,
and a classic payment doesn't run on Soroban).

Withdraw: the amount panel shows "FROM GOAL · <goal> · AVAILABLE <saved>" (the design repeats the wallet's
balance, but a withdrawal is limited by what the goal holds). Failed transfers show a reason code: SIGNATURE REJECTED
(wallet declined), NETWORK REJECTED (hash shown), EXPIRED (prepared too long ago), WALLET NOT CONNECTED, CONNECTION
LOST, NOT SENT. A submit the network didn't answer shows "Still Processing" and is never resent. Profile
Settings follows the design (wallet only); log out is in the avatar menu, email verification in the app banner.

The balance card's "TOTAL BALANCE" is the connected wallet's balance in the chosen asset (USDC ▾); its bar is saved ÷
target over unfinished goals in that asset, and "X to Next Goal" is what's left on the goal closest to done. Assets
are never added together.

## D4 — Assets · assumption

XLM and Circle's Testnet USDC (`GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`). List in
`lib/stellar/config.ts`.

## D5 — Wallets · assumption

Freighter/Varial, xBull, Albedo through Stellar Wallets Kit. LOBSTR and phone apps need a UseKollo WalletConnect
(Reown) project id: **TODO** create it and add every deploy domain to its allowlist.

## D7 — Accounts and email · **settled: the UseKollo API**

Email + password accounts with emailed codes on the API (`features/auth/api.ts`). One linked wallet per account.
"Continue with Google" still says it's coming: the API has no OAuth.

## D6 — One app · settled

Landing and app are one Next.js app (`apps/web`); the reference's separate landing and admin apps aren't needed for
the MVP (no admin in the PRD).
