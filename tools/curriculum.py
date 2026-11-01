"""Load content/*.json, resolve every example against the real Quran text,
validate it, and return one fully-resolved model that the site and Anki
builders both consume.

Example specs in the content files look like:

    {"ref": "68:19", "at": "من ربك", "note": "..."}   # match words by consonant skeleton
    {"ref": "112:1", "all": true}                      # the whole verse
    {"ref": "1:2", "words": [3, 4]}                    # explicit 1-based word range

A lesson may declare `expect` (annotation classes that must appear in every
example) and/or `check` (a named text validator below), so a mistyped or
mis-picked example fails the build instead of teaching the wrong thing.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import quran_data as q

ROOT = q.ROOT
CONTENT = ROOT / "content"

MARKS = re.compile("[ً-ٰٟۖ-ۭ‌ـ]")
SKEL_MAP = str.maketrans({"ٱ": "ا", "أ": "ا", "إ": "ا", "آ": "ا", "ؤ": "و", "ئ": "ي", "ى": "ي", "ء": None, "ٮ": None})


def skeleton(text: str) -> str:
    """Consonant skeleton used to match typed Arabic against the verse.

    Alifs (and every hamza/alif variant) are dropped on both sides, because
    the mushaf writes many long 'aa' sounds as dagger alifs, not real letters.
    """
    return MARKS.sub("", q.plain(text)).translate(SKEL_MAP).replace("ا", "").replace("ٲ", "")


# --- named validators -------------------------------------------------------
THROAT = set("ءأإؤئهعحغخ")
SUKUN = "[ْۡ]"
STOPS = "[ۖ-ۜ‌]"


def _ws(frag_plain: str) -> list[str]:
    return [re.sub(STOPS, "", w) for w in frag_plain.split()]


def _first_letter(word: str) -> str:
    return MARKS.sub("", word).replace("ٱ", "ا")[:1]


def check_idhhar(plain: str) -> bool:
    ws = _ws(plain)
    for i, w in enumerate(ws):
        if re.search(f"ن{SUKUN}[ءأإؤئهعحغخ]", w):  # noon sakinah inside a word
            return True
        if i + 1 < len(ws) and (re.search(f"ن{SUKUN}$", w) or re.search("[ًٌٍ]ا?$", w)):
            if _first_letter(ws[i + 1]) in THROAT:
                return True
    return False


def check_idhhar_shafawi(plain: str) -> bool:
    ws = _ws(plain)
    return any(
        i + 1 < len(ws) and re.search(f"م{SUKUN}$", w) and _first_letter(ws[i + 1]) not in "بم"
        for i, w in enumerate(ws)
    )


def check_qamariyah(plain: str) -> bool:
    return any(re.search("ٱلْ[ءأإابجحخعغفقكمهوي]", w) or re.search("ٱل۟?[ءأإابجحخعغفقكمهوي]", w) for w in _ws(plain))


def check_lam_allah(plain: str) -> bool:
    return any(skeleton(w).endswith("لله") for w in plain.split())


def check_heavy(plain: str) -> bool:
    return any(c in skeleton(plain) for c in "خصضغطقظ")


def check_starts_wasl(plain: str) -> bool:
    return plain.lstrip().startswith("ٱ")


CHECKS = {
    "starts_wasl": check_starts_wasl,
    "idhhar": check_idhhar,
    "idhhar_shafawi": check_idhhar_shafawi,
    "qamariyah": check_qamariyah,
    "lam_allah": check_lam_allah,
    "heavy": check_heavy,
}


# --- resolution -------------------------------------------------------------
class ContentError(Exception):
    pass


def resolve_example(spec: dict, where: str) -> dict:
    key = spec["ref"]
    words = q.words_of(key)
    n = len(words)
    if spec.get("all"):
        first, last = 1, n
    elif "words" in spec:
        first, last = spec["words"]
    else:
        target = [skeleton(w) for w in spec["at"].split()]
        sk = [skeleton(w) for w in words]
        hits = [i for i in range(n - len(target) + 1) if sk[i : i + len(target)] == target]
        if not hits:
            raise ContentError(f"{where}: {key} has no words matching '{spec['at']}'. Skeleton words: {' '.join(sk)}")
        nth = spec.get("nth", 1) - 1
        if nth >= len(hits):
            raise ContentError(f"{where}: {key} '{spec['at']}' occurrence #{nth + 1} not found")
        first = hits[nth] + 1
        last = first + len(target) - 1
    frag = q.fragment(key, first, last)
    frag["note"] = spec.get("note", "")
    frag["id"] = f"{frag['surah']:03d}{frag['ayah']:03d}_{first:03d}-{last:03d}"
    frag["audio"] = f"audio/{frag['id']}.mp3"
    frag["label"] = f"{frag['surah_name']} {key}"
    frag["label_long"] = f"Surah {frag['surah_name']} ({frag['surah']}) · Verse {frag['ayah']}"
    if not frag["whole_verse"]:
        frag["label_long"] += " · part of the verse"
    return frag


def _validate(lesson: dict, ex: dict, where: str) -> None:
    expect = lesson.get("expect")
    if expect and not set(expect) & set(ex["classes"]):
        raise ContentError(f"{where}: {ex['ref']} words {ex['words']} has classes {ex['classes']}, expected one of {expect}\n   text: {ex['plain_q']}")
    chk = lesson.get("check")
    if chk == "verse_end":
        if ex["words"][1] != q.word_count(ex["ref"]):
            raise ContentError(f"{where}: {ex['ref']} fragment must end at the end of the verse (words {ex['words']})")
    elif chk and not CHECKS[chk](ex["plain_q"]):
        raise ContentError(f"{where}: {ex['ref']} words {ex['words']} fails check '{chk}'\n   text: {ex['plain_q']}")


def load() -> dict:
    legend = json.loads((CONTENT / "legend.json").read_text("utf8"))
    legend_ids = {c["id"] for c in legend["classes"]}
    levels, errors, seen_lessons = [], [], set()
    for path in sorted((CONTENT / "levels").glob("level-*.json")):
        lvl = json.loads(path.read_text("utf8"))
        for lesson in lvl["lessons"]:
            lid = lesson["id"]
            if lid in seen_lessons:
                errors.append(f"duplicate lesson id {lid}")
            seen_lessons.add(lid)
            if re.search("[\u0600-\u06FF]", lesson["title"]):
                errors.append(f"{lid}: title must not contain Arabic (headings are tracked mono, which breaks joining); use the 'arabic' field")
            for c in lesson.get("colors", []) + lesson.get("expect", []):
                if c not in legend_ids:
                    errors.append(f"{lid}: unknown color class '{c}'")
            for kind in ("examples", "showcase"):
                resolved = []
                for n, spec in enumerate(lesson.get(kind, []), 1):
                    where = f"L{lvl['level']}/{lid}/{kind}#{n}"
                    try:
                        ex = resolve_example(spec, where)
                        if kind == "examples":
                            _validate(lesson, ex, where)
                        resolved.append(ex)
                    except (ContentError, KeyError, ValueError) as exc:
                        errors.append(str(exc) if isinstance(exc, ContentError) else f"{where}: {exc!r} spec={spec}")
                lesson[kind] = resolved
            lesson["level"] = lvl["level"]
        levels.append(lvl)
    symbols = json.loads((CONTENT / "symbols.json").read_text("utf8"))
    for grp in symbols["groups"]:
        for item in grp["items"]:
            if "example" in item:
                where = f"symbol/{item['id']}"
                try:
                    item["example"] = resolve_example(item["example"], where)
                except (ContentError, KeyError, ValueError) as exc:
                    errors.append(str(exc))
    if errors:
        print("\n".join(f"  ✗ {e}" for e in errors), file=sys.stderr)
        raise SystemExit(f"{len(errors)} content error(s)")
    return {"legend": legend, "levels": levels, "symbols": symbols}


if __name__ == "__main__":
    model = load()
    total = sum(len(ls.get("examples", [])) for lv in model["levels"] for ls in lv["lessons"])
    print(f"OK: {len(model['levels'])} levels, {sum(len(l['lessons']) for l in model['levels'])} lessons, {total} examples")
