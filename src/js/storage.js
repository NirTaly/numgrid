/**
 * NumGrid - Local Storage Manager
 */

class Storage {
    static PREFIX = 'numgrid_';

    static save(key, value) {
        try {
            localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
        } catch (e) {
            console.warn('Storage save failed:', e);
        }
    }

    static load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(this.PREFIX + key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    static remove(key) {
        localStorage.removeItem(this.PREFIX + key);
    }

    // Progress tracking
    static getCompleted() {
        return this.load('completed', {});
    }

    static markCompleted(puzzleId, time) {
        const completed = this.getCompleted();
        if (!completed[puzzleId] || time < completed[puzzleId]) {
            completed[puzzleId] = time;
        }
        this.save('completed', completed);
    }

    static isCompleted(puzzleId) {
        return puzzleId in this.getCompleted();
    }

    // Save game state for resume
    static saveGameState(game) {
        this.save('currentGame', {
            puzzleId: game.puzzleId,
            grid: game.grid,
            notes: game.notes.map(row => row.map(s => [...s])),
            timer: game.timer,
            history: game.history.map(h => ({
                ...h,
                oldNotes: [...h.oldNotes],
                newNotes: [...h.newNotes]
            })),
            historyIdx: game.historyIdx
        });
    }

    static loadGameState() {
        const data = this.load('currentGame');
        if (!data) return null;

        // Validate restored data integrity
        if (!data.puzzleId || typeof data.puzzleId !== 'string') return null;
        if (!Array.isArray(data.grid) || !Array.isArray(data.notes)) return null;
        if (!Number.isInteger(data.timer) || data.timer < 0) data.timer = 0;

        // Sanitize grid values to integers in safe range
        for (const row of data.grid) {
            if (!Array.isArray(row)) { this.clearGameState(); return null; }
            for (let i = 0; i < row.length; i++) {
                if (!Number.isInteger(row[i]) || row[i] < 0 || row[i] > 20) {
                    row[i] = 0;
                }
            }
        }

        // Sanitize notes
        for (const row of data.notes) {
            if (!Array.isArray(row)) { this.clearGameState(); return null; }
            for (let i = 0; i < row.length; i++) {
                if (!Array.isArray(row[i])) row[i] = [];
                row[i] = row[i].filter(n => Number.isInteger(n) && n >= 1 && n <= 20);
            }
        }

        return data;
    }

    static clearGameState() {
        this.remove('currentGame');
    }

    // Settings
    static getSettings() {
        return this.load('settings', {
            showErrors: true,
            showTimer: true,
            autoRemoveNotes: true
        });
    }

    static saveSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        this.save('settings', settings);
    }
}
