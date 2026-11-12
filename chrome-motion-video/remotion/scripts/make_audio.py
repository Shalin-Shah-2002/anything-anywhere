"""Build the 30 s soundtrack for the Chrome × Gemini spot.

A quiet synthesized bed (tension drone under SC 01, then a pad in D major that changes chord on
every cut, with a soft eighth-note pluck at 120 BPM) plus bundled Pixabay sound effects, each cued
to a visible action. Output: public/audio/mix.wav (48 kHz stereo, loudness-normalized to -15 LUFS).

Run from the remotion/ directory:  python3 scripts/make_audio.py
"""

import json
import math
import os
import subprocess

import numpy as np

SR = 48_000
FPS = 60
LENGTH = 30.0
N = int(LENGTH * SR)
HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(HERE, "..", "public")
SFX_DIR = os.path.join(PUBLIC, "audio", "sfx")
rng = np.random.default_rng(7)

# ---- timeline (frames at 60 fps; mirrors src/timeline.ts) -----------------------------------
T = 24
START = {"problem": 0, "reveal": 230, "ask": 396, "tabs": 592, "aimode": 788, "autobrowse": 984,
         "more": 1210, "safety": 1386, "endcard": 1572}
SEAM_MID = {k: (v + T / 2) / FPS for k, v in START.items() if k not in ("problem", "reveal")}
REVEAL = START["reveal"] / FPS  # 3.833 s


def f2s(frame):
    return frame / FPS


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def pan(sig, p):
    """Equal-power pan, p in [-1, 1]."""
    a = (p + 1) * math.pi / 4
    return np.stack([sig * math.cos(a), sig * math.sin(a)], axis=1)


def place(buf, clip, at_s, gain=1.0):
    i = int(round(at_s * SR))
    if i < 0:
        clip = clip[-i:]
        i = 0
    j = min(len(buf), i + len(clip))
    if j > i:
        buf[i:j] += clip[: j - i] * gain


# ---- bed ------------------------------------------------------------------------------------
t = np.arange(N) / SR
bed = np.zeros((N, 2))

# SC 01 tension: a low D drone with a slow beat, rising filtered noise, ticking eighths.
seg = (t < REVEAL - 0.3)
drone = (np.sin(2 * np.pi * midi(38) * t) + 0.6 * np.sin(2 * np.pi * midi(45) * 1.003 * t)) * 0.06
drone *= smooth(t / 0.4) * (1 - smooth((t - (REVEAL - 0.7)) / 0.4))
bed += pan(drone * seg, 0)

noise = rng.standard_normal(N)
cut = 200 + 2600 * np.clip(t / 3.4, 0, 1) ** 2
y = np.zeros(N)
acc = 0.0
alpha = 1 - np.exp(-2 * np.pi * cut / SR)
for k in range(int((REVEAL + 0.1) * SR)):
    acc += alpha[k] * (noise[k] - acc)
    y[k] = acc
swell = y * 0.07 * np.clip(t / 3.3, 0, 1) ** 2 * (1 - smooth((t - 3.35) / 0.12))
bed += pan(swell, 0.0)

for k8 in range(int(3.3 / 0.25)):  # ticks
    at = 0.25 + k8 * 0.25
    tick = rng.standard_normal(int(0.03 * SR)) * np.exp(-np.arange(int(0.03 * SR)) / (0.004 * SR))
    tick = np.diff(tick, prepend=0)  # crude high-pass
    place(bed, pan(tick, 0.4 if k8 % 2 else -0.4), at, 0.035 + 0.05 * (at / 3.3))

# After the reveal: a pad that changes chord on every cut.
CHORDS = [
    (REVEAL, [50, 57, 61, 64, 66]),                 # Dmaj9
    (SEAM_MID["ask"], [47, 54, 57, 61, 62]),         # Bm9
    (SEAM_MID["tabs"], [43, 50, 54, 57, 59]),        # Gmaj9
    (SEAM_MID["aimode"], [45, 52, 54, 59, 61]),      # A6/9
    (SEAM_MID["autobrowse"], [50, 57, 61, 64, 66]),  # Dmaj9
    (SEAM_MID["more"], [47, 54, 57, 62, 64]),        # Bm11
    (SEAM_MID["safety"], [43, 50, 54, 59, 61]),      # Gmaj7#11
    (SEAM_MID["endcard"], [50, 57, 62, 64, 66]),     # Dadd9, held to the end
]


