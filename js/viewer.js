// Interactive viewer for one hexecontahedron (viewer.html?shape=<id>).

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FAMILIES, describe, getPolyhedron, polyhedra } from './registry.js';
import { addLights, createPolyhedronObject, createRenderer, prefersReducedMotion } from './render.js';

const $ = (id) => document.getElementById(id);
const shapeId = new URLSearchParams(window.location.search).get('shape');
const index = polyhedra.findIndex((p) => p.id === shapeId);

if (index < 0) {
  $('shape-name').textContent = shapeId ? 'Shape not found' : 'No shape specified';
  $('shape-description').textContent = shapeId
    ? `There is no polyhedron with the id "${shapeId}".`
    : 'Open a polyhedron from the gallery.';
  $('viewer-panel').hidden = true;
} else {
  try {
    const polyhedron = getPolyhedron(shapeId);
    showInfo(polyhedron);
    setUpNavigation();
    initViewer(polyhedron);
  } catch (error) {
    console.error(error);
    $('shape-name').textContent = 'Could not build this polyhedron';
    $('shape-description').textContent = error instanceof Error ? error.message : String(error);
    $('viewer-panel').hidden = true;
  }
}

function showInfo(p) {
  document.title = `${p.name} · Hexecontahedra`;
  $('shape-family').textContent = FAMILIES[p.family].short;
  $('shape-name').textContent = p.name;
  $('shape-description').textContent = describe(p);

  const facts = [
    ['Faces', `${p.counts.faces} (${p.faceShape.toLowerCase()})`],
    ['Edges', String(p.counts.edges)],
    ['Vertices', String(p.counts.vertices)],
  ];
  if (p.dual) {
    facts.push(['Dual of', `${p.dual.name} (${p.dual.index})`]);
    facts.push(['Wythoff symbol', p.dual.wythoff]);
  }
  const list = $('shape-facts');
  for (const [term, value] of facts) {
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = value;
    list.append(dt, dd);
  }
  if (p.note) $('shape-note').textContent = p.note;
  else $('shape-note').remove();
  // On phones the details start folded so the model stays visible.
  if (window.matchMedia('(max-width: 600px)').matches) $('shape-details').open = false;
}

function setUpNavigation() {
  const neighbour = (step) => polyhedra[(index + step + polyhedra.length) % polyhedra.length];
  const link = (element, entry, label) => {
    element.href = `viewer.html?shape=${encodeURIComponent(entry.id)}`;
    element.title = `${label}: ${entry.name}`;
    element.setAttribute('aria-label', `${label}: ${entry.name}`);
  };
  link($('prev-link'), neighbour(-1), 'Previous');
  link($('next-link'), neighbour(1), 'Next');
  $('position').textContent = `${index + 1} / ${polyhedra.length}`;
}

function initViewer(polyhedron) {
  const container = $('canvas-container');
  const renderer = createRenderer();
  if (!renderer) {
    container.textContent = 'This viewer needs WebGL, which is not available in this browser.';
    container.classList.add('webgl-error');
    return;
  }
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', `3D model of the ${polyhedron.name}`);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  addLights(scene);
  const object = createPolyhedronObject(polyhedron, { radius: 1.5, edgeOpacity: 0.35 });
  object.rotation.set(0.35, 0.6, 0);
  scene.add(object);

  // Camera distance that keeps the bounding sphere (radius 1.5) in view with
  // some margin, using the narrower of the two fields of view (portrait
  // phones are limited by the horizontal one).
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  const fitDistance = () => {
    const vertical = THREE.MathUtils.degToRad(camera.fov / 2);
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
    return (1.41 * 1.5) / Math.sin(Math.min(vertical, horizontal));
  };
  camera.position.set(0, 0, fitDistance());

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 2;
  controls.maxDistance = 25;
  controls.autoRotate = !prefersReducedMotion();
  controls.autoRotateSpeed = 1.2;

  const rotateButton = $('toggle-rotate');
  const edgesButton = $('toggle-edges');
  const setPressed = (button, on) => button.setAttribute('aria-pressed', String(on));
  setPressed(rotateButton, controls.autoRotate);
  setPressed(edgesButton, true);
  const toggleRotate = () => {
    controls.autoRotate = !controls.autoRotate;
    setPressed(rotateButton, controls.autoRotate);
  };
  const toggleEdges = () => {
    object.userData.edges.visible = !object.userData.edges.visible;
    setPressed(edgesButton, object.userData.edges.visible);
  };
  rotateButton.addEventListener('click', toggleRotate);
  edgesButton.addEventListener('click', toggleEdges);

  // Arrow keys browse. No single-letter shortcuts (WCAG 2.1.4); the toggles
  // are ordinary buttons.
  window.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft') $('prev-link').click();
    else if (event.key === 'ArrowRight') $('next-link').click();
  });

  window.addEventListener('resize', () => {
    const before = fitDistance();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    // Keep the user's zoom relative to the fitted distance.
    camera.position.multiplyScalar(fitDistance() / before);
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });
}
