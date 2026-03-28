#!/usr/bin/env node
/**
 * One Up Puzzle Generator & Validator
 *
 * Generates puzzles with:
 * 1. Valid completed grid (backtracking + constraint propagation)
 * 2. Irregular region partitioning (randomized flood-fill)
 * 3. Clue removal with unique-solution verification
 * 4. Difficulty rating
 */

'use strict';

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function deepCopy(grid) {
    return grid.map(row => [...row]);
}

// ============================================================
// REGION GENERATION
// ============================================================

/**
 * Generate irregular regions for a grid using randomized flood-fill.
 * Each region will have between minSize and maxSize cells.
 * Returns a 2D array of region IDs.
 */
function generateRegions(size, minRegionSize = 2, maxRegionSize = null) {
    if (!maxRegionSize) maxRegionSize = Math.min(size, 6);

    const regions = Array.from({ length: size }, () => Array(size).fill(-1));
    let regionId = 0;
    const regionSizes = [];

    // Get all unassigned cells
    function getUnassigned() {
        const cells = [];
        for (let r = 0; r < size; r++)
            for (let c = 0; c < size; c++)
                if (regions[r][c] === -1) cells.push([r, c]);
        return cells;
    }

    function neighbors(r, c) {
        const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
        return dirs
            .map(([dr, dc]) => [r + dr, c + dc])
            .filter(([nr, nc]) => nr >= 0 && nr < size && nc >= 0 && nc < size);
    }

    let attempts = 0;
    const maxAttempts = 50;

    while (true) {
        attempts++;
        if (attempts > maxAttempts) {
            // Reset and retry
            for (let r = 0; r < size; r++)
                for (let c = 0; c < size; c++)
                    regions[r][c] = -1;
            regionId = 0;
            regionSizes.length = 0;
            attempts = 0;
        }

        const unassigned = getUnassigned();
        if (unassigned.length === 0) break;

        // Pick a random unassigned cell as seed
        const seed = unassigned[Math.floor(Math.random() * unassigned.length)];

        // Decide target size for this region
        const remaining = unassigned.length;
        let targetSize = minRegionSize + Math.floor(Math.random() * (maxRegionSize - minRegionSize + 1));

        // Don't leave tiny orphans
        if (remaining - targetSize < minRegionSize && remaining <= maxRegionSize) {
            targetSize = remaining;
        }

        // Grow region via BFS with randomization
        const regionCells = [seed];
        regions[seed[0]][seed[1]] = regionId;

        while (regionCells.length < targetSize) {
            // Find frontier: unassigned neighbors of current region
            const frontier = [];
            for (const [r, c] of regionCells) {
                for (const [nr, nc] of neighbors(r, c)) {
                    if (regions[nr][nc] === -1 && !frontier.some(([fr, fc]) => fr === nr && fc === nc)) {
                        frontier.push([nr, nc]);
                    }
                }
            }

            if (frontier.length === 0) break;

            // Pick random frontier cell
            const next = frontier[Math.floor(Math.random() * frontier.length)];
            regions[next[0]][next[1]] = regionId;
            regionCells.push(next);
        }

        // If region is too small (isolated), merge into neighbor or retry
        if (regionCells.length < minRegionSize) {
            // Try to merge into an adjacent region
            let merged = false;
            for (const [r, c] of regionCells) {
                for (const [nr, nc] of neighbors(r, c)) {
                    if (regions[nr][nc] !== -1 && regions[nr][nc] !== regionId) {
                        const targetRegion = regions[nr][nc];
                        for (const [cr, cc] of regionCells) {
                            regions[cr][cc] = targetRegion;
                        }
                        regionSizes[targetRegion] += regionCells.length;
                        merged = true;
                        break;
                    }
                }
                if (merged) break;
            }
            if (!merged) {
                // Reset these cells
                for (const [r, c] of regionCells) regions[r][c] = -1;
            }
            continue;
        }

        regionSizes.push(regionCells.length);
        regionId++;
    }

    return { regions, regionSizes, regionCount: regionId };
}

// ============================================================
// GRID SOLVER (Constraint Propagation + Backtracking)
// ============================================================

