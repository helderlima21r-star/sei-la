# Trilha original estilo "SaaS / tech" sintetizada do zero (sem samples de terceiros).
# Sincronizada com os tempos do video.html. Uso: python3 make_music.py trilha.wav
import sys, wave
import numpy as np

SR = 44100
DUR = 79.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
BPM = 112
BEAT = 60 / BPM
BAR = BEAT * 4
G = 5.6  # entrada da batida (o celular aparece)

L = np.zeros(N); R = np.zeros(N)            # mix seco
SL = np.zeros(N); SR_ = np.zeros(N)          # envio para reverb
duck = np.ones(N)                            # sidechain

def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def idx(t): return int(round(t * SR))

def add(buf, start, sig):
    i = idx(start)
    if i >= N: return
    j = min(N, i + len(sig))
    if i < 0: sig = sig[-i:]; i = 0
    buf[i:j] += sig[:j - i]

def put(start, sig, pan=0.0, send=0.0, gain=1.0):
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    s = sig * gain
    add(L, start, s * gl); add(R, start, s * gr)
    if send:
        add(SL, start, s * gl * send); add(SR_, start, s * gr * send)

def onepole_lp(x, cutoff):
    # cutoff pode ser escalar ou vetor (varredura)
    c = np.broadcast_to(np.asarray(cutoff, float), x.shape)
    a = np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x); z = 0.0
    for i in range(len(x)):
        z = (1 - a[i]) * x[i] + a[i] * z
        y[i] = z
    return y

def bandnoise(n, lo, hi):
    x = rng.standard_normal(n)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(X, n)
    return y / (np.abs(y).max() + 1e-9)

# ---------------- harmonia ----------------
CHORDS = [  # Am, Fmaj7, Cadd9, G
    {'pad': [57, 60, 64, 69], 'bass': 33, 'arp': [69, 72, 76, 79]},
    {'pad': [53, 57, 60, 64], 'bass': 29, 'arp': [65, 69, 72, 76]},
    {'pad': [55, 60, 64, 67], 'bass': 36, 'arp': [67, 72, 74, 79]},
    {'pad': [55, 59, 62, 67], 'bass': 31, 'arp': [67, 71, 74, 79]},
]
def chord_at(t):
    if t >= G + 32 * BAR: return CHORDS[2]
    return CHORDS[int(np.floor((t - G) / BAR)) % 4]

# ---------------- instrumentos ----------------
def pad_note(freq, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    y = np.zeros(n)
    for det in (-0.006, 0.0, 0.0055):
        f = freq * (1 + det)
        for h in range(1, 10):
            y += np.sin(2 * np.pi * f * h * t + h * 1.3 + det * 900) / h ** 1.6
    a = np.minimum(1, t / 0.5); r = np.minimum(1, (dur - t) / 0.6)
    lfo = 1 + 0.08 * np.sin(2 * np.pi * 0.25 * t)
    return y * a * np.clip(r, 0, 1) * lfo

def pluck(freq, dur=0.6):
    n = int(dur * SR); t = np.arange(n) / SR
    env = np.exp(-t / 0.16) * np.minimum(1, t / 0.003)
    return (np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(4 * np.pi * freq * t) * np.exp(-t / 0.05) + 0.12 * np.sin(6 * np.pi * freq * t)) * env

def bell(freq, dur=2.0):
    n = int(dur * SR); t = np.arange(n) / SR
    env = np.exp(-t / 0.7) * np.minimum(1, t / 0.004)
    return (np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t / 0.3) + 0.2 * np.sin(2 * np.pi * freq * 5.4 * t) * np.exp(-t / 0.12)) * env

def bass_note(freq, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    env = np.minimum(1, t / 0.005) * (0.65 + 0.35 * np.exp(-t / 0.08)) * np.clip((dur - t) / 0.03, 0, 1)
    return (np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(4 * np.pi * freq * t)) * env

def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 46 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.22) + 0.15 * rng.standard_normal(n) * np.exp(-t / 0.004)

CLAP = bandnoise(int(0.35 * SR), 900, 5000)
_t = np.arange(len(CLAP)) / SR
CLAP = CLAP * (np.exp(-_t / 0.09) + 0.6 * np.exp(-np.maximum(0, _t - 0.012) / 0.01) * (_t > 0.012))
HAT = bandnoise(int(0.05 * SR), 7000, 16000) * np.exp(-np.arange(int(0.05 * SR)) / SR / 0.012)
OHAT = bandnoise(int(0.25 * SR), 6000, 16000) * np.exp(-np.arange(int(0.25 * SR)) / SR / 0.07)

def riser(start, end, gain=0.5):
    n = int((end - start) * SR); t = np.arange(n) / SR; k = t / t[-1]
    noise = rng.standard_normal(n)
    y = onepole_lp(noise, 300 + 9000 * k ** 2) * k ** 2.2
    f = 220 + 900 * k ** 2
    y += 0.25 * np.sin(2 * np.pi * np.cumsum(f) / SR) * k ** 2
    put(start, y, send=0.5, gain=gain)

def impact(at, gain=0.9):
    n = int(2.5 * SR); t = np.arange(n) / SR
    f = 38 + 60 * np.exp(-t / 0.08)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.6)
    crash = bandnoise(n, 3000, 15000) * np.exp(-t / 0.9) * 0.35
    put(at, boom * gain)
    put(at, crash * gain, send=0.8)

