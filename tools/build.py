"""Run the whole pipeline:

    python tools/build.py             validate -> model -> audio -> site data -> Anki
    python tools/build.py --check     only validate the content against the Quran text
    python tools/build.py --force-audio   re-cut every audio clip

Network is only needed the first time (Quran text, timings, recitation are
cached in build/cache). ffmpeg must be on PATH for the audio step.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import build_anki  # noqa: E402
import build_audio  # noqa: E402
import build_model  # noqa: E402
import build_site  # noqa: E402
import curriculum  # noqa: E402


def main() -> None:
    curriculum.load()
    print("content OK: every example matches the Quran text and its rule")
    if "--check" in sys.argv:
        return
    model = build_model.build()
    print("model:", model["meta"]["counts"])
    if "--force-audio" in sys.argv:
        sys.argv.append("--force")
    build_audio.main()
    build_site.main()
    build_anki.build()
    # the dev-only preview page must never ship
    (HERE.parent / "site" / "_anki-preview.html").unlink(missing_ok=True)


if __name__ == "__main__":
    if subprocess.run(["ffmpeg", "-version"], capture_output=True).returncode != 0:
        raise SystemExit("ffmpeg is required (https://ffmpeg.org)")
    main()
