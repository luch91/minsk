# Workbench audit corrections

> Historical correction-gate evidence. Current environment names and release status are defined in the [authoritative release reference](release-reference.md).

The approved interface and provider/evaluator architecture are preserved. These changes correct the failures reproduced in the 2 November application audit.

## First-stage confirmation

Commit `03d73dc25bc4d5804ddc0019283ad2da14d0615d` passed the [first-stage CI run](https://github.com/luch91/minsk/actions/runs/41397671891): 83 application unit tests, 34 desktop/mobile browser tests, the 12-case deterministic benchmark, grounding checks, typecheck, lint, build, content and secret checks. CI's old high-severity audit threshold passed but still reported moderate advisories. The subsequent dependency correction is subject to the stricter full audit below.

| Failure | Correction |
| --- | --- |
| Rejected JSON replaced the active investigation | Server validation and successful evaluation now precede the atomic workflow replacement. Invalid references, cycles, evidence spans and source hashes preserve the prior workflow and results. |
| Imports inherited confirmation | Confirmation is associated with the reviewed workflow contents, and successful imports require review. |
| Policy signal stayed green | The active signal follows evaluated policy results; unevaluated records show unknown. |
| Multi-step graph lost steps/dependencies | Every declared step is rendered, dependency relationships connect the actual steps, inspection resolves the selected step, and gate editing names its target step. |

## Follow-up corrections

The remaining changes began after that first-stage pass:

- Imports and edits remain available in the current tab's workflow library. Switching workflows clears results, and reloading clears the tab's data. Explicit retention notices direct operators to workflow and certificate exports.
- Replacement controls initialise from a valid condition and its declared value type after a workflow replacement.
- Accepted source corrections retain their inspected entity. Validation errors are displayed inside the editor or inspection drawer.
- Workflow editing and its metrics describe the original workflow. Safeguard results remain a separate scenario.
- An already-blocked counterfactual is labelled already protected. Only resolved verification receives the verified label and count.
- Sidebar navigation synchronises the workspace tabs. Read-only metric definitions and workspace settings use accurate labels.
- The guide includes extraction/review, provider availability, BYOK boundaries, unknown evidence, error recovery, cancellation and retention, with working navigation actions.
- Settings documents Spark extraction/routine investigation, server-routed Wonder escalation, and Baseten's independent intervention candidates. BYOK remains local/self-hosted server configuration; hosted tokens are not customer model keys. Credentials are never accepted by this screen.
- The motion checkbox and label are aligned. Graph SVG titles use one string child.
- Development tooling uses ESLint 10 and a patched minimatch override instead of forcing its modern API into ESLint 9's legacy minimatch call sites. Full dependency audit is now an enforced CI step.

## Verification boundaries

`e2e/audit-correctness.spec.ts` exercises the rejected imports, confirmation, scenario indicators, multi-step gate editing/replay, retained imported workflows, typed selection, evidence correction, original/repaired context, unresolved verification, guide/settings navigation, evaluation failure and cancelled replacement. Existing model-fixture, certificate, benchmark, storage-failure, canvas-failure and reduced-motion coverage remains in place.

The current checks and final source SHA are available on [PR #15](https://github.com/luch91/minsk/pull/15). A local pass is not a deployed pass; preview verification must run against the isolated approved-workbench alias after publishing that source. No production deployment, merge, new provider, credential scope change or live inference is part of this correction gate.
