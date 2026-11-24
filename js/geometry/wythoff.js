// Wythoff construction of uniform polyhedra.
//
// A Wythoff symbol such as "2 5/2 | 5" names a Schwarz triangle (p q r) on the
// unit sphere, with angles pi/p, pi/q, pi/r at its corners P, Q, R. The
// reflections in the three sides generate a finite symmetry group. The
// position of the bar says where the generating vertex V sits:
//
//   p | q r   V = P                                   faces {q}, {r}
//   p q | r   V on side PQ, equidistant from QR, PR   faces {p}, {q}, {2r}
//   p q r |   V equidistant from all three sides      faces {2p}, {2q}, {2r}
//   | p q r   snub: rotations about P, Q, R move V    faces {p}, {q}, {r}, {3}
//             by equal distances
//
// Faces are orbits of the generating faces under the group. Digons and
// doubly covered faces (from fractions with an even denominator) are dropped,
// as in Coxeter et al. (1954) and Har'El, "Uniform solution for uniform
// polyhedra" (1993).

import {
  IDENTITY, add, cross, determinant, distance, dot, fromRows, length, matMul,
  matVec, normalize, reflection, scale, sub, transpose,
} from './vec.js';

const POINT_TOLERANCE = 1e-7;
const MATRIX_TOLERANCE = 1e-6;
const MAX_GROUP_ORDER = 120; // full icosahedral group

function parseRational(token) {
  const match = /^(\d+)(?:\/(\d+))?$/.exec(token);
  if (!match) throw new Error(`Invalid Wythoff number "${token}"`);
  const n = Number(match[1]);
  const d = match[2] ? Number(match[2]) : 1;
  if (!(n > d && d >= 1)) throw new Error(`Wythoff number must be greater than 1: "${token}"`);
  return { n, d, value: n / d, text: token };
}

/** Parse "p q | r" style symbols. */
export function parseWythoff(symbol) {
  const parts = symbol.trim().split('|');
  if (parts.length !== 2) throw new Error(`Wythoff symbol needs exactly one "|": "${symbol}"`);
  const tokens = (s) => s.trim().split(/\s+/).filter(Boolean);
  const left = tokens(parts[0]);
  const right = tokens(parts[1]);
  const numbers = [...left, ...right].map(parseRational);
  if (numbers.length !== 3) throw new Error(`Wythoff symbol needs three numbers: "${symbol}"`);
  const form = ['snub', 'vertex', 'edge', 'omnitruncate'][left.length];
  return { form, p: numbers[0], q: numbers[1], r: numbers[2] };
}

/**
 * Corners of the spherical triangle with angles pi/p, pi/q, pi/r
 * (spherical law of cosines for angles), with P at the north pole.
 */
function schwarzTriangle(p, q, r) {
  const A = Math.PI / p.value;
  const B = Math.PI / q.value;
  const C = Math.PI / r.value;
  const clamp = (x) => Math.max(-1, Math.min(1, x));
  const sideB = Math.acos(clamp((Math.cos(B) + Math.cos(A) * Math.cos(C)) / (Math.sin(A) * Math.sin(C))));
  const sideC = Math.acos(clamp((Math.cos(C) + Math.cos(A) * Math.cos(B)) / (Math.sin(A) * Math.sin(B))));
  const P = [0, 0, 1];
  const Q = [Math.sin(sideC), 0, Math.cos(sideC)];
  const R = [Math.sin(sideB) * Math.cos(A), Math.sin(sideB) * Math.sin(A), Math.cos(sideB)];
  return { P, Q, R };
}

/** Unit normal of the plane through the origin, a and b, pointing to `inside`. */
function inwardNormal(a, b, inside) {
  const n = normalize(cross(a, b));
  return dot(n, inside) < 0 ? scale(n, -1) : n;
}

function sameMatrix(a, b) {
  for (let i = 0; i < 9; i++) if (Math.abs(a[i] - b[i]) > MATRIX_TOLERANCE) return false;
  return true;
}

