# Verified GitHub Actions reference case

Minsk includes one corrected, certificate-bound real-world reference beside the predictable Missing Approval fixture. It is historical public configuration evidence, not current production policy and not part of the synthetic benchmark or accuracy metrics.

The source is this repository's CI workflow at immutable revision [`0769cb1`](https://github.com/luch91/minsk/blob/0769cb10564c9c56f4e9467e98e4c6151e21426f/.github/workflows/ci.yml). The repository is MIT licensed. The exact source text is frozen in [`source-ci-0769cb1.yml`](../model-evaluation/real-world-reference/source-ci-0769cb1.yml) with SHA-256 `2857fd50ea7b8b442277909d00789b4f2bc842c84a759c1acc83dc9afdc49afe`.

## Evidence record

| Evidence field | Preserved content |
| --- | --- |
| Source | Immutable public GitHub URL at revision `0769cb10564c9c56f4e9467e98e4c6151e21426f` |
| Retrieved | 2 November 2026; MIT licence recorded |
| Extracted text | Frozen verbatim source plus checked character offsets for every corrected entity |
| Model output | Original structured extraction in [`raw-meta-extraction.json`](../model-evaluation/real-world-reference/raw-meta-extraction.json) |
| Corrections | Owner-confirmed OR branch selector, historical-policy boundary and explicit scenario assumptions |
| Simulation | Corrected baseline is deterministically `SAFE_BLOCK` because the inspected CI workflow contains checks but no deployment action |
| Counterfactual | Change `c_live_model` from `false` to `true`; result is `UNSAFE_EXECUTION` while the review step remains eligible |
| Safeguard | Add `c_live_model` as an execution gate on `s_verify_preview`; verified result is `SAFE_BLOCK` |
| Certificate | Source hash, corrected workflow hash, intervention, trace and outcomes are integrity-bound and independently verified |

## Correction boundary

The raw extraction remains unchanged and evaluates as `INDETERMINATE`. It incorrectly represented the three allowed head refs as simultaneous gates. The corrected workflow replaces them with one condition whose evidence is the complete OR expression.

The isolated-preview step is retained because it existed in the frozen source, but the correction explicitly classifies it as historical review evidence rather than current deployment policy. Values used by the corrected deterministic scenario are labelled assumptions; static YAML is not presented as proof that a runtime provider status was observed.

The complete machine-readable record is [`real-world-extraction-2026-11-02.json`](../model-evaluation/real-world-extraction-2026-11-02.json). Its generated artifacts are:

- [`corrected-workflow.json`](../model-evaluation/real-world-reference/corrected-workflow.json)
- [`counterfactual-and-safeguard.json`](../model-evaluation/real-world-reference/counterfactual-and-safeguard.json)
- [`certificate.json`](../model-evaluation/real-world-reference/certificate.json)

Run `pnpm real-world:check` to reproduce the workflow, evaluations, hashes and certificate verification. CI fails if any generated artifact or source-linked evidence drifts.

The companion [configuration evidence set](../evaluation/real-configuration-cases.json) retains the broader `INDETERMINATE` assessment: this repository workflow does not reveal external Cloudflare deployment controls, GitHub environment protection or release approval. No production workflow is executed or modified by this reference case.
