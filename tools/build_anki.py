"""Build the Anki decks from build/model.json (same cards as the website).

Output (dist/anki/):
  Tarteel-Complete.apkg           everything, as a deck tree
  Tarteel-Level-N-<slug>.apkg     one package per level
  Tarteel-Rule-Symbols.apkg       marks, stop signs and the color key

Deck tree:
  Tarteel
    Level N · <title>
      NN <lesson>            <- study just one rule
    Rule Symbols
      <group> / Color Key

Notes have stable GUIDs and decks have stable ids, so importing a newer
package updates cards in place and per-level packages merge into the tree.
"""
from __future__ import annotations

import hashlib
import json
import re
import shutil

import genanki

import quran_data as q

ROOT = q.ROOT
MODEL_JSON = ROOT / "build" / "model.json"
SITE = ROOT / "site"
DIST = ROOT / "dist" / "anki"
MEDIA = ROOT / "build" / "anki_media"
FONT_FILE = "_UthmanicHafs-v22.ttf"

AR_RUN = re.compile(r"(?:[؀-ۿݐ-ݿ‌]+(?:\s+(?=[؀-ۿݐ-ݿ]))?)+")


def esc(s: str) -> str:
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def rich(s: str) -> str:
    return AR_RUN.sub(lambda m: f'<span class="ar-inline">{m.group(0)}</span>', esc(s))


def deck_id(name: str) -> int:
    return (1 << 30) + int(hashlib.sha1(name.encode("utf8")).hexdigest()[:7], 16) % (1 << 30)


def css(legend: list[dict]) -> str:
    light = "\n".join(f".tj-{c['id']} {{ color: {c['light']}; }}\n.bg-{c['id']} {{ background: {c['light']}; }}" for c in legend)
    night = "\n".join(f".nightMode .tj-{c['id']} {{ color: {c['dark']}; }}\n.nightMode .bg-{c['id']} {{ background: {c['dark']}; }}" for c in legend)
    return f"""
@font-face {{ font-family: "KFGQPC Hafs"; src: url("{FONT_FILE}"); }}
.card {{ font-family: "Nunito", "Segoe UI", system-ui, -apple-system, sans-serif; font-size: 19px; line-height: 1.55; color: #2a2340; background: #fff7ec; text-align: center; padding: 10px; }}
.nightMode.card, .nightMode .card {{ color: #f3efff; background: #17132a; }}
.kind {{ font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: #655e7e; font-weight: 800; margin-bottom: 6px; }}
.nightMode .kind {{ color: #b9b0d2; }}
.verse {{ background: #ffffff; border: 2px solid #eadfcb; border-radius: 20px; padding: 8px 8px 12px; margin: 8px auto; max-width: 640px; }}
.nightMode .verse {{ background: #272047; border-color: #3d3463; }}
.ar {{ font-family: "KFGQPC Hafs", "Amiri Quran", "Traditional Arabic", serif; direction: rtl; font-size: 40px; line-height: 2.3; word-spacing: .06em; }}
.ar.sm {{ font-size: 30px; line-height: 2.1; }}
.ar-inline {{ font-family: "KFGQPC Hafs", "Amiri Quran", "Traditional Arabic", serif; direction: rtl; font-size: 1.3em; }}
.sign {{ font-family: "KFGQPC Hafs", "Amiri Quran", serif; direction: rtl; font-size: 84px; line-height: 1.7; }}
.label {{ font-weight: 800; font-size: 15px; margin-top: 2px; }}
.label .sar {{ font-family: "KFGQPC Hafs", "Amiri Quran", serif; font-size: 1.25em; font-weight: 400; }}
.tag {{ display: inline-block; background: #fff0b8; color: #2a2340; border-radius: 999px; padding: 0 9px; font-size: 12px; margin-inline-start: 4px; }}
.prompt {{ color: #655e7e; font-weight: 700; margin: 6px 0; }}
.nightMode .prompt {{ color: #b9b0d2; }}
.gloss {{ color: #655e7e; font-size: 15px; }}
.nightMode .gloss {{ color: #b9b0d2; }}
.answer {{ max-width: 640px; margin: 8px auto 0; }}
.note {{ background: #fff0c2; color: #2a2340; border-radius: 14px; padding: 6px 12px; font-size: 16px; margin: 8px auto; max-width: 640px; }}
.nightMode .note {{ background: #4a3f1c; color: #f3efff; }}
.chips {{ margin: 6px 0; }}
.chip {{ display: inline-block; background: #fffaf3; border: 2px solid #eadfcb; border-radius: 999px; padding: 0 10px; font-size: 14px; font-weight: 700; margin: 2px; color: #2a2340; }}
.nightMode .chip {{ background: #2d2652; border-color: #3d3463; color: #f3efff; }}
.chip .dot {{ display: inline-block; width: 11px; height: 11px; border-radius: 50%; margin-inline-end: 6px; }}
.options {{ font-weight: 800; margin: 8px 0; }}
.swatch {{ width: 92px; height: 92px; border-radius: 28px; margin: 8px auto; color: #fff; font-family: "KFGQPC Hafs", "Amiri Quran", serif; font-size: 52px; line-height: 92px; }}
.big {{ font-size: 24px; font-weight: 800; }}
hr#answer {{ border: 0; border-top: 2px dashed #eadfcb; margin: 12px auto; max-width: 640px; }}
{light}
{night}
"""


