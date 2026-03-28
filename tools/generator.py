#!/usr/bin/env python3
"""
One Up Puzzle Generator & Validator

Generates two types of puzzles:
1. "Jigsaw" mode: all N regions of size N (like jigsaw Sudoku)
2. "Mixed" mode: regions of varying sizes (harder to generate)

For mixed mode, region constraints: each region size K has values {1..K},
row/col uniqueness required. This means every row/col needs values 1..N,
so large regions (size >= N) must exist in every row/col.
"""

import random
import json
import sys
import os
import time
from collections import defaultdict

# ============================================================
# JIGSAW REGION GENERATION (N regions of size N)
# ============================================================

def generate_jigsaw_regions(size):
    """Generate N irregular regions each of size N."""
    for _ in range(500):
        grid = [[-1]*size for _ in range(size)]
        success = True

        for rid in range(size):
            # Find seed: random unassigned cell
            unassigned = [(r, c) for r in range(size) for c in range(size) if grid[r][c] == -1]
            if not unassigned:
                success = False
                break
            if len(unassigned) < size:
                success = False
                break

            seed = random.choice(unassigned)
            cells = [seed]
            grid[seed[0]][seed[1]] = rid

            while len(cells) < size:
                frontier = set()
                for r, c in cells:
                    for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                        nr, nc = r+dr, c+dc
                        if 0 <= nr < size and 0 <= nc < size and grid[nr][nc] == -1:
                            frontier.add((nr, nc))
                if not frontier:
                    success = False
                    break
                # Prefer frontier cells that keep the region compact
                nxt = random.choice(list(frontier))
                grid[nxt[0]][nxt[1]] = rid
                cells.append(nxt)

            if not success:
                break

        if success and all(grid[r][c] >= 0 for r in range(size) for c in range(size)):
            return grid

    raise RuntimeError(f"Jigsaw region gen failed for {size}x{size}")


# ============================================================
# MIXED REGION GENERATION (various sizes)
# ============================================================

def generate_mixed_regions(size):
    """Generate regions of varying sizes. Every row/col must have
    at least one cell per needed value (feasibility constraint)."""
    for _ in range(1000):
        grid = [[-1]*size for _ in range(size)]
        rid = 0

        def nbrs(r, c):
            out = []
            for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                nr, nc = r+dr, c+dc
                if 0 <= nr < size and 0 <= nc < size:
                    out.append((nr, nc))
            return out

        # Plan region sizes
        remaining = size * size
        targets = []
        while remaining > 0:
            lo = max(2, 2)
            hi = min(remaining, size)
            if remaining < lo * 2 and remaining > 0:
                targets.append(remaining)
                remaining = 0
            else:
                # For larger grids, bias toward size=grid_size
                # This ensures we have enough large regions
                weights = []
                for s in range(lo, hi + 1):
                    if s == size:
                        w = 5  # Strongly prefer full-size regions
                    elif s >= size - 1:
                        w = 3
                    elif s >= size - 2:
                        w = 2
                    else:
                        w = 1
                    weights.append(w)
                choices = list(range(lo, hi + 1))
                s = random.choices(choices, weights=weights, k=1)[0]
                if remaining - s == 1:  # Avoid size-1 remainder
                    s = remaining
                targets.append(s)
                remaining -= s

        random.shuffle(targets)

        ok = True
        for target in targets:
            ua = [(r,c) for r in range(size) for c in range(size) if grid[r][c] == -1]
            if len(ua) < target:
                ok = False
                break
            seed = random.choice(ua)
            cells = [seed]
            grid[seed[0]][seed[1]] = rid

            while len(cells) < target:
                frontier = set()
                for r, c in cells:
                    for nr, nc in nbrs(r, c):
                        if grid[nr][nc] == -1:
                            frontier.add((nr, nc))
                if not frontier:
                    ok = False
                    break
                nxt = random.choice(list(frontier))
                grid[nxt[0]][nxt[1]] = rid
                cells.append(nxt)

            if len(cells) < target:
                ok = False
                break
            rid += 1

        if not ok:
            continue
        if any(grid[r][c] == -1 for r in range(size) for c in range(size)):
            continue

        # Check feasibility: for each value v=1..size, each row/col needs
        # at least one cell with region_size >= v
        region_sizes = defaultdict(int)
        for r in range(size):
            for c in range(size):
                region_sizes[grid[r][c]] += 1

        feasible = True
        for v in range(1, size + 1):
            for r in range(size):
                if not any(region_sizes[grid[r][c]] >= v for c in range(size)):
                    feasible = False
                    break
            if not feasible:
                break
            for c in range(size):
                if not any(region_sizes[grid[r][c]] >= v for r in range(size)):
                    feasible = False
                    break
            if not feasible:
                break

        if feasible:
            return grid

    return None


