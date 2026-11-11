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

- **No backend.** The browser talks to Horizon (Testnet) directly: balances (`lib/stellar/horizon.ts`) and submitting
  signed transactions (`features/savings/stellar-tx.ts`).
- Goals and activity live in localStorage (`features/goals/store.ts`, key `usekollo-goals`) **for now** (DECISIONS D2).
  Screens only use the hooks (`features/goals/hooks.ts`, `features/activity/hooks.ts`), so the storage can change
  without touching them. Bump the store `version` when its shape changes.
- Saved amount, progress and status are **derived** from confirmed activity (`@repo/domain/goal-status`), never stored.

## Accounts (`features/auth`, DECISIONS D7)

- Email + password accounts with emailed 6-digit codes. **No auth backend yet**: `features/auth/api.ts` is an
  in-browser mock behind the `AuthApi` interface (salted PBKDF2 passwords, hashed codes, 10 min expiry, 5 attempts,
  30 s resend). Codes appear in a "Demo inbox" toast. Replace `authApi` with HTTP calls when the backend exists.
- Flows: sign up → `/account-created` (Go to Dashboard · Verify Email Address → OTP modal) · sign in · forgot
  password → reset code (OTP modal) → `/reset-password` (token in memory only). `VerifyCodeDialog` is the one OTP
  modal; `useVerifyEmail()` opens it for the signed-in user (Account Created, app banner, settings).
- Session: `useSessionStore` (localStorage `usekollo-session`); `useSession()` for SSR-safe reads. "Continue with
  Google" says it's coming (needs OAuth + backend).
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

`app/(app)` needs an account (`RequireAccount` → `/sign-in?next=…`) and renders the dashboard shell (header with
transaction search, wallet pill, avatar; sidebar). The dashboard works without a wallet (empty state asks for one);
`app/(app)/(wallet)` (goal pages, activity) adds `RequireWallet` (→ `/connect?next=…`); `/goals` (Savings Goals) sits
outside it and shows the empty state without a wallet. "Create goal" buttons use
`useCreateGoalAction()`, which opens the Connect Wallet modal first when needed.

## Domain rules

- Only `confirmed` activity counts toward a goal. Pending is shown as pending, never as saved. A closed wallet popup
  is never success and records nothing. "Outcome unknown" submits are never retried automatically.
- Money: decimal strings + `@repo/domain/money` (BigInt stroops). Never floats. Never add different assets together.
- Status copy comes from `@repo/domain/labels`. Plain language: avoid blockchain jargon in the UI (PRD).
- Non-custodial: never ask for, log, or store a secret key or recovery phrase.

## Stellar (`features/wallet`, `features/savings`, `lib/stellar`)

- Stellar Wallets Kit 2.x, loaded on first use (`kit.ts`, from the reference), Testnet-pinned: Varial/Freighter,
  xBull, Albedo; LOBSTR and Varial's phone app need WalletConnect (`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, UseKollo's
  own Reown project; without it those wallets are hidden).
- Connecting = the wallet shares its public address (`connect.ts`); no sign-in message, no session server.
- Add savings / withdraw: `useGoalTransaction(kind)` → `buildDepositTx` / `buildWithdrawTx` → wallet `sign` →
  `submitSigned` → activity pending → confirmed / failed / unknown. **The two builders throw until DECISIONS D1 is
  settled**; everything around them is ready.
- Assets: `ASSETS` in `lib/stellar/config.ts` (XLM + Circle Testnet USDC). Explorer: Stellar Expert (testnet).

## App UI patterns

- Loading: `loading.tsx` renders `BrandLoader`; lists use `skeleton-shimmer`; buttons take `isLoading` + `loadingLabel`.
- Errors: `error.tsx` (retry), `global-error.tsx`, `not-found.tsx`; inside pages `ErrorState` / `EmptyState`.
- Toasts: always `notify.*` (`lib/use-toast.ts`).
- Back links: `<BackLink href label>` at the top of inner pages, to the page's parent.
- Motion: `animate-page` per route (`template.tsx`), `animate-rise` with `--i`, `data-reveal` below the fold
  (`@repo/ui/scroll-reveal`). All off for reduced motion.
- Every component marked `TODO(design)` gets rebuilt from the design guide; keep its states and data wiring.
- Built from designs so far: landing (desktop + mobile), sign up, sign in (derived), forgot password, create new
  password, account created, Connect Wallet modal (+ reconnect state: red "Wallet Disconnected" pill), dashboard
  shell (desktop sidebar; phones: bell + profile header and Home · Goals · Activity · Profile tab bar), empty and
  main dashboard (`BalanceCard`, `GoalRow` + `GoalRing`, `ActivityFeed` table/cards with search, status tabs, type
  filter, `Pagination`), Savings Goals (+ empty; period and goal filters), Create Goal (live preview + form), Goal
  Details (new / in progress / complete with summary; `GoalProgressRing`, `Breadcrumb`), Add Savings + Withdraw (`GoalTransferView kind`:
  amount + quick adds + Max → `ReviewTransferDialog` → `SubmittingDialog` once the wallet signs →
  `TransferResultDialog`: complete / failed with a reason code / unknown), Activity (+ empty, `NoActivity`), Profile
  Settings (connected: address, copy, last sync, disconnect; otherwise Connect Wallet). Still `TODO(design)`: OTP modal
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
