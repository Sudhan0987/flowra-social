---
name: duo-script
description: Write, rewrite or review a Maya & Floey sitcom reel script - the hook in Maya's first line, Floey's flip, one true tip, the check shown on screen, and a button ending - with a stickiness score and five audits. Use for any new duo reel script, a hook, a script the founder called boring or confusing, a "will people watch to the end and send it?" review, or a caption. Adapted from The Lockhouse's lockhouse-script and the stickman channel's time-trip-script (retention workflow, but/so chains, punchline endings, the SUCCESs score). Run duo-research first.
---

# Duo script (Maya & Floey)

A script has one job: **a viewer who swiped onto us stays to the button, laughs or nods, and sends it to a friend.**
The daily pipeline uses the same rules (`duoSystem` and `duoProblems` in `src/pipeline.ts`); this skill is for writing and
reviewing by hand. The cast and their voices: `brand/cast/README.md` (always read it first). The approved example:
`reel/duo/template.html`.

Three ideas drive every decision:
1. **The flip beats the lesson.** The reel works because Maya's instinct is wrong (or right for the wrong reason) and Floey
   turns it in a few words. No flip, no reel.
2. **Every word earns its second.** 50 to 75 words, 6 to 12 lines, 18 to 30 seconds plus the end card.
3. **The curse of knowledge.** Say the real names of things plainly (Search Console, the Pages report, last Sunday).

## The workflow

### 1. Foundation (4 lines, before any dialogue)
```
THE INSTINCT: what Maya fears or believes
THE FLIP:     the true fact that breaks it (from the brief, sourced)
THE TIP:      the one thing Floey tells her to do
THE BUTTON:   the last line: a reversal, a callback, a dry one-liner
```

### 2. The beat map
| Role | Who | Words | Job |
|---|---|---|---|
| hook | Maya | 6-12 | mid-panic, the problem and its number in her first words; frame one shows it |
| reframe | Floey | 2-8 | the dry flip, often a fact or a question |
| doubt (optional) | Maya | 1-6 | the viewer's own pushback ("So?", "But...") |
| tip | Floey | 8-16 | the one true thing to do, real names, plain words |
| check (optional) | Maya | 3-8 | she does it on screen and says what she sees |
| payoff | either | 3-10 | how it really is |
| button | Floey (or Maya) | 1-8 | the punchline; Maya's look to camera can follow without words |

### 3. The hook (first 2 seconds), all yes
- [ ] Maya speaks at 0.3 s; the first frame already shows the problem (the red number, the notification, the falling chart).
- [ ] Her first sentence names the problem: "My traffic dropped forty percent overnight." Never "Hi", "So I was", a title.
- [ ] Picture, words and caption point at the same thing. An open question by second 3 (why did it drop?).
Hook shapes to rotate: the number ("forty percent overnight"), the message ("My client just texted 'why is traffic down?'"),
the accusation ("Google hates me."), the threat ("I'm deleting the blog."), the discovery ("Floey. Why is my best post gone?").

### 4. Write the lines
- Spoken English, short: most lines 3 to 10 words, never over 16. Read them aloud in the two voices.
- Drive with but / so / wait / instead, never "and then". Every line changes the situation or the mood.
- They talk to each other. Only the button may go to camera (Floey); Maya's look to camera has no words.
- One tip. Numbers as words. No bare letters, no capitals, no symbols.
- Never mention Flowra or a web address in the dialogue; never a sales line.
- The button is the last spoken line: short, then stop (end card).

### 5. Stickiness score
Score with `references/sticky-check.md`. **Target 48+/60, no trait below 7.** Fix the lowest trait first.

### 6. Audits
Run all five in `references/audits.md` (flip, clarity, speed, voice, character and truth). Then time it at about 165 words
a minute: over 30 seconds of dialogue, cut.

### 7. The caption
150 to 900 characters, like a post from a funny friend who knows SEO: the situation in one line, the tip stated plainly so the
post helps on its own, a question that invites comments ("Who else panics on Sundays?"), 3 to 6 lowercase hashtags.

## Reviewing a script
Report in this order: does it have a flip, the hook check, length and word count, the stickiness score, every audit failure
with the line and the fix.

## Learning from results
The weekly results (`research/learnings.json`) show which reels were watched and sent. Add what a strong or weak reel
teaches to `references/lessons.md` (the line, the second, why), and new running jokes that landed to `brand/cast/README.md`.

## Credits
Adapted for Maya & Floey from The Lockhouse's `lockhouse-script` and the stickman project's `time-trip-script` (which
combined ideas from the MIT-licensed "youtube-scriptwriting" and "made-to-stick" skills, after Chip and Dan Heath's *Made to
Stick*). Rewritten in our own words.
