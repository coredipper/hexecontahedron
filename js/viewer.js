// Interactive viewer for one hexecontahedron (viewer.html?shape=<id>).

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FAMILIES, describe, getPolyhedron, polyhedra } from './registry.js';
import {
  addLights, createEdgeMaterial, createFaceMaterial, createPolyhedronObject,
  createRenderer, onReducedMotionChange, prefersReducedMotion,
} from './render.js';

const $ = (id) => document.getElementById(id);
const shapeIdFromUrl = () => new URLSearchParams(window.location.search).get('shape');
const indexForId = (id) => polyhedra.findIndex((p) => p.id === id);

const mobileQuery = window.matchMedia('(max-width: 600px)');
const syncDetailsOpen = () => {
  $('shape-details').open = !mobileQuery.matches;
};
syncDetailsOpen();
mobileQuery.addEventListener('change', syncDetailsOpen);

const initialId = shapeIdFromUrl();
const initialIndex = indexForId(initialId);

if (initialIndex < 0) {
  document.title = `${initialId ? 'Shape not found' : 'No shape specified'} · Hexecontahedra`;
  $('shape-name').textContent = initialId ? 'Shape not found' : 'No shape specified';
  $('shape-description').textContent = initialId
    ? `There is no polyhedron with the id "${initialId}".`
    : 'Open a polyhedron from the gallery.';
  $('viewer-panel').hidden = true;
} else {
  try {
    initViewer(initialIndex);
  } catch (error) {
    console.error(error);
    $('shape-name').textContent = 'Could not build this polyhedron';
    $('shape-description').textContent = error instanceof Error ? error.message : String(error);
    $('viewer-panel').hidden = true;
  }
}

function showInfo(p, { mirror = false } = {}) {
  document.title = `${p.name} · Hexecontahedra`;
  $('back-link').href = `index.html#${encodeURIComponent(p.id)}`;
  $('shape-family').textContent = FAMILIES[p.family].short;
  $('shape-name').textContent = p.name;
  $('shape-description').textContent = describe(p);

  const facts = [
    ['Faces', `${p.counts.faces} (${p.faceShape.toLowerCase()})`],
    ['Edges', String(p.counts.edges)],
    ['Vertices', String(p.counts.vertices)],
    [
      'Symmetry',
      p.chiral
        ? (mirror ? 'Chiral (I), enantiomorphic (mirrored)' : 'Chiral (I), enantiomorphic')
        : 'Reflexible (Ih)',
    ],
  ];
  if (p.dual) {
    facts.push(['Dual of', `${p.dual.name} (${p.dual.index})`]);
    facts.push(['Wythoff symbol', p.dual.wythoff]);
  }
  const list = $('shape-facts');
  list.replaceChildren();
  for (const [term, value] of facts) {
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = value;
    list.append(dt, dd);
  }

  const note = $('shape-note');
  if (p.note) {
    note.textContent = p.note;
    note.hidden = false;
  } else {
    note.textContent = '';
    note.hidden = true;
  }
}

