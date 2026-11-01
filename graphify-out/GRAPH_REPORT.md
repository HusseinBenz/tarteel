# Graph Report - tarteel  (2026-11-01)

## Corpus Check
- 34 files · ~44,124 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 3, .css 2)

## Summary
- 278 nodes · 554 edges · 14 communities (9 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3cad5189`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- quran_data.py
- curriculum.py
- render
- Tarteel Handout: Tajweed at a Glance
- build_anki.py
- Architecture
- Design system
- app.js
- preview_anki.py
- CLAUDE.md
- publish_pages.sh
- .claude/CLAUDE.md
- audit_site.cjs
- i18n.js

## God Nodes (most connected - your core abstractions)
1. `esc()` - 23 edges
2. `render()` - 15 edges
3. `viewPath()` - 14 edges
4. `startSession()` - 14 edges
5. `viewLesson()` - 13 edges
6. `route()` - 13 edges
7. `viewHome()` - 12 edges
8. `viewDeck()` - 11 edges
9. `build()` - 11 edges
10. `Tarteel Handout: Tajweed at a Glance` - 11 edges

## Surprising Connections (you probably didn't know these)
- `The Quran text and font` --references--> `align_markup()`  [INFERRED]
  docs/ARCHITECTURE.md → tools/quran_data.py
- `main()` --calls--> `build()`  [EXTRACTED]
  tools/build.py → tools/build_model.py
- `main()` --calls--> `load()`  [EXTRACTED]
  tools/build.py → tools/curriculum.py
- `cut()` --calls--> `segments()`  [EXTRACTED]
  tools/build_audio.py → tools/quran_data.py
- `cut()` --calls--> `verse_audio_path()`  [EXTRACTED]
  tools/build_audio.py → tools/quran_data.py

## Import Cycles
- None detected.

## Communities (14 total, 5 thin omitted)

### Community 0 - "quran_data.py"
Cohesion: 0.10
Nodes (22): align_markup(), chapters(), display_tajweed(), enrich_natural_madd(), _explode(), fragment(), full_tajweed(), _get() (+14 more)

### Community 1 - "curriculum.py"
Cohesion: 0.15
Nodes (14): build(), _strip(), check_heavy(), check_idhhar(), check_idhhar_shafawi(), check_lam_allah(), check_qamariyah(), ContentError (+6 more)

### Community 2 - "render"
Cohesion: 0.24
Nodes (17): fmtInterval(), playClip(), setPlaying(), shuffle(), startSession(), doGrade(), finish(), gradesHTML() (+9 more)

### Community 3 - "Tarteel Handout: Tajweed at a Glance"
Cohesion: 0.05
Nodes (38): Implemented, Language switch fix, Later fixes, Remaining gaps, Verification, Website audit — 1 November 2026, Add a lesson, Add an example to a lesson (+30 more)

### Community 4 - "build_anki.py"
Cohesion: 0.09
Nodes (15): build(), chips(), deck(), label(), css(), deck_id(), esc(), rich() (+7 more)

### Community 5 - "Architecture"
Cohesion: 0.22
Nodes (9): Accessibility and robustness, Anki deck tree, Architecture, Content model, Curriculum (Levels 0 to 7), Folder layout, The Quran text and font, Website routes (+1 more)

### Community 6 - "Design system"
Cohesion: 0.15
Nodes (12): Audit, Color: primitives, Color: semantic, Components, Design system, Glass buttons, Known gap, Rules that override the system (+4 more)

### Community 7 - "app.js"
Cohesion: 0.11
Nodes (52): allowedIds(), buildQueue(), chipFor(), chips(), colorRows(), countStates(), cycleSpeed(), dayKey() (+44 more)

### Community 12 - "audit_site.cjs"
Cohesion: 0.11
Nodes (10): ar, assert, data, en, fs, http, path, server (+2 more)

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Architecture` connect `Architecture` to `Tarteel Handout: Tajweed at a Glance`?**
  _High betweenness centrality (0.200) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `startSession()` (e.g. with `onClick()` and `onKey()`) actually correct?**
  _`startSession()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `quran_data.py` be split into smaller, more focused modules?**
  _Cohesion score 0.0975609756097561 - nodes in this community are weakly interconnected._
- **Why does `align_markup()` connect `quran_data.py` to `Architecture`?**
  _High betweenness centrality (0.195) - this node is a cross-community bridge._
- **Should `curriculum.py` be split into smaller, more focused modules?**
  _Cohesion score 0.14666666666666667 - nodes in this community are weakly interconnected._
- **Why does `The Quran text and font` connect `Architecture` to `quran_data.py`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **Should `Tarteel Handout: Tajweed at a Glance` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._