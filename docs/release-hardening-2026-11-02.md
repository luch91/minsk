# Release hardening and provider journey, 2 November 2026

Merge recommendation: GO when the current PR head passes CI. PR 12 remains draft and unmerged until owner authorisation. This recommendation concerns merging the tested implementation; production activation remains a separate release decision.

## Preserved interface and behaviour

The approved dark palette, component layout and persistent interference field are unchanged. No stylesheet, visual asset, simulator semantic rule or certificate integrity algorithm changed in this gate. The source-input counter now matches the API's 15,000-character extraction limit. Extracted or edited workflows are labelled Operator workflow rather than Versioned fixtures.

## Engineering changes

- An investigation lease covers the maximum Wonder timeout, Spark fallback and safeguard follow-up. An expired request cannot release a newer request's lease. The existing SQLite namespace is migrated in place without deleting records.
- Both investigator prompts include policy predicates, expected observations, freshness metadata, step action types and dependencies. The deterministic evaluator remains authoritative.
- Invalid upstream tool JSON, unknown targets and unchanged observations are rejected with controlled provider errors. Provider response bodies and credentials are not returned to users.
- Request bodies are capped at 60,000 streamed UTF-8 bytes before decoding. Browser storage denial no longer prevents API requests. Provider availability is fetched once per initialisation.
- Editing a workflow prevents an initial baseline request from overwriting its result. A successful new experiment or investigation invalidates previous certificate and comparison results. The counterfactual form follows the condition selected by the model.
- Certificate text distinguishes absent attested provenance from an assertion that no model was used. Meta certificate attestation remains checked against the server ledger and recomputed workflow results.

## Actual live browser verification

The live browser used the same application implementation as commit 43ae910dc125a598e559fbe4204bd72348816263. Deployment 241523a7-6cf4-47a0-b402-2de527d41d04 was explicitly marked dirty at the prior base commit because source was still being verified. Later changes scope a browser-test selector and correct the workflow-origin label; they do not alter provider or simulator code.

Account: Judithorluchee@gmail.com's Account, 0a8fd0acd086e68c9b558159fac0d7a8. Existing Pages project: minsk-web-preview. The temporary release-hardening branch used the existing live preview Worker, minsk-api-preview.judithorluchee.workers.dev. No production Pages deployment was made.

The hardened API live version was 2f80e15e-4f8b-455a-ae05-a59ad851a5ea. The worker bundle SHA-256 was decdd9e7af36c20d64c5d2570a17e8ceb3894af507a5c750fa674fd02fac9a60. The review Worker uses the same API bundle with all providers disabled and no provider secrets.

| Model | Provider | Purpose | Actual result |
| --- | --- | --- | --- |
| muse-spark-1.3 | Meta Model API | Extract source text into validated workflow entities and exact evidence | Three known true observations, ALL policy, two actual gates and missing approval gate correctly extracted |
| muse-spark-1.3 | Meta Model API | Propose a counterfactual, observe simulator output and propose a safeguard through two tool calls | Approval=false produced UNSAFE_EXECUTION; adding its execution gate verified SAFE_BLOCK |
| muse-wonder-1.0 | Meta Model API | Server-routed complex investigation and bounded Spark fallback | Routing remains covered by unit tests and the previous eight-case live evaluation; not called in this routine live journey |
| meta-models/muse-spark-open-1026 | Baseten | Independently propose adversarial candidates for simulator comparison | Three candidates; tests and migration blocked, approval produced UNSAFE_EXECUTION; no additional violated policy rule |
| Evaluator 1.0.0 | Existing deterministic simulator | Baseline, counterfactual, safeguard, replay and certificate consistency | SAFE_EXECUTION, UNSAFE_EXECUTION, SAFE_BLOCK and blocked replay verified |

Spark extraction response: resp_6ae8148784423f87f21e45e5, 588 input and 978 output tokens, 5863 ms provider latency. Operator review confirmed the interpretation without changing these observations.