# ============================================================
# SOLVER (bitmask-based)
# ============================================================

def get_region_info(size, regions):
    rc = defaultdict(list)
    for r in range(size):
        for c in range(size):
            rc[regions[r][c]].append((r, c))
    rs = {rid: len(cells) for rid, cells in rc.items()}
    return dict(rc), rs


def solve(size, regions, givens, max_solutions=2):
    """Solve with constraint propagation + backtracking."""
    region_cells, region_sizes = get_region_info(size, regions)
    N = size

    # Peer lists
    peers = [[None]*N for _ in range(N)]
    for r in range(N):
        for c in range(N):
            pset = set()
            for cc in range(N):
                if cc != c: pset.add((r, cc))
            for rr in range(N):
                if rr != r: pset.add((rr, c))
            rid = regions[r][c]
            for rr, cc in region_cells[rid]:
                if (rr, cc) != (r, c): pset.add((rr, cc))
            peers[r][c] = list(pset)

    solutions = []
    MAX_NODES = 500000
    nodes = [0]

    def _solve(grid, doms):
        if nodes[0] > MAX_NODES:
            return
        nodes[0] += 1

        # Propagate naked singles
        changed = True
        assigned = []
        dead = False

        while changed and not dead:
            changed = False
            for r in range(N):
                for c in range(N):
                    if grid[r][c] != 0:
                        continue
                    d = doms[r][c]
                    if d == 0:
                        dead = True
                        break
                    if d & (d-1) == 0:  # single bit
                        val = d.bit_length()
                        grid[r][c] = val
                        assigned.append((r, c))
                        doms[r][c] = 0
                        vb = 1 << (val - 1)
                        for pr, pc in peers[r][c]:
                            if doms[pr][pc] & vb:
                                doms[pr][pc] ^= vb
                                if doms[pr][pc] == 0 and grid[pr][pc] == 0:
                                    dead = True
                                    break
                        if dead:
                            break
                        changed = True
                if dead:
                    break

        if dead:
            for r, c in assigned:
                grid[r][c] = 0
            return assigned

        # Check if all assigned
        best = None
        best_cnt = 99
        for r in range(N):
            for c in range(N):
                if grid[r][c] != 0:
                    continue
                cnt = bin(doms[r][c]).count('1')
                if cnt < best_cnt:
                    best_cnt = cnt
                    best = (r, c, doms[r][c])

        if best is None:
            solutions.append([row[:] for row in grid])
            for r, c in assigned:
                grid[r][c] = 0
            return assigned

        br, bc, d = best

        bits = d
        while bits and len(solutions) < max_solutions and nodes[0] <= MAX_NODES:
            b = bits & (-bits)
            bits ^= b
            val = b.bit_length()

            # Save state
            sd = [row[:] for row in doms]
            sg = [row[:] for row in grid]

            grid[br][bc] = val
            doms[br][bc] = 0
            vb = 1 << (val - 1)
            ok = True
            for pr, pc in peers[br][bc]:
                if doms[pr][pc] & vb:
                    doms[pr][pc] ^= vb
                    if doms[pr][pc] == 0 and grid[pr][pc] == 0:
                        ok = False
                        break

            if ok:
                _solve(grid, doms)

            # Restore
            for r in range(N):
                doms[r] = sd[r][:]
                grid[r] = sg[r][:]

        for r, c in assigned:
            grid[r][c] = 0
        return assigned

    # Init
    grid = [[0]*N for _ in range(N)]
    doms = [[0]*N for _ in range(N)]
    for r in range(N):
        for c in range(N):
            rid = regions[r][c]
            rs = region_sizes[rid]
            doms[r][c] = (1 << rs) - 1

    # Place givens
    for key, val in givens.items():
        r, c = int(key.split(',')[0]), int(key.split(',')[1])
        grid[r][c] = val
        doms[r][c] = 0
        vb = 1 << (val - 1)
        for pr, pc in peers[r][c]:
            doms[pr][pc] &= ~vb

    # Check for immediate contradictions
    for r in range(N):
        for c in range(N):
            if grid[r][c] == 0 and doms[r][c] == 0:
                return []

    _solve(grid, doms)
    return solutions


