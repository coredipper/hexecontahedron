// Rhombic Hexecontahedron
// A NON-CONVEX stellation of the rhombic triacontahedron
// 60 golden rhombic faces, 62 vertices, 120 edges
//
// Construction (from Wikipedia):
// Start with a rhombic triacontahedron (RT), then:
// - Scale 20 dodecahedron-type vertices OUT by (φ+1)/2 ≈ 1.309
// - Scale 12 icosahedron-type vertices IN by (3-φ)/2 ≈ 0.691
// - 30 edge midpoints stay unchanged

const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio ≈ 1.618

function generateVertices() {
  const vertices = [];

  // The rhombic triacontahedron (RT) is the dual of the icosidodecahedron.
  // It has 32 vertices: 20 at dodecahedron positions and 12 at icosahedron positions
  // All 60 edges of RT have EQUAL length and connect ico-type to dodeca-type vertices
  //
  // For RT with unit edge, the vertices are:
  // - 12 icosahedron-type at radius φ²/√5 ≈ 1.170
  // - 20 dodecahedron-type at radius φ/√(φ²+1) ≈ 0.851 for rect-type
  //                         and radius 1/√(3/φ²) for cube-type
  //
  // Actually, let's use the standard coordinates for RT where all edges = 1

  // For RT with edge length 1:
  // - Icosahedron-type vertices at (0, ±1, ±φ) scaled by 1/√5
  // - Dodecahedron cube-type vertices at (±1, ±1, ±1) scaled by φ/√(3φ²-1)
  // - Dodecahedron rect-type vertices at (0, ±φ, ±1/φ) scaled appropriately

  // These are complex. Let me use a simpler approach:
  // Build RT from its dual, the icosidodecahedron, by taking face centers

  // The icosidodecahedron has:
  // - 12 pentagonal faces (centers point toward icosahedron vertices)
  // - 20 triangular faces (centers point toward dodecahedron vertices)

  // Let's compute the face centers of a unit icosidodecahedron
  // and use those as RT vertices

  // Icosidodecahedron vertices (for computing face centers)
  const idVerts = [];
  const n = Math.sqrt(1 + phi * phi);

  // 30 vertices at all permutations of (0, ±1, ±φ) normalized
  const perms = [
    [0, 1, phi], [0, 1, -phi], [0, -1, phi], [0, -1, -phi],
    [1, phi, 0], [1, -phi, 0], [-1, phi, 0], [-1, -phi, 0],
    [phi, 0, 1], [phi, 0, -1], [-phi, 0, 1], [-phi, 0, -1],
    [1, 0, phi], [1, 0, -phi], [-1, 0, phi], [-1, 0, -phi],
    [phi, 1, 0], [phi, -1, 0], [-phi, 1, 0], [-phi, -1, 0],
    [0, phi, 1], [0, phi, -1], [0, -phi, 1], [0, -phi, -1]
  ];

  // Remove duplicates and normalize
  const seen = new Set();
  for (const v of perms) {
    const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    const nv = [v[0]/len, v[1]/len, v[2]/len];
    const key = nv.map(x => x.toFixed(6)).join(',');
    if (!seen.has(key)) {
      seen.add(key);
      idVerts.push(nv);
    }
  }

  // Actually, let me just use the Wikipedia construction directly:
  // "If the 20 vertices of a dodecahedron are pulled out to increase the circumradius
  //  by a factor of (φ+1)/2 ≈ 1.309, the 12 face centers are pushed in to decrease
  //  the inradius to (3-φ)/2 ≈ 0.691 of its original value, and the 30 edge centers
  //  are left unchanged"

  // This describes starting from a dodecahedron and its face/edge centers
  // NOT starting from ico+dodeca vertices

  // Dodecahedron has:
  // - 20 vertices
  // - 12 faces (pentagons) with face centers at icosahedron directions
  // - 30 edges with midpoints at icosidodecahedron directions

  // Let's build this:

  // === Dodecahedron vertices (become outer in RH) ===
  // Standard dodecahedron vertices: (±1, ±1, ±1) and (0, ±1/φ, ±φ) and permutations
  const dodecaVerts = [];
  const invPhi = 1 / phi;

  // 8 cube-type
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        dodecaVerts.push([x, y, z]);
      }
    }
  }

  // 12 golden-rectangle type
  const gRect = [
    [0, invPhi, phi], [0, invPhi, -phi], [0, -invPhi, phi], [0, -invPhi, -phi],
    [invPhi, phi, 0], [invPhi, -phi, 0], [-invPhi, phi, 0], [-invPhi, -phi, 0],
    [phi, 0, invPhi], [phi, 0, -invPhi], [-phi, 0, invPhi], [-phi, 0, -invPhi]
  ];
  dodecaVerts.push(...gRect);

  // === Dodecahedron face centers (become inner in RH) ===
  // The 12 face centers of dodecahedron point toward icosahedron directions
  const faceCenters = [
    [0, 1, phi], [0, 1, -phi], [0, -1, phi], [0, -1, -phi],
    [1, phi, 0], [1, -phi, 0], [-1, phi, 0], [-1, -phi, 0],
    [phi, 0, 1], [phi, 0, -1], [-phi, 0, 1], [-phi, 0, -1]
  ];

  // Normalize face centers to unit length (these are already direction vectors)
  const fcNorm = Math.sqrt(1 + phi * phi);
  const normFaceCenters = faceCenters.map(v => [v[0]/fcNorm, v[1]/fcNorm, v[2]/fcNorm]);

  // === Dodecahedron edge midpoints (become middle in RH) ===
  // Need to find the 30 edges of the dodecahedron and compute their midpoints

  // Dodecahedron edges connect vertices that are distance 2/φ apart
  // (for the coordinates above)
  const edgeLen = 2 / phi;  // ≈ 1.236 for standard dodecahedron
  const edgeTol = 0.01;

  const dodecaEdges = [];
  for (let i = 0; i < 20; i++) {
    for (let j = i + 1; j < 20; j++) {
      const dx = dodecaVerts[i][0] - dodecaVerts[j][0];
      const dy = dodecaVerts[i][1] - dodecaVerts[j][1];
      const dz = dodecaVerts[i][2] - dodecaVerts[j][2];
      const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (Math.abs(d - edgeLen) < edgeTol) {
        dodecaEdges.push([i, j]);
      }
    }
  }

  // Compute edge midpoints
  const edgeMidpoints = dodecaEdges.map(([i, j]) => [
    (dodecaVerts[i][0] + dodecaVerts[j][0]) / 2,
    (dodecaVerts[i][1] + dodecaVerts[j][1]) / 2,
    (dodecaVerts[i][2] + dodecaVerts[j][2]) / 2
  ]);

  // === Apply the Wikipedia scaling ===
  // Outer (dodeca vertices): scale by (φ+1)/2
  const outerScale = (phi + 1) / 2;  // ≈ 1.309

  // Inner (face centers): scale by (3-φ)/2 of original face center radius
  // The original face center is at distance inradius from dodeca center
  // For dodecahedron with our coords, inradius ≈ φ²/√3 ≈ 1.511
  // After scaling to (3-φ)/2, the new radius is ~ 1.044
  const innerScale = (3 - phi) / 2;  // ≈ 0.691

  // Middle (edge midpoints): stay at original position
  const middleScale = 1.0;

  // Build final vertices

  // 12 inner (from face centers, scaled in)
  // First normalize face centers to unit vectors, then scale to innerScale * original_inradius
  // Original inradius = phi² / sqrt(3) for our dodecahedron coords
  const inradius = phi * phi / Math.sqrt(3);
  for (const fc of normFaceCenters) {
    const r = inradius * innerScale;
    vertices.push([fc[0] * r, fc[1] * r, fc[2] * r]);
  }
  // Indices 0-11: inner

  // 20 outer (dodeca vertices scaled out)
  // Original circumradius for cube-type = sqrt(3), for rect-type = sqrt(phi² + 1/phi²) ≈ 1.902
  // After scaling by (φ+1)/2, multiply each vertex by outerScale
  for (const v of dodecaVerts) {
    vertices.push([v[0] * outerScale, v[1] * outerScale, v[2] * outerScale]);
  }
  // Indices 12-31: outer

  // 30 middle (edge midpoints, unchanged)
  for (const m of edgeMidpoints) {
    vertices.push([m[0] * middleScale, m[1] * middleScale, m[2] * middleScale]);
  }
  // Indices 32-61: middle

  return vertices;
}

