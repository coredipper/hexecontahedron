const fs = require('fs');
const path = require('path');

const phi = (1 + Math.sqrt(5)) / 2;
const icoVerts = [
  [-1,  phi,  0], [ 1,  phi,  0], [-1, -phi,  0], [ 1, -phi,  0],
  [ 0, -1,  phi], [ 0,  1,  phi], [ 0, -1, -phi], [ 0,  1, -phi],
  [ phi,  0, -1], [ phi,  0,  1], [-phi,  0, -1], [-phi,  0,  1]
];

const icoFaces = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
];

function normalize(v) {
  const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
  return [v[0]/len, v[1]/len, v[2]/len];
}

function rotateAroundAxis(point, axis, angle) {
  const [x, y, z] = point;
  const [u, v, w] = axis;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  
  return [
    u*(u*x + v*y + w*z)*(1 - cosA) + x*cosA + (-w*y + v*z)*sinA,
    v*(u*x + v*y + w*z)*(1 - cosA) + y*cosA + (w*x - u*z)*sinA,
    w*(u*x + v*y + w*z)*(1 - cosA) + z*cosA + (-v*x + u*y)*sinA
  ];
}

function generateStarHexecontahedron(id, height, twistAngle) {
  const vertices = [...icoVerts];
  const faceIndices = [];

  for (const face of icoFaces) {
    const v0 = icoVerts[face[0]];
    const v1 = icoVerts[face[1]];
    const v2 = icoVerts[face[2]];

    // Centroid
    let cx = (v0[0] + v1[0] + v2[0]) / 3;
    let cy = (v0[1] + v1[1] + v2[1]) / 3;
    let cz = (v0[2] + v1[2] + v2[2]) / 3;

    let p = [cx * height, cy * height, cz * height];
    
    if (twistAngle !== 0) {
      const axis = normalize([cx, cy, cz]);
      p = rotateAroundAxis(p, axis, twistAngle);
    }

    const pIdx = vertices.length;
    vertices.push(p);

    // 3 new faces
    faceIndices.push([face[0], face[1], pIdx]);
    faceIndices.push([face[1], face[2], pIdx]);
    faceIndices.push([face[2], face[0], pIdx]);
  }
  
  // Format to 3 decimal places
  const cleanVerts = vertices.map(v => `[${v.map(n => n.toFixed(3)).join(', ')}]`);
  const cleanFaces = faceIndices.map(f => `[${f.join(', ')}]`);

  const name = `Star Hexecontahedron ${id}`;
  let desc = `Procedurally generated star polyhedron (Height: ${height.toFixed(2)}`;
  if (twistAngle !== 0) desc += `, Twist: ${twistAngle.toFixed(2)}rad`;
  desc += `)`;

  const content = `export default {
  id: "star-hexecontahedron-${id}",
  name: "${name}",
  description: "${desc}",
  isConvex: false,
  vertices: [
    ${cleanVerts.join(',\n    ')}
  ],
  faceIndices: [
    ${cleanFaces.join(',\n    ')}
  ]
};
`;
  return { id: `star-hexecontahedron-${id}`, content };
}

// Generate 27 distinct shapes
const polyhedraDir = path.join(__dirname, '../js/polyhedra');
const registryFile = path.join(__dirname, '../js/registry.js');

const generatedFiles = [];

let idCounter = 1;
for (let heightIdx = 0; heightIdx < 9; heightIdx++) {
  for (let twistIdx = 0; twistIdx < 3; twistIdx++) {
    const height = 0.6 + heightIdx * 0.25; // 0.6 to 2.6
    const twistAngle = (twistIdx - 1) * 0.5; // -0.5, 0, 0.5
    
    const poly = generateStarHexecontahedron(idCounter, height, twistAngle);
    
    fs.writeFileSync(path.join(polyhedraDir, `${poly.id}.js`), poly.content);
    generatedFiles.push(poly.id);
    
    idCounter++;
  }
}

// Update registry
let registryContent = fs.readFileSync(registryFile, 'utf8');

const importLines = generatedFiles.map((id, index) => {
  const varName = id.replace(/-([a-z0-9])/g, g => g[1].toUpperCase());
  return `import ${varName} from './polyhedra/${id}.js';`;
});

const arrayLines = generatedFiles.map(id => {
  return id.replace(/-([a-z0-9])/g, g => g[1].toUpperCase());
});

// Insert imports
const importMarker = "import rhombicHexecontahedron from './polyhedra/rhombic-hexecontahedron.js';";
if (registryContent.includes(importMarker)) {
  registryContent = registryContent.replace(importMarker, importMarker + '\n' + importLines.join('\n'));
}

// Insert array exports
const arrayMarker = "  rhombicHexecontahedron";
if (registryContent.includes(arrayMarker)) {
  registryContent = registryContent.replace(arrayMarker, arrayMarker + ',\n  ' + arrayLines.join(',\n  '));
}

fs.writeFileSync(registryFile, registryContent);
console.log('Successfully generated 27 polyhedra and updated registry.js');