/** Closure of a set of orthogonal generators (breadth-first). */
function generateGroup(generators) {
  const elements = [IDENTITY];
  for (let i = 0; i < elements.length; i++) {
    for (const g of generators) {
      const m = matMul(g, elements[i]);
      if (!elements.some((e) => sameMatrix(e, m))) {
        elements.push(m);
        if (elements.length > MAX_GROUP_ORDER) {
          throw new Error('Reflections generate an infinite or non-icosahedral group');
        }
      }
    }
  }
  return elements;
}

class PointSet {
  constructor() {
    this.points = [];
  }

  indexOf(p) {
    return this.points.findIndex((q) => distance(p, q) < POINT_TOLERANCE);
  }

  add(p) {
    let i = this.indexOf(p);
    if (i < 0) {
      i = this.points.length;
      this.points.push(p);
    }
    return i;
  }
}

/** Canonical key of a closed polygon, independent of start vertex and direction. */
function cycleKey(indices) {
  let best = null;
  for (const seq of [indices, [...indices].reverse()]) {
    for (let s = 0; s < seq.length; s++) {
      const key = seq.slice(s).concat(seq.slice(0, s)).join(',');
      if (best === null || key < best) best = key;
    }
  }
  return best;
}

/** V, rot V, rot^2 V, ... until the orbit closes. */
function rotationFace(V, rot) {
  const points = [V];
  for (let x = matVec(rot, V); distance(x, V) > POINT_TOLERANCE; x = matVec(rot, x)) {
    points.push(x);
    if (points.length > 60) throw new Error('Rotation face does not close');
  }
  return points;
}

/**
 * Polygon around the intersection of two mirrors s1, s2 when V lies on
 * neither: V, s1 V, (s1 s2) V, (s1 s2) s1 V, ...
 */
function alternatingFace(V, s1, s2) {
  const rot = matMul(s1, s2);
  const b = matVec(s1, V);
  const points = [];
  let a = V;
  let bb = b;
  do {
    points.push(a, bb);
    a = matVec(rot, a);
    bb = matVec(rot, bb);
    if (points.length > 60) throw new Error('Alternating face does not close');
  } while (distance(a, V) > POINT_TOLERANCE);
  return points;
}

/** True when a face is a digon or visits some point twice (a doubly covered polygon). */
function isDegenerate(points) {
  if (points.length < 3) return true;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (distance(points[i], points[j]) < POINT_TOLERANCE) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Snub vertex

function quadraticForm(rotation) {
  // |V - M V|^2 = V^T A V with A = (I - M)^T (I - M)
  const d = IDENTITY.map((x, i) => x - rotation[i]);
  return matMul(transpose(d), d);
}

function solve3(m, b) {
  const det = determinant(m);
  if (Math.abs(det) < 1e-14) return null;
  const col = (k) => {
    const c = m.slice();
    c[k] = b[0];
    c[3 + k] = b[1];
    c[6 + k] = b[2];
    return determinant(c) / det;
  };
  return [col(0), col(1), col(2)];
}

/** Newton iteration for |V - rP V| = |V - rQ V| = |V - rR V|, |V| = 1. */
function newtonSnub(start, forms) {
  const [AP, AQ, AR] = forms;
  const D1 = AP.map((x, i) => x - AQ[i]);
  const D2 = AQ.map((x, i) => x - AR[i]);
  let v = normalize(start);
  for (let iter = 0; iter < 60; iter++) {
    const d1v = matVec(D1, v);
    const d2v = matVec(D2, v);
    const F = [dot(v, d1v), dot(v, d2v), dot(v, v) - 1];
    if (Math.abs(F[0]) + Math.abs(F[1]) + Math.abs(F[2]) < 1e-15) break;
    const J = fromRows(scale(d1v, 2), scale(d2v, 2), scale(v, 2));
    const step = solve3(J, scale(F, -1));
    if (!step) return null;
    v = add(v, step);
  }
  const residual = Math.abs(dot(v, matVec(D1, v))) + Math.abs(dot(v, matVec(D2, v)));
  if (!(residual < 1e-12) || Math.abs(length(v) - 1) > 1e-12) return null;
  return normalize(v);
}

/** Points spread evenly over the sphere (Fibonacci lattice). */
function spherePoints(count) {
  const points = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * (i + 0.5)) / count;
    const radius = Math.sqrt(1 - y * y);
    points.push([Math.cos(golden * i) * radius, y, Math.sin(golden * i) * radius]);
  }
  return points;
}

