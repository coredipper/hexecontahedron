// Converts polygon data ({ vertices, faces }) into flat triangle and edge
// arrays ready for a GPU buffer. Independent of three.js.

import { centroid, cross, dot, length, normalize, scale, sub } from './vec.js';
import { triangulateFace } from './polygon.js';

/**
 * Plane normal of a planar polygon, pointing away from the origin. Uses the
 * largest cross product of centre-to-vertex vectors, which also works for
 * crossed polygons whose signed area is zero.
 */
export function faceNormal(points) {
  const c = centroid(points);
  let best = [0, 0, 0];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const n = cross(sub(points[i], c), sub(points[j], c));
      if (length(n) > length(best)) best = n;
    }
  }
  const n = normalize(best);
  return dot(n, c) < 0 ? scale(n, -1) : n;
}

/** Unique undirected edges as [a, b] vertex index pairs. */
export function edgeList(faces) {
  const seen = new Set();
  const edges = [];
  for (const face of faces) {
    for (let k = 0; k < face.length; k++) {
      const a = face[k];
      const b = face[(k + 1) % face.length];
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push(a < b ? [a, b] : [b, a]);
      }
    }
  }
  return edges;
}

/**
 * Triangles (with per-face normals) and edge segments, scaled so the
 * farthest vertex is at distance `radius` from the origin.
 */
export function meshData({ vertices, faces }, radius = 1) {
  const s = radius / Math.max(...vertices.map(length));
  const scaled = vertices.map((v) => scale(v, s));
  const positions = [];
  const normals = [];
  for (const face of faces) {
    const points = face.map((i) => scaled[i]);
    const n = faceNormal(points);
    for (const triangle of triangulateFace(points, n)) {
      for (const p of triangle) {
        positions.push(p[0], p[1], p[2]);
        normals.push(n[0], n[1], n[2]);
      }
    }
  }
  const edgePositions = [];
  for (const [a, b] of edgeList(faces)) edgePositions.push(...scaled[a], ...scaled[b]);
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    edges: new Float32Array(edgePositions),
  };
}
