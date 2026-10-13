# Flowra Social

The social agent. It makes one short vertical video (Reel) a day, a Maya & Floey sitcom moment for brand awareness (see below), posts each draft to Slack `#social` for the founder's ✅, and (next) publishes approved ones to Instagram. LinkedIn and X get a ready-to-post pack from the same video.

The founder is not technical: plain words, short sentences.

## How a reel is made

1. `calendar/topics.json`: the backlog, made in order. Keep about 70% on buyers' problems (traffic loss, fixes, reporting, the free tools on useflowra.com) and 30% on AI and automation.
2. `src/script.ts`: Claude writes the beats (what the voice says, what the screen shows) and the caption. The checks in `problems()` reject em dashes, banned words, bad lengths and wrong shapes; one failure gets one rewrite.
3. `src/audio.py`: Kokoro (free, local) speaks each beat; an original music bed ducks under the voice; `timeline.json` records the timings and caption chunks.
4. `src/render.ts`: `reel/reel.html` is drawn frame by frame (every frame is a pure function of time) and joined with the audio into `reel.mp4`, 1080x1920. Frame 0 is the finished hook so the default cover is readable.
5. `src/slack.ts`: the video and caption go to `#social`.

Formats today: `fix` (the 45-second fix: hook, 2 to 4 steps, outro) and `myth` (myth vs fact pairs). Beat kinds: hook, point, step, myth, fact, clip, outro.

## The daily reel: Maya & Floey (duo style)

Founder, 13 Oct 2026: reels are conversational, two characters, interesting, for **brand awareness** (not conversion), one a day on Instagram and YouTube. So the daily style is `duo`: a short sitcom moment in Maya's room. Maya (solo blogger, panics; Kokoro `bf_emma`) brings the problem in her first line, Floey flips it with one real, sourced tip, Maya checks it on screen, and it ends on a button line and the Flowra end card. Flowra is never mentioned in the dialogue.

- Cast guide: `brand/cast/README.md` (who they are, how they talk, running jokes). Maya's rig: `brand/cast/maya.js` (expressions, poses, lip sync, `MAYA.create` performer), sheet `brand/cast/sheet.html`.
- Studio: `brand/styles/duo/README.md` and `brand/cast/duo.js` (room day/night, desk, laptop, mug, laptop-screen insert, phone notification, number pills, comic marks, speaker captions, end card, named spots and shots). Worked example: `reel/duo/template.html` (the approved test reel).
- Lines are `[id, say, emotion, speaker]` (+ caption); `render-scene.mts` voices Maya's lines with `REEL_VOICE=maya`. Duo mixes have no garden hum or ambience.
- Pipeline: `DUO_RESEARCH`, `duoSystem`, `duoProblems`, `DUO_LENGTH`, `DUO_FORMAT` and the duo editor/storyboard prompts in `src/pipeline.ts`; the duo director brief in `src/studio.ts`.
- Skills (use them when working by hand; the pipeline prompts carry the same rules): `duo-research`, `duo-script` (with stickiness score and audits), `duo-voice-direction`, `duo-editing` in `.claude/skills/`. Adapted from `~/Desktop/mindgame-shorts` (Lockhouse) and `~/Desktop/Youtube/stickman-youtube`.
- `make.yml` runs every day at 10:30 IST; each reel still waits for the founder's ✅, then `autopost.yml` posts it to Instagram, Facebook and YouTube.

## Reel styles (brand/styles/styles.json)
- Only styles with `rotation` not false are picked automatically; `duo` is the only one in the rotation now. `floey-garden` and `pro` stay available with REEL_STYLE or the make.yml style input.

- The maker never uses the last reel's style (failed reels don't count). `floey-garden` (brand/studio, reel/floey/template.html, Floey's voice) and `pro` (brand/styles/pro: a narrator over a drawn working screen, useflowra.com colours, reel/pro/template.html, assets/music/mk162.mp3 Mixkit free licence). Founder, 12 Oct 2026: "dont make the reels in same style... make some professional reels also".
- Each style brings its studio guide, worked example and voice (REEL_VOICE=pro picks the narrator in floey_sound.py; the pro mix has no garden hum or ambience and uses the music file). The style is recorded on brief.json, script.json and the post, and the weekly results compare styles. Force one with make.yml input `style` or REEL_STYLE.
- Add a style: a folder in brand/styles with README.md (parts and hard rules), a worked example template that passes `src/scenecheck-cli.ts`, an entry in styles.json, and the style-specific prompt lines in src/pipeline.ts (research, writeStory, editStory, storyboard) and src/studio.ts.

## How it learns (weekly, research.yml, Sundays)

- `src/results.ts`: every published reel's numbers (Instagram, Facebook, YouTube; read-only; a refused metric is left out) joined with how it was made (hook, `hookPattern`, structure, pillar, goal, length), dated snapshots in `state/results.json`. Claude writes `research/learnings.json` (signals with confidence, do more, do less, try next) and a note goes to Slack #social. Few reels means early signals, never rules.
- `src/hooks.ts`: the top Shorts of the last 90 days on `hookQueries` (calendar/listening.json) through the YouTube Data API, ranked by views per subscriber (breakouts, not big channels). For each: three frames from the first 4 seconds and the spoken words (yt-dlp clip + `src/transcribe.py`, faster-whisper tiny.en, low-confidence speech dropped because whisper invents "thank you for watching" over music). Captions are not used (YouTube 429s them). YouTube refuses the download on GitHub's servers ("confirm you're not a bot", seen 10 Oct 2026), so there the first frame (i.ytimg.com `frame0.jpg`) and the cover stand in (`opening`), with no spoken words. Cookies would fix it but would tie a Google account to a bot; do not. Claude writes `research/hooks.json`: named patterns, each with real examples and a Flowra example.
- The researcher, the story writer and the weekly ranking read both. The story writer must build the hook on a pattern (adapt, never copy) and records which one in `script.json` `hookPattern`, so the next results can show which patterns work for us.
- Run only the learning steps by hand: Actions, "Social listening", step = learn.
- Length tests: `story/length.json`. A `test` overrides the standard length for its next `reels` reels (failed ones don't count) and is recorded as `experiment` on each post, so the results compare it. Running since 11 Oct 2026: `short-first-frame` (20 to 26 seconds, problem visible from frame one) for r007 and r008, because Instagram viewers left after 1 to 4 seconds. Founder: "do whatever feels best for our reach". The first-frame rule applies to every reel.

## Rules

- Facts about Flowra only from `facts/flowra.md` (copied from flowra-content-engine; update both when the app changes). Never a price from memory.
- No invented statistics, customers or results. Example numbers are framed as examples.
- Never the em dash or en dash.
- Product visuals only from the demo site (`assets/clips/`, recorded by the engine's media robot). Never a customer's data.
- Never follow, like or comment automatically on any platform.
- Nothing publishes without the founder's ✅ (Slack #social reaction or Approve in Flowra Desk). Once approved, `autopost.yml` posts it to Instagram and Facebook on its own, one reel a day.
- Secrets live only in GitHub secrets.
