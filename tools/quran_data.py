"""Quran text, tajweed annotations and audio timings.

Everything the build needs about the Quran lives behind this module:

* the full tajweed-annotated Madinah (Hafs/Uthmani) text, downloaded once
* per-verse details (words, glosses, page, juz, audio segments), fetched on
  demand and cached under build/cache/verses
* helpers that turn a (verse, word range) fragment into HTML

Source: the Quran.com public API (https://api.quran.com). Audio is Mahmoud
Khalil Al-Husary (Murattal), served from everyayah.com.
"""
from __future__ import annotations

import json
import re
import time
from difflib import SequenceMatcher
import urllib.request
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "build" / "cache"
VERSE_CACHE = CACHE / "verses"
AUDIO_CACHE = CACHE / "verse_audio"

API = "https://api.quran.com/api/v4"
RECITER_ID = 6  # Husary (Murattal) - segments match everyayah "Husary_128kbps"
AUDIO_URL = "https://everyayah.com/data/Husary_128kbps/{s:03d}{a:03d}.mp3"
UA = {"User-Agent": "tarteel-builder/1.0 (educational project)"}

TAG_RE = re.compile(r"<tajweed class=([a-z_]+)>(.*?)</tajweed>", re.S)
ANY_TAG_RE = re.compile(r"<[^>]+>")


def _get(url: str, binary: bool = False):
    last = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            return data if binary else json.loads(data.decode("utf8"))
        except Exception as exc:  # network hiccup: back off and retry
            last = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"GET failed: {url}: {last}")


@lru_cache(maxsize=1)
def chapters() -> dict[int, dict]:
    path = CACHE / "chapters.json"
    if not path.exists():
        path.write_text(json.dumps(_get(f"{API}/chapters?language=en")), "utf8")
    data = json.loads(path.read_text("utf8"))["chapters"]
    return {c["id"]: c for c in data}


# The source has one verse with a broken tag (an opening tag is missing).
SOURCE_FIXES = {"32:3": ("فْتَرَ>ٮٰ</tajweed>", "فْتَرَ<tajweed class=madda_normal>ٮٰ</tajweed>")}


@lru_cache(maxsize=1)
def full_tajweed() -> dict[str, str]:
    path = CACHE / "tajweed.json"
    if not path.exists():
        path.write_text(json.dumps(_get(f"{API}/quran/verses/uthmani_tajweed")), "utf8")
    out = {
        v["verse_key"]: v["text_uthmani_tajweed"]
        for v in json.loads(path.read_text("utf8"))["verses"]
    }
    for key, (bad, good) in SOURCE_FIXES.items():
        assert bad in out[key], f"source fix for {key} no longer applies"
        out[key] = out[key].replace(bad, good)
    return out


# --- the display text: KFGQPC's own encoding ---------------------------------
# The Quran.com text and the KFGQPC font use slightly different code points
# (e.g. U+0672 vs the dagger alif U+0670, stacked vs open tanween, the sukun
# shape, no tatweel before dagger alifs). The font draws a placeholder for
# some Quran.com code points, so we show KFGQPC's own published text and
# transfer the tajweed annotation onto it by character alignment.
KFGQPC_URL = "https://raw.githubusercontent.com/nuqayah/qpc-fonts/master/text-mushafs/UthmanicHafs_V22/UthmanicHafs%20v22.json"
STOP_SIGNS = set("ۖۗۘۙۚۛۜ")


@lru_cache(maxsize=1)
def kfgqpc_text() -> dict[str, str]:
    path = CACHE / "kfgqpc_v22.json"
    if not path.exists():
        path.write_bytes(_get(KFGQPC_URL, binary=True))
    rows = json.loads(path.read_text("utf8"))
    out, i = {}, 0
    for s in range(1, 115):
        for a in range(1, chapters()[s]["verses_count"] + 1):
            out[f"{s}:{a}"] = rows[i][0]
            i += 1
    assert i == len(rows) == 6236
    return out


def align_markup(tajweed_text: str, ktext: str) -> str:
    """Carry the class of every Quran.com character onto KFGQPC's text."""
    chars = _explode(END_RE.sub("", tajweed_text))
    qs = "".join(c for c, _ in chars)
    out: list[list] = []
    for tag, i1, i2, j1, j2 in SequenceMatcher(None, qs, ktext, autojunk=False).get_opcodes():
        if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
            out += [[ktext[j1 + d], chars[i1 + d][1]] for d in range(j2 - j1)]
        elif tag == "replace":
            cls = next((chars[d][1] for d in range(i1, i2) if chars[d][1]), None)
            out += [[c, cls] for c in ktext[j1:j2]]
            out += [chars[d] for d in range(i1, i2) if chars[d][0] in STOP_SIGNS and chars[d][0] not in ktext[j1:j2]]
        elif tag == "delete":  # source-only (tatweel, ZWNJ...): keep stop signs the font text omits
            out += [chars[d] for d in range(i1, i2) if chars[d][0] in STOP_SIGNS]
        else:  # insert: font-only mark, inherits the neighbouring class
            out += [[c, out[-1][1] if out else None] for c in ktext[j1:j2]]
    return _regroup(out)


