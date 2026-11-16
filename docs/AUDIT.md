# Website audit — 1 November 2026

Scope: Graphify architecture review, the static website, Arabic localization, lesson and review behavior, local assets and downloadable Anki counts. This is a software and localization audit, not a scholarly certification of the curriculum or a legal review of source licenses.

## Implemented

- Arabic interface, navigation, accessibility labels, lessons across all eight levels, 173 concept questions and answers, 26 symbols and 17 color descriptions. Arabic explanations are concise adaptations; example notes give general practice guidance rather than translating each English annotation. English word glosses are omitted in Arabic. Both editions retain every card ID, deck membership, Quran fragment, recording and reference.
- A persistent language switch and shareable `?lang=ar` / `?lang=en` links. The switch changes language in place, keeping the route, scroll position, in-progress flashcard session and browser progress. See "Language switch fix" below.
- RTL layout and Arabic UI typography with zero letter spacing. Quran passages retain the supplied Mushaf font. The hidden skip link no longer expands the RTL document beyond the viewport.
- Prevented lessons from being marked complete when all their card types were filtered out.
- Disabled review shortcuts after session completion by clearing the active card. Session restart still works.
- Fixed the completed-course home link, which previously pointed to `lesson/null`.
- Replaced an incomplete ARIA tab pattern with navigation for the three lesson steps; added accessible names to progress bars.
- Made a stored `null` or scalar root value fall back to fresh progress rather than breaking startup.
- Corrected the home page's Anki count: 570 cards, including reverse symbol/color cards. The website has 527 cards; the Anki package contains 438 notes.
- Added a rebuildable Arabic data file and validation that fails when translated concept-card coverage no longer matches the shared model.

## Verification

`python tools/build.py --check` validates every curriculum example against the cached Quran text and its annotated rule. JavaScript syntax checks and Python compilation pass.

`node tools/audit_site.cjs` covers 170 routes in each language, at 390px and 1280px, in both light and dark themes: **1,360 page configurations**. It checks visible Arabic interface text for untranslated English (allowing source and product names), runtime/resource errors, and horizontal overflow. It also checks:

- All Quran HTML, plain text, audio paths and references agree between editions.
- Every referenced recording exists locally; deck memberships and card IDs match.
- Every concept question and answer contains Arabic.
- All five card types reveal answers and advance; audio controls receive the correct recording.
- Filtered cards cannot complete a lesson.
- Grading shortcuts cannot change progress after a completed session; restarting works.
- The completed-course action points to the path; switching languages preserves 52 completed lessons.

Browser output and screenshots are written to the ignored `build/audit/` directory. This suite is not a complete WCAG audit, an acoustic review of the recordings, or a guarantee for all browsers and screen readers.

Latest run: **1,360 configurations passed, zero untranslated interface strings, zero horizontal overflows, zero runtime/resource errors**. Visual inspection verified the Arabic mobile home page and desktop lesson layout. A separate smoke check covered direct file opening, disabled browser storage, a 320px RTL example page, translated dialog labels and route preservation when changing language.

## Language switch fix

Reported: the Arabic switch did not work. It worked on a clean load, but it failed for browsers holding a cached script. `index.html` and its scripts had fixed names, so a new page could pair with the previous `app.js`, which has no handler for the button: it looked normal and did nothing. The reverse pairing (a new script on an older page) crashed on the missing button. This diagnosis comes from the code and a clean-load test; the failure was not observed on the reporter's own browser.

- `index.html` now references every script and stylesheet by content hash (`?v=...`), stamped by `tools/build_site.py`. `tools/publish_pages.sh` refuses to publish if the stamps are out of date.
- The script tolerates a stale page: without the switch, the Arabic data or the translations, it runs in English instead of crashing.
- The switch no longer reloads the page, so there is no English flash, no extra history entry and no lost session. A small inline script sets the language and theme before first paint.
- Also found while testing: the hero background made the document about 8px wider than the viewport whenever a scrollbar was present, and in RTL the page opened scrolled sideways. The audit missed this because it compared against the width including the scrollbar. Fixed, and the audit now compares against the client width and requires `scrollX` to be 0.

`tools/audit_site.cjs` now also covers: versioned assets, no reload or history entry on switch, session and focus preserved, English restored on switching back, language persistence, search in both editions, slow playback, and a simulated stale page. To run it without downloading a browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to any Chromium.

Latest run after these changes: **1,360 configurations passed**, with zero untranslated strings, overflows or runtime errors.

## Later fixes

- **Flashcard settings:** the handler was attached to an element that is never replaced, on every render, so listeners doubled with each click. Toggles stopped flipping and the work grew exponentially. There is now one listener per render and buttons update in place. The audit clicks each setting repeatedly in both languages.
- **Arabic answer feedback:** identify cards showed "Correct! This is" in English, because the translations were keyed on smaller pieces than the rendered text. It only surfaced when the shuffled first option happened to be right, so the audit passed by chance before. The audit now checks both outcomes.
- **Button contrast:** the audit measures button text against the blended glass color in both themes (186 checks, minimum 4.5:1).

## Product pass — 16 November 2026

Scope: a study of the interface, the flows and the audio, followed by the changes it called for. The learning rationale is in [`LEARNING.md`](LEARNING.md), the sync design and its measurements in [`ARCHITECTURE.md`](ARCHITECTURE.md).

### What the study found

