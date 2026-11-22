// Rhombic hexecontahedron: a non-convex stellation of the rhombic
// triacontahedron with 60 golden rhombus faces, 62 vertices and 120 edges.
//
// Construction from a regular dodecahedron with circumradius sqrt(3):
// each face is the rhombus (inner, edge midpoint, outer, edge midpoint), where
//   inner = dodecahedron face centre scaled by (3 - phi) / 2,
//   outer = dodecahedron vertex scaled by (phi + 1) / 2,
// and the midpoints belong to the two dodecahedron edges at that vertex.
// One such rhombus is written out; the other 59 are its images under the
// icosahedral group. Its long diagonal (inner to outer) is phi times the
// short diagonal (midpoint to midpoint).

import { icosahedralGroup, symmetryOrbit } from '../geometry/wythoff.js';
import { add, scale } from '../geometry/vec.js';

const phi = (1 + Math.sqrt(5)) / 2;

export function buildRhombicHexecontahedron() {
  // Dodecahedron face around the 5-fold axis (0, 1, phi): its five vertices
  // are (1, 1, 1), (1/phi, 0, phi), (-1/phi, 0, phi), (-1, 1, 1), (0, phi, 1/phi).
  const corner = [1, 1, 1];
  const neighbourA = [1 / phi, 0, phi];
  const neighbourB = [0, phi, 1 / phi];
  const faceCentre = [0, (2 + phi) / 5, (3 * phi + 1) / 5];

  const inner = scale(faceCentre, (3 - phi) / 2);
  const outer = scale(corner, (phi + 1) / 2);
  const midA = scale(add(corner, neighbourA), 0.5);
  const midB = scale(add(corner, neighbourB), 0.5);

  return symmetryOrbit([[inner, midA, outer, midB]], icosahedralGroup());
}
