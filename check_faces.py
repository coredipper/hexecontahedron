import json
import numpy as np

def area(p1, p2, p3):
    return 0.5 * np.linalg.norm(np.cross(p2 - p1, p3 - p1))

with open('js/polyhedra/star-hexecontahedron-1.js') as f:
    lines = f.readlines()

verts = []
faces = []
in_v = False
in_f = False
for line in lines:
    if 'vertices:' in line:
        in_v = True
        continue
    if 'faceIndices:' in line:
        in_v = False
        in_f = True
        continue
    if ']' in line and (in_v or in_f) and not '[' in line:
        in_v = False
        in_f = False
    
    if in_v and '[' in line:
        v = eval(line.strip().strip(','))
        verts.append(np.array(v))
    if in_f and '[' in line:
        f = eval(line.strip().strip(','))
        faces.append(f)

print(f"Faces: {len(faces)}")
for i, f in enumerate(faces):
    a = area(verts[f[0]], verts[f[1]], verts[f[2]])
    if a < 0.001:
        print(f"Degenerate face {i}: {a}")

