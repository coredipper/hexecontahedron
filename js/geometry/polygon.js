// Triangulation of planar polygons that may be concave or self-intersecting.
//
// The faces of star polyhedra and their duals are often darts, crossed
// quadrilaterals or star polygons, so a simple fan is wrong. This module
// covers exactly the region where the polygon's winding number is non-zero:
// simple polygons are ear-clipped; self-intersecting ones are split at their
// crossings into the cells of the planar arrangement, and each cell with
// non-zero winding is ear-clipped.

import { add, centroid, cross, dot, length, normalize, scale, sub } from './vec.js';

const EPS = 1e-9;

const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cross2 = (a, b) => a[0] * b[1] - a[1] * b[0];

export function signedArea(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) s += cross2(poly[i], poly[(i + 1) % poly.length]);
  return s / 2;
}

export function windingNumber(poly, p) {
  let total = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = sub2(poly[i], p);
    const b = sub2(poly[(i + 1) % poly.length], p);
    total += Math.atan2(cross2(a, b), a[0] * b[0] + a[1] * b[1]);
  }
  return Math.round(total / (2 * Math.PI));
}

/**
 * Drop repeated points, points on a straight run of the boundary, and the
 * tips of zero-width spikes. None of these change the covered region.
 */
function removeCollinear(poly) {
  let points = poly;
  let changed = true;
  while (changed && points.length > 3) {
    changed = false;
    for (let i = 0; i < points.length; i++) {
      const a = points[(i + points.length - 1) % points.length];
      const b = points[i];
      const c = points[(i + 1) % points.length];
      const ab = sub2(b, a);
      const bc = sub2(c, b);
      if (Math.hypot(ab[0], ab[1]) < EPS || Math.abs(cross2(ab, bc)) < EPS) {
        points = points.filter((_, k) => k !== i);
        changed = true;
        break;
      }
    }
  }
  return points;
}

function pointInTriangle(p, a, b, c) {
  const d1 = cross2(sub2(b, a), sub2(p, a));
  const d2 = cross2(sub2(c, b), sub2(p, b));
  const d3 = cross2(sub2(a, c), sub2(p, c));
  return d1 > EPS && d2 > EPS && d3 > EPS;
}

/** Ear clipping of a simple polygon. Returns triangles of 2D points. */
export function earClip(input) {
  let poly = removeCollinear(input);
  if (signedArea(poly) < 0) poly = [...poly].reverse();
  const triangles = [];
  const idx = poly.map((_, i) => i);
  while (idx.length > 3) {
    let clipped = false;
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[(k + idx.length - 1) % idx.length];
      const i1 = idx[k];
      const i2 = idx[(k + 1) % idx.length];
      const [a, b, c] = [poly[i0], poly[i1], poly[i2]];
      if (cross2(sub2(b, a), sub2(c, b)) <= EPS) continue; // reflex corner
      if (idx.some((j) => j !== i0 && j !== i1 && j !== i2 && pointInTriangle(poly[j], a, b, c))) continue;
      triangles.push([a, b, c]);
      idx.splice(k, 1);
      clipped = true;
      break;
    }
    if (!clipped) throw new Error('Ear clipping failed: polygon is not simple');
  }
  triangles.push(idx.map((i) => poly[i]));
  return triangles;
}

/**
 * Parameters (t on ab, u on cd) of the intersection of two segments, or null.
 * Limitation: collinear overlapping edges are treated as disjoint (not split).
 * No face in the catalog has them; a new shape that does would need it.
 */
function segmentIntersection(a, b, c, d) {
  const r = sub2(b, a);
  const s = sub2(d, c);
  const den = cross2(r, s);
  if (Math.abs(den) < EPS) return null; // parallel or collinear
  const ca = sub2(c, a);
  const t = cross2(ca, s) / den;
  const u = cross2(ca, r) / den;
  if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return null;
  return { t: Math.min(1, Math.max(0, t)), u: Math.min(1, Math.max(0, u)) };
}

