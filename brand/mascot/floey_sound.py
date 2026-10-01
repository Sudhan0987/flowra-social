"""Floey's sound design, in stereo.

  python floey_sound.py voice <id> "<line>" <outdir>      speak a line -> <id>.wav + <id>.mouth.json
  python floey_sound.py mix <cues.json> <outdir> <dur>     cues + track from floey.js -> mix.wav

Every behaviour has its own sound, panned to where Floey is on screen. The wing
hum is continuous: louder and higher while she darts, silent when perched
(real hum energy sits under 500 Hz). Calls are short dry "chip" notes under
0.1 s in bursts, as real hummingbirds make.
"""
import json, os, sys
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))
from audio import SR, env, lowpass, speakable, music_bed  # noqa: E402

rng = np.random.default_rng(11)
T = lambda d: np.arange(int(SR * d)) / SR


def hp(x, cutoff):
    return x - lowpass(x, cutoff)


def bp(x, lo, hi):
    return hp(lowpass(x, hi), lo)


def sweep(f0, f1, d, shape="exp"):
    x = T(d)
    f = f0 * (f1 / f0) ** (x / d) if shape == "exp" else np.linspace(f0, f1, len(x))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def noise(d):
    return rng.standard_normal(int(SR * d))


# ---------- one function per sound ----------
def chip(n=3):
    out = np.zeros(int(SR * (0.09 * n + 0.1)))
    for i in range(n):
        d = 0.045 + rng.random() * 0.015
        c = sweep(6800 - rng.random() * 600, 3600, d) * 0.7 + bp(noise(d), 3000, 8000) * 0.25
        c *= env(len(c), 0.002, d * 0.5)
        a = int(i * 0.09 * SR)
        out[a:a + len(c)] += c * (0.8 + 0.2 * rng.random())
    return out * 0.55


def zip_(d=0.3):
    dd = d + 0.15
    x = T(dd)
    air = bp(noise(dd), 500, 4500) * np.sin(np.pi * np.clip(x / dd, 0, 1)) ** 1.5
    tone = sweep(420, 1300, dd) * env(len(x), 0.02, dd * 0.5) * 0.18
    return (air * 0.7 + tone)


def brrt():
    d = 0.28
    x = T(d)
    flutter = bp(noise(d), 250, 1100) * (0.55 + 0.45 * np.sign(np.sin(2 * np.pi * 32 * x)))
    return flutter * env(len(x), 0.004, 0.12) * 0.9


def tk():
    d = 0.035
    return sweep(2600, 1500, d) * env(int(SR * d), 0.0005, 0.012) * 0.45


def rustle(n=1):
    out = np.zeros(int(SR * (0.16 * n + 0.2)))
    for i in range(n):
        d = 0.18
        g = hp(noise(d), 2200) * np.abs(lowpass(noise(d), 60)) * 3
        g *= env(len(g), 0.01, 0.08)
        a = int(i * 0.16 * SR)
        out[a:a + len(g)] += g
    return out * 0.5


def lick():
    d = 0.05
    return (sweep(900, 1700, d) * 0.5 + hp(noise(d), 3000) * 0.3) * env(int(SR * d), 0.001, 0.02) * 0.35


def pluck():
    d = 0.12
    return (sweep(1500, 700, d) + 0.5 * sweep(3000, 1400, d)) * env(int(SR * d), 0.001, 0.04) * 0.55


def flick():
    return np.concatenate([tk(), np.zeros(int(SR * 0.01)), zip_(0.18) * 0.6])


def sip():
    out = np.zeros(int(SR * 0.2))
    for i in range(3):
        d = 0.05
        b = sweep(700 - i * 80, 380, d) * env(int(SR * d), 0.002, 0.02)
        a = int(i * 0.045 * SR)
        out[a:a + len(b)] += b * (0.6 - i * 0.12)
    return out * 0.6


def shimmer():
    notes = [1318, 1568, 1976, 2349, 2637, 3136, 3951]
    out = np.zeros(int(SR * 1.2))
    for i, f in enumerate(notes):
        d = 0.6
        x = T(d)
        b = (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * f * 2.01 * x)) * env(len(x), 0.002, 0.18)
        a = int(i * 0.045 * SR)
        out[a:a + len(b)] += b * 0.3
    out += hp(noise(1.2), 6000) * env(int(SR * 1.2), 0.01, 0.25) * 0.15
    return out * 0.6


