/**
 * Shmiloku - Internationalization
 */

const LANGUAGES = {
    en: {
        name: 'English',
        dir: 'ltr',
        strings: {
            title: 'Shmiloku',
            subtitle: 'Number Placement Puzzle',
            play: 'Play',
            howToPlay: 'How to Play',
            settings: 'Settings',
            choosePuzzle: 'Choose Puzzle',
            undo: 'Undo',
            redo: 'Redo',
            notes: 'Notes',
            hint: 'Hint',
            erase: '\u00d7',
            back: '\u2190',
            puzzleComplete: 'Puzzle Complete!',
            time: 'Time',
            menu: 'Menu',
            nextPuzzle: 'Next Puzzle',
            easy: 'Easy',
            medium: 'Medium',
            hard: 'Hard',
            showErrors: 'Show Errors',
            showErrorsDesc: 'Highlight conflicting numbers',
            showTimer: 'Show Timer',
            showTimerDesc: 'Display elapsed time',
            language: 'Language',
            languageDesc: 'Choose your language',
            rule1Title: '1. Fill the Grid',
            rule1Text: 'Place numbers in every empty cell. Each cell belongs to a colored region.',
            rule2Title: '2. Region Rule',
            rule2Text: 'Each colored region of size N must contain the numbers 1 through N, each exactly once. For example, a region with 4 cells needs the numbers 1, 2, 3, and 4.',
            rule3Title: '3. Row & Column Rule',
            rule3Text: 'Each row and each column must contain unique numbers \u2014 no repeats allowed.',
            tipsTitle: 'Tips',
            tip1: 'Use Notes mode to mark possible candidates',
            tip2: 'Look for cells where only one number fits',
            tip3: 'Small regions (2-3 cells) are great starting points',
            tip4: 'Check both region AND row/column constraints together',
            rules: 'Rules'
        }
    },
    he: {
        name: '\u05e2\u05d1\u05e8\u05d9\u05ea',
        dir: 'rtl',
        strings: {
            title: 'Shmiloku',
            subtitle: '\u05e4\u05d0\u05d6\u05dc \u05de\u05e1\u05e4\u05e8\u05d9\u05dd',
            play: '\u05e9\u05d7\u05e7',
            howToPlay: '\u05d0\u05d9\u05da \u05dc\u05e9\u05d7\u05e7',
            settings: '\u05d4\u05d2\u05d3\u05e8\u05d5\u05ea',
            choosePuzzle: '\u05d1\u05d7\u05e8 \u05e4\u05d0\u05d6\u05dc',
            undo: '\u05d1\u05d8\u05dc',
            redo: '\u05e9\u05d7\u05d6\u05e8',
            notes: '\u05e8\u05e9\u05d9\u05de\u05d5\u05ea',
            hint: '\u05e8\u05de\u05d6',
            erase: '\u00d7',
            back: '\u2192',
            puzzleComplete: '!\u05db\u05dc \u05d4\u05db\u05d1\u05d5\u05d3',
            time: '\u05d6\u05de\u05df',
            menu: '\u05ea\u05e4\u05e8\u05d9\u05d8',
            nextPuzzle: '\u05e4\u05d0\u05d6\u05dc \u05d4\u05d1\u05d0',
            easy: '\u05e7\u05dc',
            medium: '\u05d1\u05d9\u05e0\u05d5\u05e0\u05d9',
            hard: '\u05e7\u05e9\u05d4',
            showErrors: '\u05d4\u05e6\u05d2 \u05e9\u05d2\u05d9\u05d0\u05d5\u05ea',
            showErrorsDesc: '\u05d4\u05d3\u05d2\u05e9 \u05de\u05e1\u05e4\u05e8\u05d9\u05dd \u05de\u05ea\u05e0\u05d2\u05e9\u05d9\u05dd',
            showTimer: '\u05d4\u05e6\u05d2 \u05d8\u05d9\u05d9\u05de\u05e8',
            showTimerDesc: '\u05d4\u05e6\u05d2 \u05d6\u05de\u05df \u05e9\u05e2\u05d1\u05e8',
            language: '\u05e9\u05e4\u05d4',
            languageDesc: '\u05d1\u05d7\u05e8 \u05e9\u05e4\u05d4',
            rule1Title: '1. \u05de\u05dc\u05d0 \u05d0\u05ea \u05d4\u05dc\u05d5\u05d7',
            rule1Text: '\u05d4\u05db\u05e0\u05e1 \u05de\u05e1\u05e4\u05e8\u05d9\u05dd \u05d1\u05db\u05dc \u05ea\u05d0 \u05e8\u05d9\u05e7. \u05db\u05dc \u05ea\u05d0 \u05e9\u05d9\u05d9\u05da \u05dc\u05d0\u05d6\u05d5\u05e8 \u05e6\u05d1\u05e2\u05d5\u05e0\u05d9.',
            rule2Title: '2. \u05db\u05dc\u05dc \u05d4\u05d0\u05d6\u05d5\u05e8',
            rule2Text: '\u05db\u05dc \u05d0\u05d6\u05d5\u05e8 \u05e6\u05d1\u05e2\u05d5\u05e0\u05d9 \u05d1\u05d2\u05d5\u05d3\u05dc N \u05d7\u05d9\u05d9\u05d1 \u05dc\u05d4\u05db\u05d9\u05dc \u05d0\u05ea \u05d4\u05de\u05e1\u05e4\u05e8\u05d9\u05dd 1 \u05e2\u05d3 N, \u05db\u05dc \u05d0\u05d7\u05d3 \u05e4\u05e2\u05dd \u05d0\u05d7\u05ea. \u05dc\u05de\u05e9\u05dc, \u05d0\u05d6\u05d5\u05e8 \u05e2\u05dd 4 \u05ea\u05d0\u05d9\u05dd \u05e6\u05e8\u05d9\u05da \u05d0\u05ea \u05d4\u05de\u05e1\u05e4\u05e8\u05d9\u05dd 1, 2, 3, 4.',
            rule3Title: '3. \u05db\u05dc\u05dc \u05e9\u05d5\u05e8\u05d4 \u05d5\u05e2\u05de\u05d5\u05d3\u05d4',
            rule3Text: '\u05db\u05dc \u05e9\u05d5\u05e8\u05d4 \u05d5\u05db\u05dc \u05e2\u05de\u05d5\u05d3\u05d4 \u05d7\u05d9\u05d9\u05d1\u05d5\u05ea \u05dc\u05d4\u05db\u05d9\u05dc \u05de\u05e1\u05e4\u05e8\u05d9\u05dd \u05d9\u05d9\u05d7\u05d5\u05d3\u05d9\u05d9\u05dd \u2014 \u05d1\u05dc\u05d9 \u05d7\u05d6\u05e8\u05d5\u05ea.',
            tipsTitle: '\u05d8\u05d9\u05e4\u05d9\u05dd',
            tip1: '\u05d4\u05e9\u05ea\u05de\u05e9 \u05d1\u05de\u05e6\u05d1 \u05e8\u05e9\u05d9\u05de\u05d5\u05ea \u05dc\u05e1\u05d9\u05de\u05d5\u05df \u05d0\u05e4\u05e9\u05e8\u05d5\u05d9\u05d5\u05ea',
            tip2: '\u05d7\u05e4\u05e9 \u05ea\u05d0\u05d9\u05dd \u05e9\u05e8\u05e7 \u05de\u05e1\u05e4\u05e8 \u05d0\u05d7\u05d3 \u05de\u05ea\u05d0\u05d9\u05dd \u05dc\u05d4\u05dd',
            tip3: '\u05d0\u05d6\u05d5\u05e8\u05d9\u05dd \u05e7\u05d8\u05e0\u05d9\u05dd (2-3 \u05ea\u05d0\u05d9\u05dd) \u05d4\u05dd \u05e0\u05e7\u05d5\u05d3\u05ea \u05d4\u05ea\u05d7\u05dc\u05d4 \u05de\u05e2\u05d5\u05dc\u05d4',
            tip4: '\u05d1\u05d3\u05d5\u05e7 \u05d0\u05ea \u05d0\u05d9\u05dc\u05d5\u05e6\u05d9 \u05d4\u05d0\u05d6\u05d5\u05e8 \u05d9\u05d7\u05d3 \u05e2\u05dd \u05d0\u05d9\u05dc\u05d5\u05e6\u05d9 \u05d4\u05e9\u05d5\u05e8\u05d4/\u05e2\u05de\u05d5\u05d3\u05d4',
            rules: '\u05d7\u05d5\u05e7\u05d9\u05dd'
        }
    },
    ru: {
        name: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439',
        dir: 'ltr',
        strings: {
            title: 'Shmiloku',
            subtitle: '\u0427\u0438\u0441\u043b\u043e\u0432\u0430\u044f \u0433\u043e\u043b\u043e\u0432\u043e\u043b\u043e\u043c\u043a\u0430',
            play: '\u0418\u0433\u0440\u0430\u0442\u044c',
            howToPlay: '\u041a\u0430\u043a \u0438\u0433\u0440\u0430\u0442\u044c',
            settings: '\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438',
            choosePuzzle: '\u0412\u044b\u0431\u0435\u0440\u0438 \u0433\u043e\u043b\u043e\u0432\u043e\u043b\u043e\u043c\u043a\u0443',
            undo: '\u041e\u0442\u043c\u0435\u043d\u0430',
            redo: '\u0412\u0435\u0440\u043d\u0443\u0442\u044c',
            notes: '\u0417\u0430\u043c\u0435\u0442\u043a\u0438',
            hint: '\u041f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0430',
            erase: '\u00d7',
            back: '\u2190',
            puzzleComplete: '\u0413\u043e\u043b\u043e\u0432\u043e\u043b\u043e\u043c\u043a\u0430 \u0440\u0435\u0448\u0435\u043d\u0430!',
            time: '\u0412\u0440\u0435\u043c\u044f',
            menu: '\u041c\u0435\u043d\u044e',
            nextPuzzle: '\u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0430\u044f',
            easy: '\u041b\u0451\u0433\u043a\u0438\u0439',
            medium: '\u0421\u0440\u0435\u0434\u043d\u0438\u0439',
            hard: '\u0421\u043b\u043e\u0436\u043d\u044b\u0439',
            showErrors: '\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u043e\u0448\u0438\u0431\u043a\u0438',
            showErrorsDesc: '\u041f\u043e\u0434\u0441\u0432\u0435\u0442\u0438\u0442\u044c \u043a\u043e\u043d\u0444\u043b\u0438\u043a\u0442\u044b',
            showTimer: '\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u0442\u0430\u0439\u043c\u0435\u0440',
            showTimerDesc: '\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u0432\u0440\u0435\u043c\u044f',
            language: '\u042f\u0437\u044b\u043a',
            languageDesc: '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u044f\u0437\u044b\u043a',
            rule1Title: '1. \u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u0441\u0435\u0442\u043a\u0443',
            rule1Text: '\u041f\u043e\u0441\u0442\u0430\u0432\u044c\u0442\u0435 \u0447\u0438\u0441\u043b\u0430 \u0432 \u043a\u0430\u0436\u0434\u0443\u044e \u043f\u0443\u0441\u0442\u0443\u044e \u043a\u043b\u0435\u0442\u043a\u0443. \u041a\u0430\u0436\u0434\u0430\u044f \u043a\u043b\u0435\u0442\u043a\u0430 \u043f\u0440\u0438\u043d\u0430\u0434\u043b\u0435\u0436\u0438\u0442 \u0446\u0432\u0435\u0442\u043d\u043e\u043c\u0443 \u0440\u0435\u0433\u0438\u043e\u043d\u0443.',
            rule2Title: '2. \u041f\u0440\u0430\u0432\u0438\u043b\u043e \u0440\u0435\u0433\u0438\u043e\u043d\u0430',
            rule2Text: '\u041a\u0430\u0436\u0434\u044b\u0439 \u0446\u0432\u0435\u0442\u043d\u043e\u0439 \u0440\u0435\u0433\u0438\u043e\u043d \u0440\u0430\u0437\u043c\u0435\u0440\u043e\u043c N \u0434\u043e\u043b\u0436\u0435\u043d \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0447\u0438\u0441\u043b\u0430 \u043e\u0442 1 \u0434\u043e N, \u043a\u0430\u0436\u0434\u043e\u0435 \u0440\u043e\u0432\u043d\u043e \u043e\u0434\u0438\u043d \u0440\u0430\u0437. \u041d\u0430\u043f\u0440\u0438\u043c\u0435\u0440, \u0440\u0435\u0433\u0438\u043e\u043d \u0438\u0437 4 \u043a\u043b\u0435\u0442\u043e\u043a \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0447\u0438\u0441\u043b\u0430 1, 2, 3, 4.',
            rule3Title: '3. \u041f\u0440\u0430\u0432\u0438\u043b\u043e \u0441\u0442\u0440\u043e\u043a/\u0441\u0442\u043e\u043b\u0431\u0446\u043e\u0432',
            rule3Text: '\u041a\u0430\u0436\u0434\u0430\u044f \u0441\u0442\u0440\u043e\u043a\u0430 \u0438 \u043a\u0430\u0436\u0434\u044b\u0439 \u0441\u0442\u043e\u043b\u0431\u0435\u0446 \u0434\u043e\u043b\u0436\u043d\u044b \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0443\u043d\u0438\u043a\u0430\u043b\u044c\u043d\u044b\u0435 \u0447\u0438\u0441\u043b\u0430 \u2014 \u0431\u0435\u0437 \u043f\u043e\u0432\u0442\u043e\u0440\u043e\u0432.',
            tipsTitle: '\u0421\u043e\u0432\u0435\u0442\u044b',
            tip1: '\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0439\u0442\u0435 \u0440\u0435\u0436\u0438\u043c \u0437\u0430\u043c\u0435\u0442\u043e\u043a \u0434\u043b\u044f \u043e\u0442\u043c\u0435\u0442\u043a\u0438 \u043a\u0430\u043d\u0434\u0438\u0434\u0430\u0442\u043e\u0432',
            tip2: '\u0418\u0449\u0438\u0442\u0435 \u043a\u043b\u0435\u0442\u043a\u0438, \u0433\u0434\u0435 \u043f\u043e\u0434\u0445\u043e\u0434\u0438\u0442 \u0442\u043e\u043b\u044c\u043a\u043e \u043e\u0434\u043d\u043e \u0447\u0438\u0441\u043b\u043e',
            tip3: '\u041c\u0430\u043b\u0435\u043d\u044c\u043a\u0438\u0435 \u0440\u0435\u0433\u0438\u043e\u043d\u044b (2-3 \u043a\u043b\u0435\u0442\u043a\u0438) \u2014 \u043e\u0442\u043b\u0438\u0447\u043d\u043e\u0435 \u043d\u0430\u0447\u0430\u043b\u043e',
            tip4: '\u041f\u0440\u043e\u0432\u0435\u0440\u044f\u0439\u0442\u0435 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u044f \u0440\u0435\u0433\u0438\u043e\u043d\u0430 \u0438 \u0441\u0442\u0440\u043e\u043a\u0438/\u0441\u0442\u043e\u043b\u0431\u0446\u0430 \u0432\u043c\u0435\u0441\u0442\u0435',
            rules: '\u041f\u0440\u0430\u0432\u0438\u043b\u0430'
        }
    }
};

class I18n {
    constructor() {
        this.lang = Storage.load('language') || this._detectLanguage();
        this.listeners = [];
    }

    _detectLanguage() {
        const nav = navigator.language || 'en';
        if (nav.startsWith('he')) return 'he';
        if (nav.startsWith('ru')) return 'ru';
        return 'en';
    }

    t(key) {
        const lang = LANGUAGES[this.lang];
        return (lang && lang.strings[key]) || LANGUAGES.en.strings[key] || key;
    }

    get dir() {
        return LANGUAGES[this.lang]?.dir || 'ltr';
    }

    setLanguage(lang) {
        if (!LANGUAGES[lang]) return;
        this.lang = lang;
        Storage.save('language', lang);
        document.documentElement.dir = this.dir;
        document.documentElement.lang = lang;
        this.listeners.forEach(fn => fn());
    }

    onChange(fn) {
        this.listeners.push(fn);
    }

    getAvailableLanguages() {
        return Object.entries(LANGUAGES).map(([code, lang]) => ({
            code,
            name: lang.name
        }));
    }
}
