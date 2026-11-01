# Approved workbench integration

The corrected reference prototype was approved on 1 November 2026. Its dark panel composition, typography, colours, aligned evidence signals and checkpoint labels are the visual baseline. This branch integrates that interface with the existing application. The standalone prototype remains available separately.

## Architecture

The existing useInvestigation hook owns the active workflow, source, baseline, applied intervention, scenario, safeguard result, tool trace, model provenance, certificate and provider availability. Workbench owns navigation, open inspection panels, request-independent notifications and replay position. It imports the shared contracts and existing API client. No simulator, certificate hashing implementation or benchmark fixture copies were added to the frontend.

Extraction calls /api/v1/workflows/extract. The loading state describes the request without invented percentage progress. A successful response opens structured review before model investigation. Existing condition, gate and JSON corrections invalidate derived results through the hook. Manual counterfactuals, safeguard verification, benchmarks and certificate export use the existing API. Model and challenger panels display actual returned records. Wonder routing stays server-controlled.

The API still owns model credentials, admission, credit controls, rate limits, deterministic semantics and certificate integrity. No live requests are authorised by visual approval. Existing production deployment configuration is unchanged.

## Verification at implementation checkpoint

- Typecheck, lint, build, content and secret-pattern scans pass locally.
- API tests: 51 pass. Locked benchmark: 12 of 12 cases pass.
- Simulator tests: 15 pass; one existing certificate CLI test is blocked locally because this environment denies Unix-domain socket creation used by tsx.
- Browser tests were updated for approved desktop/mobile navigation, scenarios, replay, certificate export, benchmark, corrections, disabled providers and mocked extraction errors. They require CI execution. Local Chromium downloads are truncated and Wrangler cannot enumerate interfaces in this environment.
- Full dependency audit did not return a usable local result. Existing CI retains its audit gate.

This is not a claim of deployed browser acceptance. Do not merge until CI and the isolated integrated preview journey pass. Live Meta verification needs a separately authorised test with a confirmed credit cap. No production deployment or merge is part of this checkpoint.