function updateNavigation(index) {
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

function initViewer(startIndex) {
  let currentIndex = startIndex;
  let edgesVisible = true;
  let mirror = false;

  const setPressed = (button, on) => button.setAttribute('aria-pressed', String(on));

  const container = $('canvas-container');
  const renderer = createRenderer();
  if (!renderer) {
    const initial = getPolyhedron(polyhedra[currentIndex].id);
    showInfo(initial);
    updateNavigation(currentIndex);
    container.textContent = 'This viewer needs WebGL, which is not available in this browser.';
    container.classList.add('webgl-error');
    return;
  }

  const width = Math.max(window.innerWidth, 1);
  const height = Math.max(window.innerHeight, 1);
  renderer.setSize(width, height);
  renderer.domElement.setAttribute('role', 'img');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  addLights(scene);
  const faceMaterial = createFaceMaterial();
  const edgeMaterial = createEdgeMaterial(0.35);

  // Camera distance that keeps the bounding sphere (radius 1.5) in view with
  // some margin, using the narrower of the two fields of view (portrait
  // phones are limited by the horizontal one).
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  const fitDistance = () => {
    const vertical = THREE.MathUtils.degToRad(camera.fov / 2);
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
    return (1.41 * 1.5) / Math.sin(Math.min(vertical, horizontal));
  };
  camera.position.set(0, 0, Math.min(25, Math.max(2, fitDistance())));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.minDistance = 2;
  controls.maxDistance = 25;
  controls.autoRotate = !prefersReducedMotion();
  controls.autoRotateSpeed = 1.2;

  let currentObject = null;
  const loadPolyhedron = (index, { push = false } = {}) => {
    currentIndex = (index + polyhedra.length) % polyhedra.length;
    const entry = polyhedra[currentIndex];
    const polyhedron = getPolyhedron(entry.id, { mirror });
    const nextObject = createPolyhedronObject(polyhedron, {
      radius: 1.5,
      faceMaterial,
      edgeMaterial,
    });
    if (currentObject) {
      nextObject.rotation.copy(currentObject.rotation);
      scene.remove(currentObject);
      currentObject.userData.dispose();
    } else {
      nextObject.rotation.set(0.35, 0.6, 0);
    }
    nextObject.userData.edges.visible = edgesVisible;
    scene.add(nextObject);
    currentObject = nextObject;

    showInfo(polyhedron, { mirror: polyhedron.chiral && mirror });
    updateNavigation(currentIndex);
    renderer.domElement.setAttribute('aria-label', `3D model of the ${polyhedron.name}`);

    const mirrorButton = $('toggle-mirror');
    mirrorButton.hidden = !polyhedron.chiral;
    setPressed(mirrorButton, mirror);

    if (push) {
      const url = `viewer.html?shape=${encodeURIComponent(entry.id)}`;
      window.history.pushState({ shape: entry.id }, '', url);
    }
    requestRender();
  };

  // On-demand render loop: runs continuously only while auto-rotating,
  // dragging, or settling OrbitControls damping, then goes idle.
  let rafId = 0;
  let interacting = false;
  let updating = false;
  let contextLost = false;
  const prevPosition = new THREE.Vector3();
  const prevTarget = new THREE.Vector3();

  const requestRender = () => {
    if (!rafId && !contextLost && !updating) {
      rafId = window.requestAnimationFrame(frame);
    }
  };

  const frame = () => {
    rafId = 0;
    if (contextLost) return;
    prevPosition.copy(camera.position);
    prevTarget.copy(controls.target);
    updating = true;
    controls.update();
    updating = false;
    renderer.render(scene, camera);

    const moved =
      prevPosition.distanceToSquared(camera.position) > 1e-10 ||
      prevTarget.distanceToSquared(controls.target) > 1e-10;
    if (controls.autoRotate || interacting || moved) {
      requestRender();
    }
  };

  controls.addEventListener('start', () => {
    interacting = true;
    requestRender();
  });
  controls.addEventListener('end', () => {
    interacting = false;
    requestRender();
  });
  controls.addEventListener('change', requestRender);

  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    contextLost = true;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    requestRender();
  });

  const rotateButton = $('toggle-rotate');
  setPressed(rotateButton, controls.autoRotate);
  rotateButton.addEventListener('click', () => {
    controls.autoRotate = !controls.autoRotate;
    setPressed(rotateButton, controls.autoRotate);
    requestRender();
  });
  onReducedMotionChange((reduced) => {
    if (reduced && controls.autoRotate) {
      controls.autoRotate = false;
      setPressed(rotateButton, false);
    }
  });

  const edgesButton = $('toggle-edges');
  setPressed(edgesButton, edgesVisible);
  edgesButton.addEventListener('click', () => {
    edgesVisible = !edgesVisible;
    currentObject.userData.edges.visible = edgesVisible;
    setPressed(edgesButton, edgesVisible);
    requestRender();
  });

  const mirrorButton = $('toggle-mirror');
  mirrorButton.addEventListener('click', () => {
    mirror = !mirror;
    setPressed(mirrorButton, mirror);
    loadPolyhedron(currentIndex);
  });

  const handleStepClick = (step) => (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    loadPolyhedron(currentIndex + step, { push: true });
  };
  $('prev-link').addEventListener('click', handleStepClick(-1));
  $('next-link').addEventListener('click', handleStepClick(1));

  // Arrow keys browse. No single-letter shortcuts (WCAG 2.1.4); the toggles
  // are ordinary buttons.
  window.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft') loadPolyhedron(currentIndex - 1, { push: true });
    else if (event.key === 'ArrowRight') loadPolyhedron(currentIndex + 1, { push: true });
  });

  window.addEventListener('popstate', () => {
    const nextIndex = indexForId(shapeIdFromUrl());
    if (nextIndex >= 0 && nextIndex !== currentIndex) loadPolyhedron(nextIndex);
  });

  const offset = new THREE.Vector3();
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w === 0 || h === 0) return;
    const before = fitDistance();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Keep the user's zoom relative to the fitted distance.
    const after = fitDistance();
    offset.copy(camera.position).sub(controls.target);
    const nextDist = THREE.MathUtils.clamp(offset.length() * (after / before), controls.minDistance, controls.maxDistance);
    offset.setLength(nextDist);
    camera.position.copy(controls.target).add(offset);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    requestRender();
  });

  loadPolyhedron(startIndex);
}
