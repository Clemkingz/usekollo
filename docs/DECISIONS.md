# Decisions

Open questions the PRD doesn't settle, and the assumptions the code makes meanwhile. Don't invent product rules in
code: add them here as **PENDING** and link them from the code.

## D1 — Where goal funds are held · **PENDING (blocks Add Savings / Withdraw)**

The PRD needs real Testnet transactions to add to and withdraw from a goal, while staying non-custodial. Something
has to hold a goal's funds that only the user can move.

| Option                          | How                                                                                                                                                                                                                                                                                                                                            | For                                                                                                                                                                | Against                                                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **A. Goal accounts**            | Each goal gets its own Stellar account. Created in one tx signed by the user: `createAccount` + `setOptions` (user's key as the only signer, the throwaway master key set to weight 0; the secret is discarded, never stored). Deposit = payment wallet → goal account; withdraw = payment goal account → wallet, signed by the user's wallet. | Classic operations only, fast to build, truly non-custodial, every step has a hash. Goals can be found on-chain (`/accounts?signer=<user>`), which also solves D2. | Locks ~1.5 XLM reserve per goal (+0.5 per trustline), returned if the goal account is merged. One extra address per goal. |
| **B. Soroban savings contract** | One contract; `deposit(owner, goal, amount)` / `withdraw(owner, goal, amount)` with `owner.require_auth()`. Goals stored in contract storage.                                                                                                                                                                                                  | Cleanest model, one address, goal rules on-chain.                                                                                                                  | Rust contract to write, test and deploy; Soroban RPC + simulation in the frontend; more risk in 14 days.                  |
| C. Earmark only                 | Goals are labels over the wallet balance; no funds move.                                                                                                                                                                                                                                                                                       | Trivial.                                                                                                                                                           | Fails the PRD (no real deposit/withdraw transactions).                                                                    |

**Recommendation:** A for the MVP sprint; B as a later upgrade. Implement in `buildDepositTx` / `buildWithdrawTx`
(`apps/web/src/features/savings/stellar-tx.ts`), plus a `buildCreateGoalTx` if A is chosen.

## D2 — Where goal details live · **PENDING (follows D1)**

Now: localStorage in the browser (`features/goals/store.ts`), so goals don't follow the user to another browser.
With D1-A, goal details can live on the goal account (`manageData`: name, target, date) and be read back from
Horizon; with D1-B, in contract storage.

## D3 — Goal status · assumption

Derived, never stored: **completed** (saved ≥ target), **overdue** (target date passed, not reached), else
**active**. The dashboard badge (`goalBadge`) shows **Done**, **Urgent** (overdue, or due within 14 days:
`URGENT_WITHIN_DAYS`) or **Running**. The 14 days is our assumption; confirm with design/product.

Goal Details "MONTHLY PACE" = confirmed savings ÷ months since the goal was created (at least one month)
(`monthlyPace`). "TOTAL DISBURSED" = confirmed withdrawals. "Settlement asset" shows "XLM (NATIVE)" for lumens and
the issuer for issued assets (the design's "USDC (NATIVE)" would be wrong on Stellar). Withdraw is disabled until
something is saved. An urgent goal at 0% shows a half red arc, as in the new-goal design.

Add Savings: "Max" keeps 2 XLM back on XLM goals (minimum balance + fees); the fee shown is the base fee
(0.00001 XLM, one operation). The Submitting modal's copy drops the design's "Horizon & Soroban VM engine" (jargon,
and a classic payment doesn't run on Soroban).

Withdraw: the amount panel shows "FROM GOAL · <goal> · AVAILABLE <saved>" (the design repeats the wallet's
balance, but a withdrawal is limited by what the goal holds). Failed transfers show a reason code: SIGNATURE REJECTED
(wallet declined), NETWORK REJECTED (Horizon refused; hash shown), NOT AVAILABLE YET (D1), NOT SENT. Profile
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

## D7 — Accounts and email · **PENDING (backend)**

The designs add email + password accounts (sign up, sign in, forgot / reset password, email verification by OTP)
and "Continue with Google". The PRD had wallet-only identity and no backend. Now: an in-browser mock
(`features/auth/api.ts`) with production-shaped rules (hashed passwords and codes, expiry, attempt limits, no account
enumeration on reset); codes show in a toast. Needed: an auth API, an email provider, Google OAuth client, and
whether an account links to one wallet or many (today the wallet is per browser, the account per email).
Assumption from the Account Created design: unverified accounts can use the app; a banner asks them to verify.

## D6 — One app · settled

Landing and app are one Next.js app (`apps/web`); the reference's separate landing and admin apps aren't needed for
the MVP (no admin in the PRD).