@lru_cache(maxsize=None)
def display_tajweed(key: str) -> str:
    return align_markup(full_tajweed()[key], kfgqpc_text()[key])


END_RE = re.compile(r"\s*<span class=end>.*?</span>", re.S)


def split_words(tajweed_text: str) -> list[str]:
    """Split annotated text into words.

    Cross-word rules (idgham, ikhfa, iqlab...) are tagged as ONE span that
    contains the space between two words, so we split per character and
    re-open the tag on each side of the space.
    """
    chars = _explode(END_RE.sub("", tajweed_text))
    words, cur = [], []
    for ch, cls in chars:
        if ch.isspace():
            if cur:
                words.append(_regroup(cur))
            cur = []
        else:
            cur.append([ch, cls])
    if cur:
        words.append(_regroup(cur))
    return words


def plain(html: str) -> str:
    return ANY_TAG_RE.sub("", html)


def classes_in(word_markup: str) -> list[str]:
    return [c for c, _ in TAG_RE.findall(word_markup)]


def to_html(word_markup: str, colored: bool = True) -> str:
    """Annotated word -> HTML spans (or plain text when colored=False)."""
    if not colored:
        return plain(word_markup)
    return TAG_RE.sub(lambda m: f'<span class="tj tj-{m.group(1)}">{m.group(2)}</span>', word_markup)


# --- supplementary pass: natural madd on unmarked madd letters ---------------
# The mushaf only prints a sign where madd is longer than 2 counts (or a dagger
# alif/small waw/ya). Letters like the alif of قَالَ carry no sign, so the
# annotation leaves them uncolored. For teaching, we color them as natural madd.
FATHA, DAMMA, KASRA = "َ", "ُ", "ِ"
MADD_AFTER = {"ا": FATHA, "و": DAMMA, "ي": KASRA, "ى": None}  # alif, waw, ya, alef maqsura


def _is_mark(ch: str) -> bool:
    o = ord(ch)
    return 0x064B <= o <= 0x065F or o == 0x0670 or 0x06D6 <= o <= 0x06ED


OPEN_RE = re.compile(r"<tajweed class=([a-z_]+)>")


def _explode(markup: str) -> list[list]:
    """annotated word -> [[char, class-or-None], ...]

    Quran.com sometimes NESTS tags (a silent alif inside an obligatory-madd
    span), so this is a small stack parser; the innermost class wins.
    """
    out, stack, i = [], [], 0
    while i < len(markup):
        if markup[i] == "<":
            m = OPEN_RE.match(markup, i)
            if m:
                stack.append(m.group(1))
                i = m.end()
                continue
            if markup.startswith("</tajweed>", i):
                if stack:
                    stack.pop()
                i += len("</tajweed>")
                continue
        if markup[i] != ">":  # '>' never occurs in Quran text; ignore stray ones
            out.append([markup[i], stack[-1] if stack else None])
        i += 1
    return out


def _regroup(chars: list[list]) -> str:
    out, i = "", 0
    while i < len(chars):
        cls, j = chars[i][1], i
        while j < len(chars) and chars[j][1] == cls:
            j += 1
        text = "".join(c for c, _ in chars[i:j])
        out += text if cls is None else f"<tajweed class={cls}>{text}</tajweed>"
        i = j
    return out


def enrich_natural_madd(word_markup: str) -> str:
    chars = _explode(word_markup)
    for i, (ch, cls) in enumerate(chars):
        if cls is not None or ch not in MADD_AFTER or i == 0:
            continue
        prev = chars[i - 1][0]
        want = MADD_AFTER[ch] or (KASRA if ch == "ى" and prev == KASRA else FATHA if prev == FATHA else None)
        if prev != want:
            continue
        if i + 1 < len(chars) and _is_mark(chars[i + 1][0]):
            continue  # carries its own vowel/sukun/shadda/madd sign: not a plain madd letter
        chars[i][1] = "madda_normal"
    return _regroup(chars)


SYMBOL_ONLY = re.compile(r"^[۝۞۩\s]+$")