export function isSimple(poly) {
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue; // neighbours share a vertex
      if (segmentIntersection(poly[i], poly[(i + 1) % n], poly[j], poly[(j + 1) % n])) return false;
    }
  }
  return true;
}

/** Cells of the planar arrangement formed by the polygon's edges. */
function arrangementCells(poly) {
  const n = poly.length;
  const splits = poly.map(() => [0, 1]);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const hit = segmentIntersection(poly[i], poly[(i + 1) % n], poly[j], poly[(j + 1) % n]);
      if (hit) {
        splits[i].push(hit.t);
        splits[j].push(hit.u);
      }
    }
  }

  const nodes = [];
  const nodeIndex = (p) => {
    let k = nodes.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-7);
    if (k < 0) {
      k = nodes.length;
      nodes.push(p);
    }
    return k;
  };
  const neighbours = new Map();
  const link = (a, b) => {
    if (a === b) return;
    if (!neighbours.has(a)) neighbours.set(a, new Set());
    if (!neighbours.has(b)) neighbours.set(b, new Set());
    neighbours.get(a).add(b);
    neighbours.get(b).add(a);
  };
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const ts = splits[i].sort((x, y) => x - y);
    let previous = nodeIndex(a);
    for (const t of ts.slice(1)) {
      const k = nodeIndex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      link(previous, k);
      previous = k;
    }
  }

  // Neighbours sorted by angle; walking "turn right at every node" traces
  // each bounded cell counter-clockwise.
  const sorted = new Map();
  for (const [k, set] of neighbours) {
    const angle = (m) => Math.atan2(nodes[m][1] - nodes[k][1], nodes[m][0] - nodes[k][0]);
    sorted.set(k, [...set].sort((x, y) => angle(x) - angle(y)));
  }
  const used = new Set();
  const cells = [];
  for (const [start, list] of sorted) {
    for (const next of list) {
      if (used.has(`${start},${next}`)) continue;
      const cell = [];
      let u = start;
      let v = next;
      for (let guard = 0; guard < 4 * nodes.length + 8; guard++) {
        used.add(`${u},${v}`);
        cell.push(nodes[u]);
        const around = sorted.get(v);
        const w = around[(around.indexOf(u) + around.length - 1) % around.length];
        u = v;
        v = w;
        if (u === start && v === next) break;
      }
      if (signedArea(cell) > EPS) cells.push(cell);
    }
  }
  return cells;
}

/** Triangles (2D) covering the region of non-zero winding number. */
export function triangulate2D(poly) {
  if (isSimple(poly)) return earClip(poly);
  const triangles = [];
  for (const cell of arrangementCells(poly)) {
    const pieces = earClip(cell);
    const largest = pieces.reduce((best, tri) => (Math.abs(signedArea(tri)) > Math.abs(signedArea(best)) ? tri : best));
    const inner = [(largest[0][0] + largest[1][0] + largest[2][0]) / 3, (largest[0][1] + largest[1][1] + largest[2][1]) / 3];
    if (windingNumber(poly, inner) !== 0) triangles.push(...pieces);
  }
  return triangles;
}

/**
 * Triangulate a planar 3D polygon. `normal` is the plane normal (needed
 * because a crossed polygon can have zero signed area). Returns triangles as
 * arrays of three 3D points.
 */
export function triangulateFace(points, normal) {
  const n = normalize(normal);
  const helper = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = normalize(cross(n, helper));
  const w = cross(n, u);
  const origin = centroid(points);
  const size = Math.max(...points.map((p) => length(sub(p, origin)))) || 1;
  const to2 = (p) => {
    const d = sub(p, origin);
    return [dot(d, u) / size, dot(d, w) / size];
  };
  const to3 = (q) => add(origin, add(scale(u, q[0] * size), scale(w, q[1] * size)));
  return triangulate2D(points.map(to2)).map((tri) => tri.map(to3));
}
