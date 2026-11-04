# Design and asset provenance

Minsk's interface is implemented in this repository. A third-party visual reference discovered through Pinterest informed broad moodboard direction during an early prototype: a dark, information-dense analytical workspace. The reference image, its logo, source files and proprietary assets are not included in this repository. Pinterest did not sponsor, endorse or supply Minsk.

The current Minsk identity is a monochrome, typography-only wordmark implemented in `apps/web/src/workbench/Workbench.jsx` and `apps/web/src/workbench/styles.css`. It deliberately uses no standalone pictogram, mascot or logo container. Product colours remain reserved for meaningful execution states rather than decorative branding.

## Minsk-specific work

The following elements were designed or implemented for this project:

- the Minsk wordmark treatment and evidence-led interface hierarchy;
- the animated interference field and its reduced-motion, pause and lifecycle behaviour;
- the workflow relationship view that separates evidence, policy requirements, execution gates and dependencies;
- the baseline, counterfactual and safeguard replay states;
- the prepared judge workflow, live-capacity states and deterministic-result labelling;
- the evidence review, correction, provenance and certificate views;
- the responsive layouts, interaction states, product copy and accessibility behaviour;
- the simulator, workflow contracts, benchmark fixtures and certificate implementation.

Common interface conventions such as headers, side navigation, tabs, tables, cards, status badges and drawers are not claimed as exclusive Minsk inventions. Similarity in those generic patterns does not imply affiliation with a reference product.

## Licensed third-party visual dependencies

- Metropolis is supplied through `@fontsource/metropolis` 5.3.0 under the Unlicense.
- Interface icons are supplied by `@cds/core` 6.17.0, the Clarity Design System package, which declares the MIT licence.

The dependency lockfile records exact resolved versions. See [Third-party notices](../THIRD_PARTY_NOTICES.md) and each installed package for its complete licence text.

## Scope of this notice

This file records repository provenance; it is not a legal opinion or a substitute for permission where permission is required. A notice cannot make a copied expressive design non-infringing. If a future change imports a third-party image, logo, illustration, template or source file, its licence and attribution must be reviewed before release.
