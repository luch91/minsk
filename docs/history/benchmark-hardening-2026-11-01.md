# Benchmark hardening and fresh live evaluation

> Historical benchmark evidence. It does not define current release endpoints, model roles or deployment status. See the [authoritative release reference](../release-reference.md).

Date: 1 November 2026. This record preserves the reviewed quality summary and limitations. Raw provider responses, endpoint identifiers, response IDs, token usage, dispatch metadata and budget snapshots are intentionally excluded from the public repository.

## Results

The planned benchmark across eight locked synthetic cases completed without HTTP/provider errors, retries or fallbacks. The process exited nonzero with `COMPLETED_WITH_FAILURES` because quality mismatches remain visible.

| Task | Provider/model | Reference agreement | Verified repairs |
| --- | --- | --- | --- |
| Structured extraction | Meta muse-spark-1.3 | 6/8 strict structural matches | Not applicable |
| Targeted tool investigation | Meta muse-spark-1.3 | 8/8 | 4/4 applicable |
| Targeted tool investigation | Meta muse-wonder-1.0 | 8/8 | 4/4 applicable |
| Independent model-only prediction | Meta muse-spark-1.3 | 6/8 | Not applicable |
| Independent candidate discovery | Baseten meta-models/muse-spark-open-1026 | 8/8 reference candidates found and evaluated | 4/4 deterministic reference repairs |

Targeted investigations receive the reference condition. Independent discovery does not. The result is not a fair leaderboard across these different tasks, nor evidence of real-world reliability. All cases were previously published synthetic fixtures, so they are not an unseen external test set.

## Quality findings

All eight extractions passed exact source, condition inventory, observations and evidence checks. Strict structure failed on H02 and H06. H02 decomposed the declared procedure into CHECK then DEPLOY steps, preserving the policy and deployment gate but differing from the locked single-step representation. Its strict policy/gate dimensions are also false because those checks require the reference step composition; this is not proof of a wrong policy interpretation. H06 labelled release tagging CHECK rather than the reference DEPLOY, which changes action semantics. These failures have not been hidden or used to tune prompts after the run.

The model-only task missed H07's indeterminate outcome and selected a different condition on H08. Both count against reference agreement. Spark/Wonder tool-assisted results are deterministic simulator outcomes after validated model proposals, not unverified model claims.

## Controls and reproducibility

The test used an explicitly authorized Worker with bounded dispatch and provider controls. The protected token was temporary and never committed. Existing public quotas and project ceilings were not removed.

The prior Worker version was restored after testing. The temporary token was tested against the protected model-only endpoint after restoration and received HTTP 403 without inference. Another controlled run requires an explicitly configured allowance. The public deterministic review Worker was unchanged.

Provider behaviour is nondeterministic across calls even with a fixed configuration. The retained table is a dated quality summary, not a replayable provider recording.

## BYOK boundary

BYOK remains local/self-hosted Worker configuration: provider credentials stay server-side in ignored local configuration or Worker secrets. A hosted evaluation token grants access to operator-funded inference and must not be presented as a user's own key. There is no hosted customer key vault or guided key-entry UI. The fresh live test validates the operator-hosted path, not a new customer onboarding flow.

## Release boundary

The benchmark defects identified in review are corrected with regression coverage. Remaining model quality discrepancies are documented above. Neither the approved visual layout nor production Pages deployment was changed. The locked ground truth and privacy-clean scored summary remain versioned.