/**
 * All solutions of the snub equations, as unit vectors (one of each +/- pair).
 * The equations are two quadratic cones intersected with the sphere, so there
 * are at most four pairs.
 */
function snubRoots(rotations) {
  const forms = rotations.map(quadraticForm);
  const roots = [];
  for (const start of spherePoints(400)) {
    const v = newtonSnub(start, forms);
    if (!v) continue;
    const edge = Math.sqrt(dot(v, matVec(forms[0], v)));
    if (edge < 1e-6) continue; // V on a rotation axis: degenerate
    if (!roots.some((u) => distance(u, v) < 1e-9 || distance(u, scale(v, -1)) < 1e-9)) roots.push(v);
  }
  return roots;
}

// ---------------------------------------------------------------------------

function triangleSetup(symbolOrParsed) {
  const parsed = typeof symbolOrParsed === 'string' ? parseWythoff(symbolOrParsed) : symbolOrParsed;
  const { p, q, r } = parsed;
  const { P, Q, R } = schwarzTriangle(p, q, r);
  const nP = inwardNormal(Q, R, P);
  const nQ = inwardNormal(R, P, Q);
  const nR = inwardNormal(P, Q, R);
  const sP = reflection(nP);
  const sQ = reflection(nQ);
  const sR = reflection(nR);
  // Rotations about P, Q, R by 2pi/p, 2pi/q, 2pi/r with rP rQ rR = I.
  const rP = matMul(sQ, sR);
  const rQ = matMul(sR, sP);
  const rR = matMul(sP, sQ);
  return { ...parsed, P, Q, R, nP, nQ, nR, sP, sQ, sR, rP, rQ, rR };
}

/** Is V strictly inside the Schwarz triangle? */
function insideTriangle(V, t) {
  return dot(V, t.nP) > 1e-9 && dot(V, t.nQ) > 1e-9 && dot(V, t.nR) > 1e-9;
}

/**
 * Pick the snub vertex: the root of the snub equations that lies inside the
 * Schwarz triangle (up to sign). The equations have several roots, and
 * related snubs share them (for example | 2 5/2 5 and | 5/3 2 5, whose
 * triangles differ by the sign of one corner); the triangle tells them apart.
 * The tests confirm the choice against published circumradii.
 */
function snubVertex(t) {
  const inside = [];
  for (const v of snubRoots([t.rP, t.rQ, t.rR])) {
    if (insideTriangle(v, t)) inside.push(v);
    else if (insideTriangle(scale(v, -1), t)) inside.push(scale(v, -1));
  }
  if (inside.length !== 1) {
    throw new Error(`Expected one snub root inside the triangle, found ${inside.length}`);
  }
  return inside[0];
}

/**
 * Build a uniform polyhedron from its Wythoff symbol.
 * Returns { vertices, faces, groupOrder } with faces as vertex index cycles.
 */
export function uniformPolyhedron(symbol) {
  const t = triangleSetup(symbol);
  const { form, P, sP, sQ, sR, rP, rQ, rR } = t;

  let V;
  let generating;
  if (form === 'vertex') {
    V = P;
    generating = [rotationFace(V, rQ), rotationFace(V, rR)];
  } else if (form === 'edge') {
    // On side PQ (mirror opposite R), equidistant from the two mirrors through R.
    V = normalize(cross(t.nR, sub(t.nP, t.nQ)));
    if (dot(V, t.nP) < 0) V = scale(V, -1);
    generating = [rotationFace(V, rP), rotationFace(V, rQ), alternatingFace(V, sP, sQ)];
  } else if (form === 'omnitruncate') {
    // Equidistant from all three mirrors.
    V = normalize(solve3(fromRows(t.nP, t.nQ, t.nR), [1, 1, 1]));
    generating = [alternatingFace(V, sQ, sR), alternatingFace(V, sR, sP), alternatingFace(V, sP, sQ)];
  } else {
    V = snubVertex(t);
    const rPinv = transpose(rP);
    generating = [
      rotationFace(V, rP), rotationFace(V, rQ), rotationFace(V, rR),
      [V, matVec(rQ, V), matVec(rPinv, V)],
    ];
  }
  generating = generating.filter((face) => !isDegenerate(face));

  const fullGroup = generateGroup([sP, sQ, sR]);
  const group = form === 'snub' ? fullGroup.filter((m) => determinant(m) > 0) : fullGroup;

  const vertexSet = new PointSet();
  for (const g of group) vertexSet.add(matVec(g, V));

  const faces = [];
  const seen = new Set();
  for (const face of generating) {
    for (const g of group) {
      const indices = face.map((p) => vertexSet.indexOf(matVec(g, p)));
      if (indices.includes(-1)) throw new Error('Face vertex is not in the vertex orbit');
      const key = cycleKey(indices);
      if (!seen.has(key)) {
        seen.add(key);
        faces.push(indices);
      }
    }
  }

  const frame = standardFrame(fullGroup);
  const vertices = vertexSet.points.map((p) => matVec(frame, p));
  return { vertices, faces, groupOrder: group.length };
}

