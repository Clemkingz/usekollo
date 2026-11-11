# UseKollo

A non-custodial savings-goal wallet interface on **Stellar Testnet**. Connect your own wallet, create savings goals
(asset, target amount, target date), add to them and withdraw, and track progress and activity. Users approve and sign
every transaction in their own wallet; UseKollo never holds keys or funds.

## Setup

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # optional
pnpm dev                                        # web → http://localhost:3000
```

## Scripts

`pnpm check-types` · `pnpm lint` · `pnpm test` · `pnpm build` · `pnpm format`

## Docs

- `docs/PLAN.md`: phased build plan and status
- `docs/DECISIONS.md`: open product/technical decisions and working assumptions (read D1 first)
- `CLAUDE.md`: conventions for contributors and coding agents

## Testnet wallet setup

1. Install a Stellar wallet (Freighter/Varial extension, xBull, or use Albedo in the browser) and switch it to **Testnet**.
2. Fund the account with test XLM from [Friendbot](https://friendbot.stellar.org) (the dashboard links it when the account doesn't exist yet).
3. For USDC goals, add a trustline to Testnet USDC (issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`) and get test USDC from Circle's faucet.
