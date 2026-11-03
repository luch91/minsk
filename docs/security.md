# Security and spending controls

Workflow text is untrusted data. Minsk does not execute it. Provider tool names and arguments are validated before the deterministic simulator runs, and model hypotheses never determine an execution outcome. API request bodies are capped, origins must exactly match `ALLOWED_ORIGIN`, and provider keys stay in ignored local secret files or Cloudflare secrets.

The persistent Durable Object enforces conservative pre-dispatch reservations and separate configurable application ceilings for Meta and Baseten. Both providers retain kill switches, rate limits, bounded output, timeout, validation and global dispatch controls.

Model endpoints require explicit server-side switches. The controlled benchmark route additionally requires a private evaluation token. Browser users never receive provider credentials. A single investigation lock prevents overlapping tool investigations, while request limits apply even without an Origin header.

Certificate integrity proves that the canonical certificate content has not changed. It does not prove issuer identity. Operators should disable model switches immediately when a provider or accounting anomaly is observed.