/**
 * Solve a One Up puzzle. Returns all solutions (up to maxSolutions).
 *
 * @param {number} size - Grid size
 * @param {number[][]} regions - 2D region ID array
 * @param {Object} givens - Map of "r,c" -> value
 * @param {number} maxSolutions - Stop after finding this many
 * @returns {number[][][]} Array of solution grids
 */
function solve(size, regions, givens, maxSolutions = 2) {
    // Precompute region info
    const regionCells = {};
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const rid = regions[r][c];
            if (!regionCells[rid]) regionCells[rid] = [];
            regionCells[rid].push([r, c]);
        }
    }

    const regionSizeMap = {};
    for (const [rid, cells] of Object.entries(regionCells)) {
        regionSizeMap[rid] = cells.length;
    }

    // Initialize grid and candidates
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    const candidates = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => new Set())
    );

    // Set up initial candidates based on region size
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const rid = regions[r][c];
            const regSize = regionSizeMap[rid];
            for (let n = 1; n <= regSize; n++) {
                candidates[r][c].add(n);
            }
        }
    }

    // Place givens
    function placeValue(r, c, val, cands) {
        cands[r][c].clear();
        grid[r][c] = val;

        // Remove from row
        for (let cc = 0; cc < size; cc++) {
            if (cc !== c) cands[r][cc].delete(val);
        }
        // Remove from column
        for (let rr = 0; rr < size; rr++) {
            if (rr !== r) cands[rr][c].delete(val);
        }
        // Remove from region
        const rid = regions[r][c];
        for (const [rr, cc] of regionCells[rid]) {
            if (rr !== r || cc !== c) cands[rr][cc].delete(val);
        }
    }

    for (const [key, val] of Object.entries(givens)) {
        const [r, c] = key.split(',').map(Number);
        placeValue(r, c, val, candidates);
    }

    const solutions = [];

    function backtrack(cands) {
        if (solutions.length >= maxSolutions) return;

        // Constraint propagation: naked singles
        let changed = true;
        const placed = [];

        while (changed) {
            changed = false;

            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] !== 0) continue;

                    if (cands[r][c].size === 0) {
                        // Contradiction - undo
                        for (const [pr, pc, pv] of placed) {
                            grid[pr][pc] = 0;
                        }
                        return;
                    }

                    if (cands[r][c].size === 1) {
                        const val = [...cands[r][c]][0];
                        placed.push([r, c, val]);
                        placeValue(r, c, val, cands);
                        changed = true;
                    }
                }
            }

            // Hidden singles in regions
            for (const [rid, cells] of Object.entries(regionCells)) {
                const regSize = regionSizeMap[rid];
                for (let n = 1; n <= regSize; n++) {
                    const possibleCells = cells.filter(([r, c]) =>
                        grid[r][c] === 0 && cands[r][c].has(n)
                    );
                    if (possibleCells.length === 0) {
                        // Check if already placed
                        const alreadyPlaced = cells.some(([r, c]) => grid[r][c] === n);
                        if (!alreadyPlaced) {
                            for (const [pr, pc, pv] of placed) grid[pr][pc] = 0;
                            return;
                        }
                    } else if (possibleCells.length === 1) {
                        const [r, c] = possibleCells[0];
                        placed.push([r, c, n]);
                        placeValue(r, c, n, cands);
                        changed = true;
                    }
                }
            }

            // Hidden singles in rows
            for (let r = 0; r < size; r++) {
                const valsInRow = new Set();
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] !== 0) continue;
                    for (const v of cands[r][c]) valsInRow.add(v);
                }
                for (const v of valsInRow) {
                    const cols = [];
                    for (let c = 0; c < size; c++) {
                        if (grid[r][c] === 0 && cands[r][c].has(v)) cols.push(c);
                    }
                    if (cols.length === 1) {
                        const c = cols[0];
                        placed.push([r, c, v]);
                        placeValue(r, c, v, cands);
                        changed = true;
                    }
                }
            }

            // Hidden singles in columns
            for (let c = 0; c < size; c++) {
                const valsInCol = new Set();
                for (let r = 0; r < size; r++) {
                    if (grid[r][c] !== 0) continue;
                    for (const v of cands[r][c]) valsInCol.add(v);
                }
                for (const v of valsInCol) {
                    const rows = [];
                    for (let r = 0; r < size; r++) {
                        if (grid[r][c] === 0 && cands[r][c].has(v)) rows.push(r);
                    }
                    if (rows.length === 1) {
                        const r = rows[0];
                        placed.push([r, c, v]);
                        placeValue(r, c, v, cands);
                        changed = true;
                    }
                }
            }
        }

        // Check if solved
        let solved = true;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === 0) { solved = false; break; }
            }
            if (!solved) break;
        }

        if (solved) {
            solutions.push(deepCopy(grid));
            for (const [pr, pc, pv] of placed) grid[pr][pc] = 0;
            return;
        }

        // Find cell with minimum remaining values (MRV heuristic)
        let minSize = Infinity, bestR = -1, bestC = -1;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === 0 && cands[r][c].size < minSize) {
                    minSize = cands[r][c].size;
                    bestR = r;
                    bestC = c;
                }
            }
        }

        if (bestR === -1) {
            for (const [pr, pc, pv] of placed) grid[pr][pc] = 0;
            return;
        }

        const vals = [...cands[bestR][bestC]];

        for (const val of vals) {
            if (solutions.length >= maxSolutions) break;

            // Save candidate state
            const savedCands = Array.from({ length: size }, (_, r) =>
                Array.from({ length: size }, (_, c) => new Set(cands[r][c]))
            );

            placeValue(bestR, bestC, val, cands);
            backtrack(cands);

            // Restore
            grid[bestR][bestC] = 0;
            for (let r = 0; r < size; r++)
                for (let c = 0; c < size; c++)
                    cands[r][c] = savedCands[r][c];
        }

        for (const [pr, pc, pv] of placed) grid[pr][pc] = 0;
    }

    backtrack(candidates);
    return solutions;
}

