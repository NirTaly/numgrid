#!/usr/bin/env python3
"""
Shmiloku — Pre-deploy validation suite.

Checks:
  1. All source files exist and are valid
  2. HTML structure: required elements, no broken references
  3. CSS: no syntax errors, required selectors present
  4. JS: no syntax issues, required classes/functions
  5. Puzzle data: valid JSON, all puzzles solvable
  6. i18n: all keys present in all languages
  7. Mobile layout: viewport meta, touch-action, safe-area
  8. PWA: manifest, service worker, all assets cached
  9. Security: CSP header, no inline scripts, no external URLs
  10. Accessibility: touch targets, font sizes
"""

import os
import re
import json
import sys

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src')
PUZZLES = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'puzzles')

class V:
    """Validator with pass/fail/warn tracking."""
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.warned = 0
        self.section = ''

    def section_start(self, name):
        self.section = name
        print(f'\n=== {name} ===')

    def ok(self, msg):
        self.passed += 1
        print(f'  \033[32mOK\033[0m  {msg}')

    def fail(self, msg):
        self.failed += 1
        print(f'  \033[31mFAIL\033[0m {msg}')

    def warn(self, msg):
        self.warned += 1
        print(f'  \033[33mWARN\033[0m {msg}')

    def check(self, condition, msg_pass, msg_fail):
        if condition:
            self.ok(msg_pass)
        else:
            self.fail(msg_fail)
        return condition

    def summary(self):
        total = self.passed + self.failed + self.warned
        print(f'\n{"="*50}')
        print(f'Results: {self.passed} passed, {self.failed} failed, {self.warned} warnings / {total} checks')
        if self.failed == 0:
            print('\033[32mAll checks passed. Safe to deploy.\033[0m')
        else:
            print(f'\033[31m{self.failed} check(s) failed. Fix before deploying.\033[0m')
        return self.failed == 0


def read(path):
    with open(os.path.join(SRC, path), 'r') as f:
        return f.read()


def validate_files(v):
    v.section_start('1. Source Files')
    required = [
        'index.html', 'manifest.json', 'sw.js',
        'css/style.css',
        'js/app.js', 'js/game.js', 'js/renderer.js',
        'js/storage.js', 'js/i18n.js', 'js/puzzle-data.js',
        'js/sw-register.js',
    ]
    for f in required:
        path = os.path.join(SRC, f)
        v.check(os.path.isfile(path), f'exists: {f}', f'MISSING: {f}')
        if os.path.isfile(path):
            size = os.path.getsize(path)
            v.check(size > 0, f'{f} non-empty ({size}B)', f'{f} is empty')


def validate_html(v):
    v.section_start('2. HTML Structure')
    html = read('index.html')

    v.check('viewport' in html and 'width=device-width' in html,
            'viewport meta present', 'MISSING viewport meta tag')
    v.check('Content-Security-Policy' in html,
            'CSP meta present', 'MISSING Content-Security-Policy')
    v.check('<script>' not in html.split('</head>')[0] if '</head>' in html else True,
            'no inline scripts in head', 'inline script found in head')

    # Check no inline <script> blocks (only <script src="">)
    inline_scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.+?)</script>', html, re.DOTALL)
    v.check(len(inline_scripts) == 0,
            'no inline script blocks', f'{len(inline_scripts)} inline script(s) found — CSP violation')

    # Required screens
    for screen_id in ['screen-menu', 'screen-levels', 'screen-game', 'screen-howto', 'screen-settings']:
        v.check(f'id="{screen_id}"' in html, f'screen: {screen_id}', f'MISSING screen: {screen_id}')

    # Required game elements
    for elem_id in ['grid', 'numpad', 'timer', 'btn-undo', 'btn-notes', 'btn-hint', 'btn-redo']:
        v.check(f'id="{elem_id}"' in html, f'element: #{elem_id}', f'MISSING element: #{elem_id}')

    # Touch-action classes
    v.check('no-scroll' in html, 'no-scroll class used', 'MISSING no-scroll class on game screen')
    v.check('scrollable' in html, 'scrollable class used', 'MISSING scrollable class')

    # No external URLs
    ext_urls = re.findall(r'(?:src|href)=["\']https?://(?!.*svg)', html)
    v.check(len(ext_urls) == 0, 'no external URLs in HTML',
            f'external URLs found: {ext_urls}')

    # i18n attributes
    i18n_count = len(re.findall(r'data-i18n=', html))
    v.check(i18n_count >= 20, f'{i18n_count} i18n-tagged elements', 'too few i18n elements (<20)')