def pad_note(freq, t0, t1, amp):
    n0 = int(max(0, t0 - 0.05) * SR)
    n1 = min(N, int((t1 + 1.0) * SR))
    tt = np.arange(n1 - n0) / SR + (n0 / SR)
    local = tt - t0
    env = smooth(local / 0.45) * (1 - smooth((tt - t1) / 0.9))
    out = np.zeros((n1 - n0, 2))
    for det, p in ((-6, -0.55), (6, 0.55), (0, 0.0)):
        f = freq * 2 ** (det / 1200)
        ph = rng.uniform(0, 2 * np.pi, 12)
        v = sum(np.sin(2 * np.pi * f * h * tt + ph[h - 1]) / h ** 1.5 for h in range(1, 11) if f * h < 6000)
        out += pan(v * env * amp, p)
    bed[n0:n1] += out


for i, (t0, notes) in enumerate(CHORDS):
    t1 = CHORDS[i + 1][0] if i + 1 < len(CHORDS) else LENGTH
    for n in notes:
        pad_note(midi(n), t0, t1, 0.020)
    pad_note(midi(notes[0] - 12), t0, t1, 0.028)  # soft sub under the root

# Eighth-note pluck at 120 BPM from the reveal to the end card.
PATTERN = [0, 2, 4, 3, 1, 2, 4, 3]
step = 0.25
k = 0
at = REVEAL + 0.5
while at < SEAM_MID["endcard"] - 0.1:
    notes = [c for c in CHORDS if c[0] <= at][-1][1]
    note = notes[PATTERN[k % 8]] + 12
    L = int(0.6 * SR)
    tt = np.arange(L) / SR
    f = midi(note)
    pl = (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt) + 0.08 * np.sin(6 * np.pi * f * tt))
    pl *= np.exp(-tt / 0.16) * smooth(tt / 0.004)
    vel = 1.0 if k % 4 == 0 else 0.7
    fade_in = smooth((at - REVEAL - 0.5) / 2.0)
    place(bed, pan(pl, 0.35 if k % 2 else -0.35), at, 0.05 * vel * (0.35 + 0.65 * fade_in))
    place(bed, pan(pl, -0.35 if k % 2 else 0.35), at + 0.375, 0.015 * vel)  # dotted-eighth echo
    k += 1
    at += step

# Reverb: convolution with decaying stereo noise (about 2 s).
IRL = int(2.2 * SR)
it = np.arange(IRL) / SR
ir = rng.standard_normal((IRL, 2)) * np.exp(-it / 0.42)[:, None]
ir /= np.sqrt((ir ** 2).sum(axis=0))
size = 1 << int(math.ceil(math.log2(N + IRL)))
wet = np.stack([np.fft.irfft(np.fft.rfft(bed[:, c], size) * np.fft.rfft(ir[:, c], size), size)[:N] for c in range(2)], axis=1)
bed = bed * 0.8 + wet * 0.55

# Quiet beat before the payoff, then the final fade.
duck = 1 - 0.85 * smooth((t - 3.45) / 0.15) * (1 - smooth((t - REVEAL) / 0.05))
fade = 1 - smooth((t - 28.4) / 1.6)
bed *= (duck * fade)[:, None]

# ---- sound effects --------------------------------------------------------------------------


def load(name, rate=1.0):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(SFX_DIR, name + ".mp3"), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    if rate != 1.0:  # a varispeed take: higher and shorter, or lower and longer
        src = np.arange(len(x))
        dst = np.arange(0, len(x) - 1, rate)
        x = np.stack([np.interp(dst, src, x[:, c]) for c in range(2)], axis=1)
    return x


def hit(x, decay):
    tt = np.arange(len(x)) / SR
    return x * np.exp(-tt / decay)[:, None]


sfx = np.zeros((N, 2))
cues = []


def cue(name, at, gain, peak_offset=0.0, rate=1.0, decay=None, why=""):
    x = load(name, rate)
    if decay:
        x = hit(x, decay)
    start = at - peak_offset / rate + 1 / FPS  # the sound lands one frame after its picture
    place(sfx, x, start, gain)
    cues.append({"sfx": name, "rate": rate, "picture_s": round(at, 3), "gain": gain, "why": why})


