# Genera los sonidos de la app (sin dependencias: solo la librería estándar).
# Uso: python3 scripts/generate-sounds.py
#
# refresh.wav: "tirar para recargar" en Inicio. Dos notas suaves que suben
# (como dos círculos que se encuentran), con un ataque corto y cola suave.

import math
import struct
import wave
from pathlib import Path

RATE = 44100
OUT = Path(__file__).resolve().parent.parent / "assets" / "sounds"


def tone(freq, start, length, volume):
    """Una nota con su envolvente: sube en 8 ms y se apaga en exponencial."""
    samples = []
    for i in range(int(length * RATE)):
        t = i / RATE
        attack = min(1.0, t / 0.008)
        decay = math.exp(-t * 9)
        # Fundamental y un armónico suave: suena a campanita, no a pitido
        wave_ = math.sin(2 * math.pi * freq * t) + 0.25 * math.sin(2 * math.pi * freq * 2 * t)
        samples.append((start, volume * attack * decay * wave_))
        start += 1
    return samples


def render(notes, length):
    total = [0.0] * int(length * RATE)
    for freq, at, dur, vol in notes:
        for index, value in tone(freq, int(at * RATE), dur, vol):
            if index < len(total):
                total[index] += value
    peak = max(abs(v) for v in total) or 1
    return [v / peak * 0.6 for v in total]  # margen para no saturar


def save(name, samples):
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / name), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(b"".join(struct.pack("<h", int(s * 32767)) for s in samples))
    print(f"✓ {name}")


# Mi5 y La5 (una cuarta, alegre), la segunda un poco después
save("refresh.wav", render([(659.25, 0.0, 0.35, 0.8), (880.0, 0.09, 0.4, 0.7)], 0.5))