# ============================================================
# GRID GENERATION
# ============================================================

def generate_filled_grid(size, regions):
    """Generate random filled grid using the solver."""
    # Use solver with no givens, randomized
    region_cells, region_sizes = get_region_info(size, regions)
    N = size

    peers = [[None]*N for _ in range(N)]
    for r in range(N):
        for c in range(N):
            pset = set()
            for cc in range(N):
                if cc != c: pset.add((r, cc))
            for rr in range(N):
                if rr != r: pset.add((rr, c))
            rid = regions[r][c]
            for rr, cc in region_cells[rid]:
                if (rr, cc) != (r, c): pset.add((rr, cc))
            peers[r][c] = list(pset)

    grid = [[0]*N for _ in range(N)]
    doms = [[0]*N for _ in range(N)]
    for r in range(N):
        for c in range(N):
            rid = regions[r][c]
            rs = region_sizes[rid]
            doms[r][c] = (1 << rs) - 1

    MAX_NODES = 500000
    nodes = [0]
    found = [None]

    def fill(grid, doms):
        if nodes[0] > MAX_NODES or found[0] is not None:
            return
        nodes[0] += 1

        # Propagate singles
        assigned = []
        changed = True
        dead = False

        while changed and not dead:
            changed = False
            for r in range(N):
                for c in range(N):
                    if grid[r][c] != 0:
                        continue
                    d = doms[r][c]
                    if d == 0:
                        dead = True
                        break
                    if d & (d-1) == 0:
                        val = d.bit_length()
                        grid[r][c] = val
                        assigned.append((r, c))
                        doms[r][c] = 0
                        vb = 1 << (val-1)
                        for pr, pc in peers[r][c]:
                            if doms[pr][pc] & vb:
                                doms[pr][pc] ^= vb
                                if doms[pr][pc] == 0 and grid[pr][pc] == 0:
                                    dead = True
                                    break
                        if dead:
                            break
                        changed = True
                if dead:
                    break

        if dead:
            for r, c in assigned:
                grid[r][c] = 0
            return

        # Find MRV cell
        best = None
        best_cnt = 99
        for r in range(N):
            for c in range(N):
                if grid[r][c] != 0:
                    continue
                cnt = bin(doms[r][c]).count('1')
                if cnt < best_cnt:
                    best_cnt = cnt
                    best = (r, c, doms[r][c])

        if best is None:
            # All filled — verify and save
            found[0] = [row[:] for row in grid]
            for r, c in assigned:
                grid[r][c] = 0
            return

        br, bc, d = best

        # Randomize candidate order
        vals = []
        bits = d
        while bits:
            b = bits & (-bits)
            vals.append(b.bit_length())
            bits ^= b
        random.shuffle(vals)

        for val in vals:
            if found[0] is not None or nodes[0] > MAX_NODES:
                break

            sd = [row[:] for row in doms]
            sg = [row[:] for row in grid]

            grid[br][bc] = val
            doms[br][bc] = 0
            vb = 1 << (val-1)
            ok = True
            for pr, pc in peers[br][bc]:
                if doms[pr][pc] & vb:
                    doms[pr][pc] ^= vb
                    if doms[pr][pc] == 0 and grid[pr][pc] == 0:
                        ok = False
                        break

            if ok:
                fill(grid, doms)

            for r in range(N):
                doms[r] = sd[r][:]
                grid[r] = sg[r][:]

        for r, c in assigned:
            grid[r][c] = 0

    sys.setrecursionlimit(10000)
    fill(grid, doms)
    return found[0]


