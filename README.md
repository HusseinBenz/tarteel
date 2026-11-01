# Tarteel · learn tajweed the friendly way

A cute, calm e-learning course for **tajweed**, delivered two ways from one source:

| Deliverable | Where | What it is |
|---|---|---|
| 🌐 **Static website** | [`site/`](site/) | Open `site/index.html`, or host the folder anywhere (GitHub Pages, Netlify, any web server). No build step, no backend. |
| 🃏 **Anki decks** | [`dist/anki/`](dist/anki/) | `Tarteel-Complete.apkg` plus one package per level and one for the rule symbols. 438 notes, 570 cards, with audio. |

Everything is in English. The Quran text is the **Madinah Mushaf** shown in its **original KFGQPC Uthmanic Hafs font**, colored with tajweed, and every fragment of a verse carries a label with the **surah, verse number and Mushaf page**.

## How learning works

Eight levels, from the first marks on the page to reading whole surahs.

| Level | Theme |
|---|---|
| 0 | **Meet the Mushaf**: colors, short vowels, sukun, shaddah, tanween, long vowels, little letters |
| 1 | **Noon Sakinah & Tanween**: idhhar, idgham (with / without ghunnah), iqlab, ikhfa, ghunnah |
| 2 | **Meem Sakinah**: ikhfa, idgham and idhhar shafawi |
| 3 | **Madd**: natural, connected, separated, on stopping, leen, badal, necessary, silah |
| 4 | **Letter rules**: qalqalah, sun and moon lam, hamzat al-wasl, silent letters, merging two letters |
| 5 | **Heavy, light and articulation**: heavy letters, ra, lam of Allah, makharij |
| 6 | **Stopping and starting**: waqf, the Mushaf's stop signs, ibtida |
| 7 | **Read whole surahs**: 12 short surahs, verse by verse |

There are **two ways in**:

- **Guided path** (progressive): each lesson shows the rule, what it means, examples with audio, then flashcards.
- **Flashcards** (repetitive): go straight to the cards. A fragment of a verse appears; recite it, flip the card, press play, and compare with the reciter. Cards you find hard come back sooner.

Card types: **Recite**, **Identify the rule** (the same fragment *uncolored*, so color doesn't give it away), **Concept**, **Symbol** and **Color key**. A dedicated **Rule Symbols** deck covers every vowel mark, madd sign, stop sign and the color key.

## Use it

**Website.** Open `site/index.html` in a browser, or serve the folder:

```bash
python -m http.server 8765 --directory site     # then visit http://localhost:8765
```

Progress and review schedules are stored only in your browser.

**Anki.** In Anki choose *File ▸ Import* and pick `dist/anki/Tarteel-Complete.apkg` (or just the levels you want). You get a deck tree: `Tarteel ▸ Level N ▸ one subdeck per rule`, plus `Tarteel ▸ Rule Symbols`. The font is embedded, so the Mushaf script displays correctly on desktop, AnkiDroid and AnkiMobile. The packages can also be downloaded from the website's home page.

## Rebuild or extend

Requires Python 3.10+, `ffmpeg` on your PATH and `pip install -r requirements.txt`.

```bash
python tools/build.py --check    # validate every example against the Quran text
python tools/build.py            # rebuild model, audio, website data and Anki decks
```

The first run downloads the source data into `build/` (git-ignored). Lessons live in [`content/`](content/) as JSON, and each example is a *reference* to a verse (`{"ref": "68:19", "at": "من ربك"}`), so no Arabic is typed by hand and a wrong example fails the build. See the [content guide](docs/CONTENT-GUIDE.md) and the [architecture](docs/ARCHITECTURE.md).

## Knowledge graph (graphify)

The code is indexed with [graphify](https://graphify.com), so Claude Code can look up how the pipeline and app fit together instead of reading every file. Open `graphify-out/graph.html` for the interactive view, or read `graphify-out/GRAPH_REPORT.md`.

```bash
pip install graphifyy                                # once per machine: the project's hooks call this CLI
graphify query "how are audio clips cut?"            # ask the graph
graphify update .                                    # refresh after changing code (no API key needed)
```

The graph covers code only (`tools/` and `site/js/`). Lessons in `content/` are not in it. Generated files are excluded through `.graphifyignore`.

## Publish

The website is served by GitHub Pages from the `gh-pages` branch: <https://husseinbenz.github.io/tarteel/>. After changing `site/`, run `tools/publish_pages.sh` (it pushes the `site/` folder to that branch). A printable summary of the course is in [`docs/HANDOUT.md`](docs/HANDOUT.md).

## Important notes

- **Learn with a teacher.** Tajweed is transmitted by listening and reciting back to a qualified teacher. Tarteel is a study aid for practice between lessons. Lengths of madd follow the common teaching for Hafs ʿan ʿĀṣim (natural 2, connected and separated 4–5, necessary 6, and 2/4/6 on stopping). If your teacher teaches otherwise, follow your teacher.
- **Rules without color.** Some rules (idhhar, moon-letter lam, heavy letters, ra, lam of Allah) have no color in the Mushaf. The lessons teach you to spot them from the letters.
- **Credits and licenses.** The font, text, annotation and recitation come from other sources with their own terms: see [`NOTICE.md`](NOTICE.md). In particular, check the audio terms before publishing publicly.
