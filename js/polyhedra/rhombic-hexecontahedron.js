// Rhombic Hexecontahedron
// A NON-CONVEX stellation of the rhombic triacontahedron
// 60 golden rhombic faces, 62 vertices, 120 edges
//
// Construction (from Wikipedia):
// Start with a dodecahedron, then:
// - Scale 20 dodecahedron vertices OUT by (φ+1)/2 ≈ 1.309
// - Scale 12 dodecahedron face centers IN by (3-φ)/2 ≈ 0.691
// - 30 dodecahedron edge midpoints stay unchanged

const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio ≈ 1.618

function generateGeometry() {
  const v = [];
  // 20 vertices of dodecahedron
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([x, y, z]);
  const invPhi = 1 / phi;
  const gRect = [
    [0, invPhi, phi], [0, invPhi, -phi], [0, -invPhi, phi], [0, -invPhi, -phi],
    [invPhi, phi, 0], [invPhi, -phi, 0], [-invPhi, phi, 0], [-invPhi, -phi, 0],
    [phi, 0, invPhi], [phi, 0, -invPhi], [-phi, 0, invPhi], [-phi, 0, -invPhi]
  ];
  v.push(...gRect);

  // 30 edges of dodecahedron
  const edgeLen = 2 / phi;
  const edges = [];
  const adj = Array.from({length: 20}, () => []);
  for (let i=0; i<20; i++) {
    for (let j=i+1; j<20; j++) {
      const d = Math.sqrt((v[i][0]-v[j][0])**2 + (v[i][1]-v[j][1])**2 + (v[i][2]-v[j][2])**2);
      if (Math.abs(d - edgeLen) < 0.1) {
        edges.push([i, j]);
        adj[i].push(j);
        adj[j].push(i);
      }
    }
  }

  // Find 12 faces of dodecahedron (cycles of 5)
  const dodecaFaces = [];
  const seenFaces = new Set();
  for (let i=0; i<20; i++) {
    for (const j of adj[i]) {
      for (const k of adj[j]) {
        if (k === i) continue;
        for (const l of adj[k]) {
          if (l === j || l === i) continue;
          for (const m of adj[l]) {
            if (m === k || m === j || m === i) continue;
            if (adj[m].includes(i)) {
              const face = [i, j, k, l, m];
              const key = face.slice().sort((a,b)=>a-b).join(',');
              if (!seenFaces.has(key)) {
                seenFaces.add(key);
                // order the vertices correctly around the face
                const orderedFace = [i, j, k, l, m];
                dodecaFaces.push(orderedFace);
              }
            }
          }
        }
      }
    }
  }

  const vertices = [];
  // face centers (inner)
  const faceCenters = dodecaFaces.map(f => {
    return [
      (v[f[0]][0]+v[f[1]][0]+v[f[2]][0]+v[f[3]][0]+v[f[4]][0])/5,
      (v[f[0]][1]+v[f[1]][1]+v[f[2]][1]+v[f[3]][1]+v[f[4]][1])/5,
      (v[f[0]][2]+v[f[1]][2]+v[f[2]][2]+v[f[3]][2]+v[f[4]][2])/5
    ];
  });

  // Scale inner
  const innerScale = (3 - phi) / 2;
  for (let i=0; i<12; i++) {
    vertices.push([faceCenters[i][0]*innerScale, faceCenters[i][1]*innerScale, faceCenters[i][2]*innerScale]);
  } // 0-11
  // Scale outer
  const outerScale = (phi + 1) / 2;
  for (let i=0; i<20; i++) {
    vertices.push([v[i][0]*outerScale, v[i][1]*outerScale, v[i][2]*outerScale]);
  } // 12-31
  // Middle
  for (let i=0; i<30; i++) {
    const e = edges[i];
    const mid = [(v[e[0]][0]+v[e[1]][0])/2, (v[e[0]][1]+v[e[1]][1])/2, (v[e[0]][2]+v[e[1]][2])/2];
    vertices.push(mid);
  } // 32-61

  function sub(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
  function cross(a, b) {
    return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  }
  function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }

  // Faces of RH:
  const rhFaces = [];
  for (let f=0; f<12; f++) {
    const fVerts = dodecaFaces[f];
    for (let vi of fVerts) {
      const incidentEdges = [];
      for (let e=0; e<30; e++) {
        const edge = edges[e];
        if ((edge[0] === vi && fVerts.includes(edge[1])) || 
            (edge[1] === vi && fVerts.includes(edge[0]))) {
          incidentEdges.push(e);
        }
      }
      if (incidentEdges.length === 2) {
        const fv = [f, 32 + incidentEdges[0], 12 + vi, 32 + incidentEdges[1]];
        // check normal
        const a = vertices[fv[0]];
        const b = vertices[fv[1]];
        const d_v = vertices[fv[3]];
        const e1 = sub(b, a);
        const e2 = sub(d_v, a);
        const n = cross(e1, e2);
        
        // The vertex a is an inner vertex (which is a scaled face center).
        // It points in the direction of the face center.
        // We want the normal to point outward, which means dot(n, a) > 0.
        if (dot(n, a) < 0) {
          rhFaces.push([fv[0], fv[3], fv[2], fv[1]]);
        } else {
          rhFaces.push(fv);
        }
      }
    }
  }

  return { vertices, faceIndices: rhFaces };
}

const geometry = generateGeometry();

export default {
  id: "rhombic-hexecontahedron",
  name: "Rhombic Hexecontahedron",
  description: "A non-convex stellation of the rhombic triacontahedron with 60 golden rhombus faces",
  vertices: geometry.vertices,
  faceIndices: geometry.faceIndices,
  isConvex: false
};
