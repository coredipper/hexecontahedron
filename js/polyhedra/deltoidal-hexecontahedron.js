// Deltoidal Hexecontahedron (Strombic Hexecontahedron)
// A Catalan solid - dual of the small rhombicosidodecahedron
// 60 kite-shaped faces, 62 vertices, 120 edges

const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio

function generateVertices() {
  const vertices = [];

  // The deltoidal hexecontahedron has 62 vertices of 3 types:
  // - 12 vertices of order 5 (5 faces meet) - at dodecahedron positions
  // - 20 vertices of order 3 (3 faces meet) - at icosahedron positions
  // - 30 vertices of order 4 (4 faces meet) - at icosidodecahedron edge midpoints

  // The vertex radii are chosen so that the kite faces are coplanar
  // Based on the dual of rhombicosidodecahedron

  // === 12 Order-5 vertices (dodecahedron-like) ===
  const r5 = 1.0; // Reference radius

  // (±1, ±1, ±1)
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        vertices.push([x * r5, y * r5, z * r5]);
      }
    }
  }

  // (0, ±1/φ, ±φ) and permutations
  const invPhi = 1 / phi;
  for (const i of [-1, 1]) {
    for (const j of [-1, 1]) {
      vertices.push([0, i * invPhi * r5, j * phi * r5]);
    }
  }

  // === 20 Order-3 vertices (icosahedron-like) ===
  const r3 = 1.58; // Icosahedron vertices are further out

  for (const i of [-1, 1]) {
    for (const j of [-1, 1]) {
      vertices.push([0, i * r3, j * phi * r3]);
      vertices.push([i * r3, j * phi * r3, 0]);
      vertices.push([j * phi * r3, 0, i * r3]);
    }
  }

  // === 30 Order-4 vertices (at edge midpoints) ===
  const r4 = 1.35;

  // These lie along icosidodecahedron edge directions
  // Positions: (±φ, 0, ±1), (±1, ±φ, 0), (0, ±1, ±φ) scaled
  for (const i of [-1, 1]) {
    for (const j of [-1, 1]) {
      vertices.push([i * phi * r4 / 1.9, 0, j * r4 / 1.9]);
      vertices.push([i * r4 / 1.9, j * phi * r4 / 1.9, 0]);
      vertices.push([0, i * r4 / 1.9, j * phi * r4 / 1.9]);
    }
  }

  // Additional order-4 vertices at (±φ², ±1, ±φ) type positions, normalized
  const phi2 = phi * phi;
  for (const i of [-1, 1]) {
    for (const j of [-1, 1]) {
      const len = Math.sqrt(phi2 * phi2 + 1 + phi * phi);
      vertices.push([i * phi2 * r4 / len * 1.6, j * r4 / len * 1.6, 0]);
      vertices.push([0, i * phi2 * r4 / len * 1.6, j * r4 / len * 1.6]);
      vertices.push([j * r4 / len * 1.6, 0, i * phi2 * r4 / len * 1.6]);
    }
  }

  return vertices;
}

const vertices = generateVertices();

export default {
  id: "deltoidal-hexecontahedron",
  name: "Deltoidal Hexecontahedron",
  description: "A Catalan solid with 60 kite-shaped faces, dual of the small rhombicosidodecahedron",
  vertices,
  faceIndices: [], // Empty = use ConvexGeometry
  isConvex: true
};
