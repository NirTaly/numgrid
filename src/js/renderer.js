/**
 * NumGrid - Grid Renderer
 */

class Renderer {
    constructor(game) {
        this.game = game;
        this.gridEl = document.getElementById('grid');
        this.cells = [];
    }

    buildGrid() {
        const N = this.game.size;
        this.gridEl.innerHTML = '';
        this.gridEl.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
        this.gridEl.style.gridTemplateRows = `repeat(${N}, 1fr)`;
        this.cells = [];

        const regionColors = this._getRegionColors();

        for (let r = 0; r < N; r++) {
            const row = [];
            for (let c = 0; c < N; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                const rid = this.game.regions[r][c];
                cell.style.backgroundColor = regionColors[rid];

                // Region borders
                if (r === 0 || this.game.regions[r-1][c] !== rid) cell.classList.add('border-top');
                if (r === N-1 || this.game.regions[r+1]?.[c] !== rid) cell.classList.add('border-bottom');
                if (c === 0 || this.game.regions[r][c-1] !== rid) cell.classList.add('border-left');
                if (c === N-1 || this.game.regions[r][c+1] !== rid) cell.classList.add('border-right');

                if (this.game.isGiven(r, c)) {
                    cell.classList.add('given');
                }

                this.gridEl.appendChild(cell);
                row.push(cell);
            }
            this.cells.push(row);
        }
    }

    update() {
        const N = this.game.size;
        const errors = this.game.getErrors();
        const sel = this.game.selected;

        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                const cell = this.cells[r][c];
                const val = this.game.grid[r][c];
                const notes = this.game.notes[r][c];
                const key = `${r},${c}`;

                // Clear dynamic classes
                cell.classList.remove('selected', 'same-number', 'error', 'just-placed');

                // Get selected cell's value for same-number highlighting
                const selVal = sel ? this.game.grid[sel.r][sel.c] : 0;

                // Selected cell
                if (sel && sel.r === r && sel.c === c) {
                    cell.classList.add('selected');
                }
                // Same number highlight (all cells with same value)
                else if (selVal !== 0 && val === selVal) {
                    cell.classList.add('same-number');
                }

                // Error
                if (errors.has(key) && !this.game.isGiven(r, c)) {
                    cell.classList.add('error');
                }

                // Content — use safe DOM methods, never innerHTML with data
                if (val !== 0) {
                    cell.textContent = '';
                    const span = document.createElement('span');
                    span.textContent = val;
                    cell.appendChild(span);
                } else if (notes.size > 0) {
                    const maxVal = this.game.maxValueForCell(r, c);
                    cell.textContent = '';
                    const notesDiv = document.createElement('div');
                    notesDiv.className = 'notes';
                    for (let n = 1; n <= Math.max(maxVal, 9); n++) {
                        const s = document.createElement('span');
                        s.textContent = notes.has(n) ? n : '';
                        notesDiv.appendChild(s);
                    }
                    cell.appendChild(notesDiv);
                } else {
                    cell.textContent = '';
                }
            }
        }

        // Update numpad visibility based on grid size
        this._updateNumpad();
    }

    _updateNumpad() {
        const numpad = document.getElementById('numpad');
        if (!numpad) return;

        // Show buttons 1..size
        const buttons = numpad.querySelectorAll('.numpad-btn[data-num]');
        buttons.forEach(btn => {
            const num = parseInt(btn.dataset.num);
            btn.style.display = num <= this.game.size ? '' : 'none';
        });
    }

    _getRegionColors() {
        const colors = {};
        const palette = [
            'var(--region-0)', 'var(--region-1)', 'var(--region-2)',
            'var(--region-3)', 'var(--region-4)', 'var(--region-5)',
            'var(--region-6)', 'var(--region-7)', 'var(--region-8)',
            'var(--region-9)', 'var(--region-10)', 'var(--region-11)',
        ];

        const rids = [...new Set(
            this.game.regions.flat()
        )];

        rids.forEach((rid, i) => {
            colors[rid] = palette[i % palette.length];
        });

        return colors;
    }

    // Confetti animation on completion
    celebrate() {
        const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#9b59b6', '#e17055'];
        const pieces = 50;

        for (let i = 0; i < pieces; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.left = Math.random() * 100 + 'vw';
            piece.style.top = '-10px';
            piece.style.width = (Math.random() * 8 + 5) + 'px';
            piece.style.height = (Math.random() * 8 + 5) + 'px';
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            piece.style.transform = `rotate(${Math.random() * 360}deg)`;

            document.body.appendChild(piece);

            const duration = Math.random() * 2000 + 1500;
            const xDrift = (Math.random() - 0.5) * 200;

            piece.animate([
                { transform: `translateY(0) translateX(0) rotate(0deg)`, opacity: 1 },
                { transform: `translateY(${window.innerHeight + 20}px) translateX(${xDrift}px) rotate(${Math.random()*720}deg)`, opacity: 0 }
            ], {
                duration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }).onfinish = () => piece.remove();
        }
    }
}
