# Minsk

[![CI](https://github.com/luch91/minsk/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/luch91/minsk/actions/workflows/ci.yml)
[![Live judge application](https://img.shields.io/badge/judge%20application-live-16a085)](https://minsk.pages.dev/)
[![Node.js 22](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![pnpm 10.18.3](https://img.shields.io/badge/pnpm-10.18.3-f69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Minsk finds the gap between what an automated workflow says must happen and what its execution path actually enforces.**

It turns workflow evidence into a reviewable model, evaluates the declared policy, tests a counterfactual, verifies a proposed safeguard, and produces an integrity-checked certificate. Models may help extract or challenge an interpretation; Minsk's deterministic simulator remains the authority for every execution outcome.

> [Open the live judge application](https://minsk.pages.dev/). It starts directly on a prepared workflow. No account setup, Settings visit, BYOK configuration, or provider-routing knowledge is required.

## Start here: a two-minute guided demonstration

The prepared **Missing Approval** case describes a production deployment that requires passing tests, human approval, and migration compatibility. The execution step checks tests and migration compatibility, but it does not enforce approval as a gate.

1. Open [Minsk](https://minsk.pages.dev/).
2. Click **Use deterministic demonstration**. This never calls a model provider.
3. Minsk changes the approval observation from present to absent.
4. Inspect the `UNSAFE_EXECUTION` result: policy is violated, yet deployment remains eligible.
5. Click **Verify safeguard** to add approval as an execution gate.
6. Inspect the `SAFE_BLOCK` result, replay the trace, and export the certificate.

The expected journey is deliberately reproducible:

| Stage | What changes | Expected outcome | Meaning |
| --- | --- | --- | --- |
| Baseline | Approval is present | `SAFE_EXECUTION` | Policy is satisfied and deployment may execute. |
| Counterfactual | Approval becomes absent | `UNSAFE_EXECUTION` | Policy is violated, but the missing gate still permits execution. |
| Safeguard | Approval is added as a deployment gate | `SAFE_BLOCK` | The unsafe execution is blocked while the policy violation remains visible. |

The simulator evaluates only the supplied workflow semantics. It does not execute a deployment or claim knowledge of infrastructure settings that were not provided as evidence.

## What Minsk does

Minsk keeps evidence, model assistance, policy evaluation, and execution claims separate:

```text
Source text or structured workflow
  -> Reviewable extraction with exact source spans
  -> Human confirmation or correction
  -> Declared policy requirements and actual execution gates
  -> Deterministic baseline and counterfactual evaluation
  -> Safeguard verification
  -> Replay trace and integrity-checked certificate
```

| Capability | System | Role | Authority |
| --- | --- | --- | --- |
| Workflow extraction | Meta Muse Spark | Converts source text into a reviewable workflow proposal | Non-authoritative until confirmed |
| Investigation assistance | Meta model | Suggests questions, evidence links, and tool activity | Advisory |
| Challenger analysis | Baseten-hosted Meta Muse Spark Open | Independently challenges assumptions and findings | Advisory |
| Policy evaluation | Minsk simulator | Evaluates conditions, rules, gates, and dependencies | Authoritative |
| Safeguard verification | Minsk simulator | Tests whether an intervention blocks unsafe execution | Authoritative |
| Certificate | Minsk certificate service | Binds inputs, trace, and outcomes with integrity metadata | Authoritative record |

Spark handles extraction and routine investigations. Wonder may be routed to complex investigations. Exact deployed identifiers, configuration sources, fallbacks, and environment names come from the [authoritative release reference](docs/release-reference.md).

## Choose a demonstration path

### Deterministic path: always available

Use **Use deterministic demonstration** in the application, or run the same journey locally:

```sh
pnpm install --frozen-lockfile
pnpm demo:journey
```

This path uses the versioned Missing Approval fixture and makes no provider request. It is the recommended first experience and the stable acceptance path when live capacity is unavailable.

### Optional live actions

The prepared workflow also exposes three plainly labelled actions:

- **Try live extraction** asks Meta to turn source text into a proposal for review.
- **Run model-assisted investigation** asks Meta for advisory investigation activity.
- **Run Baseten challenger** requests an independent advisory challenge.

Live actions appear only when the API reports server-side provider access and remaining allowance. The interface shows remaining request availability, not account balances, credentials, or internal spending limits. When capacity is disabled, exhausted, or unavailable, Minsk reports that state honestly. It never presents a deterministic result as a live result and never silently substitutes one after a provider failure.

## Real-world reference case

Alongside the predictable Missing Approval fixture, the workflow library includes **Historical CI review isolation verification**. It is derived from a frozen public CI policy and demonstrates how Minsk handles external material without making tests depend on a mutable web page.

The repository preserves:

- the canonical public URL, retrieval date, and exact source revision;
- a verbatim source snapshot with offsets and a source hash;
- the raw structured model extraction;
- user-confirmed corrections;
- the deterministic simulation and exact counterfactual;
- the verified safeguard; and
- certificate hashes binding the source, workflow, and result.

See the [real-world case guide](docs/real-configuration-case.md) and the versioned artifacts in [`model-evaluation/real-world-reference`](model-evaluation/real-world-reference/).

## Run Minsk locally

### Requirements

- Node.js 22
- pnpm 10.18.3
- Wrangler for the local Cloudflare Worker, installed with the workspace dependencies

### Install and start

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm benchmark
pnpm dev
```

The web application runs through Vite and proxies `/api` requests to the local Worker. Live providers are off by default, so the deterministic workflows, benchmark, replay, safeguards, and certificates remain usable without provider credentials.

## Repository map

| Path | Purpose |
| --- | --- |
| [`apps/web`](apps/web/) | React investigation workbench and judge interface |
| [`apps/api`](apps/api/) | Cloudflare Worker API, admission controls, provider routing, and certificate endpoints |
| [`packages/contracts`](packages/contracts/) | Shared schemas and workflow contracts |
| [`packages/simulator`](packages/simulator/) | Deterministic evaluator and safeguard verification |
| [`fixtures/workflows`](fixtures/workflows/) | Versioned deterministic and real-world reference workflows |
| [`evaluation`](evaluation/) | Locked synthetic and independently sourced evaluation cases |
| [`model-evaluation`](model-evaluation/) | Model comparison runner, evidence, scoring, and reference artifacts |
| [`docs`](docs/) | Architecture, provenance, deployment, security, and release evidence |

## Provider configuration

Provider credentials belong only on the API Worker. Copy the relevant names from [`.env.example`](.env.example) into the ignored `apps/api/.dev.vars`; never put keys in browser code or commit them. See [model integration](docs/model-integration.md) for the complete setup and routing contract.

<details>
<summary>Server-side provider switches and limits</summary>

| Setting | Purpose | Safe default |
| --- | --- | --- |
| `MODEL_API_KEY` | Server-side Meta key | unset |
| `MODEL_CALLS_ENABLED` | Meta kill switch | false |
| `WONDER_ENABLED` | Allow Wonder escalation | false |
| `META_CEILING_MICRO_USD` | Cumulative Meta estimate ceiling | 50000000 |
| `BASETEN_API_KEY` | Server-side Baseten key | unset |
| `BASETEN_CEILING_MICRO_USD` | Cumulative application estimate ceiling for Baseten | 10000000 |
| `BASETEN_CHALLENGER_ENABLED` | Baseten kill switch | false |
| `BASETEN_MAX_CALLS_PER_DAY` | Server-side Baseten dispatch cap | 50 |
| `PUBLIC_CHALLENGER_ENABLED` | Permit public challenger calls | false |
| `BASETEN_TEST_TOKEN` | Protect challenger access | unset |
| `MINSK_EVAL_TOKEN` | Protect controlled benchmark access | unset |
| `MINSK_EVAL_MAX_CALLS`, `MINSK_EVAL_MAX_MICRO_USD` | Controlled evaluation dispatch limit and Meta estimate ceiling | 6 calls, 300000 |
| `PUBLIC_GLOBAL_REQUESTS_PER_MINUTE`, `PUBLIC_CLIENT_REQUESTS_PER_MINUTE` | Enforced public API request quotas | 300, 30 |
| `PUBLIC_GLOBAL_MODEL_CALLS_PER_DAY`, `PUBLIC_CLIENT_MODEL_CALLS_PER_DAY` | Enforced public provider-dispatch quotas | 500, 20 |
| `ALLOWED_ORIGIN` | Allowed browser origin | unset |

</details>

Pre-dispatch reservations are stored in a persistent Durable Object solely to enforce application caps. Public quotas are enforced globally and per browser session plus Cloudflare client IP. The public availability endpoint exposes only provider state and remaining dispatch counts.

Extracted workflows retain explicit `ALL` or `ANY` rules, exact evidence excerpts, optional freshness requirements, and optional observation timestamps. Operators may correct an interpretation only while its evidence remains an exact excerpt of the supplied source. Stale, absent, ambiguous, and contradictory observations evaluate as unknown rather than false.

## Benchmarks and certificates

The offline benchmark contains 12 versioned cases and an independent reference oracle. It makes no provider calls.

```sh
pnpm benchmark
pnpm benchmark:models -- --provider meta
pnpm verify:certificate path/to/certificate.json path/to/workflow.json
```

`benchmark:models` performs fresh inference against eight locked synthetic cases with `meta`, `baseten`, or `all`. Set `MINSK_EVAL_API_URL` and `MINSK_EVAL_TOKEN`; Baseten also requires `MINSK_EVAL_TEST_TOKEN`. Results are written to ignored `model-evaluation/results/`, and an interrupted run can continue with `--resume <result-path>`. Errors remain errors; synthetic scores are not real-world accuracy claims.

The independent verifier recomputes certificate integrity and, when given the original workflow, checks the source, workflow, and deterministic results. Integrity proves internal consistency, not issuer authenticity.

`evaluation/real-configuration-cases.json` contains two read-only GitHub configuration cases with locked `INDETERMINATE` ground truth. They test the boundary between observed text and unobserved external enforcement; they are excluded from synthetic accuracy metrics.

## API overview

| Area | Routes |
| --- | --- |
| Health and availability | `/healthz`, `/api/v1/budget` |
| Workflow input | `/api/v1/samples`, `/api/v1/workflows/validate`, `/api/v1/workflows/extract` |
| Evaluation | `/api/v1/experiments/run`, `/api/v1/investigations`, `/api/v1/safeguards/verify` |
| Challenger | `/api/v1/challengers/open-weight` |
| Reports | `/api/v1/reports/export`, `/api/v1/reports/verify` |
| Benchmark | `/api/v1/benchmark` |

If the frontend receives HTML instead of JSON, verify `VITE_API_URL`, the Worker health endpoint, and `ALLOWED_ORIGIN`. A disabled provider requires the corresponding server-side switch, credential, and cap configuration.

## Verify a change

```sh
pnpm check:content
pnpm check:release
pnpm real-world:check
pnpm check:secrets
pnpm typecheck
pnpm lint
pnpm test
pnpm benchmark
pnpm benchmark:checks
pnpm build
pnpm audit
pnpm e2e
```

CI runs the same release gates, including desktop and mobile browser journeys for exhausted quota, timeout, malformed output, provider failure, fallback behavior, and the deterministic acceptance path.

## Documentation

- [Architecture](docs/architecture.md)
- [Release reference and exact model identifiers](docs/release-reference.md)
- [Submission evidence and guided demonstration](docs/submission-evidence.md)
- [Release certification checklist](docs/release-candidate-checklist.md)
- [Model integration](docs/model-integration.md)
- [Model evaluation](docs/model-evaluation.md)
- [Benchmark methodology](docs/benchmark.md)
- [Provenance](docs/provenance.md)
- [Security](docs/security.md)
- [Deployment and rollback](docs/deployment.md)
- [Contributing](CONTRIBUTING.md)
- [MIT license](LICENSE)

Historical interface-integration, hardening, and audit records remain available in [`docs`](docs/) for provenance. The historical deterministic preview is not the current judge URL.
