// Geometry tests. Run with `npm test` (Node 18+, no dependencies).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import catalog from '../js/catalog.js';
import { getPolyhedron, describe as describeEntry } from '../js/registry.js';
import { uniformPolyhedron, parseWythoff } from '../js/geometry/wythoff.js';
import { polarDual } from '../js/geometry/dual.js';
import { edgeList, faceNormal, meshData } from '../js/geometry/mesh.js';
import { isSimple, triangulate2D, triangulateFace, windingNumber } from '../js/geometry/polygon.js';
import { centroid, cross, distance, dot, length, normalize, sub } from '../js/geometry/vec.js';

const phi = (1 + Math.sqrt(5)) / 2;

// Vertex, edge and face counts and faces by type, from Wikipedia's
// "List of uniform polyhedra". All of these have 60 vertices.
const UNIFORM = {
  U25: { E: 90, F: 32, faces: { '{5}': 12, '{6}': 20 } },
  U26: { E: 90, F: 32, faces: { '{3}': 20, '{10}': 12 } },
  U27: { E: 120, F: 62, faces: { '{3}': 20, '{4}': 30, '{5}': 12 } },
  U29: { E: 150, F: 92, faces: { '{3}': 80, '{5}': 12 } },
  U31: { E: 120, F: 52, faces: { '{3}': 20, '{5/2}': 12, '{6}': 20 } },
  U32: { E: 180, F: 112, faces: { '{3}': 100, '{5/2}': 12 } },
  U33: { E: 120, F: 44, faces: { '{3}': 20, '{5}': 12, '{10}': 12 } },
  U37: { E: 90, F: 24, faces: { '{5/2}': 12, '{10}': 12 } },
  U38: { E: 120, F: 54, faces: { '{4}': 30, '{5}': 12, '{5/2}': 12 } },
  U39: { E: 120, F: 42, faces: { '{4}': 30, '{10}': 12 } },
  U40: { E: 150, F: 84, faces: { '{3}': 60, '{5}': 12, '{5/2}': 12 } },
  U42: { E: 120, F: 44, faces: { '{3}': 20, '{5}': 12, '{10/3}': 12 } },
  U43: { E: 120, F: 44, faces: { '{3}': 20, '{5/2}': 12, '{10}': 12 } },
  U44: { E: 120, F: 44, faces: { '{5}': 12, '{5/2}': 12, '{6}': 20 } },
  U46: { E: 180, F: 104, faces: { '{3}': 80, '{5}': 12, '{5/2}': 12 } },
  U48: { E: 120, F: 52, faces: { '{3}': 20, '{5}': 12, '{6}': 20 } },
  U50: { E: 120, F: 32, faces: { '{6}': 20, '{10}': 12 } },
  U55: { E: 90, F: 32, faces: { '{5/2}': 12, '{6}': 20 } },
  U56: { E: 120, F: 50, faces: { '{4}': 30, '{6}': 20 } },
  U57: { E: 150, F: 92, faces: { '{3}': 80, '{5/2}': 12 } },
  U58: { E: 90, F: 24, faces: { '{5}': 12, '{10/3}': 12 } },
  U60: { E: 150, F: 84, faces: { '{3}': 60, '{5}': 12, '{5/2}': 12 } },
  U61: { E: 120, F: 44, faces: { '{3}': 20, '{5/2}': 12, '{10/3}': 12 } },
  U63: { E: 120, F: 32, faces: { '{6}': 20, '{10/3}': 12 } },
  U64: { E: 180, F: 104, faces: { '{3}': 80, '{5/2}': 24 } },
  U66: { E: 90, F: 32, faces: { '{3}': 20, '{10/3}': 12 } },
  U67: { E: 120, F: 62, faces: { '{3}': 20, '{4}': 30, '{5/2}': 12 } },
  U69: { E: 150, F: 92, faces: { '{3}': 80, '{5/2}': 12 } },
  U72: { E: 180, F: 112, faces: { '{3}': 100, '{5/2}': 12 } },
  U73: { E: 120, F: 42, faces: { '{4}': 30, '{10/3}': 12 } },
  U74: { E: 150, F: 92, faces: { '{3}': 80, '{5/2}': 12 } },
};

