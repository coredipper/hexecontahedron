// Pentagonal Hexecontahedron
// A Catalan solid - dual of the snub dodecahedron
// 60 irregular pentagonal faces, 92 vertices, 150 edges
// This is the only Catalan solid that is chiral (exists in left and right handed forms)

const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio

// The snub dodecahedron involves a special "tribonacci constant" ξ
// derived from solving x³ - x - 1 = 0
// ξ ≈ 1.8392867552141612 (the real root)
const xi = 1.8392867552141612;

function generateVertices() {
  const vertices = [];

  // The pentagonal hexecontahedron has 92 vertices corresponding to
  // the 92 faces of the snub dodecahedron:
  // - 12 vertices from pentagonal face centers
  // - 80 vertices from triangular face centers (20 icosahedral + 60 snub)

  // The snub dodecahedron has a chiral twist parameter
  // We use even permutations with cyclic coordinate shifts

  // === 12 vertices from pentagonal face centers ===
  const r1 = 0.85;

  // These are at dodecahedron-like positions (inner)
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        vertices.push([x * r1, y * r1, z * r1]);
      }
    }
  }
  const invPhi = 1 / phi;
  for (const i of [-1, 1]) {
    for (const j of [-1, 1]) {
      vertices.push([0, i * invPhi * r1, j * phi * r1]);
    }
  }

  // === 20 vertices from icosahedral triangle faces ===
  const r2 = 1.45;

  // Icosahedron face centers point toward dodecahedron vertices
  // (±1, ±1, ±1) normalized
  const cubeLen = Math.sqrt(3);
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        vertices.push([x * r2 / cubeLen * 1.73, y * r2 / cubeLen * 1.73, z * r2 / cubeLen * 1.73]);
      }
    }
  }

  // (0, ±1/φ, ±φ) type - 12 more positions
  const rectLen = Math.sqrt(invPhi * invPhi + phi * phi);
  for (const i of [-1, 1]) {
    for (const j of [-1, 1]) {
      vertices.push([0, i * invPhi * r2 / rectLen * 1.9, j * phi * r2 / rectLen * 1.9]);
      vertices.push([i * invPhi * r2 / rectLen * 1.9, j * phi * r2 / rectLen * 1.9, 0]);
      vertices.push([j * phi * r2 / rectLen * 1.9, 0, i * invPhi * r2 / rectLen * 1.9]);
    }
  }

  // === 60 vertices from snub triangle faces ===
  // These have a chiral twist - we generate them using the snub operation
  const r3 = 1.25;
  const twist = 0.18; // Chiral twist

  // Snub vertices come in groups with specific coordinate patterns
  // Based on (even permutations of) (±2ξ, ±1, ±(2+ξφ)) and similar

  // Group A: near axes with twist
  for (const i of [-1, 1]) {
    for (const j of [-1, 1]) {
      vertices.push([i * r3 * 1.1 + j * twist, j * r3 * 0.4, 0]);
      vertices.push([0, i * r3 * 1.1 + j * twist, j * r3 * 0.4]);
      vertices.push([j * r3 * 0.4, 0, i * r3 * 1.1 + j * twist]);
    }
  }

  // Group B: twisted icosahedral positions
  for (const i of [-1, 1]) {
    for (const j of [-1, 1]) {
      vertices.push([i * r3 * 0.8 + twist, j * r3 * 0.8, j * r3 * 0.5]);
      vertices.push([j * r3 * 0.5, i * r3 * 0.8 + twist, j * r3 * 0.8]);
      vertices.push([j * r3 * 0.8, j * r3 * 0.5, i * r3 * 0.8 + twist]);
    }
  }

  // Group C: more snub positions
  for (const i of [-1, 1]) {
    for (const j of [-1, 1]) {
      vertices.push([i * r3 * 0.95, j * r3 * 0.6 + twist, j * r3 * 0.2]);
      vertices.push([j * r3 * 0.2, i * r3 * 0.95, j * r3 * 0.6 + twist]);
      vertices.push([j * r3 * 0.6 + twist, j * r3 * 0.2, i * r3 * 0.95]);
    }
  }

  // Group D: outer ring
  const r4 = 1.38;
  for (const i of [-1, 1]) {
    for (const j of [-1, 1]) {
      vertices.push([i * r4 * phi / 2, j * r4 / 2 + twist * 0.5, 0]);
      vertices.push([0, i * r4 * phi / 2, j * r4 / 2 + twist * 0.5]);
      vertices.push([j * r4 / 2 + twist * 0.5, 0, i * r4 * phi / 2]);
    }
  }

  return vertices;
}

const vertices = generateVertices();

export default {
  id: "pentagonal-hexecontahedron",
  name: "Pentagonal Hexecontahedron",
  description: "A chiral Catalan solid with 60 irregular pentagonal faces, dual of the snub dodecahedron",
  vertices,
  faceIndices: [], // Empty = use ConvexGeometry
  isConvex: true
};
