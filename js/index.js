// Gallery page: one card per hexecontahedron, each with a rotating preview.
// All previews share one WebGL renderer: a fixed, full-window canvas is drawn
// into each visible card's rectangle with scissor tests.

import * as THREE from 'three';
import { FAMILIES, describe, getPolyhedron, polyhedra } from './registry.js';
import { addLights, createPolyhedronObject, createRenderer, prefersReducedMotion } from './render.js';

const grid = document.getElementById('grid');
const previews = [];

for (const [family, { label }] of Object.entries(FAMILIES)) {
  const members = polyhedra.filter((p) => p.family === family);
  const heading = document.createElement('h2');
  heading.className = 'family-heading';
  heading.textContent = `${label} (${members.length})`;
  grid.appendChild(heading);
  for (const entry of members) grid.appendChild(createCard(entry));
}

function createCard(entry) {
  const card = document.createElement('a');
  card.className = 'polyhedron-card';
  card.href = `viewer.html?shape=${encodeURIComponent(entry.id)}`;

  const preview = document.createElement('div');
  preview.className = 'card-preview';
  card.appendChild(preview);

  const info = document.createElement('div');
  info.className = 'card-info';
  const title = document.createElement('h3');
  title.textContent = entry.name;
  const description = document.createElement('p');
  description.textContent = describe(entry);
  info.append(title, description);
  if (entry.dual) {
    const tag = document.createElement('span');
    tag.className = 'card-tag';
    tag.textContent = `${entry.dual.index} · ${entry.dual.wythoff}`;
    info.appendChild(tag);
  }
  card.appendChild(info);

  previews.push({ entry, element: preview, scene: null, object: null, visible: false });
  return card;
}

const renderer = createRenderer();
if (!renderer) {
  document.body.classList.add('no-webgl');
} else {
  const canvas = renderer.domElement;
  canvas.className = 'gallery-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  renderer.setScissorTest(true);
  renderer.setSize(window.innerWidth, window.innerHeight);
  window.addEventListener('resize', () => renderer.setSize(window.innerWidth, window.innerHeight));

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 3.2);

  // Build each preview the first time its card scrolls into view.
  const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      const preview = previews.find((p) => p.element === target);
      preview.visible = isIntersecting;
      if (isIntersecting && !preview.scene && !preview.failed) {
        try {
          initPreview(preview);
        } catch (error) {
          preview.failed = true; // keep the card; skip only its preview
          console.error(`Could not build ${preview.entry.name}:`, error);
        }
      }
    }
  }, { rootMargin: '100px' });
  for (const preview of previews) observer.observe(preview.element);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const elapsed = clock.getElapsedTime();
    const spin = !prefersReducedMotion();
    const height = window.innerHeight;
    renderer.setScissor(0, 0, window.innerWidth, height);
    renderer.clear();

    for (const preview of previews) {
      if (!preview.visible || !preview.scene) continue;
      const rect = preview.element.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > height || rect.width === 0) continue;

      renderer.setViewport(rect.left, height - rect.bottom, rect.width, rect.height);
      renderer.setScissor(rect.left, height - rect.bottom, rect.width, rect.height);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();

      if (spin) {
        preview.object.rotation.set(0.12 * elapsed + preview.phase, 0.3 * elapsed + preview.phase, 0);
      }
      renderer.render(preview.scene, camera);
    }
  });
}

function initPreview(preview) {
  const scene = new THREE.Scene();
  addLights(scene);
  const object = createPolyhedronObject(getPolyhedron(preview.entry.id), { radius: 1, edgeOpacity: 0.25 });
  preview.phase = previews.indexOf(preview) * 0.7;
  object.rotation.set(preview.phase, preview.phase, 0);
  scene.add(object);
  preview.scene = scene;
  preview.object = object;
}
