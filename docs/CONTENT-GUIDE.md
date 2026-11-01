# Content guide: adding or changing lessons

Everything a learner reads lives in `content/`. After editing, run:

```bash
python tools/build.py --check     # fast: validates every example against the Quran text
python tools/build.py             # full rebuild: site data, audio, Anki decks
```

## Add an example to a lesson

Examples are *references* to the Quran, never copied Arabic. In `content/levels/level-N.json`, inside a lesson's `"examples"`:

```json
{ "ref": "68:19", "at": "من ربك", "note": "Noon sakinah + ر." }
```

| Field | Meaning |
|---|---|
| `ref` | `surah:verse` |
| `at` | The words to show, typed in plain Arabic without diacritics. They are matched against the verse by consonant skeleton (all alifs and hamza forms are ignored, so `مالك` and `ملك` both match مَـٰلِكِ). If the phrase occurs twice, add `"nth": 2`. |
| `words` | Alternative to `at`: an explicit 1-based range, e.g. `[3, 4]`. |
| `all` | `true` for the whole verse. |
| `note` | A short hint shown with the example. |

Full verses are best for the final level; two to three words are best for a rule.

## Add a lesson

Add an object to a level's `lessons` array. Required: `id` (unique, lowercase), `title` (no Arabic, which goes in `arabic`), `arabic`, `meaning`, `summary`. Useful optional fields:

| Field | Purpose |
|---|---|
| `explain` | List of paragraphs for "How it works" |
| `letters`, `letters_label` | The letters involved, shown large |
| `counts` | Length, e.g. `"2 counts"` |
| `how`, `tips`, `mistakes`, `spot` | Step lists and notes |
| `colors` | Rule colors to show as chips (ids from `legend.json`) |
| `examples` | Practice fragments. **Each becomes a Recite card** |
| `showcase` | Fragments shown on the lesson page only (no cards) |
| `cards` | Extra question/answer cards: `{"q": "...", "a": "..."}` |
| `identify` | A question such as `"What happens to the noon sakinah here?"`. Lessons in the same level with the *same* question form a multiple-choice family. A lesson with no sibling gets no identify cards |
| `auto_cards` | `false` to skip the automatically generated "What is…?" cards (overviews) |

## Keep examples honest: `expect` and `check`

So that a wrong example cannot ship, a lesson can say what must be true of every example:

```json
"expect": ["ikhafa"]       // the color/class must appear in the example
"check": "idhhar"          // a text test, see below
```

Available `check` values: `idhhar`, `idhhar_shafawi`, `qamariyah`, `lam_allah`, `heavy`, `starts_wasl`, `verse_end`. Add new ones in `tools/curriculum.py` (`CHECKS`).

Rule classes come from the Quran.com tajweed annotation: `madda_normal`, `madda_permissible`, `madda_obligatory`, `madda_necessary`, `qalaqah`, `ghunnah`, `ikhafa`, `ikhafa_shafawi`, `idgham_ghunnah`, `idgham_wo_ghunnah`, `idgham_shafawi`, `iqlab`, `idgham_mutajanisayn`, `idgham_mutaqaribayn`, `ham_wasl`, `laam_shamsiyah`, `slnt`. Their colors and names are in `content/legend.json`.

> Note: Quran.com tags both connected (muttasil) and separated (munfasil) madd as `madda_obligatory`.

## Symbols

`content/symbols.json` holds groups of signs; each item has `glyph`, `name`, `arabic`, `meaning`, `action` and an optional `example` (same format as above).

## Colors

Colors are defined once in `content/legend.json` (a light and a dark value per rule). The website's `tajweed.css` and Anki's card CSS are both generated from it.

## Known limitation

Five verses (2:181, 13:37, 15:7, 27:20, 36:22) split into a different number of words in KFGQPC's text than in Quran.com's, so they cannot be used as examples yet. The build stops with a clear message if one is referenced.
