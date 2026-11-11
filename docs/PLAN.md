# Build plan: UseKollo MVP (14-day sprint)

Source: "UseKollo MVP – Project Brief". Structure: reference project `chuksale`. Supporting docs:
`docs/DECISIONS.md` (open questions), `CLAUDE.md` (conventions).

## Phase 0 — Scaffold · done (11 Nov 2026)

- [x] Turborepo + pnpm monorepo with the reference's tooling (Next 16, React 19, Tailwind v4, React Compiler,
      TanStack Query, zustand, react-hook-form + zod, shadcn in `@repo/ui`).
- [x] `@repo/domain`: Goal / Activity / Asset types, exact money math, derived goal status, labels; 6 unit tests.
- [x] Wallet layer from the reference (Stellar Wallets Kit, Testnet-pinned), simplified to address-only connect.
- [x] Every PRD screen has a route with a working, unstyled version: landing, connect, dashboard (empty + filled),
      create goal, goal details, add savings, withdraw, activity.
- [x] Horizon balances; transaction submit + error mapping + activity recording around stub tx builders.
- [x] `pnpm check-types`, `pnpm lint`, `pnpm test` clean; every route returns 200 in dev.

## Phase 1 — Design system · done (11 Nov 2026)

- [x] Tokens, fonts (DM Sans, Inter, JetBrains Mono), logo + icons (extracted from the design), light theme.
- [x] Restyled shared components: pill buttons and inputs, checkbox, OTP slots, dialog, toasts.
- [x] Manifest; OG image with the logo.
- [ ] SVG logo export (the 512px app icon is upscaled from a 118px mark).

## Phase 2 — Screens from the design

- [x] Landing (desktop + mobile, designer SVG illustrations); "Connect Wallet" CTAs → Sign up + Sign in.
- [x] Accounts: sign up, sign in, forgot password, create new password, account created, OTP verification modal
      (mock backend, DECISIONS D7).
- [x] Connect Wallet modal (+ /connect page) · dashboard shell (search, wallet pill, avatar, sidebar) · empty dashboard.
- [x] Main dashboard (desktop + mobile) and reconnect-wallet state; Activity page reuses it.
- [x] Savings Goals (+ empty), Create Goal, Goal Details (new, in progress, complete).
- [x] Add Savings UI: form, review, submitting, complete / failed (transaction blocked on D1)
- [x] Withdraw UI (form, review, submitting, complete, failed), Activity (+ empty), Profile Settings (+ no wallet)
- [ ] Create Savings Goal · Goal Details · Add Savings flow · Withdrawal flow · Activity History

## Phase 3 — Backend + real transactions · done (11 Nov 2026)

- [x] UseKollo API client (`lib/api`), token refresh, errors written for users.
- [x] Accounts on the API (sign up with name, verify, sign in, reset, profile, password, sign out everywhere).
- [x] Wallet linking (challenge), balances from the API, USDC trustline; no Friendbot.
- [x] Goals on the API: create + open (signed), pending / closed states, edit, delete, close.
- [x] Add Savings / Withdraw via API-prepared transactions; withdraw locked until the target (DECISIONS D8).
- [x] Metadata, favicon / icons / manifest, sitemap, branded OG image; loading, error and 404 pages; motion.

## Phase 4 — Verify & ship

- [ ] End-to-end on Testnet with each wallet; record transaction hashes as evidence (PRD).
- [ ] Mobile pass, reduced motion, empty/error states.
- [ ] Deploy (Vercel), WalletConnect allowlist, README walkthrough.
