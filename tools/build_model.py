"""Resolve the curriculum into one model (build/model.json) used by both the
website and the Anki builders.

Cards are generated here, once, so the two deliverables always agree:

  recite    show a (colored) fragment; learner recites, flips, listens
  identify  show the same fragment uncolored with the target letters
            underlined; learner names the rule, then flips
  concept   question / answer about the rule itself
  symbol    a Mushaf sign -> its name and what to do
  color     a color swatch -> which rule it means
"""
from __future__ import annotations

import json
import re
from datetime import date

import curriculum
import quran_data as q

ROOT = q.ROOT
OUT = ROOT / "build" / "model.json"


def _strip(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def build() -> dict:
    cur = curriculum.load()
    legend = cur["legend"]["classes"]
    legend_by_id = {c["id"]: c for c in legend}

    frags: dict[str, dict] = {}
    lessons: dict[str, dict] = {}
    cards: list[dict] = []
    levels = []

    def keep_frag(frag: dict) -> str:
        fid = frag["id"]
        if fid not in frags:
            frags[fid] = {k: v for k, v in frag.items() if k not in ("markup", "note")}
        return fid

    # identify families: lessons in one level that share the same prompt
    family: dict[tuple, list[str]] = {}
    for lvl in cur["levels"]:
        for ls in lvl["lessons"]:
            if ls.get("identify") and ls.get("examples"):
                family.setdefault((lvl["level"], ls["identify"]), []).append(ls["id"])

    for lvl in cur["levels"]:
        lvl_entry = {k: lvl[k] for k in ("level", "slug", "title", "emoji", "tagline", "intro")}
        lvl_entry["lessons"] = []
        for n, ls in enumerate(lvl["lessons"], 1):
            lid = ls["id"]
            fam = family.get((lvl["level"], ls.get("identify")), [])
            identify_on = bool(ls.get("identify")) and len(fam) >= 2
            marks = tuple(ls.get("expect", []))
            card_ids: list[str] = []

            def add(card: dict) -> None:
                card["lesson"] = lid
                card["level"] = lvl["level"]
                cards.append(card)
                card_ids.append(card["id"])

            # concept cards: auto + authored
            concept = []
            if ls.get("auto_cards", True):
                concept.append((f"What is {ls['title']} ({ls['arabic']})?", f"{ls['meaning']}. {ls['summary']}"))
                if ls.get("how"):
                    concept.append((f"{ls['title']}: how do you apply it?", " ".join(f"{i}. {h}" for i, h in enumerate(ls["how"], 1))))
                if ls.get("letters") and ls.get("letters_label"):
                    concept.append((f"{ls['title']}: {ls['letters_label'].lower()}?", ls["letters"]))
                if ls.get("counts") and ls["counts"] != "—":
                    concept.append((f"{ls['title']}: how long (or how much)?", ls["counts"]))
            concept += [(c["q"], c["a"]) for c in ls.get("cards", [])]
            for i, (qq, aa) in enumerate(concept, 1):
                add({"id": f"c:{lid}:{i}", "t": "c", "q": qq, "a": aa})

            ex_entries = []
            for ex in ls.get("examples", []):
                fid = keep_frag(ex)
                ex_entries.append({"f": fid, "note": ex["note"]})
                add({"id": f"r:{lid}:{fid}", "t": "r", "f": fid})
                if identify_on:
                    add({
                        "id": f"i:{lid}:{fid}",
                        "t": "i",
                        "f": fid,
                        "prompt": ls["identify"],
                        "m": q.render(ex["markup"], "mark", marks),
                        "opts": fam,
                    })
            show_entries = []
            for ex in ls.get("showcase", []):
                show_entries.append({"f": keep_frag(ex), "note": ex["note"]})

            lessons[lid] = {
                "id": lid,
                "level": lvl["level"],
                "n": n,
                "title": ls["title"],
                "arabic": ls["arabic"],
                "meaning": ls["meaning"],
                "summary": ls["summary"],
                "explain": ls.get("explain", []),
                "letters": ls.get("letters"),
                "letters_label": ls.get("letters_label"),
                "counts": ls.get("counts"),
                "colors": ls.get("colors", []),
                "how": ls.get("how", []),
                "spot": ls.get("spot"),
                "tips": ls.get("tips", []),
                "mistakes": ls.get("mistakes", []),
                "examples": ex_entries,
                "showcase": show_entries,
                "practice_link": ls.get("practice_link"),
                "identify": ls.get("identify") if identify_on else None,
                "cards": card_ids,
            }
            lvl_entry["lessons"].append(lid)
        levels.append(lvl_entry)

    # symbols & colors
    sym_groups = []
    for grp in cur["symbols"]["groups"]:
        g = {k: grp[k] for k in ("id", "title", "emoji", "blurb")}
        g["items"] = []
        for it in grp["items"]:
            entry = {k: it[k] for k in ("id", "glyph", "name", "arabic", "meaning", "action")}
            if "example" in it:
                entry["f"] = keep_frag(it["example"])
                entry["note"] = it["example"]["note"]
            g["items"].append(entry)
            cards.append({"id": f"s:{it['id']}", "t": "s", "sym": it["id"], "group": grp["id"], "lesson": None, "level": None})
        sym_groups.append(g)
    for c in legend:
        cards.append({"id": f"k:{c['id']}", "t": "k", "cls": c["id"], "lesson": None, "level": None})

    # decks
    by_id = {c["id"]: c for c in cards}
    decks = [{"id": "all", "title": "Everything", "kind": "all", "emoji": "🌈", "cards": [c["id"] for c in cards]}]
    for lvl in levels:
        ids = [cid for lid in lvl["lessons"] for cid in lessons[lid]["cards"]]
        decks.append({"id": f"level-{lvl['level']}", "title": f"Level {lvl['level']} · {lvl['title']}", "kind": "level", "level": lvl["level"], "emoji": lvl["emoji"], "cards": ids})
    for lvl in levels:
        for lid in lvl["lessons"]:
            if lessons[lid]["cards"]:
                decks.append({"id": f"lesson-{lid}", "title": lessons[lid]["title"], "kind": "lesson", "level": lvl["level"], "lesson": lid, "emoji": lvl["emoji"], "cards": lessons[lid]["cards"]})
    sym_ids = [c["id"] for c in cards if c["t"] == "s"]
    col_ids = [c["id"] for c in cards if c["t"] == "k"]
    decks.append({"id": "symbols", "title": "Rule Symbols & Colors", "kind": "symbols", "emoji": "🔣", "cards": sym_ids + col_ids})
    for g in sym_groups:
        decks.append({"id": f"symbols-{g['id']}", "title": g["title"], "kind": "symbols", "emoji": g["emoji"], "cards": [f"s:{i['id']}" for i in g["items"]]})
    decks.append({"id": "colors", "title": "Color Key", "kind": "symbols", "emoji": "🎨", "cards": col_ids})

    model = {
        "meta": {
            "title": "Tarteel",
            "tagline": "Learn tajweed the friendly way",
            "built": date.today().isoformat(),
            "text": "Madinah Mushaf (Hafs 'an 'Asim), King Fahd Complex script",
            "reciter": "Mahmoud Khalil Al-Husary (Murattal)",
            "counts": {
                "levels": len(levels),
                "lessons": len(lessons),
                "fragments": len(frags),
                "cards": len(cards),
                "recite": sum(1 for c in cards if c["t"] == "r"),
                "identify": sum(1 for c in cards if c["t"] == "i"),
                "concept": sum(1 for c in cards if c["t"] == "c"),
                "symbol": sum(1 for c in cards if c["t"] == "s"),
                "color": sum(1 for c in cards if c["t"] == "k"),
            },
        },
        "legend": legend,
        "levels": levels,
        "lessons": lessons,
        "frags": frags,
        "cards": cards,
        "symbols": sym_groups,
        "decks": decks,
    }
    # integrity: every card id unique, every reference resolvable
    assert len({c["id"] for c in cards}) == len(cards), "duplicate card ids"
    for c in cards:
        if "f" in c:
            assert c["f"] in frags, c
    for d in decks:
        for cid in d["cards"]:
            assert cid in by_id, cid
    for c in legend:
        assert c["lesson"] in lessons, f"legend {c['id']} points at missing lesson {c['lesson']}"
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(model, ensure_ascii=False, indent=1), "utf8")
    return model


if __name__ == "__main__":
    m = build()
    print(json.dumps(m["meta"]["counts"], indent=1))
    print("decks:", len(m["decks"]))
