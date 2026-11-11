# UseKollo (non-custodial savings goals on Stellar Testnet)

Users connect their own Stellar Testnet wallet, create savings goals (name, asset, target amount, target date), add
savings and withdraw through wallet-signed transactions, and track progress and activity. PRD: the "UseKollo MVP –
Project Brief" (14-day sprint). Plan: `docs/PLAN.md`. Open decisions: `docs/DECISIONS.md` (don't invent product
rules; add them there as PENDING). Structure and tooling mirror the reference project `chuksale`.

## Monorepo

Turborepo + pnpm, Node ≥ 22.

```
apps/web/            (:3000) landing (/) + auth (/sign-up, /sign-in, …) + wallet connect (/connect) + app (/dashboard, /goals/*, /activity, /settings)
packages/domain/     @repo/domain: types (Goal, Activity, Asset), exact money math, derived goal status, labels
packages/ui/         @repo/ui: design tokens, shadcn components, motion; design exports in src/assets/images
packages/eslint-config, packages/typescript-config
```

`pnpm dev` · `pnpm build` · `pnpm check-types` · `pnpm lint` · `pnpm test` · `pnpm format` (tabs, width 130).

## Data

- **The UseKollo API** (`NEXT_PUBLIC_API_URL`, default the Railway deploy; OpenAPI at `<url>/docs`, JSON at
  `/docs-json`) owns accounts, the linked wallet, goals and activity. All calls go through `api()` in
  `lib/api/client.ts`: unwraps `{ data }`, throws `ApiError` (its `message` is written for users), sends the bearer
  token and refreshes it once on 401 (single flight; refresh tokens are single use).
- API DTOs live in `lib/api/types.ts`; `lib/api/map.ts` maps them to `@repo/domain/types`. Screens use the hooks
  (`features/goals/hooks.ts`, `features/activity/hooks.ts`, `features/wallet/hooks.ts`), backed by TanStack Query.
  One `queryClient` (`lib/query-client.ts`) with `keys`; `refreshAfterTransaction()` after anything moves funds.
- Saved amount, progress, status, `canWithdraw` / `canClose` come **from the API**. Activity: `success` → confirmed,
  `submitted` → pending (the API settles it), `failed`; `prepared` / `expired` were never signed and aren't shown.

## Accounts (`features/auth`, DECISIONS D7)

- Email + password accounts on the API (`features/auth/api.ts`); 6-digit emailed codes (10 min, 5 tries, resend after
  60 s). Only verified accounts can sign in.
- Flows: sign up (name, email, password) → OTP modal → verified + signed in → `/account-created` · sign in (unverified
  → API emails a code → OTP modal → signed in) · forgot password → reset code (OTP modal, only collected) →
  `/reset-password` sends email + code + new password (code checked there; memory only). `VerifyCodeDialog` is the
  one OTP modal. Settings: name, change password, sign out everywhere.
- Session: `useSessionStore` (localStorage `usekollo-session`: tokens + user); `useSession()` for SSR-safe reads. A
  refused refresh calls `expire()` → `RequireAccount` sends to sign-in, which says the session ended. "Continue with
  Google" says it's coming (no OAuth on the API).
- React Compiler memoizes closures by the values they read: read nullable state through a local (`const email =
sent?.email ?? ""`) instead of `sent!.email` inside callbacks, or it throws during render.

## Routes (`lib/routes.ts`, PRD "Key Screens")

| #   | Screen                  | Route                                           |
| --- | ----------------------- | ----------------------------------------------- |
| 1   | Landing / Welcome       | `/` (`app/(marketing)`); auth pages at the root |
| 2   | Wallet connection       | `/connect?next=` (+ the same panel as a dialog) |
| 3–4 | Empty / main dashboard  | `/dashboard`                                    |
| 5   | Create goal             | `/goals/new`                                    |
| 6   | Goal details + activity | `/goals/[id]`                                   |
| 7   | Add savings             | `/goals/[id]/add`                               |
| 8   | Withdraw                | `/goals/[id]/withdraw`                          |
| 9   | Activity history        | `/activity`                                     |

