# Decouple the Memory Bridge trigger threshold from the session-break threshold

The 30-minute session-break constant previously did double duty: it decided when a Reading
Session technically ends, and it decided whether the Memory Bridge ("Previously…") card was worth
proactively surfacing. Those are different questions — "did activity stop" is a technical signal;
"has enough time passed that a reminder is actually useful" is a product judgment — and conflating
them meant the card could fire after a short pause, which reads as the app over-explaining
something the reader obviously still remembers.

**Decision**: keep the 30-minute threshold for ending a Reading Session, but gate the proactive
Memory Bridge card behind a separate, longer threshold — on the order of hours, or "read on a
different calendar day," rather than minutes. The exact value is an implementation detail to tune
once built, not part of this decision.

**Why**: proactive surfacing should only happen for a genuine "coming back to this after a while"
moment, not every ordinary reading break.