/** The 120 symmetries of the icosahedron, in the standard frame (see below). */
export function icosahedralGroup() {
  const t = triangleSetup('2 3 5 |');
  const group = generateGroup([t.sP, t.sQ, t.sR]);
  const frame = standardFrame(group);
  const inverse = transpose(frame);
  return group.map((g) => matMul(frame, matMul(g, inverse)));
}

/**
 * Orbit of a set of polygons under a symmetry group, with shared vertices
 * merged. Returns { vertices, faces }.
 */
export function symmetryOrbit(polygons, group) {
  const vertexSet = new PointSet();
  const faces = [];
  const seen = new Set();
  for (const polygon of polygons) {
    for (const g of group) {
      const indices = polygon.map((p) => vertexSet.add(matVec(g, p)));
      const key = cycleKey(indices);
      if (!seen.has(key)) {
        seen.add(key);
        faces.push(indices);
      }
    }
  }
  return { vertices: vertexSet.points, faces };
}

// ---------------------------------------------------------------------------
// Orientation

function rotationAxis(m) {
  const trace = m[0] + m[4] + m[8];
  if (trace < -1 + 1e-9) {
    // Half turn: m = 2 a a^T - I, so the columns of (m + I) are multiples of a.
    const mPlusI = m.map((x, i) => x + IDENTITY[i]);
    const cols = [0, 1, 2].map((j) => [mPlusI[j], mPlusI[3 + j], mPlusI[6 + j]]);
    cols.sort((a, b) => length(b) - length(a));
    return { angleCos: -1, axis: normalize(cols[0]) };
  }
  const axis = [m[7] - m[5], m[2] - m[6], m[3] - m[1]];
  return { angleCos: (trace - 1) / 2, axis: length(axis) > 1e-9 ? normalize(axis) : null };
}

/**
 * Rotation that puts the icosahedral group in the standard frame: the 2-fold
 * axes along x, y, z and a 5-fold axis along (0, 1, phi), i.e. the frame in
 * which the regular icosahedron has vertices (0, +-1, +-phi) and cyclic shifts.
 */
function standardFrame(group) {
  const rotations = group.filter((m) => determinant(m) > 0);
  const halfTurns = [];
  const fiveFold = [];
  for (const m of rotations) {
    const { angleCos, axis } = rotationAxis(m);
    if (!axis) continue;
    if (angleCos === -1) halfTurns.push(axis);
    else if (Math.abs(angleCos - Math.cos((2 * Math.PI) / 5)) < 1e-9) fiveFold.push(axis);
  }
  if (halfTurns.length !== 15 || fiveFold.length === 0) return IDENTITY; // not icosahedral
  const a = halfTurns[0];
  const b = halfTurns.find((x) => Math.abs(dot(a, x)) < 1e-9);
  const c = cross(a, b);
  let frame = fromRows(a, b, c);
  const phi = (1 + Math.sqrt(5)) / 2;
  const target = normalize([0, 1, phi]);
  const hasTarget = (f) => fiveFold.some((axis) => Math.abs(Math.abs(dot(matVec(f, axis), target)) - 1) < 1e-9);
  if (!hasTarget(frame)) frame = matMul([0, -1, 0, 1, 0, 0, 0, 0, 1], frame); // quarter turn about z
  return frame;
}
