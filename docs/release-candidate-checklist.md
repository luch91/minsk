# Minsk release certification checklist

Release candidate: https://release-candidate.minsk-web-preview.pages.dev

Canonical judge URL: https://minsk-web-preview.pages.dev

Source completion and production promotion are separate decisions. A source commit is eligible for promotion only after every automated gate below passes. The production URL is certified only after the same commit is deployed to the release-candidate alias, the deployed checks pass, and the owner authorizes promotion. This checklist does not authorize a merge, deployment, provider request, or submission.

## 1. Establish immutable identity

- Record the candidate Git commit SHA and CI run URL.
- Confirm the release-candidate build identity reports that exact SHA and the expected API origin.
- Confirm `config/release-manifest.json` identifies one canonical judge URL and the generated release reference is current.
- Confirm the repository is clean after running the release commands.

## 2. Pass source gates

Run from a clean checkout with Node.js 22 and pnpm 10.18.3:

```sh
pnpm install --frozen-lockfile
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

All commands must pass on the same source SHA. Browser acceptance must cover desktop and mobile. The deterministic benchmark must remain 12/12.

## 3. Verify the prepared judge journey

Open the release-candidate URL. It must load **The Missing Approval** without requiring Settings, BYOK, or provider-routing knowledge.

Confirm the exact actions are visible:

- `Try live extraction`
- `Run model-assisted investigation`
- `Run Baseten challenger`
- `Use deterministic demonstration`

Click `Use deterministic demonstration`. It must make no Meta or Baseten request, produce `UNSAFE_EXECUTION`, and label the outcome `DETERMINISTIC RESULT`. Continue through safeguard verification and confirm `SAFE_BLOCK`, replay, certificate export, and independent certificate verification.

Open **Historical CI review isolation verification** from the workflow library. Confirm it is labelled as a verified historical reference and preserves the frozen public source, retrieval date, source revision, raw extraction, correction record, counterfactual, safeguard, and certificate hashes.

## 4. Verify live controls

- `/api/v1/budget` exposes provider states and remaining dispatch counts only. It must not expose account balances, credentials, or internal cap amounts.
- Global and per-client allowances must be enforced by the API, not only by disabled frontend controls.
- Meta and Baseten kill switches must prevent dispatch independently.
- Baseten must retain its server-side daily request cap and cumulative application cap.
- An exhausted or disabled provider must leave the deterministic demonstration usable.
- Capacity exhaustion, timeout, malformed output, and provider failure must return honest live errors. They must never be replaced with a result presented as live.
- A bounded live smoke, when separately authorized, must record provider, exact model identifier, request purpose, latency, token usage when available, fallback status, and correlation ID.

## 5. Verify authoritative language

Use the generated [release reference](release-reference.md). Its model-purpose matrix must show every exact identifier, purpose, authority, configuration source, and fallback behavior. Product copy must distinguish `live`, `deterministic`, `disabled`, `capacity_exhausted`, `unavailable`, and `fallback` states.

## 6. Promotion decision

Promotion is blocked if any source gate, deployed identity check, deterministic journey, capacity control, or terminology check fails. When all checks pass, record the candidate SHA, CI run, deployed verification result, and owner approval. Promote that exact SHA without rebuilding from different source. Re-run the deployed smoke against the canonical judge URL after promotion.

If the production smoke fails, restore the last verified version, disable affected live providers with their kill switches, and keep the deterministic demonstration available while the issue is investigated.