def build() -> None:
    m = json.loads(MODEL_JSON.read_text("utf8"))
    legend, lessons, frags = m["legend"], m["lessons"], m["frags"]
    legend_by = {c["id"]: c for c in legend}
    STYLE = css(legend)
    MEDIA.mkdir(parents=True, exist_ok=True)
    DIST.mkdir(parents=True, exist_ok=True)

    # ---- note types ---------------------------------------------------------
    recite = genanki.Model(
        1607392401, "Tarteel Recite",
        fields=[{"name": n} for n in ["Key", "Arabic", "ArabicMarked", "Label", "Gloss", "Audio", "Chips", "Note", "Lesson",
                                      "IdentifyPrompt", "Options", "AnswerRule", "AnswerSummary"]],
        templates=[
            {
                "name": "Recite",
                "qfmt": '<div class="kind">🎤 Recite aloud, then flip · {{Lesson}}</div><div class="verse"><div class="ar">{{Arabic}}</div><div class="label">{{Label}}</div></div>',
                "afmt": '{{FrontSide}}<hr id="answer"><div class="answer">{{Audio}}<div class="gloss">{{Gloss}}</div><div class="chips">{{Chips}}</div><div class="note">{{Note}}</div></div>',
            },
            {
                "name": "Identify the rule",
                "qfmt": '{{#IdentifyPrompt}}<div class="kind">Identify the rule · {{Lesson}}</div><div class="verse"><div class="ar">{{ArabicMarked}}</div><div class="label">{{Label}}</div></div><div class="prompt">{{IdentifyPrompt}} <small>(highlighted letters)</small></div><div class="options">{{Options}}</div>{{/IdentifyPrompt}}',
                "afmt": '{{FrontSide}}<hr id="answer"><div class="answer"><div class="verse"><div class="ar">{{Arabic}}</div></div><div class="big">{{AnswerRule}}</div><div>{{AnswerSummary}}</div>{{Audio}}<div class="chips">{{Chips}}</div><div class="note">{{Note}}</div></div>',
            },
        ],
        css=STYLE,
    )
    concept = genanki.Model(
        1607392402, "Tarteel Concept",
        fields=[{"name": n} for n in ["Key", "Question", "Answer", "Lesson"]],
        templates=[{
            "name": "Concept",
            "qfmt": '<div class="kind">Concept · {{Lesson}}</div><div class="big">{{Question}}</div>',
            "afmt": '{{FrontSide}}<hr id="answer"><div class="answer">{{Answer}}</div>',
        }],
        css=STYLE,
    )
    symbol = genanki.Model(
        1607392403, "Tarteel Symbol",
        fields=[{"name": n} for n in ["Key", "Glyph", "Name", "ArabicName", "Meaning", "Action", "Example", "Audio", "Group"]],
        templates=[
            {
                "name": "Sign to name",
                "qfmt": '<div class="kind">Symbol · {{Group}}</div><div class="prompt">What is this sign called, and what does it tell you to do?</div><div class="sign">{{Glyph}}</div>',
                "afmt": '{{FrontSide}}<hr id="answer"><div class="answer"><div class="big">{{Name}} <span class="ar-inline">{{ArabicName}}</span></div><div>{{Meaning}}</div><div><b>{{Action}}</b></div>{{Example}}{{Audio}}</div>',
            },
            {
                "name": "Name to sign",
                "qfmt": '<div class="kind">Symbol · {{Group}}</div><div class="prompt">Which sign is this?</div><div class="big">{{Name}} <span class="ar-inline">{{ArabicName}}</span></div><div>{{Meaning}}</div>',
                "afmt": '{{FrontSide}}<hr id="answer"><div class="sign">{{Glyph}}</div><div><b>{{Action}}</b></div>{{Example}}{{Audio}}',
            },
        ],
        css=STYLE,
    )
    color = genanki.Model(
        1607392404, "Tarteel Color",
        fields=[{"name": n} for n in ["Key", "Swatch", "Name", "ArabicName", "Short", "Lesson"]],
        templates=[
            {
                "name": "Color to rule",
                "qfmt": '<div class="kind">Color key</div><div class="prompt">Which tajweed rule uses this color?</div>{{Swatch}}',
                "afmt": '{{FrontSide}}<hr id="answer"><div class="answer"><div class="big">{{Name}}</div><div class="ar-inline">{{ArabicName}}</div><div><b>{{Short}}</b></div><div class="gloss">Lesson: {{Lesson}}</div></div>',
            },
            {
                "name": "Rule to color",
                "qfmt": '<div class="kind">Color key</div><div class="prompt">Which color does this rule use?</div><div class="big">{{Name}}</div><div class="ar-inline">{{ArabicName}}</div>',
                "afmt": '{{FrontSide}}<hr id="answer">{{Swatch}}<div><b>{{Short}}</b></div>',
            },
        ],
        css=STYLE,
    )

    # ---- decks & notes -------------------------------------------------------
    decks: dict[str, genanki.Deck] = {}
    pkg_of: dict[str, list[str]] = {}   # package name -> deck names
    media_for: dict[str, set[str]] = {}  # deck name -> media filenames

    def deck(name: str, desc: str = "") -> genanki.Deck:
        if name not in decks:
            decks[name] = genanki.Deck(deck_id(name), name, description=desc)
            media_for[name] = {FONT_FILE}
        return decks[name]

    def sound(fid: str, dname: str) -> str:
        fname = f"tarteel_{fid}.mp3"
        src = SITE / "audio" / f"{fid}.mp3"
        shutil.copyfile(src, MEDIA / fname)
        media_for[dname].add(fname)
        return f"[sound:{fname}]"

    def label(f: dict) -> str:
        return (f'Surah {esc(f["surah_name"])} <span class="sar">{esc(f["surah_arabic"])}</span> · Verse {f["ayah"]}'
                f'<span class="tag">{f["surah"]}:{f["ayah"]}</span>'
                + ('' if f["whole_verse"] else '<span class="tag">part of the verse</span>')
                + (f'<span class="tag">Mushaf p. {f["page"]}</span>' if f.get("page") else ""))

    def chips(classes: list[str]) -> str:
        return "".join(f'<span class="chip"><span class="dot bg-{c}"></span>{esc(legend_by[c]["name"])}</span>' for c in classes if c in legend_by)

    counts = {"recite": 0, "identify": 0, "concept": 0, "symbol": 0, "color": 0}
    level_decks: dict[int, list[str]] = {}
    cards_by_id = {c["id"]: c for c in m["cards"]}
    sym_by_id = {i["id"]: i for g in m["symbols"] for i in g["items"]}
    group_title = {g["id"]: g["title"] for g in m["symbols"]}

    for lv in m["levels"]:
        parent = f"Tarteel::Level {lv['level']} · {lv['title']}"
        deck(parent, lv["intro"])
        level_decks.setdefault(lv["level"], []).append(parent)
        for lid in lv["lessons"]:
            L = lessons[lid]
            if not L["cards"]:
                continue
            dname = f"{parent}::{L['n']:02d} {L['title']}"
            d = deck(dname, L["summary"])
            level_decks[lv["level"]].append(dname)
            tags = ["tarteel", f"level{lv['level']}", lid]
            by_frag: dict[str, dict] = {}
            for cid in L["cards"]:
                c = cards_by_id[cid]
                if c["t"] == "c":
                    d.add_note(genanki.Note(model=concept, guid=genanki.guid_for(cid), tags=tags + ["concept"],
                                            fields=[cid, rich(c["q"]), rich(c["a"]), esc(L["title"])]))
                    counts["concept"] += 1
                elif c["t"] == "r":
                    by_frag[c["f"]] = {"r": c}
                elif c["t"] == "i":
                    by_frag.setdefault(c["f"], {})["i"] = c
            for ex in L["examples"]:
                f = frags[ex["f"]]
                pair = by_frag[ex["f"]]
                ident = pair.get("i")
                options = " · ".join(esc(lessons[o]["title"]) for o in ident["opts"]) if ident else ""
                d.add_note(genanki.Note(
                    model=recite, guid=genanki.guid_for(pair["r"]["id"]), tags=tags + ["recite"] + (["identify"] if ident else []),
                    fields=[pair["r"]["id"], f["html"], ident["m"] if ident else "", label(f), esc(f["gloss"]), sound(ex["f"], dname),
                            chips(f["classes"]), rich(ex["note"]), esc(L["title"]),
                            esc(ident["prompt"]) if ident else "", options, esc(L["title"]), rich(L["summary"])]))
                counts["recite"] += 1
                counts["identify"] += 1 if ident else 0

    # symbols & colors
    sym_root = "Tarteel::Rule Symbols"
    deck(sym_root, "Every small sign in the Mushaf, and the tajweed color key.")
    sym_decks = [sym_root]
    for g in m["symbols"]:
        dname = f"{sym_root}::{g['title']}"
        d = deck(dname, g["blurb"])
        sym_decks.append(dname)
        for it in g["items"]:
            f = frags[it["f"]] if it.get("f") else None
            example = f'<div class="verse"><div class="ar sm">{f["html"]}</div><div class="label">{label(f)}</div></div>' if f else ""
            if f and it.get("note"):
                example += f'<div class="note">{rich(it["note"])}</div>'
            d.add_note(genanki.Note(model=symbol, guid=genanki.guid_for(f"s:{it['id']}"), tags=["tarteel", "symbol", g["id"]],
                                    fields=[f"s:{it['id']}", esc(it["glyph"]), esc(it["name"]), esc(it["arabic"]), rich(it["meaning"]), rich(it["action"]),
                                            example, sound(it["f"], dname) if f else "", esc(g["title"])]))
            counts["symbol"] += 1
    dname = f"{sym_root}::Color Key"
    d = deck(dname, "Which color means which rule.")
    sym_decks.append(dname)
    for c in legend:
        sw = f'<div class="swatch bg-{c["id"]}">{esc(c["sample"])}</div>'
        d.add_note(genanki.Note(model=color, guid=genanki.guid_for(f"k:{c['id']}"), tags=["tarteel", "color"],
                                fields=[f"k:{c['id']}", sw, esc(c["name"]), esc(c["arabic"]), esc(c["short"]), esc(lessons[c["lesson"]]["title"])]))
        counts["color"] += 1

    # ---- packages ------------------------------------------------------------
    (MEDIA / FONT_FILE).write_bytes((SITE / "fonts" / "UthmanicHafs-v22.ttf").read_bytes())

    def write(fname: str, names: list[str]) -> dict:
        pkg = genanki.Package([decks[n] for n in names])
        files = set()
        for n in names:
            files |= media_for[n]
        pkg.media_files = [str(MEDIA / f) for f in sorted(files)]
        out = DIST / fname
        pkg.write_to_file(str(out))
        mb = out.stat().st_size / 1e6
        return {"file": fname, "size": f"{mb:.1f} MB", "bytes": out.stat().st_size}

    for old in DIST.glob("*.apkg"):
        old.unlink()
    downloads = []
    all_names = [n for lvl in sorted(level_decks) for n in level_decks[lvl]] + sym_decks
    downloads.append({"title": "Complete course (everything)", **write("Tarteel-Complete.apkg", all_names)})
    for lv in m["levels"]:
        downloads.append({"title": f"Level {lv['level']} · {lv['title']}", **write(f"Tarteel-Level-{lv['level']}-{lv['slug']}.apkg", level_decks[lv["level"]])})
    downloads.append({"title": "Rule Symbols & Color Key", **write("Tarteel-Rule-Symbols.apkg", sym_decks)})

    # publish next to the website too
    dl = SITE / "downloads"
    if dl.exists():
        shutil.rmtree(dl)
    dl.mkdir(parents=True)
    for d_ in downloads:
        shutil.copyfile(DIST / d_["file"], dl / d_["file"])
    pub = [{"title": d_["title"], "file": d_["file"], "size": d_["size"]} for d_ in downloads]
    (SITE / "data" / "downloads.js").write_text("window.TARTEEL.downloads=" + json.dumps(pub, ensure_ascii=False) + ";\n", "utf8")

    total_cards = counts["recite"] + counts["identify"] + counts["concept"] + counts["symbol"] * 2 + counts["color"] * 2
    notes = counts["recite"] + counts["concept"] + counts["symbol"] + counts["color"]
    print(f"decks: {len(decks)}  notes: {notes}  cards: {total_cards}  {counts}")
    for d_ in downloads:
        print(f"  {d_['file']:48s} {d_['size']}")


if __name__ == "__main__":
    build()
