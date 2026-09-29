"""Voice and music for one reel.

  python src/audio.py <draft dir>

Reads <dir>/script.json, speaks every beat with Kokoro (a free local voice
model, Apache 2.0), lays the beats end to end with short pauses, writes an
original music bed of the same length that ducks under the voice, and saves:

  <dir>/audio.wav      voice + music, 44.1 kHz stereo
  <dir>/timeline.json  when each beat and each caption chunk starts and ends

Env: KOKORO_DIR (model + voices, default ~/.cache/hyperframes/tts),
ESPEAK_LIB / ESPEAK_DATA (the espeak-ng library the phonemizer uses),
VOICE (default af_heart), VOICE_SPEED (default 1.05).
"""
import json
import os
import re
import sys
import wave

import numpy as np
from kokoro_onnx import Kokoro
from kokoro_onnx.config import EspeakConfig

SR = 44100
LEAD = 0.25  # silence before the first word
GAP = {"hook": 0.35, "outro": 0.0}  # pause after a beat; default below
DEFAULT_GAP = 0.3
TAIL = 1.6  # music rings out after the last word


def speakable(text):
    """What the voice should say for text written for reading."""
    t = text.replace("useflowra.com", "use flowra dot com")
    t = re.sub(r"\bGSC\b", "Search Console", t)
    t = re.sub(r"\bGA4\b", "G A 4", t)
    t = re.sub(r"\bCTR\b", "click through rate", t)
    t = re.sub(r"#(\d+)", r"number \1", t)
    return t


def chunks(text, start, end):
    """Caption chunks of up to 4 words (and about 24 characters), timed across
    the spoken span in proportion to their length, with a little extra weight
    after punctuation where the voice pauses."""
    words = text.split()
    out, cur = [], []
    for w in words:
        if cur and len(" ".join(cur + [w])) > 24:
            out.append(cur)
            cur = []
        cur.append(w)
        if len(cur) >= 4 or re.search(r"[.,:;?!]$", w):
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    weights = [sum(len(w) + 1 for w in c) + (6 if re.search(r"[.,:;?!]$", c[-1]) else 0) for c in out]
    total = sum(weights) or 1
    t = start
    res = []
    for c, wt in zip(out, weights):
        d = (end - start) * wt / total
        # words inside a chunk light up in turn, again by length
        wl = [len(w) + 1 for w in c]
        s = sum(wl)
        acc = t
        wts = []
        for n in wl:
            wts.append(round(acc, 3))
            acc += d * n / s
        res.append({"text": " ".join(c), "start": round(t, 3), "end": round(t + d, 3), "words": c, "wordStarts": wts})
        t += d
    return res


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lowpass(x, cutoff):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def place(buf, sig, t, g=1.0):
    i = int(t * SR)
    j = min(len(buf), i + len(sig))
    if 0 <= i < len(buf):
        buf[i:j] += sig[: j - i] * g


def music_bed(dur, beat_starts, seed):
    """A quiet, steady bed: pad chords, soft bass pulse, light hats, at 100 BPM.
    The progression is picked by the seed so reels don't all sound the same."""
    rng = np.random.default_rng(seed)
    n = int(SR * dur)
    bar = 2.4  # 100 BPM, 4 beats
    progs = [
        [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],  # Am F C G
        [[48, 52, 55], [55, 59, 62], [57, 60, 64], [53, 57, 60]],  # C G Am F
        [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]],  # Dm Bb F C
    ]
    prog = progs[seed % len(progs)]
    out = np.zeros(n)
    pad = np.zeros(n)
    bass = np.zeros(n)
    hats = np.zeros(n)
    b = 0
    while b * bar < dur:
        ch = prog[b % 4]
        m = int(SR * (bar + 0.4))
        t = np.arange(m) / SR
        s = np.zeros(m)
        for note in ch:
            for det in (-0.003, 0.0, 0.004):
                s += 2 * ((t * hz(note + 12) * (1 + det)) % 1.0) - 1
        a = np.minimum(1, t / 0.4) * np.minimum(1, (m - np.arange(m)) / (SR * 0.4))
        place(pad, s * a, b * bar, 0.035)
        root = ch[0] - 12
        for k in range(4):
            nb = int(SR * 0.5)
            tb = np.arange(nb) / SR
            place(bass, np.tanh(1.4 * np.sin(2 * np.pi * hz(root) * tb)) * env(nb, 0.005, 0.18), b * bar + k * 0.6, 0.16)
        for k in range(8):
            nh = int(SR * 0.04)
            h = rng.standard_normal(nh)
            h = h - lowpass(h, 6000)
            place(hats, h * env(nh, 0.0005, 0.01), b * bar + k * 0.3 + 0.15, 0.018)
        b += 1
    out = lowpass(pad, 1600) + lowpass(bass, 700) + hats
    # a soft riser into each beat change keeps the cuts feeling intentional
    for s in beat_starts[1:]:
        nr = int(SR * 0.35)
        r = lowpass(rng.standard_normal(nr), 2500) * np.linspace(0, 1, nr) ** 2
        place(out, r, max(0, s - 0.35), 0.03)
    fade_in = np.minimum(1, np.arange(n) / (SR * 0.6))
    fo = int(SR * (dur - 1.4))
    fade = np.ones(n)
    fade[fo:] = np.linspace(1, 0, n - fo) ** 1.5
    return out * fade_in * fade