# ============================================================
# PUZZLE GENERATION
# ============================================================

def generate_puzzle(size, difficulty='medium', mode='jigsaw'):
    """Generate a puzzle.

    mode='jigsaw': all regions size N (guaranteed fillable)
    mode='mixed': varying region sizes (may need retries)
    """
    for attempt in range(200):
        try:
            if mode == 'jigsaw':
                regions = generate_jigsaw_regions(size)
            else:
                regions = generate_mixed_regions(size)
                if regions is None:
                    continue
        except RuntimeError:
            continue

        solution = generate_filled_grid(size, regions)
        if solution is None:
            continue

        # Verify solution
        region_cells, region_sizes = get_region_info(size, regions)
        valid_sol = True

        for r in range(size):
            if len(set(solution[r])) != size:
                valid_sol = False
                break

        if valid_sol:
            for c in range(size):
                col = [solution[r][c] for r in range(size)]
                if len(set(col)) != size:
                    valid_sol = False
                    break

        if valid_sol:
            for rid, cells in region_cells.items():
                rs = len(cells)
                vals = [solution[r][c] for r, c in cells]
                if set(vals) != set(range(1, rs + 1)):
                    valid_sol = False
                    break

        if not valid_sol:
            continue

        # Create givens
        givens = {}
        for r in range(size):
            for c in range(size):
                givens[f"{r},{c}"] = solution[r][c]

        total = size * size
        targets = {'easy': 0.50, 'medium': 0.38, 'hard': 0.28}
        target_givens = max(size + 1, int(total * targets.get(difficulty, 0.38)))

        # Remove clues
        cells = [(r, c) for r in range(size) for c in range(size)]
        random.shuffle(cells)

        for r, c in cells:
            if len(givens) <= target_givens:
                break
            key = f"{r},{c}"
            if key not in givens:
                continue
            val = givens.pop(key)
            sols = solve(size, regions, givens, 2)
            if len(sols) != 1:
                givens[key] = val

        # Final check
        sols = solve(size, regions, givens, 2)
        if len(sols) != 1 or sols[0] != solution:
            continue

        gr = len(givens) / total
        ad = 'easy' if gr > 0.45 else ('medium' if gr > 0.32 else 'hard')

        return {
            'size': size, 'difficulty': ad, 'regions': regions,
            'givens': givens, 'solution': solution, 'given_count': len(givens)
        }

    raise RuntimeError(f"Failed to generate {size}x{size} {difficulty}")


# ============================================================
# VALIDATION
# ============================================================

def validate_puzzle(puzzle):
    size = puzzle['size']
    regions = puzzle['regions']
    givens = puzzle['givens']
    solution = puzzle['solution']
    errors = []

    region_cells, _ = get_region_info(size, regions)

    for r in range(size):
        if len(set(solution[r])) != size:
            errors.append(f"Row {r} not unique: {solution[r]}")

    for c in range(size):
        col = [solution[r][c] for r in range(size)]
        if len(set(col)) != size:
            errors.append(f"Col {c} not unique")

    for rid, cells in region_cells.items():
        rs = len(cells)
        vals = [solution[r][c] for r, c in cells]
        if set(vals) != set(range(1, rs + 1)):
            errors.append(f"Region {rid}: vals {sorted(vals)} != {{1..{rs}}}")

    for key, val in givens.items():
        r, c = int(key.split(',')[0]), int(key.split(',')[1])
        if solution[r][c] != val:
            errors.append(f"Given mismatch ({r},{c})")

    sols = solve(size, regions, givens, 2)
    if len(sols) == 0:
        errors.append("No solution")
    elif len(sols) > 1:
        errors.append("Multiple solutions")

    return len(errors) == 0, errors


