# Graph Report - tarteel  (2026-11-16)

## Corpus Check
- 38 files · ~54,760 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .css 3, .webmanifest 1)

## Summary
- 332 nodes · 701 edges · 17 communities (12 shown, 5 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `124e0781`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- quran_data.py
- curriculum.py
- startSession
- Tarteel Handout: Tajweed at a Glance
- build_anki.py
- Architecture
- Design system
- app.js
- audio.js
- CLAUDE.md
- publish_pages.sh
- .claude/CLAUDE.md
- audit_site.cjs
- i18n.js
- Website audit — 1 November 2026
- icon
- sw.js

## God Nodes (most connected - your core abstractions)
1. `esc()` - 27 edges
2. `startSession()` - 19 edges
3. `viewHome()` - 18 edges
4. `render()` - 16 edges
5. `viewPath()` - 15 edges
6. `viewLesson()` - 14 edges
7. `route()` - 13 edges
8. `How Tarteel teaches` - 12 edges
9. `viewDeck()` - 11 edges
10. `viewAbout()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `The Quran text and font` --references--> `align_markup()`  [INFERRED]
  docs/ARCHITECTURE.md → tools/quran_data.py
- `How Tarteel teaches` --references--> `recall()`  [INFERRED]
  docs/LEARNING.md → site/js/app.js
- `How Tarteel teaches` --references--> `grade()`  [INFERRED]
  docs/LEARNING.md → site/js/app.js
- `How Tarteel teaches` --references--> `buildQueue()`  [INFERRED]
  docs/LEARNING.md → site/js/app.js
- `How Tarteel teaches` --references--> `goalPanel()`  [INFERRED]
  docs/LEARNING.md → site/js/app.js

## Import Cycles
- None detected.

## Communities (17 total, 5 thin omitted)

### Community 0 - "quran_data.py"
Cohesion: 0.08
Nodes (27): cut(), main(), align_markup(), chapters(), clip_timing(), clip_window(), display_tajweed(), enrich_natural_madd() (+19 more)

### Community 1 - "curriculum.py"
Cohesion: 0.12
Nodes (15): _strip(), check_heavy(), check_idhhar(), check_idhhar_shafawi(), check_lam_allah(), check_qamariyah(), ContentError, _first_letter() (+7 more)

### Community 2 - "startSession"
Cohesion: 0.19
Nodes (19): How Tarteel teaches, References, What the scheduler does not do, fmtInterval(), nextInterval(), shuffle(), startSession(), doGrade() (+11 more)

### Community 3 - "Tarteel Handout: Tajweed at a Glance"
Cohesion: 0.06
Nodes (31): Add a lesson, Colors, Content guide: adding or changing lessons, Keep examples honest: `expect` and `check`, Known limitation, Symbols, 10. Your 8 levels, 1. How to study (+23 more)

### Community 4 - "build_anki.py"
Cohesion: 0.09
Nodes (16): build(), chips(), deck(), label(), css(), deck_id(), esc(), rich() (+8 more)

### Community 5 - "Architecture"
Cohesion: 0.18
Nodes (11): Accessibility and robustness, Anki deck tree, Architecture, Content model, Curriculum (Levels 0 to 7), Folder layout, Offline and installation, Sound and text in step (+3 more)

### Community 6 - "Design system"
Cohesion: 0.15
Nodes (12): Audit, Color: primitives, Color: semantic, Components, Design system, Glass buttons, Known gap, Rules that override the system (+4 more)

### Community 7 - "app.js"
Cohesion: 0.10
Nodes (66): adopt(), allowedIds(), applyTheme(), buildQueue(), chipFor(), chips(), colorRows(), countStates() (+58 more)

### Community 8 - "audio.js"
Cohesion: 0.22
Nodes (21): Add an example to a lesson, blobFor(), clearMarks(), describe(), echo(), emit(), finish(), frame() (+13 more)

### Community 12 - "audit_site.cjs"
Cohesion: 0.15
Nodes (5): ar, data, en, server, site

### Community 14 - "Website audit — 1 November 2026"
Cohesion: 0.22
Nodes (9): Implemented, Language switch fix, Later fixes, Product pass — 16 November 2026, Remaining gaps, Verification, Verification, Website audit — 1 November 2026 (+1 more)

### Community 15 - "icon"
Cohesion: 0.28
Nodes (4): icon(), disc(), u(), main()

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `How Tarteel teaches` connect `startSession` to `audio.js`, `Tarteel Handout: Tajweed at a Glance`, `app.js`?**
  _High betweenness centrality (0.372) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `startSession()` (e.g. with `How Tarteel teaches` and `onClick()`) actually correct?**
  _`startSession()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `quran_data.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07767722473604827 - nodes in this community are weakly interconnected._
- **Why does `Sound and text in step` connect `Architecture` to `audio.js`, `quran_data.py`?**
  _High betweenness centrality (0.351) - this node is a cross-community bridge._
- **Should `curriculum.py` be split into smaller, more focused modules?**
  _Cohesion score 0.12183908045977011 - nodes in this community are weakly interconnected._
- **Why does `clip_window()` connect `quran_data.py` to `Architecture`?**
  _High betweenness centrality (0.340) - this node is a cross-community bridge._
- **Should `Tarteel Handout: Tajweed at a Glance` be split into smaller, more focused modules?**
  _Cohesion score 0.05689900426742532 - nodes in this community are weakly interconnected._