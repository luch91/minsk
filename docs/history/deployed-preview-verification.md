# Isolated deployed workbench verification

> Historical evidence from the pre-production deterministic review gate. The names and URLs below are retained for provenance and are not current release endpoints. See the [authoritative release reference](../release-reference.md).

Frontend: https://approved-workbench.minsk-web-preview.pages.dev
Pages project: minsk-web-preview
Preview branch: approved-workbench (not the production branch).

API: https://faultline-api-visual-preview.judithorluchee.workers.dev
Configuration: apps/api/wrangler.review.jsonc

The existing deterministic visual-review Worker and its existing BudgetLedger namespace are reused. The historical Cloudflare resource name remains unchanged to avoid creating or migrating infrastructure during this gate. Product branding remains Minsk. The live-enabled minsk-api-preview Worker and production Pages deployment are unchanged.

## Isolation

The review Worker has MODEL_CALLS_ENABLED, WONDER_ENABLED, BASETEN_CHALLENGER_ENABLED and PUBLIC_CHALLENGER_ENABLED set to false. It has no provider key binding. Its public availability response reports all model/challenger access disabled without exposing account information. The allowed review origins are explicit; no wildcard was added. Existing quotas and deterministic evaluation are preserved.

The API bundle comes from the tested integration source, not the old visual implementation. Worker deployment identifier: c344fa1a32eb4bad9caa3a6f8e657e50. Previous review version retained for rollback: 45fb9c6b-5c65-485e-ba7b-c4f070f50445.

Initial Pages deployment: a6e4aa9b-560a-449e-a5c2-99b35487f26e, source c8bc12b48140559917895721792628bbe395be69. Subsequent deployment metadata records the PR commit containing the certificate pending-state correction. Static files are uploaded with Wrangler's existing Pages content-hash algorithm. Deployment is not a merge.

## Checks performed on the public deployment

- Missing Approval baseline: SAFE_EXECUTION.
- Human approval false: policy VIOLATED, execution EXECUTED, UNSAFE_EXECUTION.
- Verified approval execution gate: approval remains false, policy VIOLATED, deployment BLOCKED, SAFE_BLOCK.
- Replay reveals BLOCKED with the reason Execution gate violated.
- Returning Home retains the safeguard scenario and graph state.
- Certificate downloaded from the deployed API, integrity verified and original input verified. Issuer authenticity remains NOT_VERIFIED.
- Hosted deterministic benchmark: 12/12 cases match locked expectations.
- Browser error review found extension metadata errors rather than application page errors.

The same Playwright suite now runs against the public preview in the integration PR's CI. It checks provider isolation before starting and captures separate desktop/mobile screenshots, recordings and traces. Live inference remains outside this gate.

## Dependency advisory investigation

The two moderate audit findings are two installed minimatch versions, 3.1.5 and 10.2.6, affected by GHSA-g3hv-75wg-m249 (globparts amplification denial of service). They enter through ESLint and typescript-eslint development tooling. The npm advisory reports affected versions below 11.0.1. They are not runtime imports of the workbench or Worker.

A forced global override from the legacy minimatch API to version 11 is not a compatible maintenance update. No such override was applied. The high-severity CI audit gate passes; this is not a zero-advisory audit. Remediation requires a compatible lint-toolchain update and its own lint/config verification before release. The isolated deterministic preview remains usable with this documented development-tooling limitation.

Advisory: https://github.com/advisories/GHSA-g3hv-75wg-m249

## Release boundary

Keep PR 12 draft and unmerged. This gate does not authorise a model request, provider spending, main deployment or merge. Live extraction and investigation require a separately authorised bounded test. No personal spending was introduced.