// ============================================================
// PUZZLE GENERATION
// ============================================================

/**
 * Generate a complete valid grid by filling it via backtracking
 * while respecting region constraints.
 */
function generateFilledGrid(size, regions) {
    const regionCells = {};
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const rid = regions[r][c];
            if (!regionCells[rid]) regionCells[rid] = [];
            regionCells[rid].push([r, c]);
        }
    }

    const regionSizeMap = {};
    for (const [rid, cells] of Object.entries(regionCells)) {
        regionSizeMap[rid] = cells.length;
    }

    const grid = Array.from({ length: size }, () => Array(size).fill(0));

    function isValid(r, c, val) {
        // Check row
        for (let cc = 0; cc < size; cc++) {
            if (grid[r][cc] === val) return false;
        }
        // Check column
        for (let rr = 0; rr < size; rr++) {
            if (grid[rr][c] === val) return false;
        }
        // Check region
        const rid = regions[r][c];
        for (const [rr, cc] of regionCells[rid]) {
            if (grid[rr][cc] === val) return false;
        }
        // Check value range
        if (val > regionSizeMap[regions[r][c]]) return false;

        return true;
    }

    // Get cells in order (left-to-right, top-to-bottom)
    const cells = [];
    for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
            cells.push([r, c]);

    function fill(idx) {
        if (idx === cells.length) return true;

        const [r, c] = cells[idx];
        const rid = regions[r][c];
        const maxVal = regionSizeMap[rid];
        const vals = shuffle([...Array(maxVal)].map((_, i) => i + 1));

        for (const val of vals) {
            if (isValid(r, c, val)) {
                grid[r][c] = val;
                if (fill(idx + 1)) return true;
                grid[r][c] = 0;
            }
        }
        return false;
    }

    if (fill(0)) return grid;
    return null;
}

/**
 * Generate a puzzle by creating a filled grid and removing clues.
 */
