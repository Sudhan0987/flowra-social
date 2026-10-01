# How a Flowra reel is made

The same stages an animation studio uses for an explainer, run by the social agent. Each stage writes a file into `drafts/<id>/`, so a failed stage is retried without redoing the ones before it, and every reel can be traced back to why it was made.

| # | Stage | What happens | Output | Gate |
|---|---|---|---|---|
| 1 | Research | Find what is worth a reel this week: SEO and AI-search news, questions people ask on Reddit and forums, what similar accounts post and how it performs, our own articles and findings. Score each idea on relevance to Flowra's buyers, timeliness, and whether it can be told visually. | `brief.json` (topic, angle, why now, sources, goal: send or save) | Facts must have a source. |
| 2 | Story | Pick one story structure from `story/formats.json` (not one of the last three used). Write the script beat by beat: hook in the first 2 seconds, the body with a small payoff every 6 to 8 seconds, the payoff, a loop line. 25 to 35 seconds. | `script.json` | Word counts, one structure, no em dashes, facts only, loop present. |
| 3 | Voice | Speak each beat (Kokoro, free). This fixes the timing before any drawing, as studios do with a scratch voiceover. | `audio.wav`, `timeline.json` | |
| 4 | Storyboard | For each beat: the shot (wide, medium, close, extreme close), the camera move (push, pull, pan, whip, shake), who is on screen, what they do, the one piece of on-screen data if any, the sound effects. The visual must explain the line on its own. | `storyboard.json` | Every beat has a visual idea, not a text card. |
| 5 | Animatic | The director agent builds the scene page from the kit (`reel/kit/kit.js`) and the storyboard, then draws one still per beat and looks at them. | `scene.html`, stills | Claude reviews each still against its storyboard panel. |
| 6 | Animation | The director refines motion: easing, overlap, anticipation, squash, camera. It checks stills at 4 moments per beat. | final `scene.html` | |
| 7 | Render | Frame by frame at 30 fps, joined with the audio, loudness normalised to -14 LUFS (Instagram's target). | `reel.mp4`, `poster.jpg` | |
| 8 | Final test | Automated: length, loudness, captions inside the safe area, no clipped text. Then a reviewer looks at 12 frames and the script: does the hook land in 2 seconds, is every scene readable on a phone, does the ending loop, is anything untrue? | `qa.json` | Fails send the reel back to stage 6 once, then park it. |
| 9 | Approve and publish | The reel, caption and cover go to Slack #social for a ✅. Approved reels publish to Instagram at the planned time. | | Human ✅ |
| 10 | Learn | After 48 hours and 7 days: views, watch time, completion, sends, saves, follows. The research stage reads this to pick the next topics and structures. | `insights.json` | |
