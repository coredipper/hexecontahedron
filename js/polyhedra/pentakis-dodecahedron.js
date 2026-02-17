// Pentakis Dodecahedron
// A Catalan solid - dual of the truncated icosahedron
// 60 isosceles triangle faces, 32 vertices, 90 edges
// Created by raising a pyramid on each face of a dodecahedron

const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio ≈ 1.618

function generateVertices() {
  const vertices = [];

  // The pentakis dodecahedron has 32 vertices:
  // - 20 vertices from the underlying dodecahedron
  // - 12 vertices at the tips of pyramids (raised face centers)

  // === 20 Dodecahedron vertices ===
  // These come in 3 groups based on coordinate structure

  // Group 1: 8 vertices at (±1, ±1, ±1)
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        vertices.push([x, y, z]);
      }
    }
  }

  // Group 2: 4 vertices at (0, ±1/φ, ±φ)
  const invPhi = 1 / phi;
  for (const y of [-invPhi, invPhi]) {
    for (const z of [-phi, phi]) {
      vertices.push([0, y, z]);
    }
  }

  // Group 3: 4 vertices at (±1/φ, ±φ, 0)
  for (const x of [-invPhi, invPhi]) {
    for (const y of [-phi, phi]) {
      vertices.push([x, y, 0]);
    }
  }

  // Group 4: 4 vertices at (±φ, 0, ±1/φ)
  for (const x of [-phi, phi]) {
    for (const z of [-invPhi, invPhi]) {
      vertices.push([x, 0, z]);
    }
  }

  // === 12 Pyramid tip vertices ===
  // These point in icosahedron vertex directions (face normals of dodecahedron)
  // The height is calculated to make all triangular faces congruent
  // For pentakis dodecahedron, apex distance ≈ 1.127 × dodecahedron circumradius

  const apexScale = 2.12; // Tuned for correct pentakis proportions

  // Icosahedron vertex directions: (0, ±1, ±φ) and cyclic permutations
  for (const i of [-1, 1]) {
    for (const j of [-1, 1]) {
      // Normalize (0, 1, φ) direction
      const len = Math.sqrt(1 + phi * phi);
      vertices.push([0, i * apexScale / len, j * phi * apexScale / len]);
      vertices.push([i * apexScale / len, j * phi * apexScale / len, 0]);
      vertices.push([j * phi * apexScale / len, 0, i * apexScale / len]);
    }
  }

  return vertices;
}

const vertices = generateVertices();

export default {
  id: "pentakis-dodecahedron",
  name: "Pentakis Dodecahedron",
  description: "A Catalan solid with 60 isosceles triangle faces, dual of the truncated icosahedron",
  vertices,
  faceIndices: [], // Empty = use ConvexGeometry
  isConvex: true
};
