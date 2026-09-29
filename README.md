# flowra-social

Flowra's social agent: writes, voices and renders short vertical videos and posts each draft to Slack `#social` for approval. See `CLAUDE.md` for how it works and its rules, and `~/Desktop/Flowra/Marketing Agents Plan/04-AGENT-SOCIAL.md` for the full plan.

Run it by hand: Actions > Make a reel > Run workflow (optionally a topic id from `calendar/topics.json`).

Locally (needs Python 3.12 with `kokoro-onnx soundfile`, espeak-ng and ffmpeg):

```
PYTHON=<venv python> ESPEAK_LIB=/opt/homebrew/lib/libespeak-ng.dylib ESPEAK_DATA=/opt/homebrew/share/espeak-ng-data npx tsx src/cli.ts make [topic id]
```