// Circumradius for unit edge length, for every source polyhedron. Snub
// decimals are from each polyhedron's Wikipedia article (they tell apart the
// several solutions of the snub equations). The closed forms for U31-U73 are
// from Richard Klitzing's incidence-matrix pages (bendwavy.org/klitzing);
// the truncations and U38 are standard formulas.
const plastic = (() => {
  let x = 1.3;
  for (let i = 0; i < 50; i++) x -= (x ** 3 - x - 1) / (3 * x ** 2 - 1);
  return x;
})();
const s5 = Math.sqrt(5);
const R_SIID = Math.sqrt((17 + 3 * s5) / 8); // shared vertex set: U31, U43, U50
const R_GIID = Math.sqrt((17 - 3 * s5) / 8); // U42, U48, U63
const R_SRID = Math.sqrt(s5 + 11 / 4); // U27, U33, U39
const R_QRID = Math.sqrt(11 / 4 - s5); // U61, U67, U73
const R_RADED = Math.sqrt(7) / 2; // U38, U44, U56
const CIRCUMRADIUS = {
  U25: Math.sqrt(58 + 18 * s5) / 4,
  U26: Math.sqrt(74 + 30 * s5) / 4,
  U27: R_SRID,
  U29: 2.1558373751156,
  U31: R_SIID,
  U32: 1.4581903307387025,
  U33: R_SRID,
  U37: Math.sqrt(34 + 10 * s5) / 4,
  U38: R_RADED,
  U39: R_SRID,
  U40: 1.2744398820380232,
  U42: R_GIID,
  U43: R_SIID,
  U44: R_RADED,
  U46: Math.sqrt((2 * plastic - 1) / (plastic - 1)) / 2,
  U48: R_GIID,
  U50: R_SIID,
  U55: Math.sqrt(58 - 18 * s5) / 4,
  U56: R_RADED,
  U57: 0.8160806747999234,
  U58: Math.sqrt(34 - 10 * s5) / 4,
  U60: 0.8516302281174128,
  U61: R_QRID,
  U63: R_GIID,
  U64: Math.SQRT1_2,
  U66: Math.sqrt(74 - 30 * s5) / 4,
  U67: R_QRID,
  U69: 0.6450202372957795,
  U72: 0.5806948001339209,
  U73: R_QRID,
  U74: 0.5800015046400155,
};

// ---------------------------------------------------------------------------
// Helpers

/** 2D coordinates in the plane of a face, with an independent basis. */
function planeFrame(points) {
  const n = faceNormal(points);
  const u = normalize(cross(n, Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [0, 0, 1]));
  const w = cross(n, u);
  const c = centroid(points);
  const project = (p) => [dot(sub(p, c), u), dot(sub(p, c), w)];
  return { normal: n, poly: points.map(project), project };
}

const planeCoordinates = (points) => planeFrame(points).poly;

/** {n} or {n/d} for a regular polygon, from its winding around its centre. */
function regularPolygonType(points) {
  const c = centroid(points);
  const n = normalize(c);
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const a = sub(points[i], c);
    const b = sub(points[(i + 1) % points.length], c);
    total += Math.atan2(dot(cross(a, b), n), dot(a, b));
  }
  const k = points.length;
  let d = Math.round(Math.abs(total) / (2 * Math.PI));
  d = Math.min(d, k - d);
  return d === 1 ? `{${k}}` : `{${k}/${d}}`;
}

function sideLengths(points) {
  return points.map((p, i) => distance(p, points[(i + 1) % points.length]));
}

