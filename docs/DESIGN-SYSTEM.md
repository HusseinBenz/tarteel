# Design system

Tarteel's interface uses a design language derived from [xintra.org](https://www.xintra.org/): near-black panels with a purple glow, thin monospaced headlines, uppercase mono labels and hairline-bordered cards. The values below were measured from the live site's computed styles.

Tokens live at the top of [`site/css/style.css`](../site/css/style.css). Anki's card CSS in [`tools/build_anki.py`](../tools/build_anki.py) repeats the same values as literals, so change both. Rule colors are separate: they live in [`content/legend.json`](../content/legend.json), and both deliverables generate from that file.

## What was adopted, and what was not

| From xintra.org | Status |
|---|---|
| Neutrals, purple scale, lime accent | Adopted |
| Radii, hairline borders, mono label style, eyebrows, large `01` numerals, dark gradient panels | Adopted |
| DM Sans, DM Mono (open license) | Adopted |
| AeonikFono (their headline font) | **Not used.** It is a commercial font. Headlines use DM Mono Light instead |
| `#A355FF` button with light text | **Changed.** It measures 3.51:1, below the 4.5:1 needed for small text |
| Logo, name, imagery, copy | **Not used.** Tarteel keeps its own identity and its mascot, Noor |

The original brief asked for a friendly, cute course, and this language is much starker. Noor, the plain-spoken copy and the "one friendly step at a time" tagline carry that friendliness.

## Rules that override the system

1. **Purple is for the interface, never for Arabic.** The brand purple (hue 268°) sits only 15° to 18° from the Permissible Madd and Ikhfa rule colors. Quran text uses only the neutral ink and rule colors, so a color on a letter always means a rule.
2. **Arabic never inherits tracking or the mono font.** `letter-spacing` breaks cursive joining. Arabic always uses KFGQPC Hafs with `letter-spacing: 0`. For the same reason, titles must not contain Arabic (the build rejects it); use the lesson's `arabic` field.
3. **Interface text goes through `rich()`** when it might contain Arabic, so Arabic words get the Mushaf font.

## Tokens

### Color: primitives

| Token | Value | Token | Value |
|---|---|---|---|
| `--n-0` | `#FFFFFF` | `--v-100` | `#F1E6FF` |
| `--n-50` | `#F1F1F3` | `--v-300` | `#D6B3FF` |
| `--n-100` | `#E4E4E7` | `--v-400` | `#C08AFF` (added for links on dark) |
| `--n-300` | `#B7B7BF` | `--v-500` | `#A355FF` |
| `--n-500` | `#757583` | `--v-600` | `#8A38F5` |
| `--n-600` | `#4D4D56` | `--v-900` | `#291540` |
| `--n-700` | `#393940` | `--lime` | `#E3F26C` |
| `--n-800` | `#1F1F22` | | |
| `--n-900` | `#111113` | | |

### Color: semantic

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `n-50` | `n-900` | Page |
| `--surface` | `n-0` | `n-800` | Cards, verses |
| `--surface-2` | `n-50` | `#2A2A2E` | Notes, tags, list rows |
| `--ink` | `n-900` | `n-50` | Text, plain Arabic |
| `--muted` | `n-600` | `n-300` | Secondary text |
| `--line` | `n-100` | `n-700` | Hairlines |
| `--line-strong` | `n-300` | `n-500` | Outlined controls |
| `--primary` / `--on-primary` | `v-600` / `n-0` | `v-500` / `n-900` | Filled buttons |
| `--link` | `v-600` | `v-400` | Links |
| `--hl` | lime 85% | lime 24% | "Identify" target letters |
| `--good`, `--warn`, `--bad` | `#14733F`, `#975700`, `#C0282E` | `#5FD592`, `#F0B35A`, `#FF7B80` | Grades and answers |

The header, hero, lesson banner, due card and footer are always dark: `.on-dark` re-points the semantic tokens in either theme.

