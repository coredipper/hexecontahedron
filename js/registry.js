// Registry of all hexecontahedra
// Import all polyhedra and export as a collection

import pentakisDodecahedron from './polyhedra/pentakis-dodecahedron.js';
import deltoidalHexecontahedron from './polyhedra/deltoidal-hexecontahedron.js';
import pentagonalHexecontahedron from './polyhedra/pentagonal-hexecontahedron.js';
import triakisIcosahedron from './polyhedra/triakis-icosahedron.js';
import rhombicHexecontahedron from './polyhedra/rhombic-hexecontahedron.js';

// Array of all polyhedra (for iteration)
export const polyhedra = [
  pentakisDodecahedron,
  deltoidalHexecontahedron,
  pentagonalHexecontahedron,
  triakisIcosahedron,
  rhombicHexecontahedron
];

// Map by ID (for lookup)
export const polyhedraById = Object.fromEntries(
  polyhedra.map(p => [p.id, p])
);

// Get a polyhedron by ID
export function getPolyhedron(id) {
  return polyhedraById[id] || null;
}

export default polyhedra;
