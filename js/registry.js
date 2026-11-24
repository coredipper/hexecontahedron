// Registry of all hexecontahedra. Metadata comes from catalog.js; geometry is
// computed on first use and cached.

import catalog, { FAMILIES } from './catalog.js';
import { parseWythoff, uniformPolyhedron } from './geometry/wythoff.js';
import { polarDual } from './geometry/dual.js';
import { edgeList } from './geometry/mesh.js';

export { FAMILIES };

/**
 * A Wythoff snub (| p q r) is chiral iff all three Schwarz triangle angles are
 * distinct; two equal angles (U32 | 5/2 3 3 and U72 | 3/2 3/2 5/2) introduce a
 * reflection plane, making the polyhedron and its dual achiral.
 */
function isChiralEntry(entry) {
  if (!entry.dual) return false;
  const parsed = parseWythoff(entry.dual.wythoff);
  if (parsed.form !== 'snub') return false;
  return new Set([parsed.p.text, parsed.q.text, parsed.r.text]).size === 3;
}

export const polyhedra = catalog.map((entry) => ({
  ...entry,
  chiral: isChiralEntry(entry),
}));

const cache = new Map();

/** Vertices and faces of a catalog entry. */
function buildGeometry(entry) {
  if (entry.build) return entry.build();
  return polarDual(uniformPolyhedron(entry.dual.wythoff));
}

/** Catalog entry plus geometry ({ vertices, faces, counts }), or null. */
export function getPolyhedron(id, { mirror = false } = {}) {
  const entry = polyhedra.find((p) => p.id === id);
  if (!entry) return null;
  const mirrored = Boolean(mirror && entry.chiral);
  const key = mirrored ? `${id}:mirror` : id;
  if (!cache.has(key)) {
    const base = mirrored ? getPolyhedron(id) : null;
    const { vertices, faces } = base
      ? {
          vertices: base.vertices.map(([x, y, z]) => [-x, y, z]),
          faces: base.faces.map((f) => [...f].reverse()),
        }
      : buildGeometry(entry);
    const counts = base
      ? base.counts
      : { faces: faces.length, edges: edgeList(faces).length, vertices: vertices.length };
    cache.set(key, { ...entry, vertices, faces, counts });
  }
  return cache.get(key);
}

const PLURALS = { 'golden rhombus': 'golden rhombi' };

/** Plural, lower-case face shape ("kites", "golden rhombi"). */
function faceShapePlural(entry) {
  const shape = entry.faceShape.toLowerCase();
  return PLURALS[shape] ?? `${shape}s`;
}

/** One-line description for cards and page headers. */
export function describe(entry) {
  const source = entry.dual ? `Dual of the ${entry.dual.name}` : entry.origin ?? FAMILIES[entry.family].short;
  return `${source}. 60 ${faceShapePlural(entry)}.`;
}

const normalizeSearch = (text) =>
  String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const searchIndex = new WeakMap();
function searchableText(entry) {
  if (!searchIndex.has(entry)) {
    const parts = [
      entry.id,
      entry.name,
      FAMILIES[entry.family].label,
      FAMILIES[entry.family].short,
      entry.faceShape,
      faceShapePlural(entry),
      entry.origin ?? '',
      entry.note ?? '',
      entry.dual ? `${entry.dual.name} ${entry.dual.index} ${entry.dual.wythoff}` : '',
      entry.chiral ? 'chiral enantiomorphic' : 'reflexible',
    ];
    searchIndex.set(entry, normalizeSearch(parts.join(' ')));
  }
  return searchIndex.get(entry);
}

/** Whether a catalog entry matches the selected family and search query. */
export function matchesFilter(entry, { family = 'all', query = '' } = {}) {
  if (family !== 'all' && entry.family !== family) return false;
  const cleaned = normalizeSearch(query).trim().replace(/\s+/g, ' ');
  if (!cleaned) return true;
  if (cleaned.includes('|')) {
    return Boolean(entry.dual && normalizeSearch(entry.dual.wythoff).includes(cleaned));
  }
  const haystack = searchableText(entry);
  return cleaned.split(' ').every((term) => haystack.includes(term));
}

export default polyhedra;
