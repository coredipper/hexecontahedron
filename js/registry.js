// Registry of all hexecontahedra. Metadata comes from catalog.js; geometry is
// computed on first use and cached.

import catalog, { FAMILIES } from './catalog.js';
import { uniformPolyhedron } from './geometry/wythoff.js';
import { polarDual } from './geometry/dual.js';
import { edgeList } from './geometry/mesh.js';

export { FAMILIES };
export const polyhedra = catalog;

const cache = new Map();

/** Vertices and faces of a catalog entry. */
export function buildGeometry(entry) {
  if (entry.build) return entry.build();
  return polarDual(uniformPolyhedron(entry.dual.wythoff));
}

/** Catalog entry plus geometry ({ vertices, faces, counts }), or null. */
export function getPolyhedron(id) {
  const entry = catalog.find((p) => p.id === id);
  if (!entry) return null;
  if (!cache.has(id)) {
    const { vertices, faces } = buildGeometry(entry);
    const counts = { faces: faces.length, edges: edgeList(faces).length, vertices: vertices.length };
    cache.set(id, { ...entry, vertices, faces, counts });
  }
  return cache.get(id);
}

const PLURALS = { 'golden rhombus': 'golden rhombi' };

/** Plural, lower-case face shape ("kites", "golden rhombi"). */
export function faceShapePlural(entry) {
  const shape = entry.faceShape.toLowerCase();
  return PLURALS[shape] ?? `${shape}s`;
}

/** One-line description for cards and page headers. */
export function describe(entry) {
  const source = entry.dual ? `Dual of the ${entry.dual.name}` : entry.origin ?? FAMILIES[entry.family].short;
  return `${source}. 60 ${faceShapePlural(entry)}.`;
}

export default polyhedra;
