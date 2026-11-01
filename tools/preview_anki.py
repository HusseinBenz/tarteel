"""Dev helper: render a few cards from the built .apkg as an HTML page, so the
Anki templates can be eyeballed without Anki.  Writes site/_anki-preview.html
(git-ignored); open http://localhost:8765/_anki-preview.html.
"""
from __future__ import annotations

import json
import re
import sqlite3
import tempfile
import zipfile
from pathlib import Path

import quran_data as q

ROOT = q.ROOT


def render(tmpl: str, fields: dict[str, str], front: str = "") -> str:
    def cond(m):
        return m.group(2) if fields.get(m.group(1), "").strip() else ""
    prev = None
    while prev != tmpl:
        prev = tmpl
        tmpl = re.sub(r"\{\{#(\w+)\}\}(.*?)\{\{/\1\}\}", cond, tmpl, flags=re.S)
    tmpl = tmpl.replace("{{FrontSide}}", front)
    tmpl = re.sub(r"\{\{(\w+)\}\}", lambda m: fields.get(m.group(1), ""), tmpl)
    return re.sub(r"\[sound:([^\]]+)\]", r'<button onclick="new Audio(\'audio/\1\'.replace(\'tarteel_\',\'\')).play()">▶ play</button>', tmpl)


def main() -> None:
    tmp = tempfile.mkdtemp()
    zipfile.ZipFile(ROOT / "dist" / "anki" / "Tarteel-Complete.apkg").extract("collection.anki2", tmp)
    cur = sqlite3.connect(f"{tmp}/collection.anki2").cursor()
    models = json.loads(cur.execute("select models from col").fetchone()[0])
    wanted = [
        ("Tarteel Recite", "ikhafa", 0), ("Tarteel Recite", "iqlab", 1), ("Tarteel Concept", "Idhhar", 0),
        ("Tarteel Symbol", "Fathah", 0), ("Tarteel Color", "Qalqalah", 0), ("Tarteel Recite", "surah-112", 0),
    ]
    css = next(iter(models.values()))["css"].replace("_UthmanicHafs-v22.ttf", "fonts/UthmanicHafs-v22.ttf").replace("_dm-", "fonts/dm-")
    blocks = []
    for mname, needle, ordn in wanted:
        model = next(m for m in models.values() if m["name"] == mname)
        names = [f["name"] for f in model["flds"]]
        for (flds,) in cur.execute("select flds from notes where mid=? and flds like ? limit 1", (model["id"], f"%{needle}%")):
            fields = dict(zip(names, flds.split("\x1f")))
            t = model["tmpls"][ordn]
            front = render(t["qfmt"], fields)
            back = render(t["afmt"], fields, front)
            blocks.append(f"<h3>{mname} / {t['name']}</h3><div class='pair'><div class='card'>{front}</div><div class='card'>{back}</div></div>")
    page = f"""<!doctype html><meta charset="utf-8"><title>Anki preview</title><style>{css}
body{{margin:0;background:#ddd;font-family:sans-serif}} h3{{margin:14px 10px 2px}}
.pair{{display:flex;gap:10px;flex-wrap:wrap;padding:0 10px}} .pair .card{{flex:1 1 360px;min-width:320px;max-width:520px;border:1px solid #bbb}}
body.night .card{{color:#f3efff;background:#17132a}}</style>
<body class="{ 'night' if False else '' }"><label style="margin:10px;display:block"><input type="checkbox" onchange="document.body.classList.toggle('night',this.checked);document.querySelectorAll('.card').forEach(c=>c.classList.toggle('nightMode',this.checked))"> night mode</label>
{''.join(blocks)}</body>"""
    (ROOT / "site" / "_anki-preview.html").write_text(page, "utf8")
    print("wrote site/_anki-preview.html")


if __name__ == "__main__":
    main()
