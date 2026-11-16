# How Tarteel teaches

Every feature that shapes practice is there because of a finding about how people learn. This page maps each one to the technique it implements, the evidence for it, and where it lives in the code.

Tarteel has not run its own learner study. The claims below are about the techniques, not about measured outcomes for this course.

| Technique | In the product | Where |
|---|---|---|
| **Retrieval practice.** Recalling an answer strengthens memory more than rereading it (Roediger & Karpicke, 2006). | A recite card shows the fragment and asks the learner to say it *before* any audio is offered. Words cannot be tapped and no clip can be played until the card is flipped. Concept, symbol and color cards ask before they tell. | `startSession()` in `site/js/app.js` |
| **Spaced repetition.** Reviews spread over growing intervals beat the same reviews massed together (Cepeda et al., 2006). | A simplified SM-2 scheduler: Again returns in the same sitting, the other grades grow the interval by the card's ease. Intervals of four days or more are nudged by up to 5% so cards learned together do not all fall due on one day. | `nextInterval()`, `grade()` |
| **Short, daily sittings.** Distributed practice again: several short sessions beat one long one. | A sitting is capped at 20 cards, with the rest of the queue offered afterwards. A daily goal (10, 20 or 40 reviews), a streak and a seven-day strip sit on the home page, and new cards are limited per day (5, 12 or 20). | `buildQueue()`, `goalPanel()` |
| **Interleaving and discrimination.** Mixing categories helps learners tell similar ones apart (Kornell & Bjork, 2008). | Reviews are ordered by due date, so rules from different lessons arrive mixed. Identify cards strip the color and ask which of a family of rules applies; a wrong answer shows the chosen rule beside the right one. | `buildQueue()`, the `i` branch of `render()` |
| **Words and sound together.** People learn better from coordinated visual and spoken material than from either alone (Mayer, 2009). | Each word is highlighted as the reciter says it. The first example plays on the same screen as the rule's explanation. | `site/js/audio.js`, `viewLesson()` |
| **Model, then imitate.** | *Listen and repeat* plays the clip, then leaves a silent turn of the same length for the learner, three times. Playback can be slowed to 0.75× or 0.5×, and any single word can be played alone. | `echo()`, `playWord()` |
| **Feedback on the task.** Feedback helps most when it shows the gap between the attempt and the goal (Hattie & Timperley, 2007). | The learner can record their recitation and play it next to the reciter's. The recording stays in the browser's memory and is discarded with the card. After a sitting, the share answered right first time is shown; the home page shows the week's recall rate. | `recorder` in `audio.js`, `recall()` |
| **Worked example first.** | Every lesson runs *meet the rule → see examples → try it*: explanation, then annotated verses, then unaided practice. | `viewLesson()` |

A broad review of these techniques rates practice testing and distributed practice as the two with the strongest support (Dunlosky et al., 2013).

## What the scheduler does not do

- It does not model each learner's forgetting curve. SM-2 uses one ease factor per card. Anki's FSRS would be more accurate but needs a review history to fit.
- "Right first time" and the weekly recall rate come from the learner's own grades. Nothing checks the recitation itself: Tarteel does not listen to the learner or score pronunciation. A teacher does that.

## References

- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin, 132*(3), 354–380.
- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving students' learning with effective learning techniques. *Psychological Science in the Public Interest, 14*(1), 4–58.
- Hattie, J., & Timperley, H. (2007). The power of feedback. *Review of Educational Research, 77*(1), 81–112.
- Kornell, N., & Bjork, R. A. (2008). Learning concepts and categories: Is spacing the "enemy of induction"? *Psychological Science, 19*(6), 585–592.
- Mayer, R. E. (2009). *Multimedia learning* (2nd ed.). Cambridge University Press.
- Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science, 17*(3), 249–255.