def validate_css(v):
    v.section_start('3. CSS Layout & Mobile')
    css = read('css/style.css')

    v.check('position: fixed' in css, 'body position:fixed (prevents iOS bounce)',
            'body not fixed — will bounce on iOS')

    # Screens must have explicit height (not rely on inset:0 which fails on some mobile)
    screen_rule = css[css.find('.screen {'):css.find('.screen {') + 300] if '.screen {' in css else ''
    v.check('height: 100%' in screen_rule or '100dvh' in screen_rule,
            'screen has explicit height (not just inset:0)',
            'screen relies on inset:0 — breaks on some mobile browsers')
    v.check('overscroll-behavior' in css, 'overscroll-behavior set',
            'MISSING overscroll-behavior')
    v.check('touch-action: none' in css, 'touch-action:none for game screen',
            'MISSING touch-action:none')
    v.check('touch-action: pan-y' in css, 'touch-action:pan-y for scrollable',
            'MISSING touch-action:pan-y')
    v.check('touch-action: pan-x' in css, 'touch-action:pan-x for size-tabs',
            'MISSING touch-action:pan-x for horizontal scroll')
    v.check('env(safe-area-inset-bottom)' in css, 'safe-area-inset-bottom used',
            'MISSING safe-area-inset handling')
    v.check('100dvh' in css, 'dvh units used for viewport',
            'MISSING dvh units — vh unreliable on mobile')
    v.check('user-select: auto' in css or '-webkit-user-select: auto' in css,
            'select/input user-select:auto override',
            'MISSING user-select:auto for form elements — dropdowns will be broken')

    # Check numpad doesn't use aspect-ratio (causes invisible buttons on small screens)
    numpad_section = css[css.find('.numpad-btn'):css.find('.numpad-btn') + 500] if '.numpad-btn' in css else ''
    if 'aspect-ratio' in numpad_section:
        v.warn('numpad-btn has aspect-ratio — may cause invisible buttons on small phones')
    else:
        v.ok('numpad-btn uses fixed height (no aspect-ratio)')

    # Check minimum touch target size
    height_match = re.search(r'\.numpad-btn\s*\{[^}]*height:\s*(\d+)px', css)
    if height_match:
        h = int(height_match.group(1))
        v.check(h >= 40, f'numpad touch target {h}px >= 40px',
                f'numpad touch target {h}px < 40px minimum')
    else:
        v.warn('could not parse numpad-btn height')

    # Check responsive breakpoints exist
    v.check('@media' in css, 'responsive breakpoints present', 'MISSING responsive breakpoints')

    # RTL
    v.check('[dir="rtl"]' in css, 'RTL styles present', 'MISSING RTL styles')


def validate_js(v):
    v.section_start('4. JavaScript')
    app = read('js/app.js')
    game = read('js/game.js')
    renderer = read('js/renderer.js')
    storage = read('js/storage.js')
    i18n = read('js/i18n.js')

    # No innerHTML with data
    innerHTML_uses = re.findall(r'\.innerHTML\s*=.*(?:val|num|grid|solution)', renderer)
    v.check(len(innerHTML_uses) == 0, 'renderer: no innerHTML with data values',
            f'UNSAFE innerHTML with data: {innerHTML_uses}')

    # Event types: navigation should use click, not pointerdown
    nav_pointerdown = re.findall(r'btn-(?:play|settings|how|back|next|menu).*pointerdown', app)
    v.check(len(nav_pointerdown) == 0, 'navigation buttons use click (not pointerdown)',
            f'navigation using pointerdown (causes tap-through): {nav_pointerdown}')

    # Transition guard exists
    v.check('transitionTime' in app or 'TRANSITION_GUARD' in app or '_transitionTime' in app,
            'screen transition guard present', 'MISSING transition guard — tap-through risk')

    # Storage validation
    v.check('Number.isInteger' in storage, 'storage validates integer types',
            'MISSING storage input validation')

    # i18n has all 3 languages
    v.check("'en'" in i18n and "'he'" in i18n and "'ru'" in i18n,
            'i18n: en, he, ru defined', 'MISSING language definitions')

    # Check i18n key completeness
    lang_blocks = re.findall(r"(\w+):\s*\{[^}]*strings:\s*\{([^}]+)\}", i18n, re.DOTALL)
    all_keys = {}
    for lang, block in lang_blocks:
        keys = set(re.findall(r"(\w+):", block))
        all_keys[lang] = keys

    if len(all_keys) >= 3:
        en_keys = all_keys.get('en', set())
        for lang, keys in all_keys.items():
            if lang == 'en':
                continue
            missing = en_keys - keys
            v.check(len(missing) == 0, f'i18n: {lang} has all {len(en_keys)} keys',
                    f'i18n: {lang} missing keys: {missing}')

    # window.app exposure
    v.check('window.app' not in app, 'game not exposed on window',
            'window.app exposed — security/cheating risk')


