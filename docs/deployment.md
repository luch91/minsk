# Minsk deployment

The canonical judge production URL is https://minsk.pages.dev and its API is https://minsk-api-preview.judithorluchee.workers.dev. The release-candidate alias is https://release-candidate.minsk.pages.dev. Both use the `minsk` Pages project and the `minsk-api-preview` Worker configured by `apps/api/wrangler.preview.jsonc`. The former `minsk-web-preview` project remains a temporary rollback target and is not the canonical judge endpoint.

The authoritative environment names, URLs and provider modes are maintained in `config/release-manifest.json` and rendered in [the release reference](release-reference.md). The `approved-workbench` Pages alias and `faultline-api-visual-preview` Worker are historical deterministic-review resources, not current release endpoints.

Deploy only a validated commit. First run the Worker dry build, deploy the Worker with the project-local Wrangler configuration, then deploy the corresponding Pages build with `VITE_API_URL` set to the Worker URL. Verify `/healthz`, `/api/v1/budget`, samples, baseline evaluation, counterfactual, safeguard verification, certificate export and certificate verification from the deployed browser.

Provider availability is controlled entirely by server-side configuration. `MODEL_CALLS_ENABLED`, `WONDER_ENABLED`, `BASETEN_CHALLENGER_ENABLED`, confirmation settings and server secrets must all be present before live calls work. `/api/v1/budget` exposes switch status and bounded request accounting without revealing secrets or account information. A model provider may still reject a request or omit token usage; those cases remain visible to callers and in ledger telemetry.

Validate the release-candidate alias before promoting the same source commit to production. Do not retire historical resources or expose provider keys during verification.
