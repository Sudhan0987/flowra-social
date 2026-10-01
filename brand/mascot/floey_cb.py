"""Floey's voice with emotion, via Chatterbox (MIT).

Chatterbox speaks in the voice of a short reference clip; the reference is
Floey's own Kokoro voice (af_heart blend, the voice Sudhan chose), so the
timbre stays hers and Chatterbox adds the acting. Each line has an emotion;
the emotion sets the expressiveness (exaggeration), how closely it sticks to
the reference (cfg), and the delivery after synthesis (pitch, pace, pause),
following voice-acting research: worry and sadness lower and slower with
longer pauses, joy and excitement higher, faster, brighter.

  python floey_cb.py <ref.wav> <out.wav> <emotion> "<line>"
"""
import os, subprocess, sys, tempfile
import soundfile as sf
import numpy as np

EMOTIONS = {
    #            exaggeration  cfg    pitch  tempo
    "worried":   (0.55,        0.50,  0.985, 0.96),
    "ominous":   (0.45,        0.55,  0.975, 0.94),
    "curious":   (0.60,        0.45,  1.005, 1.00),
    "warm":      (0.60,        0.45,  1.000, 1.00),
    "bright":    (0.75,        0.35,  1.015, 1.03),
    "determined": (0.65,       0.40,  1.000, 1.02),
    "proud":     (0.70,        0.40,  1.010, 1.00),
    "excited":   (0.90,        0.30,  1.025, 1.06),
    "playful":   (0.75,        0.35,  1.020, 1.00),
}

_model = None


def model():
    global _model
    if _model is None:
        import torch
        from chatterbox.tts import ChatterboxTTS
        dev = "mps" if torch.backends.mps.is_available() else "cpu"
        _model = ChatterboxTTS.from_pretrained(device=dev)
    return _model


def speak(ref, text, emotion, out):
    ex, cfg, pitch, tempo = EMOTIONS[emotion]
    m = model()
    wav = m.generate(text, audio_prompt_path=ref, exaggeration=ex, cfg_weight=cfg)
    x = wav.squeeze(0).cpu().numpy()
    with tempfile.TemporaryDirectory() as d:
        a = os.path.join(d, "a.wav")
        sf.write(a, x, m.sr)
        filt = f"asetrate={int(m.sr * pitch)},aresample=44100,atempo={tempo / pitch:.5f},highpass=f=80,equalizer=f=4200:t=q:w=1.2:g=2,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120,silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", a, "-af", filt, "-ac", "1", out], check=True)


if __name__ == "__main__":
    ref, out, emotion, text = sys.argv[1:5]
    speak(ref, text, emotion, out)
    print(out)