Investigation responses: resp_6ae814bcb1ba293992c6452b and resp_6ae814becfcd5ddbc03b4c9f, 1922 input and 352 output tokens in total, 2116 and 1767 ms. The browser showed actual tool arguments and returned simulator results, rather than a fabricated reasoning transcript.

Baseten response: chatcmpl-97c83eee789549baaf2b1649798ca4d4, 389 input and 710 output tokens, 3351 ms. These comparison records are retained separately from the Meta certificate.

Exactly four provider requests were dispatched: three Meta and one Baseten. Before/after ledger deltas match the reported usage estimates: Meta $0.008791, Baseten $0.003504, combined $0.012295. These are application token-price estimates, not provider invoices. Promotional-credit balances and invoice reconciliation are unavailable. Existing confirmed credit configuration was used; no service was purchased.

The actual exported certificate hash is f02abfc0613de127a3abf420df8ad929bce655d068e4f53f3e5c88840a379d80. Browser verification and the independent CLI both returned valid=true and inputVerified=true. Issuer authenticity remains NOT_VERIFIED.

Raw evidence: [workflow](../model-evaluation/evidence/2026-11-02-release/workflow.json), [certificate](../model-evaluation/evidence/2026-11-02-release/certificate.json), [Meta tool records](../model-evaluation/evidence/2026-11-02-release/meta-tool-records.json), [model provenance](../model-evaluation/evidence/2026-11-02-release/model-provenance.json), [Baseten comparison](../model-evaluation/evidence/2026-11-02-release/baseten-comparison.json), [ledger before](../model-evaluation/evidence/2026-11-02-release/budget-before.json), [ledger after](../model-evaluation/evidence/2026-11-02-release/budget-after.json).

## Isolation and release boundaries

The temporary live origin was removed after verification. Restoration version be6c01f5-1c48-4111-b0dc-4e88832cc4e9 retains the hardened API source, original origins, all four original secret bindings, quota settings and provider switches. The Meta estimate ceiling remains $49; Baseten remains metered without an application-dollar ceiling under the existing owner policy. The controlled evaluation allowance remains 100 calls and $2 Meta conservative estimates; historical cumulative usage of 116 means a further controlled benchmark requires an explicitly configured allowance. No history was deleted or limits expanded in this gate.

The approved-workbench frontend still targets the isolated deterministic review Worker. Its provider switches remain false and it has no provider key. Do not switch it to a live Worker incidentally during a build.

BYOK remains local/self-hosted server configuration, not a hosted customer credential vault. Hosted evaluation tokens authorise operator-funded usage and are not a user's own model key. Public session limits provide abuse friction, not authentication; global quotas and conservative reservations remain essential. Browser cancellation stops the client request but does not promise a provider refund for already dispatched work.

The eight-case benchmark quality discrepancies remain documented in [the prior hardening report](benchmark-hardening-2026-11-01.md). A successful synthetic journey is not evidence of general real-world reliability. Baseten comparison and extraction provenance remain separate from the Meta investigation certificate. No model output is passed off as a simulator result.

## Validation and residual risk

Local checks passed: 81 unit tests (64 API, 16 simulator, one web rendering), the 12-case deterministic benchmark, certificate CLI regression, benchmark-runner checks, typecheck, lint, production build, content scan and secret-pattern scan. The release suite defines 24 browser checks across desktop/mobile and runs against both localhost and the isolated public preview. CI on the final PR head is the authoritative browser acceptance record.

The full dependency audit reports one moderate advisory affecting development-only minimatch versions 3.1.5 and 10.2.6 through the lint toolchain, with no high or critical advisory. Registry inspection confirms the current ESLint 10 release still depends on minimatch 10. A forced major-version override is not a verified compatible repair. No runtime dependency or paid infrastructure was added. This lint-toolchain advisory is documented as a residual development risk, not a zero-advisory claim.

Merge after current-head CI and preview verification pass. Production launch then requires an explicit frontend/API origin choice, confirmation of provider-credit balances and quota adequacy for judges, and a final release rehearsal. The existing workflow semantics and approved visual direction are frozen.
