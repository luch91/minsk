# Minsk submission evidence for owner review

## Product

Minsk compares an agent workflow's declared policy with its actual execution gates. It accepts a structured workflow or uses Muse Spark to extract one from text, validates source spans, evaluates the baseline, tests a changed condition, and checks a proposed gate in a deterministic simulator. A Counterexample Certificate records the workflow and source hashes, intervention, trace, outcomes, and any attested model calls. The simulator models declared workflow behavior; it does not execute a deployment or establish the state of external infrastructure.

The exact provider identifiers, purposes, authority boundaries, configuration sources and fallback behaviour are defined by the [authoritative release reference](release-reference.md). Models propose hypotheses; the deterministic evaluator decides execution outcomes. The [judge application](https://minsk-web-preview.pages.dev) opens directly on the prepared Missing Approval workflow and exposes live actions only when server-side provider controls report availability. It does not require Settings, BYOK, or provider-routing knowledge. The [public repository](https://github.com/luch91/minsk) contains the implementation and release evidence.

## Reproducible demonstration

From a clean checkout, run `pnpm install --frozen-lockfile`, then `pnpm demo:journey`. This uses the versioned [Missing Approval fixture](../fixtures/workflows/missing-approval.ts) and makes no provider call. It asserts and prints:

1. Baseline with passing tests, compatible migration, and approval present: `SAFE_EXECUTION`.
2. Counterfactual with approval absent and no approval execution gate: `UNSAFE_EXECUTION`, violating `approval-required` while deployment remains eligible.
3. Safeguard adding approval as a deployment gate: `SAFE_BLOCK`, with `resolved: true`.
4. Certificate export to `demo/results/certificate.json` and independent verification against `demo/results/workflow.json`.

Run `pnpm verify:certificate demo/results/certificate.json demo/results/workflow.json` to repeat the certificate check. A valid integrity hash plus matching original input establishes consistency, not issuer authenticity.

In the judge application, click **Use deterministic demonstration**. Minsk loads the prepared Missing Approval workflow, changes the approval observation, and produces `UNSAFE_EXECUTION` without a provider request. Verify the proposed gate to produce `SAFE_BLOCK`, use the BASELINE, COUNTERFACTUAL, and SAFEGUARD replay controls, inspect the execution trace, and export the certificate. Simulator outcomes are labelled `DETERMINISTIC RESULT`.

The optional actions **Try live extraction**, **Run model-assisted investigation**, and **Run Baseten challenger** are separately labelled and capacity-gated. Fresh model calls are enabled only while server-side switches and allowances permit them. An unavailable or exhausted live provider does not disable the deterministic journey, and a provider failure is never presented as a live success or silently replaced by a deterministic result.

The workflow library also contains **Historical CI review isolation verification**, a corrected real-world reference derived from a frozen public repository source. Its source URL, retrieval date, revision, verbatim snapshot, raw extraction, correction record, deterministic counterfactual, verified safeguard, and certificate hashes are preserved in the repository. For historical model comparison behaviour, use the clearly labelled [2026-10-30 live evaluation evidence](../model-evaluation/report-2026-10-30.md), including actual tool traces in the [raw results](../model-evaluation/evidence-2026-10-30.json). Do not present historical recordings as fresh inference.

## Evaluation and limits

The controlled comparison used eight distinct synthetic scenarios. The [scored rows](../model-evaluation/scored-2026-10-30.json) and [locked reference labels](../model-evaluation/ground-truth.json) preserve the full accuracy breakdown. Spark extraction passed 7/8 strict checks. Spark and Wonder each completed 7/8 primary assisted cases and independently verified 4/4 available unsafe repairs. Baseten completed 6/8 primary challenger cases. Direct Spark completed 7/8 primary analysis cases without verified repairs. These small, structurally similar cases do not establish real-world accuracy. Wonder showed no measured advantage over Spark on this set. The original raw and scored evidence is retained unchanged after remediation.

Known limits: Baseten candidate reliability was imperfect in the historical run; external production deployment controls remain incompletely observed; and certificate integrity does not authenticate an issuer. The held-out model comparison is synthetic and does not establish real-world accuracy. The separate [public configuration case](real-configuration-case.md) demonstrates source-linked non-synthetic evidence without claiming field accuracy.

## Official event information checked on 2026-10-30

The [Meta event page](https://dev.meta.ai/events/global-hackathon) and [Cerebral Valley event page](https://cerebralvalley.ai/e/meta-ai-developer-hackathon) state that project submissions are due **November 4, 2026 at 9:00 PM ET**. They describe Indie Developer and Startup tracks and the Build for Your World and Push the Frontier themes. The event page describes the Indie track in terms of creativity, technical ambition, and a working result, and the Startup track in terms of technical execution and production durability. These are the published track descriptions, not a claim about an unpublished scoring rubric.

The public pages still refer selected participants to Official Rules, but the full accepted rules and authenticated submission form were not accessible in this review. Therefore the exact required fields, video format or length, repository visibility rules, and final submission receipt are **not verified**. The owner must check the accepted rules and live submission form before filing. This package supplies evidence and a demonstration script; it does not claim a completed hackathon submission and does not include a demo video.