`app/(app)` needs an account (`RequireAccount` → `/sign-in?next=…`), is noindex, and renders the dashboard shell
(header with transaction search, wallet pill, avatar; sidebar). The dashboard works without a wallet (empty state
asks for one); `app/(app)/(wallet)` (goal pages, activity) adds `RequireWallet` (needs a **linked** wallet →
`/connect?next=…`); `/goals` (Savings Goals) sits outside it and shows the empty state without a wallet. "Create goal"
buttons use `useCreateGoalAction()`, which opens the Connect Wallet modal first when needed.

## Domain rules

- Goal lifecycle (API): `pending` (created, account not opened: the wallet must approve) → `active` / `overdue` →
  target reached (`completed`; withdrawals unlock and stay unlocked; saving past the target is allowed) → `closed`
  (everything plus the XLM reserve back to the wallet). Withdrawals are **locked until the target is reached**.
  Only never-opened goals can be deleted; a goal can be closed once reached or while empty.
- Pending is shown as processing, never as saved. A closed wallet popup is never success. A submit the network didn't
  answer (`pending`) is never resent; the API settles it and the activity list polls.
- Money: decimal strings + `@repo/domain/money` (BigInt stroops). Never floats. Never add different assets together.
- Status copy comes from `@repo/domain/labels`. Plain language: avoid blockchain jargon in the UI (PRD).
- Non-custodial: never ask for, log, or store a secret key or recovery phrase.

## Stellar (`features/wallet`, `features/savings`, `lib/stellar`)

- Stellar Wallets Kit 2.x, loaded on first use (`kit.ts`, from the reference), Testnet-pinned: Varial/Freighter,
  xBull, Albedo; LOBSTR and Varial's phone app need WalletConnect (`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, UseKollo's
  own Reown project; without it those wallets are hidden).
- One wallet per account, linked on the API. Connecting (`connect.ts`): the wallet shares its address; unless the
  account already has it linked, it signs the API's challenge (never submittable) and `POST /wallet/link`. A wallet
  can't be switched or unlinked while goals are open. `useConnectedWallet()`: `address` = the LINKED wallet,
  `canSign` = this browser has a wallet session for it (else the header shows "Wallet Disconnected").
- Every move of funds: the API prepares XDR → wallet `sign` → `POST /goals/{id}/transactions/{activityId}/submit`
  (`signAndSubmit` in `features/savings/hooks.ts`). Open (on create, or `/open` for pending), deposit, withdrawal,
  close. Add Savings prepares on "Review" (API errors show inline), then signs on Confirm; prepared txs expire.
- Each goal is its own Stellar account (reserve 1.5 XLM, 2 for USDC). USDC needs a wallet trustline first
  (`AssetReadiness` → `addTrustline`). Unfunded wallets are told to add test XLM from their wallet app (no Friendbot).
- Assets: `ASSETS` in `lib/stellar/config.ts` (XLM + Circle Testnet USDC; same ids as the API). Balances and
  `spendable` come from `GET /wallet`. Explorer: Stellar Expert (testnet).

## App UI patterns

- Loading: root `loading.tsx` = `BrandLoader` (leaf mark in a filling ring); `(app)/loading.tsx` = page skeleton;
  screens have shaped skeletons (`DashboardSkeleton`, goal/transfer skeletons); buttons take `isLoading` +
  `loadingLabel`; multi-step wallet actions show `TxSteps` (prepare → approve in wallet → confirm).
- Errors: `error.tsx` + `(app)/error.tsx` (retry, `StatusArt`), `global-error.tsx` (inline styles), `not-found.tsx`
  ("0% found" ring); inside pages `ErrorState` (retry + action) / `EmptyState`.
- Toasts: always `notify.*` (`lib/use-toast.ts`). Failed background refreshes toast once (`queryClient`);
  `NetworkStatus` announces offline / back online.
- Metadata: favicon.ico / icon.png / apple-icon.png (white mark on brand blue), `manifest.ts`, `sitemap.ts`,
  `robots.ts`, `opengraph-image.tsx` (`@repo/ui/og-card`). Set `NEXT_PUBLIC_SITE_URL` in deploys.
