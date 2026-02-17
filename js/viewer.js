// Three.js viewer for hexecontahedra
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { getPolyhedron } from './registry.js';

// Get shape ID from URL parameter
const params = new URLSearchParams(window.location.search);
const shapeId = params.get('shape');

if (!shapeId) {
  document.getElementById('shape-name').textContent = 'No shape specified';
  document.getElementById('shape-description').textContent = 'Add ?shape=<id> to the URL';
} else {
  const polyhedron = getPolyhedron(shapeId);

  if (!polyhedron) {
    document.getElementById('shape-name').textContent = 'Shape not found';
    document.getElementById('shape-description').textContent = `Unknown shape: ${shapeId}`;
  } else {
    // Update header
    document.getElementById('shape-name').textContent = polyhedron.name;
    document.getElementById('shape-description').textContent = polyhedron.description;
    document.title = `${polyhedron.name} - Hexecontahedra`;

    // Initialize Three.js
    initViewer(polyhedron);
  }
}

function initViewer(polyhedron) {
  const container = document.getElementById('canvas-container');

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f5f5);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 5);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
  backLight.position.set(-5, -5, -5);
  scene.add(backLight);

  // Build geometry from polyhedron data
  const geometry = buildGeometry(polyhedron);

  // Material - soft blue with good lighting response
  const material = new THREE.MeshStandardMaterial({
    color: 0x4a90d9,
    flatShading: true,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Edge lines for definition
  const edges = new THREE.EdgesGeometry(geometry, 15);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 1 });
  const lineSegments = new THREE.LineSegments(edges, lineMaterial);
  scene.add(lineSegments);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 2;
  controls.maxDistance = 15;

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Handle resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function buildGeometry(polyhedron) {
  let geometry;

  // Use ConvexGeometry for convex polyhedra (more reliable)
  // Use explicit faces for non-convex polyhedra
  if (polyhedron.isConvex !== false && (!polyhedron.faceIndices || polyhedron.faceIndices.length === 0)) {
    // Convert vertices to THREE.Vector3 array for ConvexGeometry
    const points = polyhedron.vertices.map(v => new THREE.Vector3(v[0], v[1], v[2]));
    geometry = new ConvexGeometry(points);
  } else {
    // Use explicit face indices
    geometry = buildExplicitGeometry(polyhedron);
  }

  // Center the geometry
  geometry.computeBoundingBox();
  const center = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);

  // Scale to fit nicely in view
  geometry.computeBoundingSphere();
  const scale = 1.5 / geometry.boundingSphere.radius;
  geometry.scale(scale, scale, scale);

  return geometry;
}

function buildExplicitGeometry(polyhedron) {
  const geometry = new THREE.BufferGeometry();

  const { vertices, faceIndices } = polyhedron;

  // Convert to flat arrays for BufferGeometry
  const positions = [];
  const indices = [];

  // Add all vertices
  for (const [x, y, z] of vertices) {
    positions.push(x, y, z);
  }

  // Add face indices (triangles)
  for (const face of faceIndices) {
    if (face.length === 3) {
      // Triangle
      indices.push(face[0], face[1], face[2]);
    } else if (face.length === 4) {
      // Quad - split into two triangles
      indices.push(face[0], face[1], face[2]);
      indices.push(face[0], face[2], face[3]);
    } else if (face.length > 4) {
      // Polygon - fan triangulation from first vertex
      for (let i = 1; i < face.length - 1; i++) {
        indices.push(face[0], face[i], face[i + 1]);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
