# PDF and EPUB are equally first-class, not lead-and-follower

EPUB support was added after PDF and has trailed it since — the redesign handoff, the annotation
model (Pin), and most of the audit/triage work were written PDF-first, with EPUB support bolted on
or explicitly deferred ("EPUB just doesn't get positioned Pins for now" was on the table as an
option). The alternative considered was making EPUB the lead format going forward (new
capabilities land there first, PDF stays supported but secondary), on the reasoning that "every
book reader treats EPUB as core."

**Decision**: PDF and EPUB are both fully first-class. Neither is the lead format and neither
lags — a capability gap that exists for one format but not the other (e.g. EPUB currently has no
positioned annotations, no independent typography controls, PDF has no in-book search) is treated
as a gap to close, not a difference to preserve. New reading-experience work should consider both
formats by default rather than shipping to one and backfilling the other later.

**Why**: existing PDF users already depend on features (Pins, bookmarks) that a EPUB-first pivot
would have left behind or second-classed; treating this as "stop treating EPUB as the bolted-on
afterthought" rather than "promote EPUB over PDF" avoids regressing an existing, real feature set
to chase format-of-the-moment parity in the other direction.
