# One Up - Architecture Document

## Game Overview
**One Up** is a Sudoku-like number placement puzzle with irregular regions.

### Rules
1. The grid is divided into **irregular regions** (groups of connected cells)
2. Each region of size N must contain exactly the numbers **1 through N** (each once)
3. Each **row** must contain unique numbers (no duplicates)
4. Each **column** must contain unique numbers (no duplicates)
5. Some cells are pre-filled as clues; the player deduces the rest

### What Makes It Different From Sudoku
- Variable number ranges per cell (determined by region size, not grid size)
- Irregular region shapes create complex constraint interactions
- Smaller grids (5x5) are still challenging due to region constraints

## Technology Stack

### Choice: Progressive Web App (PWA)
**Rationale:**
- Works on Android + iPhone immediately via URL (no app store)
- Offline play via Service Worker
- Installable to home screen (looks like native app)
- Single codebase: HTML5 + CSS3 + vanilla JavaScript
- Zero dependencies, fast loading, easy to maintain
- Can be served from any static host

### Stack Details
| Layer | Technology |
|-------|-----------|
| UI | HTML5 + CSS3 (Grid layout) |
| Logic | Vanilla JavaScript (ES6+ modules) |
| Storage | localStorage (progress, settings) |
| Offline | Service Worker + Cache API |
| Animations | CSS transitions + requestAnimationFrame |
| Touch | Pointer Events API (unified touch/mouse) |

## Project Structure
```
oneup-game/
├── docs/                    # Documentation
│   └── ARCHITECTURE.md      # This file
├── src/                     # Game source code
│   ├── index.html           # Main entry point
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service Worker
│   ├── css/
│   │   └── style.css        # All styles
│   ├── js/
│   │   ├── app.js           # Main app controller
│   │   ├── game.js          # Game state & logic
│   │   ├── renderer.js      # Grid rendering
│   │   ├── input.js         # Touch/click input handling
│   │   ├── puzzle-data.js   # Pre-generated puzzle bank
│   │   └── storage.js       # localStorage wrapper
│   └── assets/
│       └── icons/           # PWA icons
├── tools/                   # Offline tools (not shipped)
│   ├── generator.js         # Puzzle generator (Node.js)
│   ├── validator.js         # Puzzle validator (Node.js)
│   └── export.js            # Export puzzles to puzzle-data.js
└── puzzles/                 # Generated puzzle JSON files
    ├── 5x5.json
    ├── 6x6.json
    ├── 7x7.json
    └── 8x8.json
```

## Puzzle Generation Pipeline
1. **Generate** valid completed grid (constraint-propagation + backtracking)
2. **Partition** grid into irregular regions (randomized flood-fill)
3. **Remove** clues while maintaining unique solvability
4. **Validate** each puzzle has exactly one solution
5. **Rate** difficulty (by solving technique complexity)
6. **Export** to compact JSON format

### Difficulty Levels
- **Easy**: More givens, smaller regions, simpler deduction chains
- **Medium**: Fewer givens, mixed region sizes
- **Hard**: Minimal givens, large region variance, requires advanced techniques

## UI/UX Design

### Layout (Mobile-First)
```
┌─────────────────────┐
│     ONE UP          │
│  Level 1  ★☆☆      │
├─────────────────────┤
│                     │
│   ┌───┬───┬───┐    │
│   │ 1 │   │ 2 │    │  Grid with colored
│   ├───┼───┼───┤    │  regions and thick
│   │   │ 3 │   │    │  region borders
│   ├───┼───┼───┤    │
│   │ 2 │   │   │    │
│   └───┴───┴───┘    │
│                     │
├─────────────────────┤
│  [1] [2] [3] [⌫]   │  Number pad
├─────────────────────┤
│  [Undo] [Hint] [✓]  │  Action buttons
└─────────────────────┘
```

### Key UX Features
- **Color-coded regions** with pastel colors for clear visual grouping
- **Thick borders** between different regions
- **Tap cell → tap number** input flow
- **Instant validation** (optional): highlight conflicts in red
- **Undo/Redo** support
- **Notes mode**: pencil marks for candidates
- **Hint system**: reveal one cell
- **Timer** (optional, toggleable)
- **Dark mode** support
- **Haptic feedback** via Vibration API
- **Celebration animation** on completion
- **Progress persistence** across sessions

### Accessibility
- High contrast region colors
- Large touch targets (min 44x44px)
- Font size scales with grid
- Screen reader labels on cells

## Data Format

### Puzzle JSON Schema
```json
{
  "id": "5x5_001",
  "size": 5,
  "difficulty": "easy",
  "regions": [[0,0,0,1,1],[0,2,2,1,1],[0,2,3,3,1],[4,2,3,3,3],[4,4,4,4,3]],
  "givens": {"0,0": 2, "1,3": 1, ...},
  "solution": [[2,1,3,1,2],[1,3,2,3,1],...]
}
```
- `regions`: 2D array where each number is a region ID
- `givens`: pre-filled cells as "row,col": value
- `solution`: complete solved grid

## Performance Targets
- First paint: < 500ms
- Puzzle load: < 50ms
- Input response: < 16ms (60fps)
- Total bundle: < 200KB (no dependencies)
- Offline: full functionality after first visit
