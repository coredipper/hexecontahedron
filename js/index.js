// Index page - gallery of all hexecontahedra with 3D previews
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import polyhedra from './registry.js';

const grid = document.getElementById('grid');

// Create a single renderer for the entire page
const canvas = document.createElement('canvas');
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100vw';
canvas.style.height = '100vh';
canvas.style.pointerEvents = 'none'; // Let clicks pass through to the grid
canvas.style.zIndex = '10'; // Over the cards, but we'll make text higher z-index
document.body.appendChild(canvas);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // Transparent
renderer.setScissorTest(true);

const scenes = [];

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

  // Initialize scene for this card
  const sceneData = initScene(polyhedron, preview);
  scenes.push(sceneData);

  return card;
}

function initScene(polyhedron, element) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 4);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);

  const backLight = new THREE.DirectionalLight(0x7aa2f7, 0.8);
  backLight.position.set(-5, -5, -5);
  scene.add(backLight);

  // Build geometry
  const geometry = buildGeometry(polyhedron);

  const material = new THREE.MeshPhysicalMaterial({
    color: 0x7aa2f7,
    metalness: 0.3,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    flatShading: true,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Edges
  const edges = new THREE.EdgesGeometry(geometry, 15);
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.25 
  });
  const lineSegments = new THREE.LineSegments(edges, lineMaterial);
  scene.add(lineSegments);

  return {
    scene,
    camera,
    mesh,
    lineSegments,
    element,
    isVisible: false
  };
}

// Optimization: only render when visible
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    // Find matching scene
    const sceneData = scenes.find(s => s.element === entry.target);
    if (sceneData) {
      sceneData.isVisible = entry.isIntersecting;
    }
  }
}, { threshold: 0.05 }); // Lower threshold to ensure it renders even if partially visible

for (const sceneData of scenes) {
  observer.observe(sceneData.element);
}

// Main animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update canvas size if window resized
  if (renderer.domElement.width !== window.innerWidth || renderer.domElement.height !== window.innerHeight) {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Clear canvas once per frame
  renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.clear();

  for (const sceneData of scenes) {
    if (!sceneData.isVisible) continue;

    const { scene, camera, mesh, lineSegments, element } = sceneData;

    // Get element's bounding rectangle
    const rect = element.getBoundingClientRect();
    
    // Check if it's strictly inside the window
    if (rect.bottom < 0 || rect.top > window.innerHeight ||
        rect.right < 0 || rect.left > window.innerWidth) {
      continue; // Offscreen
    }

    // Set viewport and scissor for this element
    const width = rect.width;
    const height = rect.height;
    
    // Convert to canvas coordinates (y is inverted)
    const left = rect.left;
    const bottom = window.innerHeight - rect.bottom;

    renderer.setViewport(left, bottom, width, height);
    renderer.setScissor(left, bottom, width, height);
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Rotate
    mesh.rotation.y += 0.005;
    mesh.rotation.x += 0.002;
    lineSegments.rotation.y = mesh.rotation.y;
    lineSegments.rotation.x = mesh.rotation.x;

    renderer.render(scene, camera);
  }
}
animate();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function buildGeometry(polyhedron) {
  let geometry;

  if (polyhedron.isConvex !== false && (!polyhedron.faceIndices || polyhedron.faceIndices.length === 0)) {
    const points = polyhedron.vertices.map(v => new THREE.Vector3(v[0], v[1], v[2]));
    geometry = new ConvexGeometry(points);
  } else {
    geometry = buildExplicitGeometry(polyhedron);
  }

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
