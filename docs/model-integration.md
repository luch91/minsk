# Model integration

Muse Spark 1.3 performs extraction and routine investigations through Meta Responses. Muse Wonder 1.0 is selected for complex workflows when enabled. Baseten serves the Meta Muse Spark Open challenger as `meta-models/muse-spark-open-1026`. Model-proposed interventions are validated against the workflow and the deterministic simulator decides outcomes.

Meta requests require `MODEL_CALLS_ENABLED=true`, `META_CREDITS_CONFIRMED=true`, `META_BILLING_MODE=Standard` and a server-side `MODEL_API_KEY`. Wonder also requires `WONDER_ENABLED=true`. Baseten requires its key, `BASETEN_CHALLENGER_ENABLED=true`, and `BASETEN_CREDITS_CONFIRMED=true`. The protected challenger route requires `BASETEN_TEST_TOKEN` unless the separate `PUBLIC_CHALLENGER_ENABLED` switch is explicitly enabled. All switches default to disabled. Store secrets outside Git.

The SQLite-backed Durable Object reserves before each provider call and tracks provider-reported token usage separately. Missing usage and failures retain the reservation. Meta uses a default $50 cumulative ceiling, configurable downward through `META_CEILING_MICRO_USD`. Baseten has no application-dollar ceiling. These estimates are not provider billing limits. Compare rates with [Meta pricing](https://dev.meta.ai/docs/pricing-rate-limits) and [Baseten pricing](https://www.baseten.co/pricing/) before activation. Rate limits, maximum outputs and timeouts bound individual calls.

The controlled benchmark Worker uses `MINSK_EVAL_TOKEN`, `MINSK_EVAL_MAX_CALLS` and `MINSK_EVAL_MAX_MICRO_USD`. The call limit applies to both providers; the estimate ceiling applies only to Meta. Run `pnpm benchmark:models -- --provider meta`, `baseten`, or `all` with `MINSK_EVAL_API_URL` and `MINSK_EVAL_TOKEN` in the CLI environment. The `all` mode measures Spark extraction, Spark and Wonder tool-assisted investigations, direct Spark model-only reasoning, and the Baseten challenger. Baseten also requires `MINSK_EVAL_TEST_TOKEN`. Point the CLI at localhost for BYOK or an explicitly authorized HTTPS Worker. Configure provider keys on that Worker, never in a browser. Results are written to ignored `model-evaluation/results/` and contain synthetic workflow data and actual model output.

Public preview quotas are configured with `PUBLIC_GLOBAL_REQUESTS_PER_MINUTE`, `PUBLIC_CLIENT_REQUESTS_PER_MINUTE`, `PUBLIC_GLOBAL_MODEL_CALLS_PER_DAY`, and `PUBLIC_CLIENT_MODEL_CALLS_PER_DAY`. A browser supplies a locally generated opaque session identifier and Cloudflare supplies its client IP. Neither identity is an authentication credential; controlled benchmarking still requires the server-side evaluation token.

See [the local live smoke evidence](issue8-live-smoke.md) for actual provider results, [the historical model evaluation](model-evaluation.md) for the prior experiment, and [security](security.md) for deployment controls. A small synthetic sample does not establish real-world reliability. Certificate integrity verifies consistency and does not authenticate the issuer.

## Approved workbench live verification, 1 November 2026

| Model | Provider | Purpose | This gate |
| --- | --- | --- | --- |
| muse-spark-1.3 | Meta Model API | Extract source text into validated workflow entities and exact evidence; propose counterfactuals and safeguards through tool calls | One extraction and two investigation requests succeeded |
| muse-wonder-1.0 | Meta Model API | Server-selected escalation for complex investigations | Not called; temporarily disabled during this bounded test |
| meta-models/muse-spark-open-1026 | Baseten | Independently propose adversarial condition changes for deterministic comparison with the hosted investigation | One request returned three valid candidates |
| Deterministic evaluator 1.0.0 | Existing simulator, no model | Decide execution and policy outcomes, verify safeguards and certificate consistency | SAFE_EXECUTION, UNSAFE_EXECUTION and SAFE_BLOCK verified |

Spark extraction response resp_6ae743faaca250e240ab4ab8 used 578 input and 880 output tokens, with 3487 ms provider latency. It correctly extracted the missing approval gate but left the explicit test-pass observation unknown. Structured review corrected that observation to true before investigation. Editing resets frontend extraction provenance; this report retains the original extraction record.

Investigation responses resp_6ae7444c5f48c5a9764147b0 and resp_6ae7444eeafb25719db4400e used 1848 input and 402 output tokens in total. The model proposed c_approval=false. The simulator returned UNSAFE_EXECUTION, then verified adding c_approval to s_deploy as SAFE_BLOCK. Latencies were 1427 and 1436 ms.

Baseten response chatcmpl-e6021f37ecd842618997727e0a335b2f used 334 input and 694 output tokens, with 2643 ms latency. Tests=false and migration=false safely blocked; approval=false produced UNSAFE_EXECUTION. It found no additional violated policy rules beyond the hosted investigation.

Token-priced estimates: Meta $0.008483; Baseten $0.003367; combined $0.011850 against the authorised $1 combined test allowance. These are application estimates using reported usage, not reconciled provider invoices or proof of promotional-credit balance. Existing provider keys were used server-side. Baseten has no application dollar ceiling: this gate bounded it to one request with a 2048 output-token maximum. Meta received a temporary $0.80 incremental ceiling; the remaining $0.20 was reserved for Baseten.

The browser exported and verified certificate integrity and original input. Integrity hash: 32005eba9d33c50017ad9fa0e63beac7aea0686aab0e3a1c9071aa203d1285a9. Issuer authenticity remains NOT_VERIFIED. Certificate provenance covers the two investigation calls; Baseten comparison and extraction evidence are separate.

Exact frontend source: 6c905ee807feb54b35798f49f7e46aed4b84eb17. Temporary live deployment: https://d0e48073.minsk-web-preview.pages.dev. The live-verification origin was removed from Worker CORS after testing and the prior Meta ceiling and Wonder setting restored. The approved-workbench preview remains deterministic with inference disabled. PR 12 remains unmerged.

Release findings: extraction required human correction; correcting workflow observations clears extraction provenance; the workbench model-call metric counts records rather than individual provider requests. The verified results above come from actual response records, not that metric. No general model-accuracy claim follows from this single synthetic scenario.
