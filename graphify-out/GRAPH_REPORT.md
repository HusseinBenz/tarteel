# Graph Report - tarteel  (2026-11-01)

## Corpus Check
- 34 files · ~43,164 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 3, .css 2)

## Summary
- 273 nodes · 548 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `67a92b69`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- quran_data.py
- curriculum.py
- render
- Tarteel Handout: Tajweed at a Glance
- build_anki.py
- esc
- Design system
- app.js
- viewPath
- CLAUDE.md
- publish_pages.sh
- .claude/CLAUDE.md
- audit_site.cjs
- i18n.js
- Tarteel Handout: Tajweed at a Glance
- viewPractice

## God Nodes (most connected - your core abstractions)
1. `esc()` - 23 edges
2. `render()` - 15 edges
3. `viewPath()` - 14 edges
4. `viewPractice()` - 14 edges
5. `startSession()` - 14 edges
6. `viewLesson()` - 13 edges
7. `route()` - 13 edges
8. `viewHome()` - 12 edges
9. `viewDeck()` - 11 edges
10. `build()` - 11 edges

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

## Communities (16 total, 4 thin omitted)

### Community 0 - "quran_data.py"
Cohesion: 0.08
Nodes (27): build(), ContentError, load(), resolve_example(), _validate(), align_markup(), chapters(), display_tajweed() (+19 more)

### Community 1 - "curriculum.py"
Cohesion: 0.14
Nodes (11): _strip(), check_heavy(), check_idhhar(), check_idhhar_shafawi(), check_lam_allah(), check_qamariyah(), _first_letter(), skeleton() (+3 more)

### Community 2 - "render"
Cohesion: 0.21
Nodes (18): exampleNote(), fmtInterval(), lessonLink(), playClip(), setPlaying(), startSession(), doGrade(), finish() (+10 more)

### Community 3 - "Tarteel Handout: Tajweed at a Glance"
Cohesion: 0.05
Nodes (35): Accessibility and robustness, Anki deck tree, Architecture, Content model, Curriculum (Levels 0 to 7), Folder layout, The Quran text and font, Website routes (+27 more)

### Community 4 - "build_anki.py"
Cohesion: 0.09
Nodes (15): build(), chips(), deck(), label(), css(), deck_id(), esc(), rich() (+7 more)

### Community 5 - "esc"
Cohesion: 0.28
Nodes (13): chipFor(), chips(), colorRows(), esc(), finishLesson(), labelHTML(), markDone(), mascot() (+5 more)

### Community 6 - "Design system"
Cohesion: 0.17
Nodes (11): Audit, Color: primitives, Color: semantic, Components, Design system, Known gap, Rules that override the system, Shape, space, motion (+3 more)

### Community 7 - "app.js"
Cohesion: 0.19
Nodes (14): cycleSpeed(), dayKey(), grade(), localizeChrome(), nextInterval(), normalize(), saveState(), searchText() (+6 more)

### Community 8 - "viewPath"
Cohesion: 0.38
Nodes (13): fillDownloads(), lessonDone(), nextLesson(), progressBar(), route(), setNav(), setTitle(), viewAbout() (+5 more)

### Community 12 - "audit_site.cjs"
Cohesion: 0.11
Nodes (10): ar, assert, data, en, fs, http, path, server (+2 more)

### Community 14 - "Tarteel Handout: Tajweed at a Glance"
Cohesion: 0.18
Nodes (11): 10. Your 8 levels, 1. How to study, 2. The color key, 3. Noon sakinah (نْ) and tanween: decided by the next letter, 4. Meem sakinah (مْ), 5. Madd: how long?, 6. Letter rules, 7. Stopping (waqf) (+3 more)

### Community 15 - "viewPractice"
Cohesion: 0.42
Nodes (9): allowedIds(), buildQueue(), countStates(), deckCard(), plural(), shuffle(), state(), viewDeck() (+1 more)

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `align_markup()` connect `quran_data.py` to `Tarteel Handout: Tajweed at a Glance`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **Should `quran_data.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07993197278911565 - nodes in this community are weakly interconnected._
- **Why does `The Quran text and font` connect `Tarteel Handout: Tajweed at a Glance` to `quran_data.py`?**
  _High betweenness centrality (0.191) - this node is a cross-community bridge._
- **Should `curriculum.py` be split into smaller, more focused modules?**
  _Cohesion score 0.13538461538461538 - nodes in this community are weakly interconnected._
- **Should `Tarteel Handout: Tajweed at a Glance` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `build_anki.py` be split into smaller, more focused modules?**
  _Cohesion score 0.08858858858858859 - nodes in this community are weakly interconnected._
- **Should `audit_site.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._