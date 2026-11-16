/* Arabic interface copy. Lesson text is authored in content/ar.json and built
 * independently of the shared Quran fragments, audio and progress identifiers. */
(function () {
  'use strict';
  var messages = {
    'Tarteel': 'ترتيل', 'Home': 'الرئيسية', 'Guided path': 'المسار التعليمي', 'Flashcards': 'البطاقات', 'Symbols': 'الرموز',
    'Skip to content': 'انتقل إلى المحتوى', 'Tarteel home': 'ترتيل — الرئيسية', 'Main': 'التنقل الرئيسي',
    'Open the tajweed color key': 'افتح دليل ألوان التجويد', 'Color key': 'دليل الألوان',
    'Switch light or dark theme': 'بدل بين الوضع الفاتح والداكن', 'Theme': 'المظهر', 'Close': 'إغلاق',
    'Tajweed color key': 'دليل ألوان التجويد', 'Listen': 'استمع', 'Playing…': 'جار التشغيل…',
    'Could not play the audio': 'تعذر تشغيل الصوت', 'Could not load the course data.': 'تعذر تحميل بيانات المنهج.',
    'Learn tajweed,': 'تعلم التجويد،', 'one friendly step at a time': 'خطوة بخطوة',
    'Read the Madinah Mushaf in color, hear each rule recited, then practice with flashcards until it feels natural.': 'اقرأ مصحف المدينة بالألوان، واستمع إلى تطبيق كل حكم، ثم تدرب بالبطاقات حتى تتقن الأداء.',
    'Continue learning': 'تابع التعلم', 'Start at Level 0': 'ابدأ بالمستوى 0', 'Two ways to learn': 'طريقتان للتعلم',
    'Choose how you like to learn': 'اختر طريقة تعلمك', 'Follow the path ↗': 'اتبع المسار ↖', 'Repetitive practice': 'التدريب المتكرر',
    'Jump straight into flashcards. A fragment of a verse appears: recite it, flip, press play, and compare.': 'ابدأ بالبطاقات مباشرة: اقرأ المقطع، ثم اقلب البطاقة واستمع وقارن تلاوتك.',
    'Open the decks ↗': 'افتح مجموعات البطاقات ↖', 'Lessons done': 'الدروس المكتملة', 'Cards learned': 'البطاقات المتعلمة',
    'Due now': 'للمراجعة الآن', 'Day streak': 'أيام التدريب المتتالية', 'The colors you will learn': 'الألوان التي ستتعلمها',
    'See the whole color key': 'اعرض دليل الألوان كاملا', 'Anki': 'Anki', 'Take it with you': 'تعلم أينما كنت',
    'Complete course (everything)': 'المنهج الكامل (بطاقات Anki بالإنجليزية)', 'Rule Symbols & Color Key': 'الرموز ودليل الألوان (Anki بالإنجليزية)',
    'Eight levels, from the very first marks to reading whole surahs. Follow them in order, or jump to whatever you need.': 'ثمانية مستويات، من العلامات الأولى إلى تلاوة سور كاملة. اتبعها بالترتيب أو انتقل إلى ما تحتاجه.',
    'You are here': 'أنت هنا', 'Level overview': 'نظرة على المستوى', 'Practice this level': 'تدرب على هذا المستوى', '← All levels': 'كل المستويات →',
    '1 · Meet the rule': '1 · تعرف على الحكم', '2 · See examples': '2 · شاهد الأمثلة', '3 · Try it': '3 · تدرب',
    'This rule has no color in the Mushaf: you spot it by its letters.': 'لا يميز هذا الحكم لون في المصحف؛ تعرف عليه من حروفه.',
    'How it works': 'شرح الحكم', 'Letters': 'الحروف', 'Length': 'المقدار', 'How to spot it': 'كيف تميزه', 'How to do it': 'طريقة التطبيق', 'Tips': 'نصائح', 'Common slips': 'أخطاء شائعة',
    'Read each fragment aloud first. Then press Listen to hear the reciter.': 'اقرأ كل مقطع بصوت مسموع، ثم اضغط استمع لسماع تلاوة القارئ.',
    'No examples for this lesson. Head to the next step.': 'لا توجد أمثلة لهذا الدرس. انتقل إلى الخطوة التالية.',
    'Open the Symbols page': 'افتح صفحة الرموز', '← Back': 'رجوع →', 'Next →': 'التالي ←',
    'This lesson has no flashcards': 'لا توجد بطاقات لهذا الدرس', ', but the Symbols deck covers it.': '، لكن مجموعة الرموز تغطيه.',
    'Practice stop signs': 'تدرب على علامات الوقف', 'Lesson complete!': 'اكتمل الدرس!', 'is marked as done.': 'تم تسجيله مكتملا.',
    'Back to the path': 'العودة إلى المسار', 'All levels': 'كل المستويات',
    'Recite': 'تلاوة', 'Identify the rule': 'حدد الحكم', 'Concepts': 'المفاهيم', 'Concept': 'مفهوم', 'Colors': 'الألوان', 'Symbol': 'رمز',
    'The repetitive path. Each card shows a fragment of a verse: say it aloud, flip, press play, and compare. The cards you find hard come back sooner.': 'مسار التدريب المتكرر: اقرأ المقطع، ثم اقلب البطاقة واستمع وقارن. تعود البطاقات الصعبة للمراجعة أسرع.',
    'Review now': 'راجع الآن', 'Settings': 'الإعدادات', 'Smart review': 'مراجعة متباعدة', 'Free practice (shuffle)': 'تدريب حر بترتيب عشوائي',
    'Autoplay audio after flipping': 'تشغيل الصوت تلقائيا بعد قلب البطاقة', 'By level': 'بحسب المستوى', 'Rule symbols and colors': 'الرموز والألوان',
    'One deck per lesson': 'مجموعة لكل درس', 'All caught up!': 'أتممت المراجعات المستحقة!', 'No cards selected': 'لم تحدد أي نوع من البطاقات',
    'Nothing is due in this deck right now. You can practice everything anyway.': 'لا توجد مراجعات مستحقة في هذه المجموعة الآن. يمكنك التدرب على جميع بطاقاتها.',
    'Turn some card types back on in the settings.': 'فعل بعض أنواع البطاقات في الإعدادات.', 'Back to decks': 'العودة إلى المجموعات',
    'Session complete': 'اكتملت الجلسة', 'You reviewed': 'راجعت', '. Nice recitation!': '. بارك الله في تلاوتك!',
    'More decks': 'مجموعات أخرى', 'Practice again': 'تدرب مجددا', 'Again': 'أعدها', 'Hard': 'صعبة', 'Good': 'جيدة', 'Easy': 'سهلة',
    'Say it out loud, then flip the card.': 'اقرأ بصوت مسموع، ثم اقلب البطاقة.', 'Show answer': 'اعرض الإجابة',
    'Compare your recitation with the reciter’s.': 'قارن تلاوتك بتلاوة القارئ.', 'Lesson:': 'الدرس:', '(highlighted letters)': '(الحروف المحددة)',
    'Correct! This is': 'صحيح! الحكم هو', 'Not quite. This is': 'حاول مجددا. الحكم هو', 'Continue': 'تابع',
    'What is this sign called, and what does it tell you to do?': 'ما اسم هذه العلامة، وماذا تطلب منك؟',
    'Which tajweed rule uses this color?': 'أي حكم يدل عليه هذا اللون؟', 'Keys:': 'المفاتيح:', 'Space': 'المسافة', 'flip ·': 'للقلب ·', 'grade ·': 'للتقييم ·', 'play': 'للتشغيل',
    'Symbols of the Mushaf': 'رموز المصحف', 'Every small mark has a job. Tap a sign to see its name, what it means and an example from the Quran.': 'لكل علامة معنى. اختر علامة لترى اسمها ووظيفتها ومثالا من القرآن.',
    'Practice these as flashcards': 'تدرب عليها بالبطاقات', 'Tap a color to open its lesson. Longer madd means a deeper blue. Grays are quiet or hidden letters.': 'اختر لونا لفتح درسه. يدل الأزرق على المد، والرمادي على الحروف الساقطة أو غير المنطوقة. راجع اسم الحكم ومقداره بجانب كل لون.',
    'Practice the colors': 'تدرب على الألوان', 'About': 'عن ترتيل', 'About Tarteel': 'عن ترتيل',
    'Please learn with a teacher.': 'تعلم مع معلم متقن.', 'Counts and lengths': 'مقادير المدود', 'Credits': 'المصادر والشكر', 'Anki decks': 'مجموعات Anki',
    'Something went wrong': 'حدث خطأ', 'part of the verse': 'جزء من الآية',
    'Noor': 'نور', 'Noor, the Tarteel mascot': 'نور، رفيقك في ترتيل', 'Noor, the Tarteel mascot, holding an open book': 'نور، رفيقك في ترتيل، يحمل كتابا مفتوحا',
    'King Fahd Glorious Quran Printing Complex': 'مجمع الملك فهد لطباعة المصحف الشريف',
    'Text: Madinah Mushaf (Hafs ʿan ʿĀṣim) in the': 'النص: مصحف المدينة برواية حفص عن عاصم بخط', 'KFGQPC': 'مجمع الملك فهد',
    'Uthmanic script. Tajweed annotation and word timings via Quran.com. Recitation: Mahmoud Khalil Al-Husary.': 'العثماني. بيانات التجويد وتوقيت الكلمات من Quran.com. التلاوة: الشيخ محمود خليل الحصري.',
    'Tarteel is a study aid. Please learn with a qualified teacher, and recite back to them.': 'ترتيل وسيلة للمراجعة. تعلم مع معلم متقن واعرض عليه تلاوتك.', 'About & credits': 'عن ترتيل والمصادر',
    'Tarteel (': 'ترتيل (', ') means reciting the Quran slowly, clearly and in order. This project is a free study aid for learning tajweed: a step-by-step course, flashcards with audio, and the same content as Anki decks.': ') هو قراءة القرآن بتأن ووضوح. يقدم هذا المشروع منهجا مجانيا متدرجا وبطاقات مسموعة للتدرب على التجويد. النسخة العربية شرح موجز مكيف للمنهج؛ أما مجموعات Anki المتاحة فبالإنجليزية.',
    'Tajweed is learned by listening and reciting back to someone qualified. Use this as practice between lessons, not as a replacement.': 'يتعلم التجويد بالسماع والعرض على معلم متقن. استخدم الموقع للمراجعة والتدريب بين الدروس.',
    'Lengths of madd follow the common teaching for Hafs ʿan ʿĀṣim (Shāṭibiyyah): natural 2, connected and separated 4 to 5, necessary 6, and 2, 4 or 6 on stopping. If your teacher uses a different length, follow your teacher.': 'المقادير وفق التعليم الشائع لحفص عن عاصم من طريق الشاطبية: الطبيعي حركتان، والمتصل والمنفصل أربع أو خمس، واللازم ست، والعارض للسكون حركتان أو أربع أو ست. التزم الوجه الذي يقرئك به معلمك.',
    'Quran text, KFGQPC Uthmanic Hafs font © King Fahd Glorious Quran Printing Complex, used unmodified under its free-use license.': 'النص وخط حفص العثماني © مجمع الملك فهد لطباعة المصحف الشريف، مستخدمان دون تعديل وفق رخصة الاستخدام المجاني.',
    'Tajweed annotation, word timings and word-by-word meanings via the Quran.com API.': 'بيانات التجويد وتوقيت الكلمات والمعاني المفردة من واجهة Quran.com. تحذف المعاني الإنجليزية من العرض العربي.',
    'Recitation: Mahmoud Khalil Al-Husary (Murattal), via EveryAyah.com.': 'التلاوة: الشيخ محمود خليل الحصري، مرتل، من EveryAyah.com.',
    'Interface fonts: IBM Plex Sans Arabic, DM Sans and DM Mono (SIL Open Font License).': 'خطوط الواجهة: IBM Plex Sans Arabic للعربية وDM Sans وDM Mono للاتينية، برخصة SIL Open Font License.',
    'Natural-madd coloring on unmarked letters is added by this project.': 'أضاف المشروع تلوين المد الطبيعي في المواضع غير الملونة في المصدر.',
    'Review progress': 'تقدم المراجعة', 'No cards match your filters. Enable card types to practice this lesson.': 'لا تطابق أي بطاقات اختياراتك. فعل أنواع البطاقات للتدرب على هذا الدرس.',
    'Lesson steps': 'خطوات الدرس',
    'Course complete — revisit the path': 'أكملت المنهج — راجع المسار',
    'Could not load Arabic content.': 'تعذر تحميل المحتوى العربي.',
    'Next lesson': 'الدرس التالي', 'Review': 'المراجعة', 'A few minutes now keeps them fresh.': 'دقائق قليلة الآن تثبتها في ذاكرتك.',
    'Find a lesson or rule': 'ابحث عن درس أو حكم', 'No lessons match your search.': 'لا توجد دروس تطابق بحثك.', 'Playback speed': 'سرعة التشغيل',
    // home
    'See the whole path': 'اعرض المسار كاملا', 'Try it now': 'جرب الآن',
    'Press Listen. Each word lights up exactly as it is recited, and every color is a rule you will learn.': 'اضغط «استمع»: تضيء كل كلمة لحظة تلاوتها، وكل لون يدل على حكم ستتعلمه.',
    'Method': 'المنهج', 'How Tarteel teaches': 'كيف يعلمك ترتيل', 'Meet the rule': 'تعرف على الحكم',
    'One idea at a time: what it means, which letters trigger it, and how long it lasts.': 'فكرة واحدة في كل درس: معنى الحكم وحروفه ومقداره.',
    'Hear it in the Quran': 'اسمعه في القرآن',
    'Real verses with the reciter. Each word lights up as it is recited, and you can tap a word to hear it alone.': 'آيات بصوت القارئ، تضيء فيها كل كلمة عند تلاوتها، ويمكنك الضغط على أي كلمة لسماعها وحدها.',
    'Recite, then review': 'اتل ثم راجع',
    'Say it from memory before you listen. Cards come back just before you would forget them.': 'اقرأ من حفظك قبل أن تستمع، وتعود إليك البطاقات قبيل أن تنساها.',
    'Welcome back': 'مرحبا بعودتك', '{n} card is ready for review': '{n} بطاقة جاهزة للمراجعة', '{n} cards are ready for review': '{n} بطاقة جاهزة للمراجعة',
    'Ready for your next lesson': 'درسك التالي في انتظارك', 'You are all caught up': 'أتممت مراجعات اليوم',
    'A short session every day does more than a long one once a week.': 'جلسة قصيرة كل يوم أنفع من جلسة طويلة مرة في الأسبوع.',
    'Next lesson: {t}': 'الدرس التالي: {t}', 'Today’s goal': 'هدف اليوم', '{n} day in a row': 'أيام متتالية: {n}', '{n} days in a row': 'أيام متتالية: {n}',
    'Last 7 days': 'آخر 7 أيام', 'Recall this week': 'نسبة التذكر هذا الأسبوع', 'cards learned ·': 'بطاقة متعلمة ·',
    // lessons and audio
    'Hear it first': 'استمع أولا', 'Listen and repeat': 'استمع وردد', 'Your turn': 'دورك', 'Tap any word to hear it on its own.': 'اضغط على أي كلمة لسماعها وحدها.',
    'Play all': 'شغل الكل', 'Stop': 'إيقاف',
    // flashcards
    'End session': 'إنهاء الجلسة', 'Recordings stay on this device.': 'يبقى التسجيل على جهازك فقط.', 'Stop recording': 'أوقف التسجيل',
    'My recitation': 'تلاوتي', 'Record again': 'سجل مجددا', 'Record yourself': 'سجل تلاوتك',
    'How well did you know it?': 'ما مدى معرفتك بالإجابة؟', 'How close was your recitation?': 'ما مدى قرب تلاوتك من تلاوة القارئ؟',
    'You chose': 'اخترت', 'Right first time': 'صحيحة من أول مرة', 'Continue with {n} more': 'تابع مع {n} بطاقة أخرى',
    'The microphone is not available. Allow it in your browser to record.': 'تعذر الوصول إلى الميكروفون. اسمح به في المتصفح لتسجيل تلاوتك.',
    'Card types': 'أنواع البطاقات', 'Order': 'الترتيب', 'Audio': 'الصوت', 'New cards per day': 'البطاقات الجديدة يوميا', 'Daily goal': 'الهدف اليومي',
    // about
    'Recall before you listen.': 'استرجع قبل أن تستمع.',
    'You recite each fragment from memory first, then check it. Retrieving an answer strengthens memory more than rereading it.': 'تقرأ كل مقطع من حفظك أولا ثم تتحقق. استرجاع الإجابة يثبتها في الذاكرة أكثر من إعادة قراءتها.',
    'Spaced reviews.': 'مراجعة متباعدة.',
    'Each card returns after a growing interval, timed for just before you would forget it.': 'تعود كل بطاقة بعد مدة تطول تدريجيا، قبيل الوقت الذي تكاد تنساها فيه.',
    'Mixed practice.': 'تدريب متنوع.',
    'Reviews mix rules from different lessons, and the identify cards make you tell similar rules apart.': 'تجمع المراجعات أحكاما من دروس مختلفة، وبطاقات «حدد الحكم» تدربك على التمييز بين الأحكام المتشابهة.',
    'Listen, then echo.': 'استمع ثم ردد.',
    'Listen and repeat alternates the reciter with a silent turn for you, at full or reduced speed.': 'خاصية «استمع وردد» تتناوب بين تلاوة القارئ وفترة صمت تردد فيها، بالسرعة العادية أو بسرعة أبطأ.',
    'Feedback you can see and hear.': 'تقويم تراه وتسمعه.',
    'Words light up as they are recited, and your own recording plays next to the reciter’s, so you can hear what to adjust.': 'تضيء الكلمات عند تلاوتها، وتسمع تسجيلك بجانب تلاوة القارئ لتعرف ما تحتاج إلى تصحيحه.',
    'Your progress': 'تقدمك',
    'Progress is saved only in this browser. Export a backup to keep it safe or to move it to another device.': 'يحفظ تقدمك في هذا المتصفح فقط. صدر نسخة احتياطية لحفظه أو لنقله إلى جهاز آخر.',
    'Export backup': 'تصدير نسخة احتياطية', 'Import backup': 'استيراد نسخة احتياطية',
    'That file is not a Tarteel backup': 'هذا الملف ليس نسخة احتياطية من ترتيل', 'Backup imported': 'تم استيراد النسخة الاحتياطية',
    'Use offline': 'الاستخدام دون اتصال',
    'Save every recitation clip on this device, so the whole course works without a connection.': 'احفظ جميع المقاطع الصوتية على جهازك ليعمل المنهج كله دون اتصال بالإنترنت.',
    'Save audio for offline use': 'احفظ الصوت للاستخدام دون اتصال', 'All audio is saved on this device.': 'جميع المقاطع الصوتية محفوظة على هذا الجهاز.',
    'Some clips could not be saved. Check your connection and try again.': 'تعذر حفظ بعض المقاطع. تحقق من الاتصال ثم حاول مجددا.', 'Saving… {n}%': 'جار الحفظ… {n}%'
  };
  var active = false;
  function text(value) {
    if (!active) return value;
    var s = String(value), key = s.trim(), out = messages[key];
    if (out == null) {
      out = key
        .replace(/^Levels 0 to (\d+) · Madinah Mushaf$/, 'المستويات من 0 إلى $1 · مصحف المدينة')
        .replace(/^Levels 0 to (\d+), in order\. Each lesson shows the rule, what it means, examples, then flashcards\.$/, 'المستويات من 0 إلى $1 بالترتيب. في كل درس شرح للحكم وأمثلة ثم بطاقات للتدريب.')
        .replace(/^The same course is available as Anki decks: (\d+) cards with audio, organized into one deck per rule\.$/, 'تتوفر نسخة إنجليزية من المنهج بصيغة Anki: $1 بطاقة مسموعة، في مجموعة لكل حكم.')
        .replace(/^Start at Level 0 ↗$/, 'ابدأ بالمستوى 0 ↖').replace(/^Continue learning ↗$/, 'تابع التعلم ↖')
        .replace(/^Course complete — revisit the path ↗$/, 'أكملت المنهج — راجع المسار ↖')
        .replace(/^(\d+) cards? in the whole course$/, '$1 بطاقة في المنهج كله')
        .replace(/^This lesson has no flashcards, but the Symbols deck covers it\.$/, 'لا توجد بطاقات لهذا الدرس، لكن مجموعة الرموز تغطيه.')
        .replace(/ is marked as done\.$/, ' — تم تسجيله مكتملا.')
        .replace(/^Next: (.+) →$/, 'التالي: $1 ←')
        .replace(/^Level (\d+)$/, 'المستوى $1').replace(/^› Level (\d+)$/, '‹ المستوى $1')
        .replace(/^Level (\d+):$/, 'المستوى $1:').replace(/^Level (\d+): /, 'المستوى $1: ')
        .replace(/^Playback speed: (.+)$/, 'سرعة التشغيل: $1')
        .replace(/^(\d+) cards? due$/, '$1 بطاقة مستحقة')
        .replace(/^(\d+) cards?$/, '$1 بطاقة').replace(/^(\d+) miss(?:es)?$/, '$1 إجابة أعيد تدريبها')
        .replace(/^lessons ·$/, 'دروس ·').replace(/^in the whole course$/, 'في المنهج كله')
        .replace(/^due now ·$/, 'مستحقة الآن ·').replace(/^new for today$/, 'جديدة لليوم')
        .replace(/^(\d+) cards? · (\d+) due · (\d+) new$/, '$1 بطاقة · $2 مستحقة · $3 جديدة')
        .replace(/^(\d+) cards? · (\d+) new$/, '$1 بطاقة · $2 جديدة').replace(/^(\d+) cards? · (\d+) due$/, '$1 بطاقة · $2 مستحقة')
        .replace(/^Practice all (\d+) cards$/, 'تدرب على البطاقات كلها ($1)')
        .replace(/^Surah /, 'سورة ').replace(/^· Verse /, '· الآية ').replace(/^Mushaf p\. /, 'صفحة المصحف ')
        .replace(/^Listen to /, 'استمع إلى ').replace(/^Next:$/, 'التالي:')
        .replace(/^\((\d+) misses? came back for another try\)\. Nice recitation!$/, '(أعدت تدريب $1 من الإجابات). بارك الله في تلاوتك!')
        .replace(/^<10m(?= ·|$)/, 'أقل من 10 د').replace(/^(\d+)d(?= ·|$)/, '$1 ي').replace(/^(\d+)w(?= ·|$)/, '$1 أ').replace(/^(\d+)mo(?= ·|$)/, '$1 ش');
    }
    return s.slice(0, s.indexOf(key)) + out + s.slice(s.indexOf(key) + key.length);
  }
  function localize(root) {
    if (!active) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [], node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement.closest('script, style, .ar, .ar-inline, .letters, .big-sign, .swatch, .sw')) nodes.push(node);
    }
    nodes.forEach(function (n) { n.nodeValue = text(n.nodeValue); });
    [root].concat(Array.prototype.slice.call(root.querySelectorAll('[aria-label], [title], [placeholder]'))).forEach(function (el) {
      ['aria-label', 'title', 'placeholder'].forEach(function (attr) { if (el.hasAttribute(attr)) el.setAttribute(attr, text(el.getAttribute(attr))); });
    });
  }
  window.TarteelI18n = { text: text, localize: localize, use: function (language) { active = language === 'ar'; }, messages: messages };
})();