def main():
    d = sys.argv[1]
    script = json.load(open(os.path.join(d, "script.json")))
    kdir = os.path.expanduser(os.environ.get("KOKORO_DIR", "~/.cache/hyperframes/tts"))
    k = Kokoro(
        os.path.join(kdir, "models", "kokoro-v1.0.onnx"),
        os.path.join(kdir, "voices", "voices-v1.0.bin"),
        espeak_config=EspeakConfig(lib_path=os.environ.get("ESPEAK_LIB"), data_path=os.environ.get("ESPEAK_DATA")),
    )
    voice = os.environ.get("VOICE", "af_heart")
    speed = float(os.environ.get("VOICE_SPEED", "1.05"))

    clips = []
    for beat in script["beats"]:
        samples, sr = k.create(speakable(beat["say"]), voice=voice, speed=speed, lang="en-us")
        if sr != SR:  # Kokoro speaks at 24 kHz; resample by interpolation
            x = np.arange(len(samples)) / sr
            samples = np.interp(np.arange(int(len(samples) * SR / sr)) / SR, x, samples)
        clips.append(np.asarray(samples, dtype=np.float64))

    t = LEAD
    beats = []
    for beat, c in zip(script["beats"], clips):
        start, spoken = t, len(c) / SR
        end = start + spoken + GAP.get(beat["kind"], DEFAULT_GAP)
        beats.append({"start": round(start, 3), "spokenEnd": round(start + spoken, 3), "end": round(end, 3), "chunks": chunks(beat["say"], start, start + spoken)})
        t = end
    dur = t + TAIL
    beats[-1]["end"] = round(dur, 3)

    n = int(SR * dur)
    vo = np.zeros(n)
    for b, c in zip(beats, clips):
        place(vo, c, b["start"])
    vo = vo / (np.max(np.abs(vo)) + 1e-9) * 0.92

    bed = music_bed(dur, [b["start"] for b in beats], sum(map(ord, script.get("id", "x"))))
    bed = bed / (np.max(np.abs(bed)) + 1e-9)
    # Duck the bed under the voice: follow the voice's loudness, smoothed.
    win = int(SR * 0.08)
    level = np.convolve(np.abs(vo), np.ones(win) / win, mode="same")
    level = np.convolve(level, np.ones(win * 3) / (win * 3), mode="same")
    duck = 1 - 0.7 * np.minimum(1, level / 0.05)
    mix = vo + bed * 0.16 * duck
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.9

    st = np.stack([mix, np.concatenate([np.zeros(10), mix[:-10]])], axis=1)
    with wave.open(os.path.join(d, "audio.wav"), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype("<i2").tobytes())
    json.dump({"duration": round(dur, 3), "beats": beats}, open(os.path.join(d, "timeline.json"), "w"), indent=1)
    print(f"audio.wav {dur:.1f}s, {len(beats)} beats, voice {voice}")


if __name__ == "__main__":
    main()
