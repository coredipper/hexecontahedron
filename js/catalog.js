// The 32 hexecontahedra listed on Wikipedia's "Hexecontahedron" page:
// 4 Catalan solids, the rhombic hexecontahedron, and the 27 duals of the
// non-convex uniform polyhedra that have 60 vertices.
//
// Each dual is built from the Wythoff symbol of its uniform polyhedron
// (see js/geometry/wythoff.js). U-numbers and Wythoff symbols follow
// Wikipedia's "List of uniform polyhedra". The great dirhombicosidodecacron
// (dual of U75, which has no Wythoff construction of this kind) is not part
// of that list of 27 and is not included.

import { buildRhombicHexecontahedron } from './polyhedra/rhombic-hexecontahedron.js';

export const FAMILIES = {
  catalan: { label: 'Catalan solids', short: 'Catalan solid' },
  stellation: { label: 'Stellation', short: 'Stellation' },
  'star-dual': { label: 'Uniform star duals', short: 'Uniform star dual' },
};

const dual = (name, index, wythoff) => ({ name, index, wythoff });

const catalog = [
  {
    id: 'pentakis-dodecahedron',
    name: 'Pentakis Dodecahedron',
    family: 'catalan',
    faceShape: 'Isosceles triangle',
    dual: dual('truncated icosahedron', 'U25', '2 5 | 3'),
  },
  {
    id: 'triakis-icosahedron',
    name: 'Triakis Icosahedron',
    family: 'catalan',
    faceShape: 'Isosceles triangle',
    dual: dual('truncated dodecahedron', 'U26', '2 3 | 5'),
  },
  {
    id: 'deltoidal-hexecontahedron',
    name: 'Deltoidal Hexecontahedron',
    family: 'catalan',
    faceShape: 'Kite',
    dual: dual('rhombicosidodecahedron', 'U27', '3 5 | 2'),
  },
  {
    id: 'pentagonal-hexecontahedron',
    name: 'Pentagonal Hexecontahedron',
    family: 'catalan',
    faceShape: 'Pentagon',
    dual: dual('snub dodecahedron', 'U29', '| 2 3 5'),
    note: 'Chiral: it exists in left- and right-handed forms.',
  },
  {
    id: 'rhombic-hexecontahedron',
    name: 'Rhombic Hexecontahedron',
    family: 'stellation',
    faceShape: 'Golden rhombus',
    build: buildRhombicHexecontahedron,
    origin: 'Stellation of the rhombic triacontahedron',
    note: 'Isohedral, but not the dual of a uniform polyhedron.',
  },
  {
    id: 'small-icosacronic-hexecontahedron',
    name: 'Small Icosacronic Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Kite',
    dual: dual('small icosicosidodecahedron', 'U31', '5/2 3 | 3'),
  },
  {
    id: 'small-hexagonal-hexecontahedron',
    name: 'Small Hexagonal Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Hexagon',
    dual: dual('small snub icosicosidodecahedron', 'U32', '| 5/2 3 3'),
    note: 'Partially degenerate: some vertices coincide in pairs, because the uniform polyhedron has pairs of coplanar triangles.',
  },
  {
    id: 'small-dodecacronic-hexecontahedron',
    name: 'Small Dodecacronic Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Dart',
    dual: dual('small dodecicosidodecahedron', 'U33', '3/2 5 | 5'),
  },
  {
    id: 'small-stellapentakis-dodecahedron',
    name: 'Small Stellapentakis Dodecahedron',
    family: 'star-dual',
    faceShape: 'Isosceles triangle',
    dual: dual('truncated great dodecahedron', 'U37', '2 5/2 | 5'),
  },
  {
    id: 'medial-deltoidal-hexecontahedron',
    name: 'Medial Deltoidal Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Kite',
    dual: dual('rhombidodecadodecahedron', 'U38', '5/2 5 | 2'),
  },
  {
    id: 'small-rhombidodecacron',
    name: 'Small Rhombidodecacron',
    family: 'star-dual',
    faceShape: 'Antiparallelogram',
    dual: dual('small rhombidodecahedron', 'U39', '2 5/2 5 |'),
  },
  {
    id: 'medial-pentagonal-hexecontahedron',
    name: 'Medial Pentagonal Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Pentagon',
    dual: dual('snub dodecadodecahedron', 'U40', '| 2 5/2 5'),
  },
  {
    id: 'great-ditrigonal-dodecacronic-hexecontahedron',
    name: 'Great Ditrigonal Dodecacronic Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Kite',
    dual: dual('great ditrigonal dodecicosidodecahedron', 'U42', '3 5 | 5/3'),
  },
  {
    id: 'small-ditrigonal-dodecacronic-hexecontahedron',
    name: 'Small Ditrigonal Dodecacronic Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Dart',
    dual: dual('small ditrigonal dodecicosidodecahedron', 'U43', '5/3 3 | 5'),
  },
  {
    id: 'medial-icosacronic-hexecontahedron',
    name: 'Medial Icosacronic Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Dart',
    dual: dual('icosidodecadodecahedron', 'U44', '5/3 5 | 3'),
  },
  {
    id: 'medial-hexagonal-hexecontahedron',
    name: 'Medial Hexagonal Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Concave hexagon',
    dual: dual('snub icosidodecadodecahedron', 'U46', '| 5/3 3 5'),
  },
  {
    id: 'great-icosacronic-hexecontahedron',
    name: 'Great Icosacronic Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Dart',
    dual: dual('great icosicosidodecahedron', 'U48', '3/2 5 | 3'),
  },
  {
    id: 'small-dodecicosacron',
    name: 'Small Dodecicosacron',
    family: 'star-dual',
    faceShape: 'Antiparallelogram',
    dual: dual('small dodecicosahedron', 'U50', '3/2 3 5 |'),
  },
  {
    id: 'great-stellapentakis-dodecahedron',
    name: 'Great Stellapentakis Dodecahedron',
    family: 'star-dual',
    faceShape: 'Isosceles triangle',
    dual: dual('truncated great icosahedron', 'U55', '2 5/2 | 3'),
  },
  {
    id: 'rhombicosacron',
    name: 'Rhombicosacron',
    family: 'star-dual',
    faceShape: 'Antiparallelogram',
    dual: dual('rhombicosahedron', 'U56', '2 3 5/2 |'),
  },
  {
    id: 'great-pentagonal-hexecontahedron',
    name: 'Great Pentagonal Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Pentagon',
    dual: dual('great snub icosidodecahedron', 'U57', '| 2 5/2 3'),
  },
  {
    id: 'great-pentakis-dodecahedron',
    name: 'Great Pentakis Dodecahedron',
    family: 'star-dual',
    faceShape: 'Isosceles triangle',
    dual: dual('small stellated truncated dodecahedron', 'U58', '2 5 | 5/3'),
  },
  {
    id: 'medial-inverted-pentagonal-hexecontahedron',
    name: 'Medial Inverted Pentagonal Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Concave pentagon',
    dual: dual('inverted snub dodecadodecahedron', 'U60', '| 5/3 2 5'),
  },
  {
    id: 'great-dodecacronic-hexecontahedron',
    name: 'Great Dodecacronic Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Kite',
    dual: dual('great dodecicosidodecahedron', 'U61', '5/2 3 | 5/3'),
  },
  {
    id: 'great-dodecicosacron',
    name: 'Great Dodecicosacron',
    family: 'star-dual',
    faceShape: 'Antiparallelogram',
    dual: dual('great dodecicosahedron', 'U63', '5/3 5/2 3 |'),
  },
  {
    id: 'great-hexagonal-hexecontahedron',
    name: 'Great Hexagonal Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Concave hexagon',
    dual: dual('great snub dodecicosidodecahedron', 'U64', '| 5/3 5/2 3'),
    note: 'Partially degenerate: some vertices coincide in pairs, because the uniform polyhedron has pairs of coplanar pentagrams.',
  },
  {
    id: 'great-triakis-icosahedron',
    name: 'Great Triakis Icosahedron',
    family: 'star-dual',
    faceShape: 'Isosceles triangle',
    dual: dual('great stellated truncated dodecahedron', 'U66', '2 3 | 5/3'),
  },
  {
    id: 'great-deltoidal-hexecontahedron',
    name: 'Great Deltoidal Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Dart',
    dual: dual('nonconvex great rhombicosidodecahedron', 'U67', '5/3 3 | 2'),
  },
  {
    id: 'great-inverted-pentagonal-hexecontahedron',
    name: 'Great Inverted Pentagonal Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Concave pentagon',
    dual: dual('great inverted snub icosidodecahedron', 'U69', '| 5/3 2 3'),
  },
  {
    id: 'small-hexagrammic-hexecontahedron',
    name: 'Small Hexagrammic Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Hexagram',
    dual: dual('small retrosnub icosicosidodecahedron', 'U72', '| 3/2 3/2 5/2'),
    note: 'Partially degenerate: some vertices coincide in pairs, because the uniform polyhedron has pairs of coplanar triangles.',
  },
  {
    id: 'great-rhombidodecacron',
    name: 'Great Rhombidodecacron',
    family: 'star-dual',
    faceShape: 'Antiparallelogram',
    dual: dual('great rhombidodecahedron', 'U73', '2 5/3 3/2 |'),
  },
  {
    id: 'great-pentagrammic-hexecontahedron',
    name: 'Great Pentagrammic Hexecontahedron',
    family: 'star-dual',
    faceShape: 'Pentagram',
    dual: dual('great retrosnub icosidodecahedron', 'U74', '| 2 3/2 5/3'),
  },
];

export default catalog;