function classifyFace(points) {
  const poly = planeCoordinates(points);
  const sides = sideLengths(points);
  const size = Math.max(...sides);
  const eq = (a, b) => Math.abs(a - b) < 1e-7 * size;
  const crossed = !isSimple(poly);
  const turns = poly.map((p, i) => {
    const a = poly[(i + poly.length - 1) % poly.length];
    const b = poly[(i + 1) % poly.length];
    return Math.sign((p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]));
  });
  const convex = turns.every((t) => t === turns[0]);
  const k = points.length;
  if (k === 3) return eq(sides[0], sides[1]) || eq(sides[1], sides[2]) || eq(sides[0], sides[2]) ? 'isosceles triangle' : 'triangle';
  if (k === 4) {
    if (crossed) return eq(sides[0], sides[2]) && eq(sides[1], sides[3]) ? 'antiparallelogram' : 'crossed quadrilateral';
    if (sides.every((s) => eq(s, sides[0]))) {
      const ratio = distance(points[0], points[2]) / distance(points[1], points[3]);
      return eq(Math.max(ratio, 1 / ratio), phi) ? 'golden rhombus' : 'rhombus';
    }
    const kiteLike = (eq(sides[0], sides[1]) && eq(sides[2], sides[3])) || (eq(sides[1], sides[2]) && eq(sides[3], sides[0]));
    if (kiteLike) return convex ? 'kite' : 'dart';
    return 'quadrilateral';
  }
  const [simpleName, starName] = { 5: ['pentagon', 'pentagram'], 6: ['hexagon', 'hexagram'] }[k];
  if (crossed) return starName;
  return convex ? simpleName : `concave ${simpleName}`;
}

/** Sorted pairwise distances: equal for congruent polygons. */
function shapeSignature(points) {
  const d = [];
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) d.push(distance(points[i], points[j]));
  return d.sort((a, b) => a - b);
}

