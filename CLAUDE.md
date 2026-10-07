# Flowra Social

The social agent. It makes short vertical videos (Reels) about the problems Flowra's buyers have, posts each draft to Slack `#social` for the founder's ✅, and (next) publishes approved ones to Instagram. LinkedIn and X get a ready-to-post pack from the same video.

The founder is not technical: plain words, short sentences.

## How a reel is made

1. `calendar/topics.json`: the backlog, made in order. Keep about 70% on buyers' problems (traffic loss, fixes, reporting, the free tools on useflowra.com) and 30% on AI and automation.
2. `src/script.ts`: Claude writes the beats (what the voice says, what the screen shows) and the caption. The checks in `problems()` reject em dashes, banned words, bad lengths and wrong shapes; one failure gets one rewrite.
3. `src/audio.py`: Kokoro (free, local) speaks each beat; an original music bed ducks under the voice; `timeline.json` records the timings and caption chunks.
4. `src/render.ts`: `reel/reel.html` is drawn frame by frame (every frame is a pure function of time) and joined with the audio into `reel.mp4`, 1080x1920. Frame 0 is the finished hook so the default cover is readable.
5. `src/slack.ts`: the video and caption go to `#social`.

Formats today: `fix` (the 45-second fix: hook, 2 to 4 steps, outro) and `myth` (myth vs fact pairs). Beat kinds: hook, point, step, myth, fact, clip, outro.

## Rules

- Facts about Flowra only from `facts/flowra.md` (copied from flowra-content-engine; update both when the app changes). Never a price from memory.
- No invented statistics, customers or results. Example numbers are framed as examples.
- Never the em dash or en dash.
- Product visuals only from the demo site (`assets/clips/`, recorded by the engine's media robot). Never a customer's data.
- Never follow, like or comment automatically on any platform.
- Nothing publishes without the founder's ✅ (Slack #social reaction or Approve in Flowra Desk). Once approved, `autopost.yml` posts it to Instagram and Facebook on its own, one reel a day.
- Secrets live only in GitHub secrets.
