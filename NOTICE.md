# Third-party material and licenses

Tarteel contains material from other sources. Please keep these notices with any copy you distribute.

## Quran text and the Uthmanic Hafs font

- **Font** `site/fonts/UthmanicHafs-v22.ttf` / `.woff2`: *KFGQPC Uthmanic Script HAFS*, version 2.2, © King Fahd Glorious Quran Printing Complex (KFGQPC), Al-Madinah Al-Munawwarah. The font's license grants the right to use, copy and distribute it free of cost, and **forbids selling, modifying, altering, translating, reverse engineering or decompiling it**. It is shipped unmodified. The `.woff2` file is the same font repackaged in a web container (no glyph changes). Source: <https://fonts.qurancomplex.gov.sa>.
- **Text** shown to learners is KFGQPC's published text for this font (`UthmanicHafs v22.json`), obtained from the open `nuqayah/qpc-fonts` mirror of KFGQPC's files.
- **Tajweed annotation, word-by-word glosses, word timings and mushaf page numbers** come from the public [Quran.com API](https://api.quran.com) (Quran Foundation). Natural-madd coloring of unmarked letters is added by this project.

## Recitation audio

- Clips are short excerpts cut from the recitation of **Sheikh Mahmoud Khalil Al-Husary (Murattal)** as published on [EveryAyah.com](https://everyayah.com). The rights to the recording remain with their owners. Before publishing this project publicly or commercially, please confirm that your use is acceptable under EveryAyah's and the reciter's terms. The clips are derived files and can be regenerated or replaced with another reciter by changing `RECITER_ID` and `AUDIO_URL` in `tools/quran_data.py`.

## Interface fonts

- **DM Sans** and **DM Mono**: SIL Open Font License 1.1. Files `site/fonts/dm-sans-latin.woff2`, `dm-mono-300.woff2` and `dm-mono-400.woff2` are the Latin subsets served by Google Fonts. The Anki packages embed DM Sans and DM Mono 400.

## Visual design

- The interface's colors, spacing and component styling are derived from [xintra.org](https://www.xintra.org/). No Xintra logo, imagery, copy or font files are used, and Tarteel is not affiliated with Xintra. See `docs/DESIGN-SYSTEM.md`.

## Software

- **genanki** (MIT) builds the Anki packages. **ffmpeg** (LGPL/GPL) is used at build time only and is not distributed.

## The project's own code and writing

The lesson text, tools and website code in this repository are the project's own. No license has been chosen yet; until the owner adds one, all rights are reserved by the owner.
