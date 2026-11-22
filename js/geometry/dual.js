// Polar dual of a uniform polyhedron.
//
// Reciprocation about the midsphere (radius rho) maps each face plane at
// distance d along unit normal n to the dual vertex (rho^2 / d) n, and each
// vertex to a dual face. The dual face of vertex v joins the dual vertices of
// the faces around v, in the order they meet at v.

import { add, centroid, dot, scale } from './vec.js';

export function polarDual({ vertices, faces }) {
  const [a, b] = faces[0];
  const midpoint = scale(add(vertices[a], vertices[b]), 0.5);
  const rho2 = dot(midpoint, midpoint);

  const dualVertices = faces.map((face) => {
    // Faces of a uniform polyhedron are regular polygons, so the vertex
    // centroid is the foot of the perpendicular from the origin: its
    // direction is the face normal and its length the face distance.
    const center = centroid(face.map((i) => vertices[i]));
    const d2 = dot(center, center);
    if (d2 < 1e-12) throw new Error('A face passes through the centre, so its dual vertex is at infinity');
    return scale(center, rho2 / d2);
  });

  // For each vertex: the faces around it, with the two neighbours of the
  // vertex in each face (the edges the face contributes at that vertex).
  const corners = vertices.map(() => []);
  faces.forEach((face, f) => {
    face.forEach((v, k) => {
      corners[v].push({
        face: f,
        prev: face[(k + face.length - 1) % face.length],
        next: face[(k + 1) % face.length],
      });
    });
  });

  const dualFaces = corners.map((list, v) => {
    const first = list[0];
    const order = [first.face];
    let current = first;
    let edgeTo = first.next;
    for (let guard = 0; guard < list.length; guard++) {
      const following = list.find((c) => c !== current && (c.prev === edgeTo || c.next === edgeTo));
      if (!following) throw new Error(`Edge ${v}-${edgeTo} is not shared by two faces`);
      if (following === first) break;
      order.push(following.face);
      edgeTo = following.prev === edgeTo ? following.next : following.prev;
      current = following;
    }
    if (order.length !== list.length) throw new Error(`Faces around vertex ${v} do not form one cycle`);
    return order;
  });

  return { vertices: dualVertices, faces: dualFaces };
}
