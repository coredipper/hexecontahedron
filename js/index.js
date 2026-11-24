// Gallery page: one card per hexecontahedron, each with a rotating preview.
// All previews share one WebGL renderer, scene, lights and materials: a fixed,
// full-window canvas is drawn into each visible card's rectangle with scissor tests.

import * as THREE from 'three';
import { FAMILIES, describe, getPolyhedron, matchesFilter, polyhedra } from './registry.js';
import {
  addLights, createEdgeMaterial, createFaceMaterial, createPolyhedronObject,
  createRenderer, onReducedMotionChange, prefersReducedMotion,
} from './render.js';

const grid = document.getElementById('grid');
const filterGroups = document.getElementById('filter-groups');
const searchInput = document.getElementById('gallery-search');
const statusEl = document.getElementById('gallery-status');
const emptyEl = document.getElementById('gallery-empty');
const emptyMessage = document.getElementById('gallery-empty-message');
const resetButton = document.getElementById('gallery-reset');

const previews = [];
const previewByElement = new Map();
const sections = [];

for (const [family, { label }] of Object.entries(FAMILIES)) {
  const members = polyhedra.filter((p) => p.family === family);
  const heading = document.createElement('h2');
  heading.className = 'family-heading';
  heading.textContent = `${label} (${members.length})`;
  grid.appendChild(heading);

  const items = [];
  for (const entry of members) {
    const { card, item } = createCard(entry);
    grid.appendChild(card);
    items.push(item);
  }
  sections.push({ family, label, heading, items });
}

function createCard(entry) {
  const card = document.createElement('a');
  card.id = entry.id;
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

  const item = { entry, card, element: preview, object: null, phase: previews.length * 0.7, visible: false, failed: false };
  previews.push(item);
  previewByElement.set(preview, item);
  return { card, item };
}

// Family filter chips + search input.
const FILTER_LABELS = [
  ['all', `All (${polyhedra.length})`],
  ...sections.map(({ family, label, items }) => [family, `${label} (${items.length})`]),
];

let activeFamily = 'all';
let scheduleRender = () => {};
const familyButtons = new Map();

for (const [family, label] of FILTER_LABELS) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'control-button';
  button.textContent = label;
  button.setAttribute('aria-pressed', String(family === activeFamily));
  button.addEventListener('click', () => {
    if (activeFamily === family) return;
    activeFamily = family;
    for (const [key, btn] of familyButtons) btn.setAttribute('aria-pressed', String(key === activeFamily));
    applyFilter();
  });
  familyButtons.set(family, button);
  filterGroups.appendChild(button);
}

function applyFilter() {
  const query = searchInput.value;
  const filtered = activeFamily !== 'all' || query.trim() !== '';
  let shown = 0;

  for (const section of sections) {
    let sectionShown = 0;
    for (const item of section.items) {
      const match = matchesFilter(item.entry, { family: activeFamily, query });
      item.card.hidden = !match;
      if (match) sectionShown += 1;
    }
    section.heading.hidden = sectionShown === 0;
    section.heading.textContent =
      filtered && sectionShown !== section.items.length
        ? `${section.label} (${sectionShown} of ${section.items.length})`
        : `${section.label} (${section.items.length})`;
    shown += sectionShown;
  }

  emptyEl.hidden = shown > 0;
  if (shown === 0) {
    const trimmed = query.trim();
    emptyMessage.textContent = trimmed
      ? `No polyhedra match "${trimmed}".`
      : 'No polyhedra match the active filter.';
  }
  statusEl.textContent = filtered
    ? `Showing ${shown} of ${polyhedra.length} hexecontahedra.`
    : '';
  scheduleRender();
}

searchInput.addEventListener('input', applyFilter);
resetButton.addEventListener('click', () => {
  activeFamily = 'all';
  for (const [key, btn] of familyButtons) btn.setAttribute('aria-pressed', String(key === activeFamily));
  searchInput.value = '';
  applyFilter();
  searchInput.focus();
});
window.addEventListener('pageshow', applyFilter);
if (searchInput.value) applyFilter();

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

  const scene = new THREE.Scene();
  addLights(scene);
  const faceMaterial = createFaceMaterial();
  const edgeMaterial = createEdgeMaterial(0.25);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 3.2);

  let rafId = 0;
  let contextLost = false;
  let elapsed = 0;
  let lastTime = null;

  const requestRender = () => {
    if (!rafId && !contextLost && !document.hidden) {
      rafId = window.requestAnimationFrame(renderFrame);
    }
  };
  scheduleRender = requestRender;

  const renderFrame = (now) => {
    rafId = 0;
    if (contextLost || document.hidden) {
      lastTime = null;
      return;
    }

    const spin = !prefersReducedMotion();
    if (spin) {
      if (lastTime !== null) elapsed += Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
    } else {
      lastTime = null;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width === 0 || height === 0) return;

    renderer.setScissor(0, 0, width, height);
    renderer.clear();

    for (const preview of previews) {
      if (preview.card.hidden || !preview.visible || !preview.object) continue;
      const rect = preview.element.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > height || rect.width === 0 || rect.height === 0) continue;

      renderer.setViewport(rect.left, height - rect.bottom, rect.width, rect.height);
      renderer.setScissor(rect.left, height - rect.bottom, rect.width, rect.height);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();

      if (spin) {
        preview.object.rotation.set(0.12 * elapsed + preview.phase, 0.3 * elapsed + preview.phase, 0);
      }
      scene.add(preview.object);
      renderer.render(scene, camera);
      scene.remove(preview.object);
    }

    if (spin) requestRender();
  };

  const initPreview = (preview) => {
    const object = createPolyhedronObject(getPolyhedron(preview.entry.id), {
      radius: 1,
      faceMaterial,
      edgeMaterial,
    });
    object.rotation.set(preview.phase, preview.phase, 0);
    preview.object = object;
  };

  // Build each preview the first time its card scrolls into view.
  const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      const preview = previewByElement.get(target);
      if (!preview) continue;
      preview.visible = isIntersecting;
      if (isIntersecting && !preview.object && !preview.failed) {
        try {
          initPreview(preview);
        } catch (error) {
          preview.failed = true; // keep the card; skip only its preview
          console.error(`Could not build ${preview.entry.name}:`, error);
        }
      }
    }
    requestRender();
  }, { rootMargin: '100px' });
  for (const preview of previews) observer.observe(preview.element);

  window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width === 0 || height === 0) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    requestRender();
  });
  window.addEventListener('scroll', requestRender, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      lastTime = null;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    } else {
      requestRender();
    }
  });
  onReducedMotionChange(() => requestRender());

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    contextLost = true;
    lastTime = null;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    requestRender();
  });

  requestRender();
}