function edgeFaceCounts(faces) {
  const counts = new Map();
  for (const face of faces) {
    for (let k = 0; k < face.length; k++) {
      const a = face[k];
      const b = face[(k + 1) % face.length];
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Uniform polyhedra from Wythoff symbols

test('Wythoff symbols parse', () => {
  assert.deepEqual(parseWythoff('2 5/2 | 5').form, 'edge');
  assert.deepEqual(parseWythoff('| 2 3 5').form, 'snub');
  assert.deepEqual(parseWythoff('3/2 3 5 |').form, 'omnitruncate');
  assert.deepEqual(parseWythoff('2 | 3 5').form, 'vertex');
  assert.throws(() => parseWythoff('2 3 5'));
  assert.throws(() => parseWythoff('1 3 | 5'));
});

for (const entry of catalog.filter((e) => e.dual)) {
  const { index, wythoff, name } = entry.dual;
  test(`${index} ${name} (${wythoff}) matches the reference counts`, () => {
    const poly = uniformPolyhedron(wythoff);
    const ref = UNIFORM[index];
    assert.ok(ref, `no reference data for ${index}`);
    assert.equal(poly.vertices.length, 60, 'vertices');
    assert.equal(poly.faces.length, ref.F, 'faces');
    assert.equal(edgeList(poly.faces).length, ref.E, 'edges');

    const types = {};
    for (const face of poly.faces) {
      const t = regularPolygonType(face.map((i) => poly.vertices[i]));
      types[t] = (types[t] ?? 0) + 1;
    }
    assert.deepEqual(types, ref.faces, 'faces by type');

    const radii = poly.vertices.map(length);
    assert.ok(Math.max(...radii) - Math.min(...radii) < 1e-12, 'vertices on one sphere');
    const lengths = edgeList(poly.faces).map(([a, b]) => distance(poly.vertices[a], poly.vertices[b]));
    assert.ok(Math.max(...lengths) - Math.min(...lengths) < 1e-12, 'all edges equal');
    for (const count of edgeFaceCounts(poly.faces).values()) assert.equal(count, 2, 'each edge joins two faces');

    const ratio = radii[0] / lengths[0];
    assert.ok(Math.abs(ratio - CIRCUMRADIUS[index]) < 1e-9, `circumradius ${ratio} vs ${CIRCUMRADIUS[index]}`);

    const dual = polarDual(poly);
    assert.equal(dual.vertices.length, ref.F, 'dual vertices = faces');
    assert.equal(edgeList(dual.faces).length, ref.E, 'dual edges = edges');
  });
}

// ---------------------------------------------------------------------------
// The 32 hexecontahedra

test('catalog has 32 entries with unique ids', () => {
  assert.equal(catalog.length, 32);
  assert.equal(new Set(catalog.map((e) => e.id)).size, 32);
  assert.equal(catalog.filter((e) => e.family === 'catalan').length, 4);
  assert.equal(catalog.filter((e) => e.family === 'star-dual').length, 27);
});

for (const entry of catalog) {
  test(`${entry.name}: 60 congruent planar ${entry.faceShape.toLowerCase()} faces`, () => {
    const p = getPolyhedron(entry.id);
    assert.equal(p.faces.length, 60);
    assert.equal(p.counts.faces, 60);

    const scale = Math.max(...p.vertices.map(length));
    const reference = shapeSignature(p.faces[0].map((i) => p.vertices[i]));
    for (const face of p.faces) {
      const points = face.map((i) => p.vertices[i]);
      const n = faceNormal(points);
      const h = dot(n, points[0]);
      for (const q of points) assert.ok(Math.abs(dot(n, q) - h) < 1e-9 * scale, 'face is planar');
      const signature = shapeSignature(points);
      signature.forEach((d, i) => assert.ok(Math.abs(d - reference[i]) < 1e-9 * scale, 'faces are congruent'));
      assert.equal(classifyFace(points), entry.faceShape.toLowerCase());
    }
    for (const count of edgeFaceCounts(p.faces).values()) assert.equal(count, 2, 'each edge joins two faces');
    assert.ok(describeEntry(entry).length > 0);
  });
}

test('Catalan solids are convex; the others are not', () => {
  for (const entry of catalog) {
    const p = getPolyhedron(entry.id);
    const scale = Math.max(...p.vertices.map(length));
    let convex = true;
    for (const face of p.faces) {
      const points = face.map((i) => p.vertices[i]);
      const n = faceNormal(points);
      const h = dot(n, points[0]);
      if (p.vertices.some((v) => dot(n, v) > h + 1e-9 * scale)) convex = false;
    }
    assert.equal(convex, entry.family === 'catalan', entry.name);
  }
});

test('Catalan solids have the expected vertex counts', () => {
  const expected = {
    'pentakis-dodecahedron': [32, 90],
    'triakis-icosahedron': [32, 90],
    'deltoidal-hexecontahedron': [62, 120],
    'pentagonal-hexecontahedron': [92, 150],
    'rhombic-hexecontahedron': [62, 120],
  };
  for (const [id, [v, e]] of Object.entries(expected)) {
    const p = getPolyhedron(id);
    assert.equal(p.counts.vertices, v, `${id} vertices`);
    assert.equal(p.counts.edges, e, `${id} edges`);
  }
});

test('only the three partially degenerate duals have coincident vertices', () => {
  // Wikipedia's infoboxes give V = 112, 104, 112: both points of each pair count.
  const wikipediaCount = {
    'small-hexagonal-hexecontahedron': 112,
    'great-hexagonal-hexecontahedron': 104,
    'small-hexagrammic-hexecontahedron': 112,
  };
  for (const [id, count] of Object.entries(wikipediaCount)) {
    assert.equal(getPolyhedron(id).counts.vertices, count, id);
  }
  const distinctExpected = {
    'small-hexagonal-hexecontahedron': 92,
    'great-hexagonal-hexecontahedron': 92,
    'small-hexagrammic-hexecontahedron': 92,
  };
  for (const entry of catalog) {
    const p = getPolyhedron(entry.id);
    const scale = Math.max(...p.vertices.map(length));
    const distinct = [];
    for (const v of p.vertices) if (!distinct.some((u) => distance(u, v) < 1e-9 * scale)) distinct.push(v);
    assert.equal(distinct.length, distinctExpected[entry.id] ?? p.vertices.length, entry.name);
    assert.equal(Boolean(entry.note?.startsWith('Partially degenerate')), entry.id in distinctExpected, entry.name);
  }
});

test('pentakis dodecahedron apices lie on icosahedron axes (0, 1, phi)', () => {
  const p = getPolyhedron('pentakis-dodecahedron');
  const axis = normalize([0, 1, phi]);
  assert.ok(p.vertices.some((v) => Math.abs(dot(normalize(v), axis) - 1) < 1e-12));
});

// ---------------------------------------------------------------------------
// Triangulation

function coverageMismatches(poly, triangles, samples = 4000) {
  const inTriangle = (p, t) => {
    const s = (a, b) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    const d = [s(t[0], t[1]), s(t[1], t[2]), s(t[2], t[0])];
    return d.every((x) => x > 0) || d.every((x) => x < 0);
  };
  const xs = poly.map((q) => q[0]);
  const ys = poly.map((q) => q[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  let seed = 7;
  const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  let bad = 0;
  for (let i = 0; i < samples; i++) {
    const p = [x0 + (x1 - x0) * random(), y0 + (y1 - y0) * random()];
    const expected = windingNumber(poly, p) !== 0 ? 1 : 0;
    const covered = triangles.filter((t) => inTriangle(p, t)).length;
    if (covered !== expected) bad++;
  }
  return bad;
}

test('2D triangulation covers exactly the non-zero winding region', () => {
  const pentagram = [0, 2, 4, 1, 3].map((k) => [Math.cos((2 * Math.PI * k) / 5), Math.sin((2 * Math.PI * k) / 5)]);
  const antiparallelogram = [[-1, 0], [1, 0], [-0.5, 1], [0.5, 1]];
  const dart = [[0, 0], [1, 2], [0, 0.8], [-1, 2]];
  const spiked = [[0, 0], [1, 0], [1, 1], [1, 1.5], [1, 1], [0, 1]]; // zero-width spike
  for (const poly of [pentagram, antiparallelogram, dart, spiked]) {
    assert.equal(coverageMismatches(poly, triangulate2D(poly)), 0);
  }
});

test('every face of every polyhedron is triangulated exactly (3D path)', () => {
  for (const entry of catalog) {
    const p = getPolyhedron(entry.id);
    for (const face of p.faces) {
      const points = face.map((i) => p.vertices[i]);
      const { normal, poly, project } = planeFrame(points);
      const triangles = triangulateFace(points, normal);
      const h = dot(normal, points[0]);
      const scale = Math.max(...points.map(length));
      for (const t of triangles) for (const q of t) assert.ok(Math.abs(dot(normal, q) - h) < 1e-9 * scale, 'in plane');
      assert.equal(coverageMismatches(poly, triangles.map((t) => t.map(project)), 300), 0, entry.name);
    }
  }
});

test('mesh data is finite and scaled to the unit sphere', () => {
  for (const entry of catalog) {
    const mesh = meshData(getPolyhedron(entry.id));
    assert.ok(mesh.positions.length > 0 && mesh.positions.length % 9 === 0);
    assert.equal(mesh.normals.length, mesh.positions.length);
    assert.ok(mesh.positions.every(Number.isFinite) && mesh.edges.every(Number.isFinite));
    let max = 0;
    for (let i = 0; i < mesh.positions.length; i += 3) {
      max = Math.max(max, Math.hypot(mesh.positions[i], mesh.positions[i + 1], mesh.positions[i + 2]));
    }
    assert.ok(Math.abs(max - 1) < 1e-6, entry.name);
  }
});