# ============================================================
# EXPORT
# ============================================================

def export_to_js(puzzle_dir, out_path):
    all_data = {}
    for fname in sorted(os.listdir(puzzle_dir)):
        if fname.endswith('.json'):
            with open(os.path.join(puzzle_dir, fname)) as f:
                data = json.load(f)
            key = fname.replace('.json', '')
            all_data[key] = data
    js = "// Auto-generated puzzle data\nconst PUZZLE_DATA = " + json.dumps(all_data) + ";\n"
    with open(out_path, 'w') as f:
        f.write(js)
    print(f"Exported to {out_path}", file=sys.stderr)


# ============================================================
# MAIN
# ============================================================

def main():
    args = sys.argv[1:]
    cmd = args[0] if args else 'generate'

    if cmd == 'single':
        size = int(args[1]) if len(args) > 1 else 5
        diff = args[2] if len(args) > 2 else 'medium'
        t0 = time.time()
        p = generate_puzzle(size, diff)
        p['id'] = f"{size}x{size}_{diff}_test"
        ok, errs = validate_puzzle(p)
        print(json.dumps(p, indent=2))
        print(f"Valid: {ok}, Time: {time.time()-t0:.2f}s", file=sys.stderr)
        if not ok: print(f"Errors: {errs}", file=sys.stderr)

    elif cmd == 'generate':
        sizes = [5, 6, 7, 8]
        per_diff = 34
        diffs = ['easy', 'medium', 'hard']
        out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'puzzles')
        os.makedirs(out_dir, exist_ok=True)

        for size in sizes:
            t0 = time.time()
            print(f"\n=== {size}x{size} ===", file=sys.stderr)
            all_p = []

            for diff in diffs:
                dt = time.time()
                for i in range(per_diff):
                    for attempt in range(10):
                        try:
                            p = generate_puzzle(size, diff)
                            p['id'] = f"{size}x{size}_{diff}_{i+1:03d}"
                            ok, errs = validate_puzzle(p)
                            if ok:
                                all_p.append(p)
                                break
                            else:
                                print(f"  INVALID: {errs}", file=sys.stderr)
                        except Exception as e:
                            if attempt == 9:
                                print(f"  FAIL {size}x{size}_{diff}_{i+1}: {e}", file=sys.stderr)
                    if (i + 1) % 10 == 0:
                        print(f"  {diff}: {i+1}/{per_diff} ({time.time()-dt:.1f}s)", file=sys.stderr)

            elapsed = time.time() - t0
            out_path = os.path.join(out_dir, f"{size}x{size}.json")
            export = [{
                'id': p['id'], 'size': p['size'], 'difficulty': p['difficulty'],
                'regions': p['regions'], 'givens': p['givens'], 'solution': p['solution']
            } for p in all_p]
            with open(out_path, 'w') as f:
                json.dump(export, f)
            print(f"  {len(export)} puzzles in {elapsed:.1f}s -> {out_path}", file=sys.stderr)

        js_path = os.path.join(out_dir, '..', 'src', 'js', 'puzzle-data.js')
        os.makedirs(os.path.dirname(js_path), exist_ok=True)
        export_to_js(out_dir, js_path)

    elif cmd == 'validate':
        fp = args[1]
        with open(fp) as f:
            puzzles = json.load(f)
        v, iv = 0, 0
        for p in puzzles:
            ok, errs = validate_puzzle(p)
            if ok: v += 1
            else:
                iv += 1
                print(f"INVALID {p['id']}: {errs}")
        print(f"\n{v} valid, {iv} invalid / {len(puzzles)}")

    elif cmd == 'export':
        puzzle_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'puzzles')
        js_path = args[1] if len(args) > 1 else os.path.join(puzzle_dir, '..', 'src', 'js', 'puzzle-data.js')
        export_to_js(puzzle_dir, js_path)

    else:
        print("Usage: python generator.py [generate|validate|single|export]", file=sys.stderr)


if __name__ == '__main__':
    main()