- Back links: `<BackLink href label>` at the top of inner pages, to the page's parent.
- Motion: `animate-page` per route (`template.tsx`), `animate-rise` with `--i`, `animate-grow` (bars),
  `animate-ring-in` (rings), `AnimatedNumber` for balances, `animate-check` on success, `data-reveal` below the fold
  (`@repo/ui/scroll-reveal`). All off for reduced motion.
- Every component marked `TODO(design)` gets rebuilt from the design guide; keep its states and data wiring.
- Built from designs so far: landing (desktop + mobile), sign up, sign in (derived), forgot password, create new
  password, account created, Connect Wallet modal (+ reconnect state: red "Wallet Disconnected" pill), dashboard
  shell (desktop sidebar; phones: bell + profile header and Home · Goals · Activity · Profile tab bar), empty and
  main dashboard (`BalanceCard`, `GoalRow` + `GoalRing`, `ActivityFeed` table/cards with search, status tabs, type
  filter, `Pagination`), Savings Goals (+ empty; period and goal filters), Create Goal (live preview + form), Goal
  Details (new / in progress / complete with summary; `GoalProgressRing`, `Breadcrumb`), Add Savings + Withdraw (`GoalTransferView kind`:
  amount + quick adds + Max → `ReviewTransferDialog` → `SubmittingDialog` once the wallet signs →
  `TransferResultDialog`: complete / failed with a reason code / still processing), Activity (+ empty, `NoActivity`),
  Profile Settings (connected: address, copy, last sync, disconnect; otherwise Connect Wallet). Derived (no design):
  pending / closed goal cards, withdraw-locked state, close / delete / edit goal dialogs, USDC trustline notice,
  settings account / password / sessions sections. Still `TODO(design)`: OTP modal
  (derived), Withdraw/Add mobile layouts (derived).
- Money on goal screens: `money(amount, code)` (`lib/money.ts`) shows USDC as dollars, other assets with their code.

## Design system (`packages/ui`)

Tokens in `src/styles/globals.css`: primary `#0329E9` (`primary-50…700`), `navy` #010E52 (hero headings), `ink`
#212121 (text), `page` #F9F9F9, `canvas` #F0F0F0 (app background), `lavender` #EFE6FC, `line`, `field` (input
borders). Fonts via next/font in the root layout: DM Sans (`font-display`: headings, marketing copy), Inter
(`font-sans`: UI), JetBrains Mono (`font-mono`: KEY INTEGRITY). Buttons are full pills (`default`, `outline`,
`light`, `outline-light` on blue). Inputs are 52px pills (`@repo/ui/input-field`). Logo: `components/Logo.tsx`
(PNG with alpha extracted from the design; `variant="wordmark"`, `tone="light"`). TODO: SVG logo export.

## Conventions

- Feature folders: `src/features/<domain>/{components/, hooks.ts, schema.ts, store.ts}`. `src/app/**` pages stay thin.
  Layout pieces in `src/components/layouts`, providers in `src/components/providers`.
- Imports: `@/…` inside the app, `@repo/ui/…`, `@repo/domain/…`. Named exports for components; route files default.
- Every `<form>` using `form.handleSubmit` needs `noValidate`. A component using `useSearchParams` needs `<Suspense>`.
- Never `setState` synchronously in `useEffect`; never read `ref.current` during render. Flex children with long
  text need `min-w-0`.

## Landmines

1. pnpm strict linking: a package imported in a file must be a dependency of _that_ workspace package. `next/*`
   stays in apps, never `@repo/ui`.
2. Restart the dev server after `pnpm install`. Stale TS errors after tsconfig changes: delete `*.tsbuildinfo`.
3. New dependency with build scripts → `allowBuilds` in `pnpm-workspace.yaml`.
4. Don't `next build` into `.next` while dev runs: `NEXT_DIST_DIR=.next-verify npx next build`.
5. Next 16: error boundaries get `retry()`; route params are Promises (`PageProps<"/goals/[id]">`). Read
   `apps/web/AGENTS.md`.
6. Keep all `@radix-ui/*` on the same release; `recharts` stays 2.x.
