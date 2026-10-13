---
name: duo-editing
description: Plan and check the shots, acting, cutaways and sound of a Maya & Floey reel - frame one shows the problem, the speaker acts while the listener reacts, named shots (wide, maya, mayaTight, floey, floeyTight), the laptop insert for the check, a change every 2-3 seconds, and the button landing on a reaction. Use when storyboarding or directing a duo scene, reviewing stills of one, or when a reel "feels static", "the joke doesn't land" or "something is cut off". Adapted from The Lockhouse camera language and the stickman channel's video-editing skill.
---

# Duo editing (Maya & Floey)

The studio and its parts: `brand/styles/duo/README.md`. The approved example: `reel/duo/template.html`. The automatic checks:
`npx tsx src/scenecheck-cli.ts <scene> <lines.js> <build dir>` (must say PASS).

## The rules
1. **Frame one is the problem, already happening** (Maya mid-panic with the red number, the notification already down, the
   chart already falling). It is also what the scroll shows; the cover is never seen in the feed.
2. **The speaker acts, the listener reacts.** On every line the other character does something small on the key word: a look,
   an expression, a pose change, Floey's head tilt. A frozen listener kills the joke.
3. **Shots have reasons** (Lockhouse camera language): push in for a realisation, pull out to the two-shot after a line lands,
   cut to the listener's face for the reaction that sells it, a quick cut for a comic reversal, a tiny shake only for real
   panic. Named shots in `DUO.SHOT`; nobody is ever sliced at the frame edge (Floey fully in or fully out).
4. **A change every 2 to 3 seconds**: a shot, a pose, a prop, an insert. Lines over ~3 s get a move or a reaction mid-line.
5. **Show the tip**: the check happens on screen (Maya types, `DUO.screenInsert` draws the chart, a stat pill flips).
   At most one insert and one notification per reel.
6. **The button lands on a reaction**: Floey's line, then Maya's face (deadpan look to camera, or relief), then the end card.
7. **Text is the key word, not the sentence**: captions carry the dialogue; on-screen props hold one number or a short message.
8. **Sounds on real events only**: ding (notification, good number), buzz (phone), typing, pop (jolt), boing (comic), whoosh
   (insert), thump (end card). Never two within 0.4 s; the music ducks under the voices by itself.
9. **Safe area**: subjects inside x 60-1020, y 220-1420 on screen; captions own 1440-1580.

## Checklist before the full render
- [ ] stills at the start of every line and at the button: who is speaking is clear, the listener reacts
- [ ] frame one shows the problem; the end card appears after the button with a beat of silence
- [ ] scenecheck PASS; no number pill leaves the frame during a camera move (fade it before)
- [ ] the check is shown, not described
