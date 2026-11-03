# Issue 8 local provider smoke test

> Historical provider smoke evidence. Current model roles and deployments are defined in the [authoritative release reference](release-reference.md).

On 2026-10-30 a protected local Worker exercised Meta and Baseten under bounded server-side controls. The test used existing server-side credentials; no credential or account information is included here.

| Task | Provider model | Result | Elapsed |
| --- | --- | --- | --- |
| Extraction | muse-spark-1.3 | Validated workflow and source spans | 7011 ms |
| Investigation | muse-spark-1.3 | SAFE_EXECUTION, UNSAFE_EXECUTION, SAFE_BLOCK; certificate verified | 3950 ms |
| Investigation | muse-wonder-1.0 | SAFE_EXECUTION, UNSAFE_EXECUTION, SAFE_BLOCK; certificate verified | 6029 ms |
| Challenger | meta-models/muse-spark-open-1026 | Three candidates: SAFE_BLOCK, UNSAFE_EXECUTION, SAFE_BLOCK | 5158 ms |

This test forced the investigator model for comparison and does not by itself verify automatic escalation. Certificate integrity and original input matched; issuer authenticity was not verified.

The machine-readable local result is stored in ignored `model-evaluation/results/issue8-smoke.json`. It contains synthetic workflow and provider output, not credentials. These tests do not establish real-world accuracy or prove provider charges.

A subsequent fresh held-out benchmark evaluated eight synthetic cases. Spark extraction matched 8/8 checks. Spark and Wonder each matched 8/8 requested-target simulator outcomes, including four unsafe cases, three safe negative controls and one indeterminate case; each had four verified repairs. Baseten returned matching requested-target outcomes for 7/8 cases; H04 returned malformed candidate JSON. These are small synthetic samples. The protected comparison was interrupted by the configured dispatch controls and resumed after increasing only the local test limits. See the machine-readable [Meta](../model-evaluation/issue8-meta-2026-10-30.json) and [Baseten](../model-evaluation/issue8-baseten-2026-10-30.json) results.

On 2026-10-30, the deployed protected preview Worker was exercised again after the configurable public-quota change. Spark extraction returned a source-validated two-condition workflow. Forced Spark and Wonder investigations each produced `SAFE_EXECUTION`, `UNSAFE_EXECUTION`, and verified `SAFE_BLOCK` results, then exported certificates that independently verified against the original input. The Baseten challenger returned three validated candidates, including the approval counterfactual that produced `UNSAFE_EXECUTION`.
