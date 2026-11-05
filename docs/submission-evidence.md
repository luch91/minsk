# Minsk submission evidence for owner review

## Product

Minsk compares an agent workflow's declared policy with its actual execution gates. It accepts a structured workflow or uses Muse Spark to extract one from text, validates source spans, evaluates the baseline, tests a changed condition, and checks a proposed gate in a deterministic simulator. A Counterexample Certificate records the workflow and source hashes, intervention, trace, outcomes, and any attested model calls. The simulator models declared workflow behavior; it does not execute a deployment or establish the state of external infrastructure.

The exact provider identifiers, purposes, authority boundaries, configuration sources and fallback behaviour are defined by the [authoritative release reference](release-reference.md). Models propose hypotheses; the deterministic evaluator decides execution outcomes. The [judge application](https://minsk.pages.dev) opens directly on the prepared Missing Approval workflow and exposes live actions only when server-side provider controls report availability. It does not require Settings, BYOK, or provider-routing knowledge. The [public repository](https://github.com/luch91/minsk) contains the implementation and release evidence. The published [demo video](https://youtu.be/AAyDCW-5OKI) presents the application journey.

The owner reports having submitted Minsk to the Meta Global AI Developer Hackathon 2026. This repository does not contain a submission receipt, confirmation identifier or equivalent evidence that independently verifies the submission.

## Reproducible demonstration

From a clean checkout, run `pnpm install --frozen-lockfile`, then `pnpm demo:journey`. This uses the versioned [Missing Approval fixture](../fixtures/workflows/missing-approval.ts) and makes no provider call. It asserts and prints:

1. Baseline with passing tests, compatible migration, and approval present: `SAFE_EXECUTION`.
2. Counterfactual with approval absent and no approval execution gate: `UNSAFE_EXECUTION`, violating `approval-required` while deployment remains eligible.
3. Safeguard adding approval as a deployment gate: `SAFE_BLOCK`, with `resolved: true`.
4. Certificate export to `demo/results/certificate.json` and independent verification against `demo/results/workflow.json`.

Run `pnpm verify:certificate demo/results/certificate.json demo/results/workflow.json` to repeat the certificate check. A valid integrity hash plus matching original input establishes consistency, not issuer authenticity.

In the judge application, click **Use deterministic demonstration**. Minsk loads the prepared Missing Approval workflow, changes the approval observation, and produces `UNSAFE_EXECUTION` without a provider request. Verify the proposed gate to produce `SAFE_BLOCK`, use the BASELINE, COUNTERFACTUAL, and SAFEGUARD replay controls, inspect the execution trace, and export the certificate. Simulator outcomes are labelled `DETERMINISTIC RESULT`.

The optional actions **Try live extraction**, **Run model-assisted investigation**, and **Run Baseten challenger** are separately labelled and capacity-gated. Fresh model calls are enabled only while server-side switches and allowances permit them. An unavailable or exhausted live provider does not disable the deterministic journey, and a provider failure is never presented as a live success or silently replaced by a deterministic result.

The workflow library also contains **Historical CI review isolation verification**, a corrected real-world reference derived from a frozen public repository source. Its source URL, retrieval date, revision, verbatim snapshot, raw extraction, correction record, deterministic counterfactual, verified safeguard, and certificate hashes are preserved in the repository. For historical model comparison behaviour, use the clearly labelled [2026-10-30 quality summary](../model-evaluation/report-2026-10-30.md). Raw provider recordings are intentionally excluded and the dated summary must not be presented as fresh inference.

## Evaluation and limits

The controlled comparison used eight distinct synthetic scenarios. The privacy-clean [scored rows](../model-evaluation/scored-2026-10-30.json) and [locked reference labels](../model-evaluation/ground-truth.json) preserve the quality breakdown. Spark extraction passed 7/8 strict checks. Spark and Wonder each completed 7/8 primary assisted cases and independently verified 4/4 available unsafe repairs. Baseten completed 6/8 primary challenger cases. Direct Spark completed 7/8 primary analysis cases without verified repairs. These small, structurally similar cases do not establish real-world accuracy. Wonder showed no measured advantage over Spark on this set.

Known limits: Baseten candidate reliability was imperfect in the historical run; external production deployment controls remain incompletely observed; and certificate integrity does not authenticate an issuer. The held-out model comparison is synthetic and does not establish real-world accuracy. The separate [public configuration case](real-configuration-case.md) demonstrates source-linked non-synthetic evidence without claiming field accuracy.

## Official event information checked on 2026-10-30

The [Meta event page](https://dev.meta.ai/events/global-hackathon) and [Cerebral Valley event page](https://cerebralvalley.ai/e/meta-ai-developer-hackathon) state that project submissions are due **November 4, 2026 at 9:00 PM ET**. They describe Indie Developer and Startup tracks and the Build for Your World and Push the Frontier themes. The event page describes the Indie track in terms of creativity, technical ambition, and a working result, and the Startup track in terms of technical execution and production durability. These are the published track descriptions, not a claim about an unpublished scoring rubric.

The public pages still refer selected participants to Official Rules, but the full accepted rules and authenticated submission form were not accessible in this review. Therefore the exact required fields, video format or length, repository visibility rules, and final submission receipt are **not verified**. The owner reports that the submission was completed, and the published demo is linked above. This evidence package does not claim a verified submission receipt.

## Release handoff evidence recorded on 2026-11-04

The release-candidate and production deployments below were built from the same application commit. Both Cloudflare Pages deployments completed successfully before the final production verification.

| Evidence | Reference |
| --- | --- |
| Canonical judge URL | [https://minsk.pages.dev](https://minsk.pages.dev) |
| Published demo video | [https://youtu.be/AAyDCW-5OKI](https://youtu.be/AAyDCW-5OKI) |
| Submission status | Owner reports having submitted; no verified submission receipt is present in the repository. |
| Production build identity | [build-info.json](https://minsk.pages.dev/build-info.json) |
| Immutable production deployment | [5376128f](https://5376128f.minsk.pages.dev) |
| Release-candidate alias | [https://release-candidate.minsk.pages.dev](https://release-candidate.minsk.pages.dev) |
| Immutable release-candidate deployment | [ad4bc74f](https://ad4bc74f.minsk.pages.dev) |
| Application release commit | [`93dd7b8016b402d1827976410a8dddd745a3cba5`](https://github.com/luch91/minsk/commit/93dd7b8016b402d1827976410a8dddd745a3cba5) |
| Startup-render fix and full browser CI | [PR #24](https://github.com/luch91/minsk/pull/24) · [CI run 41709786718](https://github.com/luch91/minsk/actions/runs/41709786718) |
| Guided README and documentation CI | [PR #25](https://github.com/luch91/minsk/pull/25) · [CI run 41715031044](https://github.com/luch91/minsk/actions/runs/41715031044) |
| Documentation commit | [`2ee785ae69213bc128be9f7e1a91e4d53f9293bf`](https://github.com/luch91/minsk/commit/2ee785ae69213bc128be9f7e1a91e4d53f9293bf) |

Cloudflare reports deployment `5376128f-aaec-4607-b0ee-7381efb8909f` as a successful production deployment from `main` and deployment `ad4bc74f-e1e5-4f9f-87da-26f7745bc06e` as a successful preview deployment from `release-candidate`. Each reports application commit `93dd7b8016b402d1827976410a8dddd745a3cba5`. Private account and financial data are intentionally excluded from this evidence file.
