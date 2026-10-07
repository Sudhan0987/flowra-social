# LinkedIn playbook (vendored)

From github.com/sergebulaev/linkedin-skills at commit bfa41ff (MIT, see LICENSE).
Only the writing guidance is used: post-writer, repurposer, the 20 hook
formulas, the 2026 algorithm notes, the humanizer checklist and the
pre-posting audit. Its publishing helpers (Publora, Apify, `lib.*`) are not
used; the founder posts by hand.

`src/social-calendar.ts` feeds these to Claude when drafting LinkedIn posts.
Flowra's house rules win where they disagree: no em or en dashes at all, no
invented numbers, stories, customers or "vulnerability", facts only from the
sources or facts/flowra.md, and the link goes in the first comment.

To update: copy the same files from a newer commit and note it here.