function dist(v1, v2) {
  return Math.sqrt(
    (v1[0] - v2[0]) ** 2 + (v1[1] - v2[1]) ** 2 + (v1[2] - v2[2]) ** 2
  );
}

function generateFaces(vertices) {
  const faces = [];

  // Find the 120 shortest edges
  const allDists = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      allDists.push({ i, j, d: dist(vertices[i], vertices[j]) });
    }
  }
  allDists.sort((a, b) => a.d - b.d);

  const edges = allDists.slice(0, 120);

  const edgeSet = new Set();
  const adj = Array.from({ length: vertices.length }, () => []);
  for (const { i, j } of edges) {
    edgeSet.add(i < j ? `${i},${j}` : `${j},${i}`);
    adj[i].push(j);
    adj[j].push(i);
  }

  function hasEdge(i, j) {
    return edgeSet.has(i < j ? `${i},${j}` : `${j},${i}`);
  }

  function sub(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
  function cross(a, b) {
    return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  }
  function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }

  // Find rhombus faces
  const usedFaces = new Set();

  for (const { i: a, j: b } of edges) {
    for (const c of adj[b]) {
      if (c === a || hasEdge(a, c)) continue;

      for (const d of adj[a]) {
        if (d === b || d === c || hasEdge(b, d)) continue;
        if (!hasEdge(c, d)) continue;

        const key = [a, b, c, d].sort((x, y) => x - y).join(',');
        if (usedFaces.has(key)) continue;
        usedFaces.add(key);

        const center = [
          (vertices[a][0] + vertices[b][0] + vertices[c][0] + vertices[d][0]) / 4,
          (vertices[a][1] + vertices[b][1] + vertices[c][1] + vertices[d][1]) / 4,
          (vertices[a][2] + vertices[b][2] + vertices[c][2] + vertices[d][2]) / 4
        ];

        const e1 = sub(vertices[b], vertices[a]);
        const e2 = sub(vertices[d], vertices[a]);
        const normal = cross(e1, e2);

        if (dot(normal, center) > 0) {
          faces.push([a, b, c]);
          faces.push([a, c, d]);
        } else {
          faces.push([a, c, b]);
          faces.push([a, d, c]);
        }
      }
    }
  }

  return faces;
}

const vertices = generateVertices();
const faceIndices = generateFaces(vertices);

export default {
  id: "rhombic-hexecontahedron",
  name: "Rhombic Hexecontahedron",
  description: "A non-convex stellation of the rhombic triacontahedron with 60 golden rhombus faces",
  vertices,
  faceIndices,
  isConvex: false
};
