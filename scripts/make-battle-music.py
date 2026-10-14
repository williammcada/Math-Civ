"""v0.5 battle score (spec F8): original, synthesized, offline. No samples.

battle.mp3      Calm opening: a held drone, a breathy flute-like lead in the Japanese "in" scale,
                occasional koto-like plucks, and a low drum used only to mark phrases.
battle_late.mp3 Plays from round 5 (Kobayakawa's round) and after a line breaks: the same material,
                with a steady low drum pattern, a plucked ostinato and the lead an octave higher.

Both loop seamlessly (sound past the end wraps to the start). Usage: python3 scripts/make-battle-music.py
Needs numpy and ffmpeg (libmp3lame)."""
import subprocess, wave, os
import numpy as np

RATE = 22050
OUT = 'public/audio'
D2 = 38  # MIDI note numbers
IN_SCALE = [0, 1, 5, 7, 8]  # D, Eb, G, A, Bb: the "in" (miyako-bushi) scale


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def note(deg, octave=0):
    """Scale degree (may exceed 4) to MIDI number above D4."""
    o, d = divmod(deg, 5)
    return 62 + 12 * (o + octave) + IN_SCALE[d]


def add(buf, start, sig):
    """Mix sig into buf at start, wrapping past the end so the loop is seamless."""
    n = len(buf)
    i = int(start) % n
    end = i + len(sig)
    if end <= n:
        buf[i:end] += sig
    else:
        k = n - i
        buf[i:] += sig[:k]
        rest = sig[k:]
        while len(rest):
            m = min(len(rest), n)
            buf[:m] += rest[:m]
            rest = rest[m:]


def drone(seconds, rng):
    t = np.arange(int(seconds * RATE)) / RATE
    swell = 0.75 + 0.25 * np.sin(2 * np.pi * t / seconds * 2)  # two slow swells per loop (loops cleanly)
    sig = np.zeros_like(t)
    for m, a in [(D2, .5), (D2 + 7, .28), (D2 + 12, .2)]:
        f = hz(m)
        sig += a * (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * 2 * f * t) + .12 * np.sin(2 * np.pi * 3 * f * t))
        sig += a * .5 * np.sin(2 * np.pi * (f * 1.003) * t)  # slow beating for warmth
    return sig * swell * .06


def flute(midi, dur, rng, bend_from=None, vib=5.2):
    n = int(dur * RATE)
    t = np.arange(n) / RATE
    f0 = hz(midi)
    f = np.full(n, f0)
    if bend_from is not None:  # meri/kari style slide into the note
        k = min(n, int(.18 * RATE))
        f[:k] = np.linspace(hz(bend_from), f0, k)
    depth = np.clip((t - .35) / .5, 0, 1) * .006  # vibrato grows on held notes
    f = f * (1 + depth * np.sin(2 * np.pi * vib * t))
    phase = 2 * np.pi * np.cumsum(f) / RATE
    tone = np.sin(phase) + .22 * np.sin(2 * phase) + .06 * np.sin(3 * phase)
    breath = np.convolve(rng.standard_normal(n), np.ones(12) / 12, 'same') * .35
    env = np.minimum(1, t / .12) * np.minimum(1, (dur - t) / .35)
    env *= 1 + .25 * np.exp(-t * 6)  # breathy attack (muraiki)
    return (tone * (1 - .2) + breath * np.exp(-t * 3) + breath * .25) * np.clip(env, 0, None) * .09


def pluck(midi, dur, rng, level=.08):
    """Karplus-Strong string, koto-like."""
    n = int(dur * RATE)
    p = max(2, int(RATE / hz(midi)))
    buf = rng.uniform(-1, 1, p)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * .996
    return out * level


def taiko(level, rng, dur=1.6):
    n = int(dur * RATE)
    t = np.arange(n) / RATE
    f = 52 * (1 + .9 * np.exp(-t * 18))  # pitch drops after the strike
    body = np.sin(2 * np.pi * np.cumsum(f) / RATE) * np.exp(-t * 3.2)
    skin = np.convolve(rng.standard_normal(n), np.ones(30) / 30, 'same') * np.exp(-t * 40) * .6
    return (body + skin) * level


