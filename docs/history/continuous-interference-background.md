# Continuous interference background

> Historical implementation note. Current release information is maintained in the [release reference](../release-reference.md).

The owner-approved combination uses the earlier dark palette (ink navy #060d15, header/sidebar #080f19, panels #101c28) with cyan #42d5f5, lime #a3e635 and coral #ff6574. Existing layout, workflow data, graph semantics and API contracts are preserved.

A single decorative Canvas 2D component is mounted at the application root before the workflow-loading branch. The header, sidebar, metrics and every workspace view use the same fixed background. Navigation, tabs, inspections and workflow state updates do not remount it. Its phase lives in a ref and survives pause/resume and resizing. A full browser reload starts a new timeline; it is not an in-app navigation.

Motion runs at a paint cap of 24 fps, with at most two million backing-store pixels and a DPR cap of 1.5. Smaller viewports use fewer contour points and rings. No WebGL, video downloads, generated graphics, libraries or inference calls are required. The drawing is decorative, hidden from assistive technology and cannot intercept pointers. Panels provide dark contrast beneath text.

Settings includes an Animate interference field checkbox. Pausing persists locally when browser storage is available. Reduced-motion preference always overrides animation, leaving a static field. Hidden tabs stop the frame loop. A blocked or unavailable canvas leaves the dark theme and application controls intact.

Browser regression coverage checks one mounted surface and advancing pixels across all primary views, tabs and drawers, pause/resume persistence, reduced motion, responsive resize and a blocked-canvas deterministic counterfactual/safeguard journey. Existing extraction, investigation, replay and certificate tests remain in place. This change does not enable live inference or alter provider controls.