def bloom():
    # leaves rustle, then a soft rising marimba chime
    out = np.zeros(int(SR * 1.2))
    r = rustle(2)
    out[:len(r)] += r
    for i, f in enumerate([523, 659, 784]):
        x = T(0.7)
        b = (np.sin(2 * np.pi * f * x) + 0.25 * np.sin(2 * np.pi * f * 4 * x) * np.exp(-x / 0.03)) * env(len(x), 0.002, 0.25)
        a = int((0.08 + i * 0.09) * SR)
        out[a:a + len(b)] += b * 0.35
    return out


def tap():
    d = 0.09
    return (sweep(180, 90, d) + 0.3 * lowpass(noise(d), 800)) * env(int(SR * d), 0.001, 0.03) * 0.7


def flutter():
    d = 0.35
    x = T(d)
    return bp(noise(d), 200, 1500) * (0.5 + 0.5 * np.sin(2 * np.pi * 38 * x)) * env(len(x), 0.01, 0.15) * 0.8


def shake():
    d = 0.42
    x = T(d)
    return hp(noise(d), 1800) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * x)) * env(len(x), 0.01, 0.15) * 0.6


def swish():
    d = 0.2
    return bp(noise(d), 600, 3000) * np.sin(np.pi * np.linspace(0, 1, int(SR * d))) ** 2 * 0.4


def ting():
    x = T(0.5)
    return np.sin(2 * np.pi * 2093 * x) * env(len(x), 0.001, 0.12) * 0.3


def reverse(d=0.6):
    out = np.zeros(int(SR * (d + 0.2)))
    k = 0
    while k * 0.22 < d:
        x = T(0.11)
        b = np.sign(np.sin(2 * np.pi * 1050 * x)) * env(len(x), 0.003, 0.05)
        a = int(k * 0.22 * SR)
        out[a:a + len(b)] += lowpass(b, 3000) * 0.18
        k += 1
    return out


def zipoff(d=0.32):
    dd = d + 0.25
    x = T(dd)
    air = bp(noise(dd), 600, 6000) * np.clip(x / d, 0, 1) ** 2 * env(len(x), 0.001, 0.08)
    return (air + sweep(500, 2200, dd) * 0.15 * np.clip(x / d, 0, 1)) * 0.9


def chomp():
    d = 0.07
    crunch = bp(noise(d), 1500, 6000) * np.abs(lowpass(noise(d), 300)) * 4
    return (crunch + sweep(900, 400, d) * 0.4) * env(int(SR * d), 0.001, 0.025) * 0.8


def gulp():
    d = 0.22
    x = T(d)
    return sweep(420, 140, d) * env(len(x), 0.01, 0.09) * 0.8 + lowpass(noise(d), 300) * env(len(x), 0.005, 0.05) * 0.3


SOUNDS = {"chip": lambda c: chip(c.get("n", 3)), "zip": lambda c: zip_(c.get("d", 0.3)), "brrt": lambda c: brrt(), "tk": lambda c: tk(),
          "rustle": lambda c: rustle(c.get("n", 1)), "lick": lambda c: lick(), "pluck": lambda c: pluck(), "flick": lambda c: flick(),
          "sip": lambda c: sip(), "shimmer": lambda c: shimmer(), "bloom": lambda c: bloom(), "tap": lambda c: tap(), "flutter": lambda c: flutter(),
          "shake": lambda c: shake(), "swish": lambda c: swish(), "ting": lambda c: ting(), "reverse": lambda c: reverse(c.get("d", 0.6)),
          "zipoff": lambda c: zipoff(c.get("d", 0.32)), "chomp": lambda c: chomp(), "gulp": lambda c: gulp()}
GAIN = {"chip": 0.8, "zip": 0.7, "brrt": 0.6, "tk": 0.8, "rustle": 1.8, "lick": 1.5, "pluck": 0.8, "flick": 0.7, "sip": 0.8, "shimmer": 0.7,
        "bloom": 0.8, "tap": 1.1, "flutter": 0.6, "shake": 1.2, "swish": 0.5, "ting": 0.6, "reverse": 0.6, "zipoff": 0.8, "chomp": 1.0, "gulp": 1.0}


