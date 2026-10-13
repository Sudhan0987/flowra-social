---
name: duo-voice-direction
description: Direct how Maya and Floey say their lines - the pause after each line (comic timing), each line's emotion, splitting a line for a beat before a reveal, and keeping the two voices distinct - so the dialogue sounds like two people, not two machines reading. Use after a duo script is approved and before the voice is made, when a reel "sounds robotic", "the timing is off", "the joke doesn't land", or a voice needs changing. Adapted from the stickman channel's voice-direction skill and The Lockhouse voice guide.
---

# Voice direction (Maya & Floey)

The script decides WHAT is said; this decides HOW. Never change the meaning or the facts of an approved line here: only the
pause, the emotion, a split, or a comma. Bigger changes go back to `duo-script`.

## The two voices (approved 13 Oct 2026; never swap them)
| | Floey | Maya |
|---|---|---|
| Engine | Kokoro (daily runs, `FLOEY_ENGINE=kokoro`); Chatterbox "acted" is local only | Kokoro |
| Voice | af_heart 0.82 + af_bella 0.18, lifted ~1.2 semitones (`floey_voice`) | `bf_emma` (British), speed 1.05 (`maya_voice`, `MAYA_VOICE`) |
| Manner | brief, dry, warm | fast and high when panicking, flat when annoyed |
How it works: each line in `lines.js` is `[id, say, emotion, speaker]`; `render-scene.mts` sets `REEL_VOICE=maya` for Maya's lines;
`floey_sound.py` speaks it; the emotion sets pitch and pace (`EMOTION` table).

## Emotions (the voice's delivery, one per line)
ominous, worried, curious, warm, bright, determined, proud, excited, playful.
- Maya: panic = **worried** (never **excited**: in bf_emma it sounds happy, seen in the 13 Oct trial); annoyed or deadpan = **warm** (flat); realisation = **bright**; relief = **proud**.
- Floey: dry reframe = **warm**; teasing = **playful**; the tip = **determined** or **warm**; smug button = **proud**.
Match speed to feeling (Juslin and Laukka 2003): fear and joy faster and higher, calm and sad slower and lower.

## Comic timing = the pause after each line (`pause` in the story, `GAP` in the scene)
| Moment | Pause after |
|---|---|
| A snappy comeback follows ("So?" after "It's Sunday, Maya.") | 0.15-0.25 s |
| An ordinary exchange | 0.3-0.4 s |
| A question the viewer should think about | 0.5-0.6 s |
| Before a reveal or the check result | 0.5-0.7 s (and Maya acts in the silence: typing, squinting) |
| After the button (before the end card) | 0.6-0.8 s |
- A pause makes the next word more memorable (MacGregor, Corley and Donaldson 2010): put the silence BEFORE the reveal word.
- The punchline itself is said quick and flat, not slow (Attardo and Pickering 2011). Don't pause inside it.
- Asides are faster and flatter ("Probably.", "Again."): give them their own short line with emotion warm.
- To get a beat inside a sentence, split it into two lines ("Oh." / "It's up three percent.") or end the setup with "...".

## Accents
Floey is American, Maya is British: give each the words of her accent (Floey: elevator, vacation; Maya: lift, holiday).

## Checks after the voice is made
- `drafts/<id>/build/voice.json` gives each line's length: 2 words should take about 0.6-0.9 s; a long line over 4 s is a lecture.
- Listen for blurred words (letters, numbers, names); fix by spelling them as words.
- No two adjacent lines may sound like the same person: if they do, check the speaker field.
