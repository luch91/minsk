# Judge release candidate

Judge URL: https://minsk-web-preview.pages.dev

The URL must serve the exact verified release commit before it is shared. The application reports Meta and Baseten availability from `/api/v1/budget`; a provider status failure is shown as unavailable instead of disabled.

## Model responsibilities

| Capability | Provider and model | Purpose | Authority |
| --- | --- | --- | --- |
| Workflow extraction | Meta `muse-spark-1.3` | Propose a source-linked structured workflow | Advisory until operator confirmation |
| Routine investigation | Meta `muse-spark-1.3` | Propose a counterfactual and safeguard through tool calls | Advisory |
| Complex investigation | Meta `muse-wonder-1.0` | Server-routed escalation with one bounded Spark fallback | Advisory |
| Challenger | Baseten `meta-models/muse-spark-open-1026` | Propose independent adversarial candidates | Advisory |
| Evaluation | Minsk Evaluator 1.0.0 | Compute baseline, counterfactual, replay and safeguard outcomes | Authoritative for declared workflow semantics |
| Certificate | Minsk certificate service | Bind source, workflow, trace and results with integrity metadata | Integrity record, not issuer authentication |

## Judge controls

- Global live-provider allowance: 120 dispatches per UTC day.
- Per-client allowance: 12 dispatches per UTC day.
- Meta cumulative application estimate ceiling: $49 in the preview configuration.
- Baseten cumulative application estimate ceiling: $10 in the preview configuration.
- Provider kill switches and credit-confirmation switches remain required.
- Deterministic counterfactuals, safeguards, replay and certificate export remain available after live capacity is exhausted.

The ceilings are application estimates, not provider-side billing guarantees. The release operator must confirm current promotional-credit balances and provider billing controls before enabling live inference.
