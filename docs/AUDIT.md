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

## Remaining gaps

| Priority | Finding | Next step |
|---|---|---|
| Medium | Arabic is an adapted, shorter edition. Detailed English tips, common mistakes and example-specific annotations are not all reproduced. | Expand Arabic prose and example notes if strict editorial parity is needed; have an Arabic-speaking tajweed teacher review both editions. |
| Medium | Downloadable Anki decks are English only. They are labeled explicitly in the Arabic interface. | Build separately identified Arabic Anki decks if requested, so imports do not overwrite English notes. |
| Medium | Some English teaching rules are simplified, particularly the treatment of silah exceptions, starting verbs with hamzat al-wasl, and detailed ra cases. Arabic adds qualifications, but this audit does not rewrite the English curriculum. | Review these lessons with a qualified teacher and align the two editions' detail. |
| Low | Dark-theme madd colors do not form a reliable light-to-deep sequence. This pre-existing design gap is recorded in `DESIGN-SYSTEM.md`. | Review the teaching palette together with contrast and color-distinction checks. Arabic color guidance avoids relying on depth alone. |
| Low | Progress is local to one browser; there is no export/import or cross-device sync. | Consider a backup/export feature if learners need to migrate devices. |
| Owner decision | `NOTICE.md` records unresolved recording-use terms and the absence of a chosen project license. | Confirm source permissions and choose the project's license. No license was assumed or changed during this work. |

The first audit pass above made no publishing or remote repository changes.