| Area | Finding | Change |
|---|---|---|
| Audio | Clips played, but nothing on screen moved with them. The per-word timings used to cut each clip were thrown away after the build | Timings ship with every fragment. The word being recited is outlined, driven by the player's clock on every frame |
| Audio | A learner could only replay a whole clip | Tap a word to hear it alone; *Listen and repeat* (reciter, then a silent turn, three times); *Play all* for a lesson's verses in order |
| Audio | The first play of a clip waited on the network | The current card's clip and the next one's are fetched ahead and played from memory |
| Feedback | "Compare with the reciter" relied on memory of what one had just said | Record on the card, then play it next to the reciter. Kept in memory for that card only |
| Feedback | A wrong identify answer showed only the right rule | It also shows the rule that was chosen, so the two can be told apart |
| Practice | A review session ran until the whole queue was empty | Sittings of 20, with the rest offered after. A daily goal, a streak and a seven-day strip |
| Home | Returning learners saw the same marketing page as newcomers | Two states: a pitch with a live verse to play, or what is due today |
| Lesson | On a phone the lesson banner and step tabs pushed the flashcard below the fold | The banner collapses to one line after the first step. The first example plays beside the explanation |
| Navigation | On a phone the four links wrapped onto a second header row | A tab bar at the bottom, hidden during a flashcard session |
| Flashcards | Grades sat in a 2×2 block below a long answer | One row of four that stays in view while the answer scrolls |
| Symbols | A tapped sign's explanation opened at the foot of a long page | It opens under the group that was tapped |
| Settings | Seven unlabeled toggles in two rows | Labeled groups; new cards per day and the daily goal can be set |
| Robustness | Progress lived in one browser with no way out (listed as a gap above) | Export and import a backup on the About page |
| Robustness | No offline use | A service worker, an install manifest, and *Use offline* to save every clip |
| Pipeline | A fresh clone could not build: the cache folders were never created, and ffmpeg had to be on PATH even for `--check` | Folders are created on import; ffmpeg falls back to `imageio-ffmpeg`; `--check` needs neither |
| Pipeline | Asset hashes depended on the checkout's line endings | Hashes are taken over normalized line endings |
| Copy | "1 miss came back and were practiced again" | "came back for another try" |

### Verification

`node tools/audit_site.cjs` in headless Edge, after the last change:

- **1,360 page configurations** (170 routes, two languages, 390px and 1280px, light and dark): zero runtime or resource errors, zero horizontal overflow, zero untranslated Arabic interface strings.
- **Button contrast:** 218 checks, all at least 4.5:1.
- **Timings:** every one of the 202 fragments splits into exactly the words its timings describe, in both the colored and the identify markup; every clip's length matches its timings.
- **Highlight:** a clip is played at 1× and at 0.5×, and on every frame the outlined word is compared with the player's clock. No frame was out of step, every word lit in turn, and the highlight cleared at the end.
- **One word:** playback starts at the word and stops after it, on a server that cannot serve byte ranges.
- **Listen and repeat, Play all:** the silent turn is silent; verses play in order; a second click stops both.
- **Recording:** with a generated microphone signal, a take is made, ended by flipping the card, offered for playback, and gone on the next card. The question side of a card has no tappable words.
- **Sittings, settings, backup:** a capped sitting offers the rest; daily settings save; an exported backup restores cards and settings; a file that is not a backup changes nothing.
- **Offline:** with the network off, the page opens, a clip plays with its highlight, and the Mushaf font is available.
- **Stale page:** a page without `audio.js` still plays a clip.

Not verified: nobody listened to the clips against the highlight, so its accuracy rests on the Quran.com timings and the measurements in `ARCHITECTURE.md`. Recording and offline use ran only in headless Edge with a generated microphone signal, not with a real microphone or on Safari, Firefox or a phone. Installing the app was not tested. The service worker runs only over https, so its first real exercise is the published site.

## Remaining gaps

| Priority | Finding | Next step |
|---|---|---|
| Medium | Arabic is an adapted, shorter edition. Detailed English tips, common mistakes and example-specific annotations are not all reproduced. | Expand Arabic prose and example notes if strict editorial parity is needed; have an Arabic-speaking tajweed teacher review both editions. |
| Medium | Downloadable Anki decks are English only. They are labeled explicitly in the Arabic interface. | Build separately identified Arabic Anki decks if requested, so imports do not overwrite English notes. |
| Medium | Some English teaching rules are simplified, particularly the treatment of silah exceptions, starting verbs with hamzat al-wasl, and detailed ra cases. Arabic adds qualifications, but this audit does not rewrite the English curriculum. | Review these lessons with a qualified teacher and align the two editions' detail. |
| Low | Dark-theme madd colors do not form a reliable light-to-deep sequence. This pre-existing design gap is recorded in `DESIGN-SYSTEM.md`. | Review the teaching palette together with contrast and color-distinction checks. Arabic color guidance avoids relying on depth alone. |
| Low | Progress is local to one browser. A backup can now be exported and imported by hand; there is no automatic cross-device sync. | Sync would need accounts and a server, which the project has avoided. |
| Medium | Tarteel does not listen to the learner. Recording lets them compare by ear, but nothing scores pronunciation. | Keep directing learners to a teacher. Automatic assessment would need a speech model and a privacy review. |
| Low | Tapping a word is pointer-only. Keyboard users get the whole clip from the Listen button. | Make words focusable if single-word playback proves important for keyboard users. |
| Low | The Anki decks were not rebuilt in this pass and carry no word timings. | Rebuild with `python tools/build.py` when the decks next change. |
| Owner decision | `NOTICE.md` records unresolved recording-use terms and the absence of a chosen project license. | Confirm source permissions and choose the project's license. No license was assumed or changed during this work. |

The first audit pass above made no publishing or remote repository changes.
