"""Original local wrong-answer cue: two short, falling, dissonant buzzes."""
from array import array
from pathlib import Path
import math
import wave

rate = 16000
duration = 0.62
samples = array('h')
for i in range(round(rate * duration)):
    t = i / rate
    pulse_start = 0 if t < 0.29 else 0.34
    local = t - pulse_start
    length = 0.25
    if local < 0 or local >= length:
        samples.append(0)
        continue
    envelope = min(1, local / 0.008) * min(1, (length - local) / 0.035)
    phase = 2 * math.pi * (190 * local - 90 * local * local)
    # Limited odd harmonics give a retro buzz without a harsh full-scale square wave.
    tone = math.sin(phase) + 0.25 * math.sin(3 * phase) + 0.35 * math.sin(phase * 1.08)
    samples.append(round(tone * envelope * 0.26 * 32767))
target = Path('public/audio/answer-incorrect.wav')
target.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(target), 'wb') as out:
    out.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
    out.writeframes(samples.tobytes())
print(f'{target}: {duration:.2f} seconds, {target.stat().st_size} bytes')