def pan_gains(x):
    p = np.clip(x / 1080 * 2 - 1, -1, 1) * 0.8
    a = (p + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


def place_st(out, sig, t, x0, x1=None):
    a = int(t * SR)
    if a >= len(out) or a + len(sig) <= 0:
        return
    if a < 0:
        sig, a = sig[-a:], 0
    sig = sig[: len(out) - a]
    xs = np.linspace(x0, x0 if x1 is None else x1, len(sig))
    l, r = pan_gains(xs)
    out[a:a + len(sig), 0] += sig * l
    out[a:a + len(sig), 1] += sig * r


def hum(track, dur):
    """The wing hum, sample by sample from the per-frame track."""
    n = int(SR * dur)
    fps = track["fps"]
    fr = np.arange(n) / SR * fps
    get = lambda k: np.interp(fr, np.arange(len(track[k])), np.array(track[k], dtype=float))
    fly, spd, x = lowpass(get("flying"), 20), get("speed"), get("x")
    k = np.clip(spd / 2500, 0, 1)
    f0 = 86 + 70 * k
    ph = 2 * np.pi * np.cumsum(f0) / SR
    tone = sum(np.sin(h * ph + h) / h for h in (1, 2, 3, 4, 6))
    beat = 0.75 + 0.25 * np.sin(2 * np.pi * 42 * np.arange(n) / SR)
    air = bp(rng.standard_normal(n), 180, 700) * 0.6
    sig = lowpass((tone * 0.7 + air) * beat, 1100) * fly * (0.35 + 0.65 * k) * 0.22
    l, r = pan_gains(x)
    return np.stack([sig * l, sig * r], axis=1)


def ambience(dur):
    """A quiet garden: soft wind and a distant bird now and then."""
    n = int(SR * dur)
    wind = lowpass(rng.standard_normal(n), 400) * (0.6 + 0.4 * lowpass(rng.standard_normal(n), 0.5) * 20)
    out = np.stack([wind, np.roll(wind, 900)], axis=1) * 0.05
    t = 0.8
    while t < dur - 0.5:
        b = sweep(2600 + rng.random() * 1200, 1900, 0.18) * env(int(SR * 0.18), 0.01, 0.08) * 0.05
        place_st(out, b, t, rng.random() * 1080)
        t += 1.8 + rng.random() * 2.2
    return out


# Floey's own voice: af_heart (the voice we chose) with a touch of af_bella's
# warmth, lifted about 1.2 semitones without changing its length, a gentle
# presence lift and light compression so it carries on phone speakers.
FLOEY_BLEND = [("af_heart", 0.82), ("af_bella", 0.18)]
FLOEY_PITCH = 1.072
FLOEY_SPEED = 1.04


# delivery per emotion (from voice-acting research: worry and sadness lower,
# slower, longer pauses; joy and excitement higher, faster, brighter)
#            pitch   pace   pause after (s)
EMOTION = {"ominous": (0.975, 0.94, 0.35), "worried": (0.985, 0.96, 0.3), "curious": (1.005, 1.0, 0.15), "warm": (1.0, 1.0, 0.15),
           "bright": (1.015, 1.03, 0.1), "determined": (1.0, 1.02, 0.1), "proud": (1.01, 1.0, 0.15), "excited": (1.025, 1.07, 0.05), "playful": (1.02, 1.0, 0.1)}


def floey_voice(k, line, plain=False, emotion="warm"):
    import subprocess, tempfile
    if plain:
        v, sr = k.create(speakable(line), voice="af_heart", speed=1.08, lang="en-us")
        return np.interp(np.arange(int(len(v) * SR / sr)) / SR, np.arange(len(v)) / sr, v)
    style = sum(k.get_voice_style(n) * w for n, w in FLOEY_BLEND)
    ep, es, _ = EMOTION.get(emotion, EMOTION["warm"])
    v, sr = k.create(speakable(line), voice=style, speed=FLOEY_SPEED * es, lang="en-us")
    with tempfile.TemporaryDirectory() as d:
        a, b = os.path.join(d, "a.wav"), os.path.join(d, "b.wav")
        sf.write(a, v, sr)
        pitch = FLOEY_PITCH * ep
        filt = (f"asetrate={int(sr * pitch)},aresample={SR},atempo={1 / pitch:.5f},"
                "highpass=f=90,equalizer=f=4200:t=q:w=1.2:g=2.5,equalizer=f=250:t=q:w=1:g=-1.5,"
                "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", a, "-af", filt, "-ac", "1", b], check=True)
        out, _ = sf.read(b)
    return out