def click(at):
    n = int(0.03 * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.006) + 0.3 * rng.standard_normal(n) * np.exp(-t / 0.002)
    put(at, y, gain=0.12, send=0.2)

# ---------------- arranjo ----------------
# pad: do começo ao fim (um acorde por compasso)
FINAL = G + 32 * BAR  # acorde final (C), no tempo do compasso
for b in np.arange(G - 3 * BAR, FINAL, BAR):
    s0 = max(b, 0.0)
    c = chord_at(b + 0.01)
    dur = b + BAR + 0.6 - s0
    for i, m in enumerate(c['pad']):
        put(s0, pad_note(mtof(m), dur), pan=(i - 1.5) * 0.35, send=0.6, gain=0.022)
for i, m in enumerate(CHORDS[2]['pad'] + [48]):
    put(FINAL, pad_note(mtof(m), DUR - FINAL), pan=(i - 2) * 0.3, send=0.7, gain=0.024)

# sinos na abertura
for i, (tt, m) in enumerate([(0.5, 76), (1.6, 79), (2.5, 84), (3.3, 81), (4.2, 88)]):
    put(tt, bell(mtof(m)), pan=(-0.4 if i % 2 else 0.4), send=0.8, gain=0.09)
riser(3.4, 5.6, 0.32)
impact(5.6, 0.8)

def beats(a, b, step=BEAT, offset=0.0):
    k0 = int(np.ceil((a - G - offset) / step - 1e-9))
    t = G + offset + k0 * step
    out = []
    while t < b - 1e-6:
        out.append(t); t += step
    return out

DRUMS_END = 70.4
BREAK = (63.6, 64.4)
def in_break(t): return BREAK[0] <= t < BREAK[1]

K = kick()
for t in beats(G, DRUMS_END):
    if in_break(t): continue
    put(t, K, gain=0.55)
    n = int(0.3 * SR); tt = np.arange(n) / SR
    i = idx(t); j = min(N, i + n)
    duck[i:j] = np.minimum(duck[i:j], 1 - 0.55 * np.exp(-tt[:j - i] / 0.11))

# baixo em colcheias
for t in beats(G, DRUMS_END, BEAT / 2):
    if in_break(t): continue
    c = chord_at(t + 0.01)
    put(t, bass_note(mtof(c['bass'] + 12), BEAT / 2 * 0.92), gain=0.20)

# arpejo (pluck) em colcheias, com eco pontuado
PAT = [0, 1, 2, 3, 2, 1, 3, 2]
arp_times = beats(G, 76.0, BEAT / 2)
for k, t in enumerate(arp_times):
    if in_break(t): continue
    c = chord_at(t + 0.01)
    m = c['arp'][PAT[k % 8]]
    g = 0.075 if t < 70.6 else 0.055 * max(0, 1 - (t - 72) / 4)
    if g <= 0: continue
    pan = 0.25 if k % 2 else -0.25
    put(t, pluck(mtof(m)), pan=pan, send=0.35, gain=g)
    put(t + BEAT * 0.75, pluck(mtof(m)), pan=-pan * 2.4, send=0.5, gain=g * 0.35)

# palmas e chimbais a partir do checklist
for t in beats(16.7, DRUMS_END):
    k = int(round((t - G) / BEAT))
    if in_break(t): continue
    if k % 2 == 1: put(t, CLAP, send=0.4, gain=0.16)
for t in beats(10.6, DRUMS_END, BEAT, BEAT / 2):
    if in_break(t): continue
    put(t, OHAT if t > 16.7 else HAT, pan=0.2, gain=0.07 if t > 16.7 else 0.08)
for t in beats(16.7, DRUMS_END, BEAT / 4):
    if in_break(t): continue
    k = int(round((t - G) / (BEAT / 4)))
    if k % 2 == 1: put(t, HAT, pan=-0.3, gain=0.035)

# transições
riser(62.2, 64.4, 0.25)
impact(64.4, 0.55)
riser(69.0, 70.8, 0.3)
impact(70.8, 0.8)
for i, (tt, m) in enumerate([(71.7, 84), (73.1, 88), (G + 32 * BAR, 91)]):
    put(tt, bell(mtof(m), 3.0), pan=(0.3 if i % 2 else -0.3), send=0.9, gain=0.08)

# toques na tela (mesmos tempos do vídeo)
TS = [16.7, 21.7, 26.7, 31.7, 36.7]
for t in [9.9, 16.3] + [x + 4.5 for x in TS] + [45.3, 46.5, 48.4, 51.2, 53.7, 60.3]:
    click(t)

# ---------------- reverb + master ----------------
def reverb(x, seed):
    n = int(2.2 * SR); t = np.arange(n) / SR
    ir = np.random.default_rng(seed).standard_normal(n) * np.exp(-t / 0.55)
    ir = onepole_lp(ir, 6000); ir /= np.sqrt((ir ** 2).sum())
    m = 1 << int(np.ceil(np.log2(len(x) + n)))
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[:len(x)]

# o sidechain vale para pad/baixo: aplica no mix inteiro de leve (efeito "pumping")
pump = 0.5 + 0.5 * duck
L *= pump; R *= pump
L += reverb(SL, 1) * 0.55; R += reverb(SR_, 2) * 0.55

t = np.arange(N) / SR
fade = np.clip(t / 0.4, 0, 1) * np.clip((DUR - 0.2 - t) / 3.0, 0, 1)
mix = np.stack([L, R], 1) * fade[:, None]
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
mix *= 0.89 / np.abs(mix).max()
pcm = (mix * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', sys.argv[1])
