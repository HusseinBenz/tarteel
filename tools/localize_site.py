"""Build the Arabic website overlay without changing Quran text or card IDs."""
from copy import deepcopy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def arabic_model(model: dict) -> dict:
    source = json.loads((ROOT / 'content/ar.json').read_text('utf8'))
    authored_lessons = {lesson['id']: lesson
                        for path in (ROOT / 'content/levels').glob('*.json')
                        for lesson in json.loads(path.read_text('utf8'))['lessons']}
    result = deepcopy(model)
    for level, translated in zip(result['levels'], source['levels'], strict=True):
        level.update(title=translated[0], tagline=translated[1], intro=translated[1])
    for lid, lesson in result['lessons'].items():
        if lid.startswith('surah-'):
            summary = 'اقرأ آيات ' + lesson['arabic'] + ' مرتبة، وراجع الأحكام التي تعلمتها.'
            translated = [summary, 'استمع إلى تلاوة الشيخ الحصري، ثم أعد كل آية ووازن بين تلاوتك وتلاوته.', 'اقرأ الآية بصوت مسموع.|انتبه للألوان وعلامات الوقف.|استمع ثم أعد التلاوة.']
        else:
            translated = source['lessons'][lid]
        lesson.update(title=lesson['arabic'], meaning=translated[0], summary=translated[0],
                      explain=translated[1].split('|'), how=translated[2].split('|'),
                      spot=None, tips=[], mistakes=[], letters_label='حروف الحكم' if lesson['letters'] else None)
        if lesson['counts'] and lesson['counts'] != '—':
            lesson['counts'] = source['counts'][lesson['counts']]
        if lid == 'idhhar-shafawi':
            lesson['letters'] = 'كل الحروف عدا ب وم'
        if lesson['identify']:
            lesson['identify'] = 'ما حكم الحروف المحددة في هذا الموضع؟'
        for example in lesson['examples'] + lesson['showcase']:
            example['note'] = 'تدرب على ' + lesson['arabic'] + ' في هذا الموضع، واستمع إلى أداء القارئ.'
    for card in result['cards']:
        if card['t'] == 'i':
            card['prompt'] = 'ما حكم الحروف المحددة في هذا الموضع؟'
        if card['t'] != 'c':
            continue
        lid = card['lesson']
        lesson = result['lessons'][lid]
        original = model['lessons'][lid]
        number = int(card['id'].rsplit(':', 1)[1])
        authored = source['cards'].get(lid, [])
        auto = 0
        if authored_lessons[lid].get('auto_cards', True):
            auto = 1 + bool(original['how']) + bool(original['letters'] and original['letters_label']) + bool(original['counts'] and original['counts'] != '—')
        actual = sum(c['t'] == 'c' for c in model['cards'] if c.get('lesson') == lid)
        if auto + len(authored) != actual:
            raise ValueError(f'Arabic concept cards out of date for {lid}: expected {actual}, found {auto + len(authored)}')
        if number <= auto:
            pairs = [('ما المقصود بـ' + lesson['arabic'] + '؟', lesson['summary']),
                     ]
            if original['how']:
                pairs.append(('كيف تطبق ' + lesson['arabic'] + '؟', ' '.join(lesson['how'])))
            if original['letters'] and original['letters_label']:
                pairs.append(('ما حروف ' + lesson['arabic'] + '؟', lesson['letters']))
            if original['counts'] and original['counts'] != '—':
                pairs.append(('ما مقدار ' + lesson['arabic'] + '؟', lesson['counts']))
            card['q'], card['a'] = pairs[number - 1]
        else:
            card['q'], card['a'] = authored[number - auto - 1]
    for group in result['symbols']:
        group['title'], group['blurb'] = source['groups'][group['id']]
        for item in group['items']:
            item['name'] = item['arabic']
            item['meaning'], item['action'] = source['symbols'][item['id']]
            if 'note' in item:
                item['note'] = 'لاحظ العلامة في المثال واستمع إلى طريقة أدائها.'
    for color in result['legend']:
        color['name'] = color['arabic']
        color['short'] = source['colors'][color['id']]
    for fragment in result['frags'].values():
        # English word glosses are not Quran translations and are omitted in Arabic.
        fragment['gloss'] = ''
        fragment['surah_name'] = fragment['surah_arabic']
        fragment['label'] = 'سورة ' + fragment['surah_arabic'] + '، الآية ' + str(fragment['ayah'])
    for deck in result['decks']:
        if deck['id'] == 'all':
            deck['title'] = 'جميع البطاقات'
        elif deck['kind'] == 'level':
            deck['title'] = 'المستوى ' + str(deck['level']) + ' · ' + result['levels'][deck['level']]['title']
        elif deck['id'].startswith('lesson-'):
            deck['title'] = result['lessons'][deck['id'][7:]]['title']
        else:
            deck['title'] = source['decks'][deck['id']]
    return result
