# Collapse reader chrome-reduction mechanisms into one tap-to-toggle model

The reader had three overlapping ways to reduce visual chrome: Focus Mode (a true fullscreen
overlay), Quiet Reading (a minimal but still-visible toolbar), and an idle timer that dimmed the
toolbar to 15% opacity after 3.5s of inactivity. None of them fully hid the chrome the way a
deliberate tap does, and reasoning about which one applied when was already getting complicated.

**Decision**: replace all three with a single mechanism — tapping the page toggles Chrome fully
shown or fully hidden. Focus Mode's fullscreen-canvas behavior (fixed position, full viewport) is
absorbed as what "chrome hidden" does technically, rather than surviving as a separate toggle the
reader has to reason about.

**Why**: three concepts that all meant roughly "less distraction" made the reading experience
harder to predict than the distraction they were solving, and worked directly against the goal of
keeping the reading UI simple.

## Considered Options

- Keep Focus Mode as a distinct toggle for true fullscreen, on top of ordinary tap-to-hide —
  rejected: the distinction between "chrome hidden" and "chrome hidden *and* fullscreen" isn't one
  a reader would reliably understand or want to manage as two separate decisions.
