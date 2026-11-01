"""Cut one short mp3 clip per fragment from the verse recitation.

Per-word timings come from the Quran.com API; the cut is done with ffmpeg.
Clips land in site/audio/ and are reused (renamed) by the Anki build.
"""
from __future__ import annotations

import json
import subprocess
import sys

import quran_data as q

ROOT = q.ROOT
MODEL = ROOT / "build" / "model.json"
OUT = ROOT / "site" / "audio"


def cut(fid: str, frag: dict) -> str:
    key = f"{frag['surah']}:{frag['ayah']}"
    first, last = frag["words"]
    seg = q.segments(key)
    if not seg:
        raise SystemExit(f"{fid}: no segment timings for {key}")

    def start_of(pos: int) -> int:
        while pos not in seg and pos < max(seg):
            pos += 1
        return seg[pos][0]

    def end_of(pos: int) -> int:
        while pos not in seg and pos > min(seg):
            pos -= 1
        return seg[pos][1]

    n_words = q.word_count(key)
    start = start_of(first)
    end = end_of(last)
    start = max(0, start - (150 if first == 1 else 20))
    end = end + (250 if last == n_words else 40)
    dur = max(0.4, (end - start) / 1000)

    src = q.verse_audio_path(key)
    dst = OUT / f"{fid}.mp3"
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-ss", f"{start / 1000:.3f}", "-i", str(src), "-t", f"{dur:.3f}",
        "-af", f"afade=t=in:d=0.02,afade=t=out:st={max(0, dur - 0.06):.3f}:d=0.06",
        "-ac", "1", "-ar", "44100", "-b:a", "64k", str(dst),
    ]
    subprocess.run(cmd, check=True)
    return f"{dur:.1f}s"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    model = json.loads(MODEL.read_text("utf8"))
    frags = model["frags"]
    todo = [(fid, f) for fid, f in frags.items() if not (OUT / f"{fid}.mp3").exists() or "--force" in sys.argv]
    print(f"{len(frags)} fragments, {len(todo)} to cut")
    for i, (fid, f) in enumerate(todo, 1):
        d = cut(fid, f)
        if i % 20 == 0 or i == len(todo):
            print(f"  {i}/{len(todo)} {fid} {d}", flush=True)


if __name__ == "__main__":
    main()
