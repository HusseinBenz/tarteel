# Website audit — 1 November 2026

Scope: Graphify architecture review, the static website, Arabic localization, lesson and review behavior, local assets and downloadable Anki counts. This is a software and localization audit, not a scholarly certification of the curriculum or a legal review of source licenses.

## Implemented

- Arabic interface, navigation, accessibility labels, lessons across all eight levels, 173 concept questions and answers, 26 symbols and 17 color descriptions. Arabic explanations are concise adaptations; example notes give general practice guidance rather than translating each English annotation. English word glosses are omitted in Arabic. Both editions retain every card ID, deck membership, Quran fragment, recording and reference.
- A persistent language switch and shareable `?lang=ar` / `?lang=en` links. Language changes keep the current route and browser progress. An in-progress card session restarts when the page reloads; already graded cards remain saved.
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

## Remaining gaps

| Priority | Finding | Next step |
|---|---|---|
| Medium | Arabic is an adapted, shorter edition. Detailed English tips, common mistakes and example-specific annotations are not all reproduced. | Expand Arabic prose and example notes if strict editorial parity is needed; have an Arabic-speaking tajweed teacher review both editions. |
| Medium | Downloadable Anki decks are English only. They are labeled explicitly in the Arabic interface. | Build separately identified Arabic Anki decks if requested, so imports do not overwrite English notes. |
| Medium | Some English teaching rules are simplified, particularly the treatment of silah exceptions, starting verbs with hamzat al-wasl, and detailed ra cases. Arabic adds qualifications, but this audit does not rewrite the English curriculum. | Review these lessons with a qualified teacher and align the two editions' detail. |
| Low | Dark-theme madd colors do not form a reliable light-to-deep sequence. This pre-existing design gap is recorded in `DESIGN-SYSTEM.md`. | Review the teaching palette together with contrast and color-distinction checks. Arabic color guidance avoids relying on depth alone. |
| Low | Progress is local to one browser; there is no export/import or cross-device sync. | Consider a backup/export feature if learners need to migrate devices. |
| Owner decision | `NOTICE.md` records unresolved recording-use terms and the absence of a chosen project license. | Confirm source permissions and choose the project's license. No license was assumed or changed during this work. |

No publishing or remote repository changes were performed.
