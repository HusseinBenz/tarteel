# Graph Report - tarteel  (2026-11-01)

## Corpus Check
- 29 files · ~32,784 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 3, .css 2)

## Summary
- 232 nodes · 486 edges · 12 communities (8 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `794329d1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- quran_data.py
- curriculum.py
- render
- Tarteel Handout: Tajweed at a Glance
- build_anki.py
- app.js
- Design system
- Architecture
- preview_anki.py
- CLAUDE.md
- publish_pages.sh
- .claude/CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `esc()` - 23 edges
2. `render()` - 15 edges
3. `viewPractice()` - 14 edges
4. `startSession()` - 14 edges
5. `viewLesson()` - 13 edges
6. `viewPath()` - 12 edges
7. `route()` - 12 edges
8. `viewHome()` - 11 edges
9. `viewDeck()` - 11 edges
10. `Tarteel Handout: Tajweed at a Glance` - 11 edges

## Surprising Connections (you probably didn't know these)
- `The Quran text and font` --references--> `align_markup()`  [INFERRED]
  docs/ARCHITECTURE.md → tools/quran_data.py
- `main()` --calls--> `build()`  [EXTRACTED]
  tools/build.py → tools/build_anki.py
- `main()` --calls--> `main()`  [EXTRACTED]
  tools/build.py → tools/build_site.py
- `cut()` --calls--> `segments()`  [EXTRACTED]
  tools/build_audio.py → tools/quran_data.py
- `cut()` --calls--> `verse_audio_path()`  [EXTRACTED]
  tools/build_audio.py → tools/quran_data.py

## Import Cycles
- None detected.

## Communities (12 total, 4 thin omitted)

### Community 0 - "quran_data.py"
Cohesion: 0.09
Nodes (25): The Quran text and font, main(), tajweed_css(), resolve_example(), align_markup(), chapters(), display_tajweed(), enrich_natural_madd() (+17 more)

### Community 1 - "curriculum.py"
Cohesion: 0.10
Nodes (17): cut(), main(), main(), build(), _strip(), check_heavy(), check_idhhar(), check_idhhar_shafawi() (+9 more)

### Community 2 - "render"
Cohesion: 0.22
Nodes (17): exampleNote(), fmtInterval(), lessonLink(), playClip(), setPlaying(), startSession(), doGrade(), gradesHTML() (+9 more)

### Community 3 - "Tarteel Handout: Tajweed at a Glance"
Cohesion: 0.05
Nodes (32): Add a lesson, Add an example to a lesson, Colors, Content guide: adding or changing lessons, Keep examples honest: `expect` and `check`, Known limitation, Symbols, 10. Your 8 levels (+24 more)

### Community 4 - "build_anki.py"
Cohesion: 0.21
Nodes (8): build(), chips(), deck(), label(), css(), deck_id(), esc(), rich()

### Community 5 - "app.js"
Cohesion: 0.14
Nodes (43): allowedIds(), buildQueue(), chipFor(), chips(), colorRows(), countStates(), dayKey(), deckCard() (+35 more)

### Community 6 - "Design system"
Cohesion: 0.17
Nodes (11): Audit, Color: primitives, Color: semantic, Components, Design system, Known gap, Rules that override the system, Shape, space, motion (+3 more)

### Community 7 - "Architecture"
Cohesion: 0.25
Nodes (8): Accessibility and robustness, Anki deck tree, Architecture, Content model, Curriculum (Levels 0 to 7), Folder layout, Website routes, Why this shape

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Architecture` connect `Architecture` to `quran_data.py`, `Tarteel Handout: Tajweed at a Glance`?**
  _High betweenness centrality (0.237) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `startSession()` (e.g. with `onClick()` and `onKey()`) actually correct?**
  _`startSession()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `quran_data.py` be split into smaller, more focused modules?**
  _Cohesion score 0.08502415458937199 - nodes in this community are weakly interconnected._
- **Why does `The Quran text and font` connect `quran_data.py` to `Architecture`?**
  _High betweenness centrality (0.225) - this node is a cross-community bridge._
- **Should `curriculum.py` be split into smaller, more focused modules?**
  _Cohesion score 0.0960960960960961 - nodes in this community are weakly interconnected._
- **Should `Tarteel Handout: Tajweed at a Glance` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14492753623188406 - nodes in this community are weakly interconnected._