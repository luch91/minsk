# Contributing

Open an issue or pull request with a focused change. Before requesting review, run the same source gates as CI:

```sh
pnpm check:content
pnpm check:release
pnpm real-world:check
pnpm check:secrets
pnpm typecheck
pnpm lint
pnpm test
pnpm benchmark
pnpm benchmark:checks
pnpm build
pnpm audit
pnpm e2e --max-failures=1
```

Report only checks you actually ran. Do not commit credentials, private workflow text, account balances or financial reconciliation data. Record human contributors accurately.
