# Graph Report - tarteel  (2026-11-01)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 169 nodes · 418 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e3a3fce5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10

## God Nodes (most connected - your core abstractions)
1. `esc()` - 23 edges
2. `render()` - 15 edges
3. `startSession()` - 14 edges
4. `viewPractice()` - 14 edges
5. `viewLesson()` - 13 edges
6. `route()` - 12 edges
7. `viewHome()` - 11 edges
8. `words_of()` - 10 edges
9. `build()` - 10 edges
10. `setNav()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `cut()` --calls--> `verse_audio_path()`  [EXTRACTED]
  tools/build_audio.py → tools/quran_data.py
- `resolve_example()` --calls--> `fragment()`  [EXTRACTED]
  tools/curriculum.py → tools/quran_data.py
- `skeleton()` --calls--> `plain()`  [EXTRACTED]
  tools/curriculum.py → tools/quran_data.py
- `cut()` --calls--> `segments()`  [EXTRACTED]
  tools/build_audio.py → tools/quran_data.py
- `resolve_example()` --calls--> `words_of()`  [EXTRACTED]
  tools/curriculum.py → tools/quran_data.py

## Import Cycles
- None detected.

## Communities (11 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (20): align_markup(), chapters(), display_tajweed(), enrich_natural_madd(), _explode(), fragment(), full_tajweed(), _get() (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (16): build(), _strip(), check_heavy(), check_idhhar(), check_idhhar_shafawi(), check_lam_allah(), check_qamariyah(), ContentError (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.22
Nodes (18): exampleNote(), fmtInterval(), playClip(), rich(), setPlaying(), startSession(), doGrade(), finish() (+10 more)

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (5): cut(), main(), main(), main(), tajweed_css()

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (8): build(), chips(), deck(), label(), css(), deck_id(), esc(), rich()

### Community 5 - "Community 5"
Cohesion: 0.27
Nodes (11): chipFor(), chips(), dayKey(), finishLesson(), grade(), markDone(), nextInterval(), saveState() (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.34
Nodes (14): fillDownloads(), lessonDone(), mascot(), nextLesson(), progressBar(), route(), setNav(), setTitle() (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.42
Nodes (9): allowedIds(), buildQueue(), countStates(), deckCard(), plural(), shuffle(), state(), viewDeck() (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.43
Nodes (7): colorRows(), esc(), labelHTML(), lessonLink(), playBtn(), verseBox(), show()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `build()` connect `Community 4` to `Community 3`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `startSession()` (e.g. with `onClick()` and `onKey()`) actually correct?**
  _`startSession()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Why does `build()` connect `Community 1` to `Community 0`, `Community 3`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11576354679802955 - nodes in this community are weakly interconnected._
- **Why does `render()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._