# Hexecontahedra 3D Viewer Design

## Overview

Interactive 3D visualizations of 5 hexecontahedra (60-faced polyhedra) viewable in a web browser.

## Scope

Starting with the 5 "simple" hexecontahedra:

| Shape | Face Type | Notes |
|-------|-----------|-------|
| Pentakis Dodecahedron | Isosceles triangles | Catalan solid |
| Deltoidal Hexecontahedron | Kites | Catalan solid |
| Pentagonal Hexecontahedron | Irregular pentagons | Catalan solid |
| Triakis Icosahedron | Isosceles triangles | Catalan solid |
| Rhombic Hexecontahedron | Golden rhombi | Concave form |

Architecture supports adding the 27 star-polyhedral duals later.

## Technology

- **Three.js** for 3D rendering
- **Vanilla JS** with ES modules (no build step)
- **CSS Grid** for responsive layout

## Project Structure

```
hexecontahedron/
├── index.html              # Gallery page listing all 5 polyhedra
├── viewer.html             # Shared 3D viewer page
├── css/
│   └── styles.css          # Shared styles
├── js/
│   ├── polyhedra/          # One file per polyhedron
│   │   ├── pentakis-dodecahedron.js
│   │   ├── deltoidal-hexecontahedron.js
│   │   ├── pentagonal-hexecontahedron.js
│   │   ├── triakis-icosahedron.js
│   │   └── rhombic-hexecontahedron.js
│   ├── registry.js         # Imports all polyhedra, exports as collection
│   └── viewer.js           # Three.js setup, controls, rendering
```

## Polyhedra Data Format

```javascript
export default {
  name: "Pentakis Dodecahedron",
  description: "A Catalan solid with 60 isosceles triangle faces",
  vertices: [[x, y, z], ...],
  faceIndices: [[0, 1, 2], ...]  // indices into vertices array
}
```

## Viewer Features

- Mouse drag to rotate
- Scroll to zoom
- Smooth damping via OrbitControls
- Solid faces (soft blue #4a90d9) with MeshStandardMaterial
- Thin dark edge lines for definition
- Light gray background (#f5f5f5)
- Responsive canvas (fills viewport)

## Index Page

- Grid layout (3 → 2 → 1 columns responsive)
- Each card: small auto-rotating 3D preview + name
- Click navigates to `viewer.html?shape=<id>`
- White background, subtle card shadows

## Adding New Polyhedra

1. Create `js/polyhedra/<name>.js` with vertex/face data
2. Import and register in `js/registry.js`

No other changes needed.
