// Index page - gallery of all hexecontahedra with 3D previews
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import polyhedra from './registry.js';

const grid = document.getElementById('grid');

// Create a card for each polyhedron
for (const polyhedron of polyhedra) {
  const card = createCard(polyhedron);
  grid.appendChild(card);
}

function createCard(polyhedron) {
  const card = document.createElement('a');
  card.className = 'polyhedron-card';
  card.href = `viewer.html?shape=${polyhedron.id}`;

  // Preview container
  const preview = document.createElement('div');
  preview.className = 'card-preview';
  card.appendChild(preview);

  // Info section
  const info = document.createElement('div');
  info.className = 'card-info';

  const title = document.createElement('h2');
  title.textContent = polyhedron.name;
  info.appendChild(title);

  const description = document.createElement('p');
  description.textContent = polyhedron.description;
  info.appendChild(description);

  card.appendChild(info);

  // Initialize 3D preview after card is in DOM
  requestAnimationFrame(() => {
    initPreview(preview, polyhedron);
  });

  return card;
}

function initPreview(container, polyhedron) {
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfafafa);

  // Camera
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  camera.position.set(0, 0, 4);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);

  // Build geometry
  const geometry = buildGeometry(polyhedron);

  const material = new THREE.MeshStandardMaterial({
    color: 0x4a90d9,
    flatShading: true,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Edges
  const edges = new THREE.EdgesGeometry(geometry, 15);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
  const lineSegments = new THREE.LineSegments(edges, lineMaterial);
  scene.add(lineSegments);

  // Auto-rotate animation
  function animate() {
    requestAnimationFrame(animate);
    mesh.rotation.y += 0.005;
    mesh.rotation.x += 0.002;
    lineSegments.rotation.y = mesh.rotation.y;
    lineSegments.rotation.x = mesh.rotation.x;
    renderer.render(scene, camera);
  }
  animate();

  // Handle resize
  const resizeObserver = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  resizeObserver.observe(container);
}

function buildGeometry(polyhedron) {
  let geometry;

  // Use ConvexGeometry for convex polyhedra
  // Use explicit faces for non-convex polyhedra
  if (polyhedron.isConvex !== false && (!polyhedron.faceIndices || polyhedron.faceIndices.length === 0)) {
    const points = polyhedron.vertices.map(v => new THREE.Vector3(v[0], v[1], v[2]));
    geometry = new ConvexGeometry(points);
  } else {
    geometry = buildExplicitGeometry(polyhedron);
  }

  // Center and scale
  geometry.computeBoundingBox();
  const center = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);

  geometry.computeBoundingSphere();
  const scale = 1.2 / geometry.boundingSphere.radius;
  geometry.scale(scale, scale, scale);

  return geometry;
}

function buildExplicitGeometry(polyhedron) {
  const geometry = new THREE.BufferGeometry();

  const { vertices, faceIndices } = polyhedron;

  const positions = [];
  const indices = [];

  for (const [x, y, z] of vertices) {
    positions.push(x, y, z);
  }

  for (const face of faceIndices) {
    if (face.length === 3) {
      indices.push(face[0], face[1], face[2]);
    } else if (face.length === 4) {
      indices.push(face[0], face[1], face[2]);
      indices.push(face[0], face[2], face[3]);
    } else if (face.length > 4) {
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
