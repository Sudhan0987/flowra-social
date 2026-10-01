"""Sound for the Floey motion test: wing hum, effects and one spoken line.
Writes motion.wav and motion-mouth.json (beak opening per frame, from the voice)."""
import json, os, sys
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))
from audio import SR, sfx, env, lowpass, place  # noqa: E402
from kokoro_onnx import Kokoro  # noqa: E402
from kokoro_onnx.config import EspeakConfig  # noqa: E402

HERE = os.path.dirname(__file__)
DUR, FPS = 8.8, 30
VOICE_AT, LINE = 2.75, "Hi! I'm Floey."
rng = np.random.default_rng(7)
out = np.zeros(int(SR * DUR))

# wing hum: a soft buzz near 90 Hz with harmonics, swelling while darting
t = np.arange(len(out)) / SR
hum = sum(np.sin(2 * np.pi * 88 * h * t + h) / h for h in (1, 2, 3, 5))
hum = lowpass(hum * (1 + 0.25 * np.sin(2 * np.pi * 11 * t)), 900)
swell = np.full(len(out), 0.35)
for a, b in [(1.4, 1.9), (4.95, 5.5), (6.85, 7.75)]:
    m = (t > a) & (t < b)
    swell[m] = 0.35 + 0.65 * np.sin(np.pi * (t[m] - a) / (b - a))
swell[t > 7.75] = np.clip(0.35 * (1 - (t[t > 7.75] - 7.75) / 0.3), 0, None)
out += hum * swell * 0.09

def chirp(f0, f1, dur=0.12):
    x = np.arange(int(SR * dur)) / SR
    f = np.linspace(f0, f1, len(x))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(x), 0.004, dur * 0.6) * 0.35

for at, kind, g in [(1.45, "whoosh", 0.6), (1.78, "pop", 0.35), (2.3, "pop", 0.25), (4.95, "whoosh", 0.5), (5.62, "pop", 0.4), (5.88, "pop", 0.45), (6.14, "pop", 0.5), (6.4, "ding", 0.55), (6.9, "whoosh", 0.35), (7.6, "whoosh", 0.7)]:
    place(out, sfx(kind, rng), at, g)
place(out, chirp(1800, 2600), 2.32, 0.6)
place(out, chirp(2200, 3200) , 4.62, 0.7)
place(out, chirp(2600, 1900), 4.78, 0.5)

k = Kokoro(os.path.expanduser("~/.cache/hyperframes/tts/models/kokoro-v1.0.onnx"), os.path.expanduser("~/.cache/hyperframes/tts/voices/voices-v1.0.bin"),
           espeak_config=EspeakConfig(lib_path=os.environ.get("ESPEAK_LIB"), data_path=os.environ.get("ESPEAK_DATA")))
v, sr = k.create(LINE, voice=os.environ.get("VOICE", "af_heart"), speed=1.08, lang="en-us")
v = np.interp(np.arange(int(len(v) * SR / sr)) / SR, np.arange(len(v)) / sr, v)
place(out, v, VOICE_AT, 1.0)

# beak opening per frame from the voice loudness
mouth = []
for f in range(int(DUR * FPS)):
    a = int((f / FPS - VOICE_AT) * SR)
    seg = v[max(a, 0): max(a + SR // FPS, 0)] if a + SR // FPS > 0 else np.zeros(1)
    mouth.append(0 if len(seg) == 0 else float(np.sqrt(np.mean(seg ** 2))))
peak = max(mouth) or 1
mouth = [round(min(1, m / peak * 1.3), 3) for m in mouth]

out = out / max(1e-9, np.abs(out).max()) * 0.9
sf.write(os.path.join(HERE, "motion.wav"), out, SR)
json.dump(mouth, open(os.path.join(HERE, "motion-mouth.json"), "w"))
print(f"motion.wav {DUR}s, voice {len(v) / SR:.2f}s")
