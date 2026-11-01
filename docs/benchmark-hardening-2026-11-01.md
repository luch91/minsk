# Benchmark hardening and fresh live evaluation

Date: 1 November 2026. Evidence: [raw live results](../model-evaluation/evidence/2026-11-01/live-results.json), [offline rescored summary](../model-evaluation/evidence/2026-11-01/rescored-summary.json), [tested runner](../model-evaluation/evidence/2026-11-01/tested-runner.txt), [tested scorer](../model-evaluation/evidence/2026-11-01/tested-scoring.txt). The snapshots match the SHA-256 values in the raw manifest. Later runner type assertions do not change evaluation behaviour. The offline rescore changes extraction's inapplicable missed-unsafe count to null; it makes no model requests and preserves all original responses and classification scores.

## Results

All 40 planned tasks across eight locked synthetic cases completed, using 48 provider requests. No HTTP/provider errors, retries, fallbacks or unknown-usage dispatches were recorded. The process exited nonzero with COMPLETED_WITH_FAILURES because quality mismatches remain visible.

| Task | Provider/model | Reference agreement | Verified repairs | Token-priced estimate |
| --- | --- | --- | --- | --- |
| Structured extraction | Meta muse-spark-1.3 | 6/8 strict structural matches | Not applicable | $0.034485 |
| Targeted tool investigation | Meta muse-spark-1.3 | 8/8 | 4/4 applicable | $0.021071 |
| Targeted tool investigation | Meta muse-wonder-1.0 | 8/8 | 4/4 applicable | $0.111768 |
| Independent model-only prediction | Meta muse-spark-1.3 | 6/8 | Not applicable | $0.014008 |
| Independent candidate discovery | Baseten meta-models/muse-spark-open-1026 | 8/8 reference candidates found and evaluated | 4/4 deterministic reference repairs | $0.022598 |

Combined estimate: $0.203930, comprising Meta $0.181332 and Baseten $0.022598. These match the before/after provider ledger deltas. Provider invoices and remaining promotional-credit balances were not available; providerBillingReconciled remains false. The user's existing credit-backed provider configuration was used without purchasing services.

Targeted investigations receive the reference condition. Independent discovery does not. The result is not a fair leaderboard across these different tasks, nor evidence of real-world reliability. All cases were previously published synthetic fixtures, so they are not an unseen external test set.

## Quality findings

All eight extractions passed exact source, condition inventory, observations and evidence checks. Strict structure failed on H02 and H06. H02 decomposed the declared procedure into CHECK then DEPLOY steps, preserving the policy and deployment gate but differing from the locked single-step representation. Its strict policy/gate dimensions are also false because those checks require the reference step composition; this is not proof of a wrong policy interpretation. H06 labelled release tagging CHECK rather than the reference DEPLOY, which changes action semantics. These failures have not been hidden or used to tune prompts after the run.

The model-only task missed H07's indeterminate outcome and selected a different condition on H08. Both count against reference agreement. Spark/Wonder tool-assisted results are deterministic simulator outcomes after validated model proposals, not unverified model claims.

## Controls and reproducibility

The live endpoint was https://minsk-api-preview.judithorluchee.workers.dev. Tested Worker version: 8167aaa1-958b-497f-8583-debbef2e90d2. The protected token was temporary and never committed. For this test, the cumulative controlled dispatch allowance was 128 and the Meta conservative evaluation ceiling was $5. Existing defaults, public quotas and the project Meta ceiling were not removed. Usage increased from 68 to 116 cumulative controlled dispatches.

The prior Worker version was restored after testing. Cloudflare required explicit force for rollback because the evaluation secret changed. The old source, original secrets and original limits were then copied into restoration version 7066cd85-bc89-4788-8032-e58c5f7d7c1d using version-specific binding inheritance. Its configured allowance is again 100 calls and $2 conservative Meta evaluation cost. The temporary token was tested against the protected model-only endpoint after restoration and received HTTP 403 without inference. No evaluation records were deleted. Since cumulative dispatches now exceed that original allowance, another controlled run needs an explicitly configured allowance. The public deterministic review Worker was unchanged.

The Git base in the live manifest is the local checkout's base commit, not a claim that the edited tree had already been committed. Full tested runner/scorer snapshots and all relevant source hashes are supplied. Provider behaviour is nondeterministic across calls even with a fixed configuration.

## BYOK boundary

BYOK remains local/self-hosted Worker configuration: provider credentials stay server-side in ignored local configuration or Worker secrets. A hosted evaluation token grants access to operator-funded inference and must not be presented as a user's own key. There is no hosted customer key vault or guided key-entry UI. The fresh live test validates the operator-hosted path, not a new customer onboarding flow.

## Release boundary

The benchmark defects identified in review are corrected with regression coverage. Remaining model quality discrepancies are documented above. Neither the approved visual layout nor production Pages deployment was changed. PR 12 remains draft and unmerged. Historical live result files and locked ground truth are preserved.
