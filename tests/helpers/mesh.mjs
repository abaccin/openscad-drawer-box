import assert from 'node:assert/strict';

const subtract = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export function inspectMesh(vertices, expectedShells = 1) {
  assert.ok(vertices.length > 0, 'Render must contain geometry');
  assert.equal(vertices.length % 3, 0);
  const triangles = [];
  for (let i = 0; i < vertices.length; i += 3) triangles.push(vertices.slice(i, i + 3));
  const edges = new Map(), neighbors = new Map();
  for (const triangle of triangles) {
    const keys = triangle.map(vertex => vertex.join(','));
    for (let i = 0; i < 3; i++) {
      const a = keys[i], b = keys[(i + 1) % 3];
      const edge = [a, b].sort().join('|');
      edges.set(edge, (edges.get(edge) || 0) + 1);
      if (!neighbors.has(a)) neighbors.set(a, new Set());
      neighbors.get(a).add(b);
    }
  }
  assert.ok([...edges.values()].every(count => count === 2), 'Mesh must be watertight');
  const visited = new Set();
  let shells = 0;
  for (const start of neighbors.keys()) {
    if (visited.has(start)) continue;
    shells++;
    const pending = [start];
    while (pending.length) {
      const key = pending.pop();
      if (visited.has(key)) continue;
      visited.add(key);
      pending.push(...neighbors.get(key));
    }
  }
  assert.equal(shells, expectedShells, 'Exported mesh must have the expected connected shells');
  return {
    triangles,
    bounds: [Math.min, Math.max].map(fn => [0, 1, 2].map(axis => vertices.reduce(
      (bound, point) => fn(bound, point[axis]), fn === Math.min ? Infinity : -Infinity,
    ))),
    contains(point) {
      // An oblique ray avoids shared edges at grid and engraving coordinates.
      const direction = [1, 0.123457, 0.234569], distances = [];
      for (const [a, b, c] of triangles) {
        const edge1 = subtract(b, a), edge2 = subtract(c, a);
        const p = cross(direction, edge2), determinant = dot(edge1, p);
        if (Math.abs(determinant) < 1e-9) continue;
        const t = subtract(point, a), u = dot(t, p) / determinant;
        if (u < 0 || u > 1) continue;
        const q = cross(t, edge1), v = dot(direction, q) / determinant;
        if (v < 0 || u + v > 1) continue;
        const distance = dot(edge2, q) / determinant;
        if (distance > 1e-7) distances.push(distance);
      }
      distances.sort((a, b) => a - b);
      return distances.filter((v, i) => i === 0 || v - distances[i - 1] > 1e-7).length % 2 === 1;
    },
  };
}