function generatePuzzle(size, difficulty = 'medium') {
    const maxRetries = 100;

    for (let retry = 0; retry < maxRetries; retry++) {
        // Generate regions
        const minRegion = Math.max(2, Math.floor(size * 0.4));
        const maxRegion = Math.min(size + 1, Math.ceil(size * 1.2));
        const { regions } = generateRegions(size, minRegion, maxRegion);

        // Generate filled grid
        const solution = generateFilledGrid(size, regions);
        if (!solution) continue;

        // Create givens from solution
        const allCells = [];
        for (let r = 0; r < size; r++)
            for (let c = 0; c < size; c++)
                allCells.push([r, c]);

        // Start with all cells as givens, then remove
        const givens = {};
        for (const [r, c] of allCells) {
            givens[`${r},${c}`] = solution[r][c];
        }

        // Determine how many to remove based on difficulty
        const totalCells = size * size;
        let targetGivens;
        switch (difficulty) {
            case 'easy':
                targetGivens = Math.ceil(totalCells * 0.50);
                break;
            case 'medium':
                targetGivens = Math.ceil(totalCells * 0.35);
                break;
            case 'hard':
                targetGivens = Math.ceil(totalCells * 0.25);
                break;
            default:
                targetGivens = Math.ceil(totalCells * 0.35);
        }

        // Shuffle cells for random removal order
        const removeCandidates = shuffle([...allCells]);

        for (const [r, c] of removeCandidates) {
            if (Object.keys(givens).length <= targetGivens) break;

            const key = `${r},${c}`;
            const val = givens[key];
            delete givens[key];

            // Check unique solvability
            const solutions = solve(size, regions, givens, 2);

            if (solutions.length !== 1) {
                // Put it back - removing this cell creates ambiguity
                givens[key] = val;
            }
        }

        // Validate final puzzle
        const finalSolutions = solve(size, regions, givens, 2);
        if (finalSolutions.length !== 1) {
            console.error(`Validation failed for retry ${retry}, skipping`);
            continue;
        }

        // Verify solution matches
        const sol = finalSolutions[0];
        let matches = true;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (sol[r][c] !== solution[r][c]) {
                    matches = false;
                    break;
                }
            }
            if (!matches) break;
        }

        if (!matches) {
            console.error(`Solution mismatch on retry ${retry}`);
            continue;
        }

        // Rate difficulty based on actual solving
        const givenCount = Object.keys(givens).length;
        const givenRatio = givenCount / totalCells;
        let actualDifficulty;
        if (givenRatio > 0.45) actualDifficulty = 'easy';
        else if (givenRatio > 0.30) actualDifficulty = 'medium';
        else actualDifficulty = 'hard';

        return {
            size,
            difficulty: actualDifficulty,
            regions,
            givens,
            solution,
            givenCount,
            totalCells
        };
    }

    throw new Error(`Failed to generate ${size}x${size} puzzle after ${maxRetries} retries`);
}

// ============================================================
// BATCH GENERATION
// ============================================================

function generateBatch(size, count, difficulty) {
    const puzzles = [];

    for (let i = 0; i < count; i++) {
        try {
            const puzzle = generatePuzzle(size, difficulty);
            puzzle.id = `${size}x${size}_${difficulty}_${String(i + 1).padStart(3, '0')}`;
            puzzles.push(puzzle);

            if ((i + 1) % 10 === 0) {
                process.stderr.write(`  ${size}x${size} ${difficulty}: ${i + 1}/${count}\n`);
            }
        } catch (e) {
            process.stderr.write(`  Error generating ${size}x${size} #${i + 1}: ${e.message}\n`);
            i--; // Retry
        }
    }

    return puzzles;
}

// ============================================================
// VALIDATION
// ============================================================

