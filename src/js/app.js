/**
 * NumGrid - Main App Controller
 */

class App {
    constructor() {
        this.game = new OneUpGame();
        this.renderer = null;
        this.currentScreen = 'menu';
        this.selectedSize = '5x5';
        this.puzzleBank = {};

        this.init();
    }

    init() {
        // Load puzzle data
        if (typeof PUZZLE_DATA !== 'undefined') {
            this.puzzleBank = PUZZLE_DATA;
        }

        // Load settings
        const settings = Storage.getSettings();
        this.game.showErrors = settings.showErrors;

        // Setup event listeners
        this._setupEvents();

        // Check for saved game
        const saved = Storage.loadGameState();
        if (saved && saved.puzzleId) {
            this._showResumePrompt(saved);
        }

        // Show menu
        this.showScreen('menu');
    }

    showScreen(name) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(`screen-${name}`);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = name;
        }

        if (name === 'levels') {
            this._renderLevelSelect();
        }
    }

    // ============================================================
    // LEVEL SELECT
    // ============================================================

    _renderLevelSelect() {
        const container = document.getElementById('level-list');
        container.innerHTML = '';

        // Size tabs
        const tabs = document.getElementById('size-tabs');
        tabs.innerHTML = '';
        const sizes = Object.keys(this.puzzleBank).sort();

        sizes.forEach(size => {
            const tab = document.createElement('button');
            tab.className = `size-tab ${size === this.selectedSize ? 'active' : ''}`;
            tab.textContent = size;
            tab.onclick = () => {
                this.selectedSize = size;
                this._renderLevelSelect();
            };
            tabs.appendChild(tab);
        });

        // Puzzles for selected size
        const puzzles = this.puzzleBank[this.selectedSize] || [];
        const completed = Storage.getCompleted();

        const diffs = ['easy', 'medium', 'hard'];
        const diffLabels = {easy: 'Easy', medium: 'Medium', hard: 'Hard'};
        const diffStars = {easy: '\u2605', medium: '\u2605\u2605', hard: '\u2605\u2605\u2605'};

        for (const diff of diffs) {
            const diffPuzzles = puzzles.filter(p => p.difficulty === diff);
            if (diffPuzzles.length === 0) continue;

            const section = document.createElement('div');
            section.className = 'diff-section';

            const h3 = document.createElement('h3');
            h3.textContent = `${diffLabels[diff]} ${diffStars[diff]}`;
            section.appendChild(h3);

            const grid = document.createElement('div');
            grid.className = 'level-grid';

            diffPuzzles.forEach((puzzle, idx) => {
                const item = document.createElement('button');
                item.className = 'level-item';
                item.textContent = idx + 1;

                if (completed[puzzle.id]) {
                    item.classList.add('completed');
                }

                item.onclick = () => this.startPuzzle(puzzle);
                grid.appendChild(item);
            });

            section.appendChild(grid);
            container.appendChild(section);
        }
    }

    // ============================================================
    // GAME PLAY
    // ============================================================

    startPuzzle(puzzle) {
        this.game.load(puzzle);
        this.renderer = new Renderer(this.game);

        this.game.onUpdate = () => {
            this.renderer.update();
            this._updateUI();
            Storage.saveGameState(this.game);
        };

        this.game.onComplete = () => {
            Storage.markCompleted(this.game.puzzleId, this.game.timer);
            Storage.clearGameState();
            this.renderer.celebrate();
            setTimeout(() => this._showCompletionOverlay(), 800);
        };

        this.showScreen('game');
        this.renderer.buildGrid();
        this.renderer.update();
        this._updateUI();
    }

    _updateUI() {
        // Timer
        const timerEl = document.getElementById('timer');
        if (timerEl) timerEl.textContent = this.game.formatTimer();

        // Level info
        const levelInfo = document.getElementById('level-info');
        if (levelInfo) {
            const stars = {easy: '\u2605', medium: '\u2605\u2605', hard: '\u2605\u2605\u2605'};
            levelInfo.textContent = `${this.game.size}x${this.game.size} ${stars[this.game.difficulty] || ''}`;
        }

        // Size badge
        const sizeBadge = document.getElementById('size-badge');
        if (sizeBadge) sizeBadge.textContent = `${this.game.size}x${this.game.size}`;

        // Notes mode button
        const notesBtn = document.getElementById('btn-notes');
        if (notesBtn) {
            notesBtn.classList.toggle('active', this.game.notesMode);
        }
    }

    _showCompletionOverlay() {
        const overlay = document.getElementById('overlay-complete');
        const statsEl = overlay.querySelector('.stats');
        statsEl.textContent = `Time: ${this.game.formatTimer()}`;
        overlay.classList.add('active');

        // Vibrate
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    }

    _showResumePrompt(saved) {
        // For simplicity, just auto-resume
        const puzzle = this._findPuzzleById(saved.puzzleId);
        if (puzzle) {
            this.startPuzzle(puzzle);
            // Restore state
            this.game.grid = saved.grid;
            this.game.notes = saved.notes.map(row =>
                row.map(arr => new Set(arr))
            );
            this.game.timer = saved.timer;
            this.game.history = saved.history.map(h => ({
                ...h,
                oldNotes: new Set(h.oldNotes),
                newNotes: new Set(h.newNotes)
            }));
            this.game.historyIdx = saved.historyIdx;
            this.game.started = true;
            this.game.startTimer();
            this.renderer.update();
            this._updateUI();
        }
    }

    _findPuzzleById(id) {
        for (const puzzles of Object.values(this.puzzleBank)) {
            for (const p of puzzles) {
                if (p.id === id) return p;
            }
        }
        return null;
    }

    // ============================================================
    // EVENT HANDLERS
    // ============================================================

    _setupEvents() {
        // Grid clicks
        document.getElementById('grid').addEventListener('pointerdown', (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            this.game.select(r, c);
        });

        // Number pad
        document.getElementById('numpad').addEventListener('pointerdown', (e) => {
            const btn = e.target.closest('.numpad-btn');
            if (!btn) return;

            if (btn.dataset.num) {
                this.game.placeNumber(parseInt(btn.dataset.num));
                // Haptic
                if (navigator.vibrate) navigator.vibrate(10);
            } else if (btn.dataset.action === 'erase') {
                this.game.erase();
            }
        });

        // Action buttons
        document.getElementById('btn-undo')?.addEventListener('pointerdown', () => this.game.undo());
        document.getElementById('btn-redo')?.addEventListener('pointerdown', () => this.game.redo());
        document.getElementById('btn-notes')?.addEventListener('pointerdown', () => this.game.toggleNotesMode());
        document.getElementById('btn-hint')?.addEventListener('pointerdown', () => this.game.hint());

        // Menu buttons
        document.getElementById('btn-play')?.addEventListener('pointerdown', () => this.showScreen('levels'));
        document.getElementById('btn-how-to-play')?.addEventListener('pointerdown', () => this.showScreen('howto'));
        document.getElementById('btn-settings')?.addEventListener('pointerdown', () => {
            this.showScreen('settings');
            this._renderSettings();
        });

        // Back buttons
        document.querySelectorAll('.btn-back').forEach(btn => {
            btn.addEventListener('pointerdown', () => {
                if (this.currentScreen === 'game') {
                    this.showScreen('levels');
                    this.game.stopTimer();
                } else {
                    this.showScreen('menu');
                }
            });
        });

        // Completion overlay
        document.getElementById('btn-next-puzzle')?.addEventListener('pointerdown', () => {
            document.getElementById('overlay-complete').classList.remove('active');
            this._startNextPuzzle();
        });
        document.getElementById('btn-back-to-menu')?.addEventListener('pointerdown', () => {
            document.getElementById('overlay-complete').classList.remove('active');
            this.showScreen('levels');
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (this.currentScreen !== 'game') return;

            if (e.key >= '1' && e.key <= '9') {
                this.game.placeNumber(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                this.game.erase();
            } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                e.shiftKey ? this.game.redo() : this.game.undo();
                e.preventDefault();
            } else if (e.key === 'n') {
                this.game.toggleNotesMode();
            } else if (e.key === 'ArrowUp' && this.game.selected) {
                this.game.select(Math.max(0, this.game.selected.r - 1), this.game.selected.c);
            } else if (e.key === 'ArrowDown' && this.game.selected) {
                this.game.select(Math.min(this.game.size - 1, this.game.selected.r + 1), this.game.selected.c);
            } else if (e.key === 'ArrowLeft' && this.game.selected) {
                this.game.select(this.game.selected.r, Math.max(0, this.game.selected.c - 1));
            } else if (e.key === 'ArrowRight' && this.game.selected) {
                this.game.select(this.game.selected.r, Math.min(this.game.size - 1, this.game.selected.c + 1));
            } else if (e.key === 'Escape') {
                this.game.deselect();
            }
        });
    }

    _startNextPuzzle() {
        // Find next uncompleted puzzle of same size/difficulty
        const puzzles = this.puzzleBank[`${this.game.size}x${this.game.size}`] || [];
        const completed = Storage.getCompleted();
        const sameDiff = puzzles.filter(p =>
            p.difficulty === this.game.difficulty && !completed[p.id]
        );

        if (sameDiff.length > 0) {
            this.startPuzzle(sameDiff[0]);
        } else {
            this.showScreen('levels');
        }
    }

    // ============================================================
    // SETTINGS
    // ============================================================

    _renderSettings() {
        const settings = Storage.getSettings();

        this._setupToggle('toggle-errors', settings.showErrors, (val) => {
            Storage.saveSetting('showErrors', val);
            this.game.showErrors = val;
        });

        this._setupToggle('toggle-timer', settings.showTimer, (val) => {
            Storage.saveSetting('showTimer', val);
            const timerEl = document.getElementById('timer');
            if (timerEl) timerEl.style.display = val ? '' : 'none';
        });
    }

    _setupToggle(id, initialValue, onChange) {
        const el = document.getElementById(id);
        if (!el) return;

        el.className = `toggle ${initialValue ? 'on' : ''}`;
        el.onclick = () => {
            const isOn = el.classList.toggle('on');
            onChange(isOn);
        };
    }
}

// ============================================================
// BOOTSTRAP
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
