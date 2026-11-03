# Judge release candidate

Candidate URL: https://release-candidate.minsk-web-preview.pages.dev

Canonical judge URL after promotion: https://minsk-web-preview.pages.dev

The URL must serve the exact verified release commit before it is shared. The application reports Meta and Baseten availability from `/api/v1/budget`; a provider status failure is shown as unavailable instead of disabled.

## Model responsibilities

Use the generated [authoritative release reference](release-reference.md). Its model-purpose matrix is derived from `config/release-manifest.json` and includes every exact identifier, configuration source, authority and fallback behaviour.

## Judge controls

- Global live-provider allowance: 500 dispatches per UTC day.
- Per-client allowance: 20 dispatches per UTC day.
- Separate server-side Meta and Baseten application ceilings remain enforced.
- Provider kill switches and operator-confirmation switches remain required.
- Deterministic counterfactuals, safeguards, replay and certificate export remain available after live capacity is exhausted.

The application ceilings are dispatch controls rather than provider billing guarantees. No account balance or credential information is exposed to the browser.
