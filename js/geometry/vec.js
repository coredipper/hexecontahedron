// Small 3D vector and 3x3 matrix helpers. Vectors are [x, y, z] arrays;
// matrices are flat row-major arrays of 9 numbers. No three.js dependency,
// so the geometry code also runs under Node for tests.

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const length = (a) => Math.hypot(a[0], a[1], a[2]);
export const normalize = (a) => scale(a, 1 / length(a));
export const distance = (a, b) => length(sub(a, b));

export function centroid(points) {
  let c = [0, 0, 0];
  for (const p of points) c = add(c, p);
  return scale(c, 1 / points.length);
}

export const IDENTITY = Object.freeze([1, 0, 0, 0, 1, 0, 0, 0, 1]);

export function matMul(a, b) {
  const m = new Array(9);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      m[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
    }
  }
  return m;
}

export const matVec = (m, v) => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];

export const transpose = (m) => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];

export const determinant = (m) =>
  m[0] * (m[4] * m[8] - m[5] * m[7]) -
  m[1] * (m[3] * m[8] - m[5] * m[6]) +
  m[2] * (m[3] * m[7] - m[4] * m[6]);

/** Reflection across the plane through the origin with unit normal n. */
export function reflection(n) {
  const [x, y, z] = n;
  return [
    1 - 2 * x * x, -2 * x * y, -2 * x * z,
    -2 * x * y, 1 - 2 * y * y, -2 * y * z,
    -2 * x * z, -2 * y * z, 1 - 2 * z * z,
  ];
}

/** Rotation matrix whose rows are the given orthonormal basis vectors. */
export const fromRows = (a, b, c) => [...a, ...b, ...c];
