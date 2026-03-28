/**
 * NumGrid - Game Logic
 */

class OneUpGame {
    constructor() {
        this.size = 0;
        this.regions = [];
        this.givens = {};
        this.solution = [];
        this.grid = [];         // Current player state
        this.notes = [];        // Pencil marks: notes[r][c] = Set of numbers
        this.selected = null;   // {r, c} or null
        this.history = [];      // Undo stack: [{r, c, oldVal, oldNotes, newVal, newNotes}]
        this.historyIdx = -1;
        this.notesMode = false;
        this.timer = 0;
        this.timerInterval = null;
        this.started = false;
        this.completed = false;
        this.puzzleId = null;
        this.difficulty = '';
        this.regionSizes = {};
        this.regionCells = {};
        this.onUpdate = null;   // Callback
        this.onComplete = null;
        this.showErrors = true;
    }

    load(puzzle) {
        this.size = puzzle.size;
        this.regions = puzzle.regions;
        this.givens = puzzle.givens;
        this.solution = puzzle.solution;
        this.puzzleId = puzzle.id;
        this.difficulty = puzzle.difficulty;
        this.completed = false;

        // Init grid
        this.grid = Array.from({length: this.size}, () => Array(this.size).fill(0));
        this.notes = Array.from({length: this.size}, () =>
            Array.from({length: this.size}, () => new Set())
        );

        // Place givens
        for (const [key, val] of Object.entries(this.givens)) {
            const [r, c] = key.split(',').map(Number);
            this.grid[r][c] = val;
        }

        // Compute region info
        this.regionCells = {};
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const rid = this.regions[r][c];
                if (!this.regionCells[rid]) this.regionCells[rid] = [];
                this.regionCells[rid].push([r, c]);
            }
        }
        this.regionSizes = {};
        for (const [rid, cells] of Object.entries(this.regionCells)) {
            this.regionSizes[rid] = cells.length;
        }

        // Reset state
        this.history = [];
        this.historyIdx = -1;
        this.selected = null;
        this.notesMode = false;
        this.timer = 0;
        this.started = false;
        this.stopTimer();
    }

    isGiven(r, c) {
        return `${r},${c}` in this.givens;
    }

    getRegionSize(r, c) {
        return this.regionSizes[this.regions[r][c]];
    }

    maxValueForCell(r, c) {
        return this.getRegionSize(r, c);
    }

    select(r, c) {
        if (this.completed) return;
        this.selected = {r, c};
        this._notify();
    }

    deselect() {
        this.selected = null;
        this._notify();
    }

    placeNumber(num) {
        if (!this.selected || this.completed) return;
        const {r, c} = this.selected;
        if (this.isGiven(r, c)) return;

        if (!this.started) {
            this.started = true;
            this.startTimer();
        }

        if (this.notesMode) {
            this._placeNote(r, c, num);
        } else {
            this._placeValue(r, c, num);
        }
    }

    _placeValue(r, c, num) {
        const oldVal = this.grid[r][c];
        const oldNotes = new Set(this.notes[r][c]);

        if (oldVal === num) {
            // Toggle off
            this.grid[r][c] = 0;
            this._pushHistory(r, c, oldVal, oldNotes, 0, new Set());
        } else {
            this.grid[r][c] = num;
            this.notes[r][c] = new Set();
            this._pushHistory(r, c, oldVal, oldNotes, num, new Set());

            // Auto-remove this number from notes in same row/col/region
            this._clearNotesForPlacement(r, c, num);
        }

        this._notify();
        this._checkCompletion();
    }

    _placeNote(r, c, num) {
        if (this.grid[r][c] !== 0) return; // Can't note on filled cell

        const oldNotes = new Set(this.notes[r][c]);
        if (this.notes[r][c].has(num)) {
            this.notes[r][c].delete(num);
        } else {
            this.notes[r][c].add(num);
        }

        this._pushHistory(r, c, 0, oldNotes, 0, new Set(this.notes[r][c]));
        this._notify();
    }

    _clearNotesForPlacement(r, c, num) {
        // Remove num from notes in same row, col, and region
        for (let cc = 0; cc < this.size; cc++) {
            this.notes[r][cc].delete(num);
        }
        for (let rr = 0; rr < this.size; rr++) {
            this.notes[rr][c].delete(num);
        }
        const rid = this.regions[r][c];
        for (const [rr, cc] of this.regionCells[rid]) {
            this.notes[rr][cc].delete(num);
        }
    }

    erase() {
        if (!this.selected || this.completed) return;
        const {r, c} = this.selected;
        if (this.isGiven(r, c)) return;

        const oldVal = this.grid[r][c];
        const oldNotes = new Set(this.notes[r][c]);

        this.grid[r][c] = 0;
        this.notes[r][c] = new Set();

        this._pushHistory(r, c, oldVal, oldNotes, 0, new Set());
        this._notify();
    }

    _pushHistory(r, c, oldVal, oldNotes, newVal, newNotes) {
        // Truncate future history if we've undone
        this.history = this.history.slice(0, this.historyIdx + 1);
        this.history.push({r, c, oldVal, oldNotes, newVal, newNotes});
        this.historyIdx = this.history.length - 1;
    }

    undo() {
        if (this.historyIdx < 0 || this.completed) return;
        const h = this.history[this.historyIdx];
        this.grid[h.r][h.c] = h.oldVal;
        this.notes[h.r][h.c] = new Set(h.oldNotes);
        this.historyIdx--;
        this._notify();
    }

    redo() {
        if (this.historyIdx >= this.history.length - 1 || this.completed) return;
        this.historyIdx++;
        const h = this.history[this.historyIdx];
        this.grid[h.r][h.c] = h.newVal;
        this.notes[h.r][h.c] = new Set(h.newNotes);
        this._notify();
    }

    toggleNotesMode() {
        this.notesMode = !this.notesMode;
        this._notify();
    }

    hint() {
        if (this.completed) return;
        // Find an empty or wrong cell and reveal it
        const cells = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (!this.isGiven(r, c) && this.grid[r][c] !== this.solution[r][c]) {
                    cells.push([r, c]);
                }
            }
        }

        if (cells.length === 0) return;

        const [r, c] = cells[Math.floor(Math.random() * cells.length)];
        const oldVal = this.grid[r][c];
        const oldNotes = new Set(this.notes[r][c]);
        const val = this.solution[r][c];

        this.grid[r][c] = val;
        this.notes[r][c] = new Set();
        this._pushHistory(r, c, oldVal, oldNotes, val, new Set());
        this.selected = {r, c};

        if (!this.started) {
            this.started = true;
            this.startTimer();
        }

        this._notify();
        this._checkCompletion();
    }

    // Error checking
    getErrors() {
        if (!this.showErrors) return new Set();
        const errors = new Set();

        // Row check
        for (let r = 0; r < this.size; r++) {
            const seen = {};
            for (let c = 0; c < this.size; c++) {
                const v = this.grid[r][c];
                if (v === 0) continue;
                if (seen[v] !== undefined) {
                    errors.add(`${r},${c}`);
                    errors.add(`${r},${seen[v]}`);
                }
                seen[v] = c;
            }
        }

        // Col check
        for (let c = 0; c < this.size; c++) {
            const seen = {};
            for (let r = 0; r < this.size; r++) {
                const v = this.grid[r][c];
                if (v === 0) continue;
                if (seen[v] !== undefined) {
                    errors.add(`${r},${c}`);
                    errors.add(`${seen[v]},${c}`);
                }
                seen[v] = r;
            }
        }

        // Region check
        for (const [rid, cells] of Object.entries(this.regionCells)) {
            const seen = {};
            for (const [r, c] of cells) {
                const v = this.grid[r][c];
                if (v === 0) continue;
                const rs = cells.length;
                if (v > rs) {
                    errors.add(`${r},${c}`);
                }
                if (seen[v] !== undefined) {
                    errors.add(`${r},${c}`);
                    const [pr, pc] = seen[v];
                    errors.add(`${pr},${pc}`);
                }
                seen[v] = [r, c];
            }
        }

        return errors;
    }

    _checkCompletion() {
        // Check if grid is full and correct
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] !== this.solution[r][c]) return;
            }
        }

        this.completed = true;
        this.stopTimer();
        if (this.onComplete) this.onComplete();
    }

    startTimer() {
        if (this.timerInterval) return;
        this.timerInterval = setInterval(() => {
            this.timer++;
            this._notify();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTimer() {
        const m = Math.floor(this.timer / 60);
        const s = this.timer % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    _notify() {
        if (this.onUpdate) this.onUpdate();
    }
}