def is_symbol(text: str) -> bool:
    return bool(SYMBOL_ONLY.match(plain(text)))


def words_of(key: str, display: bool = False) -> list[str]:
    """Annotated words of a verse, with the supplementary natural-madd pass applied.

    display=False: Quran.com's encoding (used to match and validate examples).
    display=True:  KFGQPC's own encoding (used for everything the learner sees).

    Hizb/sajdah signs (۞ ۩) are not words: the audio timings skip them, so they
    are attached to the neighbouring word to keep word numbers aligned.
    """
    out, lead = [], ""
    for w in split_words(display_tajweed(key) if display else full_tajweed()[key]):
        if is_symbol(w):
            if out:
                out[-1] += " " + w
            else:
                lead = w + " "
        else:
            out.append(lead + enrich_natural_madd(w))
            lead = ""
    return out


def render(markups: list[str], mode: str = "color", marks: tuple = ()) -> str:
    """Render annotated words as HTML.

    color: every rule gets its color span.  plain: no coloring at all.
    mark:  uncolored, but letters whose class is in `marks` are underlined
           (used by 'identify' cards so color does not give the answer away).
    """
    def sub(m):
        cls, text = m.group(1), m.group(2)
        if mode == "color":
            return f'<span class="tj tj-{cls}">{text}</span>'
        if mode == "mark" and cls in marks:
            return f'<span class="tj-mark">{text}</span>'
        return text
    return " ".join(TAG_RE.sub(sub, w) for w in markups)


def verse(key: str) -> dict:
    """Cached verse details: words(+gloss), page, juz, audio segments."""
    s, a = key.split(":")
    path = VERSE_CACHE / f"{int(s):03d}_{int(a):03d}.json"
    if not path.exists():
        url = (
            f"{API}/verses/by_key/{key}?words=true&word_fields=text_uthmani"
            f"&word_translation_language=en&audio={RECITER_ID}"
            f"&fields=page_number,juz_number"
        )
        path.write_text(json.dumps(_get(url)["verse"], ensure_ascii=False), "utf8")
        time.sleep(0.15)
    return json.loads(path.read_text("utf8"))


def verse_audio_path(key: str) -> Path:
    s, a = (int(x) for x in key.split(":"))
    path = AUDIO_CACHE / f"{s:03d}{a:03d}.mp3"
    if not path.exists():
        path.write_bytes(_get(AUDIO_URL.format(s=s, a=a), binary=True))
        time.sleep(0.15)
    return path


def word_count(key: str) -> int:
    return len(words_of(key))


def surah_of(key: str) -> dict:
    return chapters()[int(key.split(":")[0])]


def segments(key: str) -> dict[int, tuple[int, int]]:
    """word position (1-based) -> (start_ms, end_ms) in the verse audio."""
    seg = (verse(key).get("audio") or {}).get("segments") or []
    return {int(s[1]): (int(s[2]), int(s[3])) for s in seg if len(s) >= 4}


def fragment(key: str, first: int, last: int, colored: bool = True) -> dict:
    """Everything a card needs about words first..last (1-based, inclusive) of a verse."""
    words = words_of(key, display=True)
    src = words_of(key)
    if len(words) != len(src):
        raise ValueError(f"{key}: KFGQPC text has {len(words)} words but Quran.com has {len(src)}")
    if not (1 <= first <= last <= len(words)):
        raise ValueError(f"{key}: word range {first}-{last} outside 1..{len(words)}")
    chosen = words[first - 1 : last]
    v = verse(key)
    api_words = [w for w in v["words"] if w["char_type_name"] == "word" and not is_symbol(w["text_uthmani"])]
    glosses = [
        (api_words[i]["translation"]["text"] or "").strip()
        for i in range(first - 1, last)
        if i < len(api_words)
    ]
    ch = surah_of(key)
    s, a = key.split(":")
    whole = first == 1 and last == len(words)
    return {
        "ref": key,
        "words": [first, last],
        "whole_verse": whole,
        "surah": int(s),
        "ayah": int(a),
        "surah_name": ch["name_simple"],
        "surah_arabic": ch["name_arabic"],
        "surah_meaning": ch["translated_name"]["name"],
        "page": v.get("page_number"),
        "juz": v.get("juz_number"),
        "markup": chosen,
        "html": render(chosen, "color"),
        "plain": " ".join(plain(w) for w in chosen),
        "plain_q": " ".join(plain(w) for w in src[first - 1 : last]),
        "classes": sorted({c for w in chosen for c, _ in TAG_RE.findall(w)}),
        "gloss": " · ".join(g for g in glosses if g),
    }
