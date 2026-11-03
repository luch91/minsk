# Model integration

The exact model identifiers, purposes, authority boundaries, configuration sources and fallback behaviour are maintained in `config/release-manifest.json` and rendered in the [authoritative release reference](release-reference.md). Model-proposed interventions are validated against the workflow and the deterministic simulator decides outcomes.

Meta requests require `MODEL_CALLS_ENABLED=true`, `META_CREDITS_CONFIRMED=true`, `META_BILLING_MODE=Standard` and a server-side `MODEL_API_KEY`. Wonder also requires `WONDER_ENABLED=true`. Baseten requires its key, `BASETEN_CHALLENGER_ENABLED=true`, and `BASETEN_CREDITS_CONFIRMED=true`. The protected challenger route requires `BASETEN_TEST_TOKEN` unless the separate `PUBLIC_CHALLENGER_ENABLED` switch is explicitly enabled. All switches default to disabled. Store secrets outside Git.

The SQLite-backed Durable Object reserves before each provider call and tracks provider-reported token usage separately. Missing usage and failures retain the reservation. Meta uses a default $50 cumulative ceiling through `META_CEILING_MICRO_USD`. Baseten uses a separate default $10 ceiling through `BASETEN_CEILING_MICRO_USD`. These estimates are not provider billing limits. Compare rates with [Meta pricing](https://dev.meta.ai/docs/pricing-rate-limits) and [Baseten pricing](https://www.baseten.co/pricing/) before activation. Rate limits, maximum outputs and timeouts bound individual calls.

The controlled benchmark Worker uses `MINSK_EVAL_TOKEN`, `MINSK_EVAL_MAX_CALLS` and `MINSK_EVAL_MAX_MICRO_USD`. The call limit applies to both providers; the estimate ceiling applies only to Meta. Run `pnpm benchmark:models -- --provider meta`, `baseten`, or `all` with `MINSK_EVAL_API_URL` and `MINSK_EVAL_TOKEN` in the CLI environment. The `all` mode measures Spark extraction, Spark and Wonder tool-assisted investigations, direct Spark model-only reasoning, and the Baseten challenger. Baseten also requires `MINSK_EVAL_TEST_TOKEN`. Point the CLI at localhost for BYOK or an explicitly authorized HTTPS Worker. Configure provider keys on that Worker, never in a browser. Results are written to ignored `model-evaluation/results/` and contain synthetic workflow data and actual model output.

Public preview quotas are configured with `PUBLIC_GLOBAL_REQUESTS_PER_MINUTE`, `PUBLIC_CLIENT_REQUESTS_PER_MINUTE`, `PUBLIC_GLOBAL_MODEL_CALLS_PER_DAY`, and `PUBLIC_CLIENT_MODEL_CALLS_PER_DAY`. A browser supplies a locally generated opaque session identifier and Cloudflare supplies its client IP. Neither identity is an authentication credential; controlled benchmarking still requires the server-side evaluation token.

See [the local live smoke evidence](issue8-live-smoke.md) for actual provider results, [the historical model evaluation](model-evaluation.md) for the prior experiment, and [security](security.md) for deployment controls. A small synthetic sample does not establish real-world reliability. Certificate integrity verifies consistency and does not authenticate the issuer.

## Historical approved-workbench live verification, 1 November 2026

This section records a past bounded verification and does not define current deployment names, routing or release status.

| Model | Provider | Purpose | This gate |
| --- | --- | --- | --- |
| muse-spark-1.3 | Meta Model API | Extract source text into validated workflow entities and exact evidence; propose counterfactuals and safeguards through tool calls | Extraction and investigation paths succeeded |
| muse-wonder-1.0 | Meta Model API | Server-selected escalation for complex investigations | Not called; temporarily disabled during this bounded test |
| meta-models/muse-spark-open-1026 | Baseten | Independently propose adversarial condition changes for deterministic comparison with the hosted investigation | Valid candidates were returned and evaluated |
| Deterministic evaluator 1.0.0 | Existing simulator, no model | Decide execution and policy outcomes, verify safeguards and certificate consistency | SAFE_EXECUTION, UNSAFE_EXECUTION and SAFE_BLOCK verified |

Spark extraction correctly identified the missing approval gate but left the explicit test-pass observation unknown. Structured review corrected that observation to true before investigation. Editing resets frontend extraction provenance; the raw historical evidence retains the original extraction record.

The historical investigation proposed `c_approval=false`. The simulator returned `UNSAFE_EXECUTION`, then verified adding `c_approval` to `s_deploy` as `SAFE_BLOCK`.

The historical Baseten challenger found that tests=false and migration=false safely blocked while approval=false produced `UNSAFE_EXECUTION`. It found no additional violated policy rules beyond the hosted investigation.

The verification used bounded server-side admission, output and provider controls. Credentials remained server-side; no account information is included.

The browser exported and verified certificate integrity and original input. Integrity hash: `32005eba9d33c50017ad9fa0e63beac7aea0686aab0e3a1c9071aa203d1285a9`. Issuer authenticity remains `NOT_VERIFIED`. Certificate provenance covers the attested investigation; Baseten comparison and extraction evidence are separate.

Exact historical frontend source: `6c905ee807feb54b35798f49f7e46aed4b84eb17`. The temporary branch deployment and approved-workbench alias are historical evidence, not current release endpoints. Current endpoints are defined in the [release reference](release-reference.md).

Release findings: extraction required human correction, and correcting workflow observations clears extraction provenance. The verified results above come from actual response records. No general model-accuracy claim follows from this single synthetic scenario.

## Release hardening, 2 November 2026

The complete extraction, review, Meta tool investigation, independent Baseten comparison, replay and attested certificate journey was verified through the actual browser. See the [historical release hardening report](release-hardening-2026-11-02.md) for preserved controls and raw evidence. Current model roles and endpoints come only from the [release reference](release-reference.md).
