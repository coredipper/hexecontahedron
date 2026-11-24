// Shared three.js setup for the gallery and the viewer.

import * as THREE from 'three';
import { meshData } from './geometry/mesh.js';

const FACE_COLOR = 0x7aa2f7;

export function addLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(5, 10, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(FACE_COLOR, 0.8);
  rim.position.set(-5, -5, -5);
  scene.add(rim);
}

export function createFaceMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: FACE_COLOR,
    metalness: 0.3,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    // Star-dual faces self-intersect and are visible from both sides.
    side: THREE.DoubleSide,
    // Push faces back slightly so the edge lines do not z-fight with them.
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
}

export function createEdgeMaterial(opacity = 0.3) {
  return new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity });
}

/**
 * Mesh plus edge lines for a polyhedron ({ vertices, faces }), scaled so the
 * farthest vertex is at `radius`. Pass shared `faceMaterial` / `edgeMaterial`
 * to avoid creating per-object materials in the gallery.
 */
export function createPolyhedronObject(
  polyhedron,
  { radius = 1, edgeOpacity = 0.3, faceMaterial, edgeMaterial } = {},
) {
  const data = meshData(polyhedron, radius);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));

  const ownsFaceMaterial = !faceMaterial;
  const ownsEdgeMaterial = !edgeMaterial;
  const mesh = new THREE.Mesh(geometry, faceMaterial ?? createFaceMaterial());

  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute('position', new THREE.BufferAttribute(data.edges, 3));
  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial ?? createEdgeMaterial(edgeOpacity));

  const dispose = () => {
    geometry.dispose();
    edgeGeometry.dispose();
    if (ownsFaceMaterial) mesh.material.dispose();
    if (ownsEdgeMaterial) edges.material.dispose();
  };

  const group = new THREE.Group();
  group.add(mesh, edges);
  group.userData = { mesh, edges, dispose };
  return group;
}

/** WebGL renderer, or null when WebGL is not available. */
export function createRenderer(options) {
  try {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, ...options });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    return renderer;
  } catch (error) {
    console.error('WebGL is not available:', error);
    return null;
  }
}

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
export const prefersReducedMotion = () => reducedMotionQuery.matches;
export const onReducedMotionChange = (listener) => {
  reducedMotionQuery.addEventListener('change', () => listener(reducedMotionQuery.matches));
};
