# Model evaluation

Minsk has two separate evaluation modes. `pnpm benchmark` is deterministic, offline and CI-safe. It runs the 12 versioned Minsk Failure Benchmark cases against the simulator and independent reference oracle. It does not contact a provider.

`pnpm benchmark:models -- --provider meta`, `baseten`, or `all` performs fresh provider calls against eight locked synthetic held-out workflows. It requires `MINSK_EVAL_API_URL` and `MINSK_EVAL_TOKEN`; Baseten also requires `MINSK_EVAL_TEST_TOKEN`. A local Worker with credentials in ignored `.dev.vars` is BYOK. A hosted Worker needs an operator-issued evaluation token. Provider keys are never sent to the CLI.

Each result file records the locked reference, API latency, per-provider telemetry, token usage when reported, estimated usage cost, accounting status, errors, dispatches, retries, fallback count, extraction checks, outcome agreement, unsafe-detection confusion counts, correct indeterminate handling, and independently verified safeguards. The command fails on provider errors instead of presenting a partial run as success. Results are written to ignored `model-evaluation/results/`.

The historical controlled comparison remains immutable in `model-evaluation/`. It contains 48 model-case tasks on eight synthetic scenarios and is not real-world accuracy evidence. The recorded provider token estimate was $0.330163; final provider billing was not returned. See `report-2026-10-30.md`, `scored-2026-10-30.json`, and `ground-truth.json` for exact samples and limitations.

The evaluation dispatch limit covers both providers. `MINSK_EVAL_MAX_MICRO_USD` is a Meta-only conservative estimate limit. Meta's application ceiling defaults to $50. Baseten has no application-dollar ceiling, but retains its authentication, input validation, request, dispatch, timeout and rate controls. Neither local estimate is a provider-side billing guarantee.

## Scoring protocol v2

Run `pnpm benchmark:checks` for transport-mocked CLI regression tests and scoring typecheck. CI executes these without inference. Fresh provider runs require `MINSK_EVAL_DEPLOYMENT_ID`, obtained from the selected Worker's deployed version. It binds the resume fingerprint together with the local Git base commit, endpoint, labels and hashes of the runner, scorer, dataset generator, prompts, provider configuration, contracts and evaluator. The local checkout can contain edits; the recorded source hashes, rather than the base commit alone, identify those bytes. Resume retains every prior attempt, including failures, and dispatches only previously unattempted tasks. Historical v1 files cannot be resumed under v2.

Set the controlled evaluation allowance explicitly before a live run. Eight cases with all five tasks require up to 48 provider dispatches in the current one-change, one-repair protocol. The ledger's controlled dispatch count is cumulative, not reset on each CLI invocation. The configured count must cover existing usage plus planned dispatches. The default remains six calls; the permitted configured maximum is now 200. The Meta estimate ceiling remains separately enforced, and Baseten remains metered without an application dollar ceiling. Never remove controls to complete a run.

Reports distinguish planned, attempted, completed, errored, classified, unclassified and target-matched cases. Agreement per attempt includes errors and missing candidates in its denominator; agreement across planned cases also includes unattempted work. Confusion counts apply only to classified, target-matched cases, while missed unsafe cases include errors, missing candidates and wrong targets. INDETERMINATE is reported separately from determinate negative controls. An unknown output label cannot count as a classification. A correct outcome for a different condition or replacement value cannot count as reference agreement.

Targeted Spark and Wonder investigations are given the reference condition. Baseten candidate discovery and Spark model-only prediction are not. These are separate tasks and must not be ranked as an equal-task model leaderboard. Actual returned model IDs and fallbacks are recorded. Baseten verified repairs are deterministic checks of the reference gate after its candidate is found; they are not Baseten-generated safeguard proposals.

Strict extraction checks cover schema/references, exact source and hash, all named conditions, values/types/freshness, policy predicates and membership, actual gates, step action/dependency structure, and nonempty exact source evidence. The current locked extraction references contain one step. An equivalent multi-step decomposition can fail strict structural agreement. These fixtures do not establish semantic-equivalence recognition or general extraction accuracy. Names match after case/punctuation normalisation; semantic aliases are not guessed.

Failed scoring yields COMPLETED_WITH_FAILURES and a nonzero exit even when all HTTP requests succeed. Budget or rate exhaustion yields STOPPED. Partial work is retained, with planned denominators explicit. Provider estimates are not invoices.

See [the fresh 1 November report](benchmark-hardening-2026-11-01.md), including immutable response evidence and an offline-only rescore.
