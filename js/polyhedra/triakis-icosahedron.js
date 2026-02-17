// Triakis Icosahedron
// A Catalan solid - dual of the truncated dodecahedron
// 60 isosceles triangle faces, 32 vertices, 90 edges
// Created by raising a pyramid on each face of an icosahedron

const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio

function generateVertices() {
  const vertices = [];

  // The triakis icosahedron has 32 vertices:
  // - 12 vertices from the underlying icosahedron (the "base" vertices)
  // - 20 vertices at the tips of pyramids (raised face centers)

  // === 12 Icosahedron vertices ===
  // Standard icosahedron: (0, ±1, ±φ) and cyclic permutations
  const icoScale = 1.0;

  for (const i of [-1, 1]) {
    for (const j of [-1, 1]) {
      vertices.push([0, i * icoScale, j * phi * icoScale]);
      vertices.push([i * icoScale, j * phi * icoScale, 0]);
      vertices.push([j * phi * icoScale, 0, i * icoScale]);
    }
  }

  // === 20 Pyramid tip vertices ===
  // These are at the face centers of the icosahedron, raised outward
  // For triakis icosahedron, the apex height creates congruent isosceles triangles
  // Face centers are in dodecahedron vertex directions

  const apexScale = 0.72; // Tuned for correct triakis proportions (shorter than ico vertices)

  // Dodecahedron vertex directions: (±1, ±1, ±1) and (0, ±1/φ, ±φ) permutations
  // Group 1: 8 vertices at (±1, ±1, ±1) normalized
  const cubeLen = Math.sqrt(3);
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        vertices.push([x * apexScale * 1.73 / cubeLen, y * apexScale * 1.73 / cubeLen, z * apexScale * 1.73 / cubeLen]);
      }
    }
  }

  // Group 2: 12 more vertices at (0, ±1/φ, ±φ) type positions, normalized
  const invPhi = 1 / phi;
  const rectLen = Math.sqrt(invPhi * invPhi + phi * phi);

  for (const i of [-1, 1]) {
    for (const j of [-1, 1]) {
      vertices.push([0, i * invPhi * apexScale * 2 / rectLen, j * phi * apexScale * 2 / rectLen]);
      vertices.push([i * invPhi * apexScale * 2 / rectLen, j * phi * apexScale * 2 / rectLen, 0]);
      vertices.push([j * phi * apexScale * 2 / rectLen, 0, i * invPhi * apexScale * 2 / rectLen]);
    }
  }

  return vertices;
}

const vertices = generateVertices();

export default {
  id: "triakis-icosahedron",
  name: "Triakis Icosahedron",
  description: "A Catalan solid with 60 isosceles triangle faces, dual of the truncated dodecahedron",
  vertices,
  faceIndices: [], // Empty = use ConvexGeometry
  isConvex: true
};
