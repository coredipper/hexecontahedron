// Registry of all hexecontahedra
// Import all polyhedra and export as a collection

import pentakisDodecahedron from './polyhedra/pentakis-dodecahedron.js';
import deltoidalHexecontahedron from './polyhedra/deltoidal-hexecontahedron.js';
import pentagonalHexecontahedron from './polyhedra/pentagonal-hexecontahedron.js';
import triakisIcosahedron from './polyhedra/triakis-icosahedron.js';
import rhombicHexecontahedron from './polyhedra/rhombic-hexecontahedron.js';
import starHexecontahedron1 from './polyhedra/star-hexecontahedron-1.js';
import starHexecontahedron2 from './polyhedra/star-hexecontahedron-2.js';
import starHexecontahedron3 from './polyhedra/star-hexecontahedron-3.js';
import starHexecontahedron4 from './polyhedra/star-hexecontahedron-4.js';
import starHexecontahedron5 from './polyhedra/star-hexecontahedron-5.js';
import starHexecontahedron6 from './polyhedra/star-hexecontahedron-6.js';
import starHexecontahedron7 from './polyhedra/star-hexecontahedron-7.js';
import starHexecontahedron8 from './polyhedra/star-hexecontahedron-8.js';
import starHexecontahedron9 from './polyhedra/star-hexecontahedron-9.js';
import starHexecontahedron10 from './polyhedra/star-hexecontahedron-10.js';
import starHexecontahedron11 from './polyhedra/star-hexecontahedron-11.js';
import starHexecontahedron12 from './polyhedra/star-hexecontahedron-12.js';
import starHexecontahedron13 from './polyhedra/star-hexecontahedron-13.js';
import starHexecontahedron14 from './polyhedra/star-hexecontahedron-14.js';
import starHexecontahedron15 from './polyhedra/star-hexecontahedron-15.js';
import starHexecontahedron16 from './polyhedra/star-hexecontahedron-16.js';
import starHexecontahedron17 from './polyhedra/star-hexecontahedron-17.js';
import starHexecontahedron18 from './polyhedra/star-hexecontahedron-18.js';
import starHexecontahedron19 from './polyhedra/star-hexecontahedron-19.js';
import starHexecontahedron20 from './polyhedra/star-hexecontahedron-20.js';
import starHexecontahedron21 from './polyhedra/star-hexecontahedron-21.js';
import starHexecontahedron22 from './polyhedra/star-hexecontahedron-22.js';
import starHexecontahedron23 from './polyhedra/star-hexecontahedron-23.js';
import starHexecontahedron24 from './polyhedra/star-hexecontahedron-24.js';
import starHexecontahedron25 from './polyhedra/star-hexecontahedron-25.js';
import starHexecontahedron26 from './polyhedra/star-hexecontahedron-26.js';
import starHexecontahedron27 from './polyhedra/star-hexecontahedron-27.js';

// Array of all polyhedra (for iteration)
export const polyhedra = [
  pentakisDodecahedron,
  deltoidalHexecontahedron,
  pentagonalHexecontahedron,
  triakisIcosahedron,
  rhombicHexecontahedron,
  starHexecontahedron1,
  starHexecontahedron2,
  starHexecontahedron3,
  starHexecontahedron4,
  starHexecontahedron5,
  starHexecontahedron6,
  starHexecontahedron7,
  starHexecontahedron8,
  starHexecontahedron9,
  starHexecontahedron10,
  starHexecontahedron11,
  starHexecontahedron12,
  starHexecontahedron13,
  starHexecontahedron14,
  starHexecontahedron15,
  starHexecontahedron16,
  starHexecontahedron17,
  starHexecontahedron18,
  starHexecontahedron19,
  starHexecontahedron20,
  starHexecontahedron21,
  starHexecontahedron22,
  starHexecontahedron23,
  starHexecontahedron24,
  starHexecontahedron25,
  starHexecontahedron26,
  starHexecontahedron27
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
