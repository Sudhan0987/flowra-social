---
name: duo-research
description: Research a Maya & Floey reel before any script is written - pick a relatable situation people really post about, check it passes the gates (Demand, Relatable 60+, the instinct and the flip, Tag test), and source Floey's one tip from Google's own documentation or a major industry source. Use for any new duo reel topic, the weekly topic supply, "is this a good reel idea?", "is this tip true?", or when the founder says a reel was boring or not relatable. Adapted from The Lockhouse's lockhouse-research and the stickman channel's time-trip-research.
---

# Duo research (Maya & Floey)

The script skill (`duo-script`) turns a situation into 25 seconds of sitcom. This skill makes sure the situation deserves it:
**wanted, relatable, flippable, true.** The daily pipeline runs the same gates in `src/pipeline.ts` (`DUO_RESEARCH`); use this
skill when working by hand (a topic list, a founder's idea, a fact check).

Why these reels exist (founder, 13 Oct 2026): "social media is used for brand awareness... not for direct conversion." So we
pick what people will watch and send, then make the tip true. Never a product pitch.

## The gates (all must pass)

1. **Demand: people really talk about it.** Evidence: a Reddit thread (r/SEO, r/bigseo, r/juststart, r/Blogging,
   r/content_marketing), a forum question asked again and again, a widely shared post, this week's social listening
   (`research/latest.json`), or a breakout Short in `research/hooks.json`. Score **Demand 1-5**; never below 3.
2. **Relatable: out of 100 people who run a site, how many have lived it?** 60+ to pass. Traffic drops, Sunday dips, a post
   that won't index, a client's "why did traffic drop?" message, a Google update day, AI answers taking clicks, comment spam,
   writing at 1 am: high. A niche technical edge case: low.
3. **The instinct and the flip** (from Lockhouse's Fool Score). Write, before anything else:
   ```
   THE INSTINCT:  what Maya (and most viewers) fears or believes first
   WHY IT FEELS RIGHT: the everyday experience behind it
   THE FLIP:      the true fact that breaks it, in one plain sentence
   THE TIP:       the one thing Floey tells her to do (the viewer can do it today)
   ```
   If THE FLIP does not surprise at least half of viewers, the reel has no turn: find a better angle.
4. **Tag test: would someone send it to a friend with "this is you"?** Yes, or pick again.
5. **True.** THE FLIP and THE TIP need a reliable source: Google's own documentation, Search Central blog or Search
   Console help first; then a major industry source (Search Engine Land, Search Engine Journal, Ahrefs or Semrush research
   with a method). Never another creator's video, never memory alone. Two sources when it is a claim about how Google works.

## Pillars (rough monthly mix)
Relatable panics 35% · myths everyone half-believes 25% · this week's SEO and AI-search news as a moment Maya lives through
20% · the everyday life of running a site 20%. Product never (the end card does that).

## Originality
Situations are universal; the telling is ours. Never copy another creator's sketch, joke or catchphrase; reference
creators teach techniques only. Real people and brands are never the butt of a joke; Google is a setting, not a villain.

## Output
The brief (`drafts/<id>/brief.json` in the pipeline, or a short note when working by hand): topic, angle, whyNow, audience,
facts with sources, instinct, flip, visualIdea (what the room, the laptop insert or a notification can show), the Demand
evidence and the two scores (Demand, Relatable). Then continue with `duo-script`.

## Weekly topic supply
On Sundays the listening job refreshes `research/latest.json`. Turn its best threads into 7 situations with the gates above
and add them to `calendar/topics.json` (topic + angle), so the week's reels are ready.