function validatePuzzle(puzzle) {
    const { size, regions, givens, solution } = puzzle;
    const errors = [];

    // 1. Check solution fills entire grid
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (!solution[r][c] || solution[r][c] < 1) {
                errors.push(`Empty cell at (${r},${c})`);
            }
        }
    }

    // 2. Check row uniqueness
    for (let r = 0; r < size; r++) {
        const seen = new Set();
        for (let c = 0; c < size; c++) {
            const v = solution[r][c];
            if (seen.has(v)) errors.push(`Duplicate ${v} in row ${r}`);
            seen.add(v);
        }
    }

    // 3. Check column uniqueness
    for (let c = 0; c < size; c++) {
        const seen = new Set();
        for (let r = 0; r < size; r++) {
            const v = solution[r][c];
            if (seen.has(v)) errors.push(`Duplicate ${v} in col ${c}`);
            seen.add(v);
        }
    }

    // 4. Check region constraints
    const regionCells = {};
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const rid = regions[r][c];
            if (!regionCells[rid]) regionCells[rid] = [];
            regionCells[rid].push([r, c]);
        }
    }

    for (const [rid, cells] of Object.entries(regionCells)) {
        const regSize = cells.length;
        const seen = new Set();
        for (const [r, c] of cells) {
            const v = solution[r][c];
            if (v < 1 || v > regSize) {
                errors.push(`Value ${v} out of range [1,${regSize}] in region ${rid}`);
            }
            if (seen.has(v)) errors.push(`Duplicate ${v} in region ${rid}`);
            seen.add(v);
        }
    }

    // 5. Check givens match solution
    for (const [key, val] of Object.entries(givens)) {
        const [r, c] = key.split(',').map(Number);
        if (solution[r][c] !== val) {
            errors.push(`Given at (${r},${c}) is ${val} but solution is ${solution[r][c]}`);
        }
    }

    // 6. Check unique solvability
    const solutions = solve(size, regions, givens, 2);
    if (solutions.length === 0) errors.push('No solution exists');
    if (solutions.length > 1) errors.push('Multiple solutions exist');

    return { valid: errors.length === 0, errors };
}

// ============================================================
// MAIN
// ============================================================

const fs = require('fs');
const path = require('path');

function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'generate';

    if (command === 'generate') {
        const sizes = [5, 6, 7, 8];
        const puzzlesPerDifficulty = 34; // 34 * 3 difficulties = 102 per size
        const difficulties = ['easy', 'medium', 'hard'];

        for (const size of sizes) {
            console.error(`\nGenerating ${size}x${size} puzzles...`);
            const allPuzzles = [];

            for (const diff of difficulties) {
                const puzzles = generateBatch(size, puzzlesPerDifficulty, diff);
                allPuzzles.push(...puzzles);
            }

            // Validate all
            console.error(`Validating ${allPuzzles.length} puzzles...`);
            let validCount = 0;
            for (const p of allPuzzles) {
                const result = validatePuzzle(p);
                if (result.valid) {
                    validCount++;
                } else {
                    console.error(`  INVALID ${p.id}: ${result.errors.join(', ')}`);
                }
            }
            console.error(`  ${validCount}/${allPuzzles.length} valid`);

            // Export
            const outPath = path.join(__dirname, '..', 'puzzles', `${size}x${size}.json`);
            const exportData = allPuzzles
                .filter(p => validatePuzzle(p).valid)
                .map(p => ({
                    id: p.id,
                    size: p.size,
                    difficulty: p.difficulty,
                    regions: p.regions,
                    givens: p.givens,
                    solution: p.solution
                }));

            fs.writeFileSync(outPath, JSON.stringify(exportData, null, 2));
            console.error(`  Wrote ${exportData.length} puzzles to ${outPath}`);
        }
    } else if (command === 'validate') {
        const file = args[1];
        if (!file) {
            console.error('Usage: node generator.js validate <file.json>');
            process.exit(1);
        }
        const puzzles = JSON.parse(fs.readFileSync(file, 'utf8'));
        let valid = 0, invalid = 0;
        for (const p of puzzles) {
            const result = validatePuzzle(p);
            if (result.valid) {
                valid++;
            } else {
                console.log(`INVALID ${p.id}: ${result.errors.join(', ')}`);
                invalid++;
            }
        }
        console.log(`\nResults: ${valid} valid, ${invalid} invalid out of ${puzzles.length} total`);
    } else if (command === 'single') {
        const size = parseInt(args[1]) || 5;
        const diff = args[2] || 'medium';
        console.error(`Generating single ${size}x${size} ${diff} puzzle...`);
        const puzzle = generatePuzzle(size, diff);
        puzzle.id = `${size}x${size}_${diff}_test`;
        const result = validatePuzzle(puzzle);
        console.log(JSON.stringify(puzzle, null, 2));
        console.error(`Valid: ${result.valid}`);
        if (!result.valid) console.error(`Errors: ${result.errors.join(', ')}`);
    } else {
        console.error('Usage: node generator.js [generate|validate|single] [args...]');
    }
}

main();