# SC 01 (HyperFrames): popups and the implosion
cue("pop", 0.72 + 0.1, 0.55, 0.122, why="notification prompt lands")
cue("pop", 1.18 + 0.1, 0.5, 0.122, rate=0.9, why="checkout form lands")
cue("glitch-1", 2.06 + 0.1, 0.32, 0.217, why="fake virus alert")
cue("pop", 2.32 + 0.1, 0.45, 0.122, rate=1.12, why="fake prize popup")
cue("riser", REVEAL - 0.05, 0.28, 4.1, why="build into the implosion")
# SC 02: the reveal
cue("impact-bass-1", REVEAL + 2 / FPS, 0.30, 0.048, decay=0.5, why="dot bursts into Chrome")
cue("sparkle", f2s(START["reveal"] + 92), 0.30, 0.022, why="Gemini line appears")
# Seams: rotate takes so no two cuts sound alike
cue("whoosh", SEAM_MID["ask"], 0.42, 0.165, rate=1.0, why="zoom-blur into SC 03")
cue("whoosh", SEAM_MID["tabs"], 0.40, 0.165, rate=0.86, why="whip into SC 04")
cue("whoosh", SEAM_MID["aimode"], 0.40, 0.165, rate=1.14, why="zoom-blur into SC 05")
cue("whoosh", SEAM_MID["autobrowse"], 0.40, 0.165, rate=0.93, why="whip into SC 06")
cue("whoosh", SEAM_MID["more"], 0.36, 0.165, rate=0.8, why="SC 06 recedes")
cue("whoosh", SEAM_MID["safety"], 0.40, 0.165, rate=1.07, why="zoom-blur into SC 08")
cue("whoosh-cinematic", SEAM_MID["endcard"], 0.26, 2.45, why="Chrome-colour wipe into the end card")
# SC 06: checklist ticks
cue("click-soft", f2s(START["autobrowse"] + 78), 0.55, 0.053, why="tick: finds the supplies")
cue("click-soft", f2s(START["autobrowse"] + 196), 0.55, 0.053, rate=1.1, why="tick: adds to cart")
cue("pop", f2s(START["autobrowse"] + 214), 0.4, 0.122, rate=0.85, why="amber: asks before buying")
# SC 07: four cards land
for i, r in enumerate([1.0, 1.08, 0.95, 1.15]):
    cue("pop", f2s(START["more"] + 14 + i * 7 + 8), 0.30, 0.122, rate=r, why=f"card {i + 1} lands")
# SC 08: alert swings in, stat lands
cue("whoosh", f2s(START["safety"] + 38), 0.22, 0.165, rate=1.3, why="malware alert swings in")
cue("pop", f2s(START["safety"] + 92), 0.4, 0.122, why="stat chip lands")
# SC 09 (HyperFrames end card)
cue("impact-bass-2", f2s(START["endcard"]) + 0.42, 0.14, 0.024, decay=0.6, why="Chrome logo lands")
cue("sparkle", f2s(START["endcard"]) + 1.3, 0.28, 0.022, why="Gemini line")
cue("pop", f2s(START["endcard"]) + 1.66, 0.45, 0.122, why="URL button")

mix = bed + sfx
mix *= (1 - smooth((t - 29.6) / 0.4))[:, None]

# ---- write + loudness-normalize -------------------------------------------------------------
os.makedirs(os.path.join(PUBLIC, "audio"), exist_ok=True)
raw_path = os.path.join(PUBLIC, "audio", "mix_raw.wav")
out_path = os.path.join(PUBLIC, "audio", "mix.wav")
pcm = np.clip(mix, -1, 1)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", raw_path],
               input=pcm.astype(np.float64).tobytes(), check=True)

probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw_path, "-af", "loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
m = json.loads(probe[probe.rindex("{"):probe.rindex("}") + 1])
af = (f"loudnorm=I=-15:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
      f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw_path, "-af", af, "-ar", str(SR), "-c:a", "pcm_s16le", out_path], check=True)
os.remove(raw_path)

with open(os.path.join(PUBLIC, "audio", "cues.json"), "w") as fh:
    json.dump({"length_s": LENGTH, "bed": "synthesized (scripts/make_audio.py)", "cues": cues}, fh, indent=2)
print("raw loudness", m["input_i"], "LUFS, true peak", m["input_tp"], "dBTP")
print("wrote", out_path, "with", len(cues), "cues")