def kokoro():
    from kokoro_onnx import Kokoro
    from kokoro_onnx.config import EspeakConfig
    base = os.environ.get("KOKORO_DIR") or os.path.expanduser("~/.cache/hyperframes/tts")
    return Kokoro(os.path.join(base, "models", "kokoro-v1.0.onnx"), os.path.join(base, "voices", "voices-v1.0.bin"),
                  espeak_config=EspeakConfig(lib_path=os.environ.get("ESPEAK_LIB"), data_path=os.environ.get("ESPEAK_DATA")))


def voice(line_id, line, outdir, emotion="warm"):
    """Chatterbox (acted, in Floey's voice) when its environment is installed, else Kokoro with emotional delivery."""
    cb = os.path.join(os.path.dirname(__file__), "..", "..", ".venv-cb", "bin", "python")
    ref = os.path.join(os.path.dirname(__file__), "floey-ref.wav")
    out = os.path.join(outdir, f"{line_id}.wav")
    if os.environ.get("FLOEY_ENGINE", "chatterbox") == "chatterbox" and os.path.exists(cb) and os.path.exists(ref):
        import subprocess
        subprocess.run([cb, os.path.join(os.path.dirname(__file__), "floey_cb.py"), ref, out, emotion, speakable(line)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        v, _ = sf.read(out)
    else:
        v = floey_voice(kokoro(), line, emotion=emotion)
    sf.write(out, v, SR)
    step = SR // 30
    m = [float(np.sqrt(np.mean(v[i:i + step] ** 2))) for i in range(0, len(v), step)]
    peak = max(m) or 1
    json.dump([round(min(1, x / peak * 1.3), 3) for x in m], open(os.path.join(outdir, f"{line_id}.mouth.json"), "w"))
    print(f"{line_id}: {len(v) / SR:.2f}s")


def compare(line, path):
    """The same line in the stock voice, then in Floey's voice, for listening side by side."""
    k = kokoro()
    a, b = floey_voice(k, line, plain=True), floey_voice(k, line)
    gap = np.zeros(int(SR * 0.9))
    out = np.concatenate([a / np.abs(a).max() * 0.8, gap, chip(2) * 0.6, np.zeros(int(SR * 0.15)), b / np.abs(b).max() * 0.8])
    sf.write(path, out, SR)
    print(path)


def mix(cues_path, outdir, dur):
    data = json.load(open(cues_path))
    out = hum(data["track"], dur) + ambience(dur)
    if data.get("music"):
        # a quiet music bed under everything, ducked while Floey talks
        mb = music_bed(dur, data["music"], 5)[: len(out)]
        duck = np.ones(len(out))
        for c in data["cues"]:
            if c["kind"] == "voice":
                a, b = int(c["t"] * SR), int((c["t"] + c.get("len", 2)) * SR)
                duck[max(0, a - 2000): b + 4000] = 0.55
        duck = lowpass(duck, 8)
        out[: len(mb)] += np.stack([mb, mb], axis=1) * duck[: len(mb), None] * 0.22
    for c in data["cues"]:
        if c["kind"] == "voice":
            v, _ = sf.read(os.path.join(outdir, f"{c['id']}.wav"))
            place_st(out, v * 1.6, c["t"], 540)  # voice stays centred
            continue
        if c["kind"] not in SOUNDS:
            print("unknown sound", c["kind"])
            continue
        place_st(out, SOUNDS[c["kind"]](c) * GAIN[c["kind"]], c["t"], c.get("x0", c.get("x", 540)), c.get("x1"))
    out = out / max(1e-9, np.abs(out).max()) * 0.9
    sf.write(os.path.join(outdir, "mix.wav"), out, SR)
    print(f"mix.wav {dur:.1f}s, {len(data['cues'])} cues")


if __name__ == "__main__":
    if sys.argv[1] == "voice":
        voice(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5] if len(sys.argv) > 5 else "warm")
    elif sys.argv[1] == "compare":
        compare(sys.argv[2], sys.argv[3])
    else:
        mix(sys.argv[2], sys.argv[3], float(sys.argv[4]))
