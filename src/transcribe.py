# What is said in each short audio clip (the first 4 seconds of a Short), for
# the hook library (src/hooks.ts). faster-whisper's tiny English model, free,
# on the CPU, about a second a clip. Reads 16 kHz mono WAVs, prints JSON
# {path: text}. Samples are passed as an array, not a path, so it does not
# depend on PyAV's file decoder (which breaks across versions).
import json
import sys
import wave

import numpy as np
from faster_whisper import WhisperModel

model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
out = {}
for f in sys.argv[1:]:
    try:
        with wave.open(f) as w:
            audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
        segments, _ = model.transcribe(audio, beam_size=1, vad_filter=True, condition_on_previous_text=False)
        # whisper invents stock phrases over music; drop segments it doubts are speech
        out[f] = " ".join(s.text.strip() for s in segments if s.no_speech_prob < 0.5 and s.avg_logprob > -0.8).strip()
    except Exception:
        out[f] = ""
print(json.dumps(out))
