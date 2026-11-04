# Issue 8 local provider smoke test

> Historical provider smoke evidence. Current model roles and deployments are defined in the [authoritative release reference](../release-reference.md).

On 2026-10-30 a protected local Worker exercised Meta and Baseten under bounded server-side controls. The test used existing server-side credentials; no credential or account information is included here.

| Task | Provider model | Result |
| --- | --- | --- |
| Extraction | muse-spark-1.3 | Validated workflow and source spans |
| Investigation | muse-spark-1.3 | SAFE_EXECUTION, UNSAFE_EXECUTION, SAFE_BLOCK; certificate verified |
| Investigation | muse-wonder-1.0 | SAFE_EXECUTION, UNSAFE_EXECUTION, SAFE_BLOCK; certificate verified |
| Challenger | meta-models/muse-spark-open-1026 | Three candidates: SAFE_BLOCK, UNSAFE_EXECUTION, SAFE_BLOCK |

This test forced the investigator model for comparison and does not by itself verify automatic escalation. Certificate integrity and original input matched; issuer authenticity was not verified.

The machine-readable provider recording is not part of the public repository. These tests do not establish real-world accuracy or provider billing.

A subsequent held-out benchmark evaluated eight synthetic cases under a different protocol. Its dated [quality summary](../../model-evaluation/report-2026-10-30.md) is authoritative for that run. These small synthetic samples do not establish real-world accuracy, and their raw provider recordings are intentionally excluded from the public repository.

On 2026-10-30, the deployed protected preview Worker was exercised again after the configurable public-quota change. Spark extraction returned a source-validated two-condition workflow. Forced Spark and Wonder investigations each produced `SAFE_EXECUTION`, `UNSAFE_EXECUTION`, and verified `SAFE_BLOCK` results, then exported certificates that independently verified against the original input. The Baseten challenger returned three validated candidates, including the approval counterfactual that produced `UNSAFE_EXECUTION`.