def reverb(x):
    """Small feedback-delay reverb, wrapped so the tail continues into the loop start."""
    y = x.copy()
    for d, g in [(.113, .32), (.167, .26), (.241, .2), (.353, .15), (.47, .1)]:
        k = int(d * RATE)
        y += g * np.roll(x, k)
    return y


def compose(name, late, seconds, seed):
    rng = np.random.default_rng(seed)
    buf = np.zeros(int(seconds * RATE))
    buf += drone(seconds, rng) * (1.15 if late else 1)
    beat = 60 / (72 if late else 60)
    bars = int(round(seconds / (beat * 4)))
    # Lead phrases: (scale degree, beats). Rests are None. Written for this score.
    phrases = [
        [(4, 3), (3, 1), (2, 4), (None, 2), (1, 1), (2, 1), (3, 6), (None, 2)],
        [(5, 2), (4, 2), (3, 3), (1, 1), (2, 4), (None, 4)],
        [(2, 2), (3, 2), (5, 4), (6, 2), (5, 2), (4, 6), (None, 2)],
        [(3, 2), (2, 1), (1, 1), (0, 6), (None, 6)],
    ]
    pos = 0.0
    prev = None
    octave = 0 if not late else 1
    pi = 0
    while pos < seconds - 1:
        for deg, beats in phrases[pi % len(phrases)]:
            dur = beats * beat
            if deg is not None and pos < seconds:
                m = note(deg, octave - 1)
                add(buf, pos * RATE, flute(m, dur * .98, rng, bend_from=(m - 1 if prev is not None and rng.random() < .35 else None)))
                prev = m
            pos += dur
        pi += 1
    # Plucks: sparse in the opening; a steady ostinato late.
    if late:
        pattern = [0, 2, 1, 3, 0, 2, 4, 3]
        for i in range(int(seconds / (beat / 2))):
            m = note(pattern[i % 8], -2)
            add(buf, i * beat / 2 * RATE, pluck(m, 1.2, rng, .055 if i % 2 else .075))
    else:
        for bar in range(bars):
            if bar % 2 == 1:
                for k, deg in enumerate([0, 3, 2]):
                    add(buf, (bar * 4 + 1 + k * .5) * beat * RATE, pluck(note(deg, -1), 2.5, rng, .06))
    # Drum: emphasis only in the opening (start of every fourth bar); a slow pattern late.
    for bar in range(bars):
        if late:
            for b, lv in [(0, .34), (2, .18), (3.5, .12)]:
                add(buf, (bar * 4 + b) * beat * RATE, taiko(lv, rng))
            if bar % 4 == 3:
                add(buf, (bar * 4 + 3) * beat * RATE, taiko(.22, rng))
        elif bar % 4 == 0:
            add(buf, bar * 4 * beat * RATE, taiko(.26, rng))
            add(buf, (bar * 4 + .5) * beat * RATE, taiko(.12, rng))
    buf = reverb(buf)
    peak = np.max(np.abs(buf))
    buf = buf / peak * (.36 if late else .31)  # leave headroom; music sits under the effects
    pcm = (buf * 32767).astype(np.int16)
    wav = f'/tmp/{name}.wav'
    with wave.open(wav, 'wb') as w:
        w.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        w.writeframes(pcm.tobytes())
    out = f'{OUT}/{name}.mp3'
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '40k', out], check=True)
    os.remove(wav)
    rms = float(np.sqrt(np.mean(buf ** 2)))
    print(f'{out}: {seconds:.1f} s, {os.path.getsize(out)} bytes, RMS {rms:.3f}, peak {np.max(np.abs(buf)):.2f}')


os.makedirs(OUT, exist_ok=True)
# 60 bpm × 16 bars = 64 s; 72 bpm × 16 bars = 53.3 s (whole bars so the loop lands on a downbeat)
compose('battle', False, 64.0, 1600)
compose('battle_late', True, 16 * 4 * 60 / 72, 1601)