### Type

| Role | Font | Size / weight | Notes |
|---|---|---|---|
| Headline | DM Mono | `clamp(2rem, 5vw, 3.25rem)` / 300 | `-.01em` tracking |
| Section heading | DM Mono | `clamp(1.4rem, 3vw, 1.9rem)` / 300 | |
| Card heading | DM Mono | 1.15rem / 400 | |
| Numeral | DM Mono | 3rem / 400 | `01`, level numbers |
| Label | DM Mono | 13px / 400 | Uppercase, `.02em` tracking |
| Small label | DM Mono | 11px / 400 | Tags, card header |
| Body | DM Sans | 16px / 400 | |
| Quran | KFGQPC Hafs V22 | `clamp(2rem, 6.5vw, 3.4rem)` | Line-height 2.3 for the marks |
| Arabic interface | IBM Plex Sans Arabic | As the Latin role, 300 / 400 / 600 | No tracking or uppercase; line-height 1.85. Used only in the Arabic edition and on the language switch |

### Shape, space, motion

| Group | Values |
|---|---|
| Radius | `--r-sm` 4px (tags), `--r-md` 8px (buttons), `--r-lg` 12px (rows), `--r-xl` 24px (cards), `--r-pill` (chips) |
| Space | 4, 8, 12, 16, 24, 32, 48, 72 px (`--s-1` to `--s-8`) |
| Border | 1px. The site's computed `0.8px` is 1px at 125% display scaling |
| Elevation | Hairline first. Only the flashcard and dialogs use `--shadow-lg` |
| Motion | 120ms color and border changes; 200ms flashcard rise; all off under `prefers-reduced-motion` |

## Components

| Component | Class | Variants | States |
|---|---|---|---|
| Button | `.btn` | default, `.soft` (outlined), `.big` | hover, focus, disabled |
| Audio button | `.play` | `.big` | `aria-pressed` while playing |
| Speed button | `.speed` | `.big` | Cycles 1×, 0.75×, 0.5×; saved |
| Language switch | `.language-btn` | | Hover, focus; labeled in the language it switches to |
| Next-up panel | `.plan`, `.plan-card` | | Hover border. Shown only once a learner has progress |
| Search | `.search` | | Focus |
| Toggle | `.toggle` | | `aria-pressed` |
| Step tab | `.step` | | `aria-current`, `.done` |
| Eyebrow | `.eyebrow` | | |
| Card | `.card`, `.path-card`, `.level-card`, `.deck` | | hover border on links |
| Verse | `.verse` | `.ar.sm` | Always shows the surah and verse label |
| Rule chip | `.chip` | link or plain | hover |
| Tag | `.tag`, `.here` | lime for "you are here" | |
| Flashcard | `.flash` | recite, identify, concept, symbol, color | front, answer |
| Grade | `.grade` | `.g0` to `.g3` | hover, keys 1 to 4 |
| Answer option | `.opt` | `.right`, `.wrong` | hover, disabled |

## Audit

Run in the browser across every route and card type, in both themes.

| Check | Result |
|---|---|
| Text contrast (4.5:1, or 3:1 for large text and Arabic) | 7,540 checks, 0 failures |
| Arabic font and tracking | 1,050 checks. The 2 remaining font issues (level descriptions) were then fixed, but the audit was not re-run after that fix |
| Horizontal overflow at 390px | None on the 8 routes tested |

Rule colors changed to pass on white: Ghunnah `#E8790C` to `#D96E06`, and the three grays `#9A97A8` to `#8C8C98`. Dark-theme grays also moved, `#8C8A9C` to `#8E8E9A`.

### Known gap

In the dark theme the madd blues are hard to tell apart and no longer get deeper with length: Natural `#7CB3FF`, Permissible `#A99BFF`, Obligatory `#8499FF`, Necessary `#B6A4FF`. The light theme is fine. Changing them changes what learners memorize, so they were left for a separate decision.
