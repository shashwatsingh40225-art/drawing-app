# Kin Reader

Reading experience for user-uploaded PDF documents: renders pages, tracks reading position, and
layers optional tools (bookmarks, pinned notes, session recaps) over the page without competing
with it for attention.

## Language

**Chrome**:
The reader's persistent controls (top bar, page-position strip, Tools launcher) layered over the
page. Shown or hidden as a single unit via tap — there is no dimmed or partial state. Tapping the
page is zone-based: left third turns to the previous page, right third turns to the next page,
center toggles Chrome. Swipe gestures work everywhere as an alternative to zone taps.
_Avoid_: Focus Mode, Quiet Reading (both retired as separate concepts — see ADR 0001)

**Tools**:
The single secondary entry point bundling everything that isn't Back, Bookmark, or Chrome itself:
Thumbnails, Bookmarks list, Add Pin, Kin Archive browsing, and past Memory Bridge recaps. Ordered
by how often each is actually reached for during reading, not by feature significance.
_Avoid_: Overflow menu, More options, Sidebar (when referring to this specific grouping)

**Bookmark**:
A page-level marker with no position on the page — "I was here." Distinct from a Pin, which
always has an x/y location.
_Avoid_: Pin, Save

**Pin**:
A positioned annotation placed at a specific x/y point on a page, created through the single "Add
Pin" action. Either a written note or a reference to one of the 20 Kin Archive artworks — the two
share one entry point and one underlying record, differing only in whether an archive artwork is
attached. "Add Pin" shows a brief chooser (write a note / pick from Kin Archive) before placing
anything — it does not drop a default pin first and let it be edited into the other kind later.
_Avoid_: Note (as a synonym for the general concept — a note is one of the two things a Pin can
be, not interchangeable with it), Annotation

**Kin Archive**:
The collection of 20 studio artworks (the user's own sketches) available to attach to a Pin as a
visual reference.

**Reading Session**:
A stretch of reading inferred automatically from activity; ends after 30 minutes without
interaction. Becomes eligible for a Memory Bridge recap once it crosses a meaningful-activity
threshold.
_Avoid_: Visit, Read

**Memory Bridge**:
The proactive "Previously…" recap shown when reopening a book after a real gap. Its surfacing
threshold is deliberately longer than a Reading Session's break threshold — see ADR 0002.
_Avoid_: Recap (fine as shorthand once Memory Bridge is established as the primary term)