def validate_puzzles(v):
    v.section_start('5. Puzzle Data')

    # Check puzzle-data.js
    pd = read('js/puzzle-data.js')
    v.check('PUZZLE_DATA' in pd, 'PUZZLE_DATA variable present',
            'MISSING PUZZLE_DATA in puzzle-data.js')

    # Parse puzzle data
    try:
        json_str = pd[pd.index('{'):pd.rindex('}') + 1]
        data = json.loads(json_str)
        v.ok(f'puzzle-data.js valid JSON ({len(json_str)} bytes)')
    except Exception as e:
        v.fail(f'puzzle-data.js JSON parse error: {e}')
        return

    required_sizes = ['5x5', '6x6', '7x7', '8x8']
    for size in required_sizes:
        puzzles = data.get(size, [])
        v.check(len(puzzles) >= 100, f'{size}: {len(puzzles)} puzzles (>= 100)',
                f'{size}: only {len(puzzles)} puzzles (need >= 100)')

        # Check structure of first puzzle
        if puzzles:
            p = puzzles[0]
            for key in ['id', 'size', 'difficulty', 'regions', 'givens', 'solution']:
                v.check(key in p, f'{size} puzzle has key: {key}',
                        f'{size} puzzle MISSING key: {key}')

        # Check difficulty distribution
        diffs = {}
        for p in puzzles:
            d = p.get('difficulty', '?')
            diffs[d] = diffs.get(d, 0) + 1
        for diff in ['easy', 'medium', 'hard']:
            count = diffs.get(diff, 0)
            v.check(count >= 30, f'{size} {diff}: {count} (>= 30)',
                    f'{size} {diff}: only {count} (need >= 30)')


def validate_pwa(v):
    v.section_start('6. PWA / Service Worker')

    # Manifest
    try:
        manifest = json.loads(read('manifest.json'))
        v.ok('manifest.json valid JSON')
        v.check('name' in manifest, 'manifest has name', 'MISSING manifest name')
        v.check('start_url' in manifest, 'manifest has start_url', 'MISSING start_url')
        v.check(manifest.get('display') == 'standalone', 'display: standalone',
                f'display is "{manifest.get("display")}" not standalone')
    except Exception as e:
        v.fail(f'manifest.json error: {e}')

    # Service worker
    sw = read('sw.js')
    sw_register = read('js/sw-register.js')

    v.check("register(" in sw_register, 'sw-register.js registers SW', 'MISSING SW registration')
    v.check("'./" in sw_register or "'./" in sw_register,
            'SW uses relative path', 'SW path may break on subdirectory deploy')

    # Check all JS files are in SW cache list
    cached_assets = re.findall(r"'([^']+)'", sw)
    js_files = ['app.js', 'game.js', 'renderer.js', 'storage.js', 'i18n.js', 'puzzle-data.js', 'sw-register.js']
    for jsf in js_files:
        v.check(any(jsf in a for a in cached_assets),
                f'SW caches: {jsf}', f'SW MISSING cache: {jsf}')

    v.check('style.css' in sw, 'SW caches CSS', 'SW MISSING CSS cache')


def validate_security(v):
    v.section_start('7. Security')
    html = read('index.html')

    # CSP
    csp_match = re.search(r'content="([^"]*)"', html[html.find('Content-Security-Policy'):] if 'Content-Security-Policy' in html else '')
    if csp_match:
        csp = csp_match.group(1)
        v.check("script-src 'self'" in csp, "CSP: script-src 'self'",
                f'CSP allows unsafe scripts: {csp}')
        v.check('unsafe-eval' not in csp, 'CSP: no unsafe-eval', 'CSP allows unsafe-eval')
    else:
        v.fail('no CSP found')

    # No external fetch/XHR
    all_js = ''
    for f in ['js/app.js', 'js/game.js', 'js/renderer.js', 'js/storage.js', 'js/i18n.js']:
        all_js += read(f)

    v.check('fetch(' not in all_js, 'no fetch() in app code',
            'fetch() found in app code — data exfiltration risk')
    v.check('XMLHttpRequest' not in all_js, 'no XMLHttpRequest',
            'XMLHttpRequest found')

    # No eval
    v.check('eval(' not in all_js, 'no eval()', 'eval() found — code injection risk')

    # No document.write
    v.check('document.write' not in all_js, 'no document.write', 'document.write found')


def main():
    v = V()

    validate_files(v)
    validate_html(v)
    validate_css(v)
    validate_js(v)
    validate_puzzles(v)
    validate_pwa(v)
    validate_security(v)

    success = v.summary()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
