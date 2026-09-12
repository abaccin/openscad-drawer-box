import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, test } from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configured = process.env.OPENSCAD || 'openscad';
// Bypass the Windows console wrapper so timeouts terminate the actual renderer.
const executable = process.platform === 'win32'
  ? configured.replace(/openscad\.com$/i, 'openscad.exe') : configured;
const temporary = mkdtempSync(join(tmpdir(), 'drawer-box-test-'));
let sequence = 0;
after(() => rmSync(temporary, { recursive: true, force: true }));

function run(settings, extension = 'stl') {
  const output = join(temporary, `${sequence++}.${extension}`);
  const args = ['-o', output];
  if (extension === 'stl') args.push('--export-format', 'asciistl');
  for (const [name, value] of Object.entries(settings)) {
    args.push('-D', `${name}=${JSON.stringify(value)}`);
  }
  args.push(join(root, 'round_box_drawer.scad'));
  const result = spawnSync(executable, args, {
    cwd: root, encoding: 'utf8', timeout: 600_000, maxBuffer: 10 * 1024 * 1024,
  });
  assert.ifError(result.error);
  return { ...result, output, log: result.stdout + result.stderr };
}

const subtract = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

function render(settings = {}) {
  const result = run({ itemsShown: 'box', ...settings });
  assert.equal(result.status, 0, result.log);
  assert.doesNotMatch(result.log, /ERROR:|WARNING:|not a valid 2-manifold/i);
  const vertices = [...readFileSync(result.output, 'utf8').matchAll(
    /vertex\s+([-\d.e+]+)\s+([-\d.e+]+)\s+([-\d.e+]+)/gi,
  )].map(match => match.slice(1).map(Number));
  assert.ok(vertices.length > 0, 'Render must contain geometry');
  assert.equal(vertices.length % 3, 0);
  const triangles = [];
  for (let i = 0; i < vertices.length; i += 3) triangles.push(vertices.slice(i, i + 3));
  const edges = new Map();
  const neighbors = new Map();
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
  const pending = [neighbors.keys().next().value];
  while (pending.length) {
    const key = pending.pop();
    if (visited.has(key)) continue;
    visited.add(key);
    pending.push(...neighbors.get(key));
  }
  assert.equal(visited.size, neighbors.size, 'Dividers/engravings must form one connected shell');

  return {
    triangles,
    bounds: [Math.min, Math.max].map(fn =>
      [0, 1, 2].map(axis => vertices.reduce(
        (bound, point) => fn(bound, point[axis]), fn === Math.min ? Infinity : -Infinity,
      )),
    ),
    contains(point) {
      // Non-axis-aligned ray avoids shared edges at grid and engraving coordinates.
      const direction = [1, 0.123457, 0.234569];
      const distances = [];
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

function near(actual, expected, tolerance = 0.03) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} must be near ${expected}`);
}

test('default box remains undivided with the original floor, base, and ledges', () => {
  const mesh = render();
  mesh.bounds[1].forEach((v, i) => near(v, [160, 95, 50][i]));
  assert.equal(mesh.contains([80, 47.5, 4.9]), true);
  assert.equal(mesh.contains([80, 47.5, 5.1]), false);
  assert.equal(mesh.contains([4, 47.5, 41]), true);
  assert.equal(mesh.contains([0.5, 47.5, 1]), false);
});

test('equal grid makes six clear compartments with specified wall thickness and height', () => {
  const mesh = render({ dividerCountX: 2, dividerCountY: 1 });
  const sizeX = (158 - 2 * 1.2) / 3, sizeY = (93 - 1.2) / 2;
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 2; y++) {
      assert.equal(mesh.contains([1 + sizeX / 2 + x * (sizeX + 1.2),
        1 + sizeY / 2 + y * (sizeY + 1.2), 15]), false);
    }
  }
  for (const x of [1 + sizeX, 1 + 2 * sizeX + 1.2]) {
    assert.equal(mesh.contains([x - 0.1, 20, 15]), false);
    assert.equal(mesh.contains([x + 0.6, 20, 29.9]), true);
    assert.equal(mesh.contains([x + 0.6, 20, 30.1]), false);
    assert.equal(mesh.contains([x + 1.3, 20, 15]), false);
  }
  assert.equal(mesh.contains([80, 47.5, 15]), true);
});

test('custom sizes preserve clear measurements and allocate the final remainder', () => {
  const mesh = render({ dividerCountX: 2, dividerCountY: 1,
    compartmentSizesX: [40, 55], compartmentSizesY: [30] });
  for (const x of [41, 97.2]) {
    assert.equal(mesh.contains([x - 0.1, 20, 15]), false);
    assert.equal(mesh.contains([x + 0.6, 20, 15]), true);
    assert.equal(mesh.contains([x + 1.3, 20, 15]), false);
  }
  assert.equal(mesh.contains([80, 31.6, 15]), true);
  for (const x of [21, 69.7, 128.7]) {
    for (const y of [16, 62.1]) assert.equal(mesh.contains([x, y, 15]), false);
  }
});

for (const [name, settings, floor, height, point] of [
  ['stacking', { dividerCountX: 1 }, 5, 41.5, [80, 20]],
  ['lid rails', { withLid: true, dividerCountY: 1 }, 2, 44.5, [80, 47.5]],
  ['flat full-height box', { withStacking: false, dividerCountX: 1 }, 2, 48, [80, 20]],
]) {
  test(`dividers respect the exact maximum height for ${name}`, () => {
    const mesh = render({ ...settings, dividerHeight: height, pullLedges: 'none' });
    assert.equal(mesh.contains([...point, floor + height - 0.1]), true);
    assert.equal(mesh.contains([...point, floor + height + 0.1]), false);
  });
}

test('near-corner divisions stay within the rounded shell and fuse to the floor', () => {
  const mesh = render({ dividerCountX: 1, compartmentSizesX: [0.1] });
  assert.equal(mesh.contains([1.7, 20, 15]), true);
  assert.equal(mesh.contains([1.7, 0.1, 15]), false);
});

test('divider thickness and raised-floor height follow non-default settings', () => {
  const mesh = render({ dividerCountX: 1, dividerThickness: 2.4, dividerHeight: 12,
    bottomThickness: 3, stackingDepth: 4 });
  assert.equal(mesh.contains([78.7, 20, 10]), false);
  assert.equal(mesh.contains([78.9, 20, 10]), true);
  assert.equal(mesh.contains([81.1, 20, 18.9]), true);
  assert.equal(mesh.contains([81.3, 20, 10]), false);
  assert.equal(mesh.contains([80, 20, 19.1]), false);
});

const lidSettings = { withLid: true, itemsShown: 'lid' };

test('personal logo engraves the correct depth and preserves transparent letter cutouts', () => {
  const mesh = render({ ...lidSettings, withLidArtwork: false });
  const logoPoint = (x, y, z) => [10 + (x - 50) * 12 / 89, -48.4 + (50 - y) * 12 / 89, z];
  assert.equal(mesh.contains(logoPoint(16, 40, 1.75)), false);
  assert.equal(mesh.contains(logoPoint(16, 40, 1.25)), true);
  assert.equal(mesh.contains(logoPoint(30, 30, 1.75)), true);
  near(mesh.bounds[1][2], 2);
});

test('both engravings share the lid without overlap or through-holes', () => {
  const mesh = render(lidSettings);
  const engraved = mesh.triangles.filter(triangle => triangle.every(v => Math.abs(v[2] - 1.5) < 1e-5));
  const logo = engraved.filter(triangle => triangle.every(v => v[0] < 20));
  const robot = engraved.filter(triangle => triangle.every(v => v[0] > 20));
  assert.ok(logo.length > 0 && robot.length > 0, 'Both SVGs must actually be engraved');
  for (const triangle of logo) for (const vertex of triangle) {
    assert.ok(vertex[0] >= 3.99 && vertex[0] <= 16.01);
  }
  for (const triangle of robot) for (const vertex of triangle) assert.ok(vertex[0] >= 27.9);
  assert.equal(mesh.contains([10, -48.4, 1]), true);
  assert.equal(mesh.contains([80, -48.4, 1]), true);
});

test('disabled engravings do not import their SVGs', () => {
  const mesh = render({ ...lidSettings, withLidArtwork: false, withLidLogo: false,
    lidArtworkFile: 'missing-robot.svg', lidLogoFile: 'missing-logo.svg' });
  assert.equal(mesh.contains([10, -48.4, 1.75]), true);
  assert.equal(mesh.contains([80, -48.4, 1.75]), true);
});

test('logo size and depth are independently parametric', () => {
  const mesh = render({ ...lidSettings, withLidArtwork: false, lidLogoSize: 18, lidLogoDepth: 0.8 });
  const engraved = mesh.triangles.filter(t => t.every(v => Math.abs(v[2] - 1.2) < 1e-5)).flat();
  assert.ok(engraved.length > 0);
  near(Math.min(...engraved.map(v => v[0])), 4);
  near(Math.max(...engraved.map(v => v[0])), 22);
});

const invalid = [
  [{ dividerCountX: -1 }, /dividerCountX must be a nonnegative integer/],
  [{ dividerCountY: 1.5 }, /dividerCountY must be a nonnegative integer/],
  [{ dividerCountX: '2' }, /dividerCountX must be a nonnegative integer/],
  [{ compartmentSizesX: [20] }, /exactly 0 clear sizes/],
  [{ dividerCountX: 2, compartmentSizesX: [40] }, /exactly 2 clear sizes/],
  [{ dividerCountY: 1, compartmentSizesY: 30 }, /must be a list/],
  [{ dividerCountY: 1, compartmentSizesY: [0] }, /positive numbers/],
  [{ dividerCountX: 1, compartmentSizesX: ['40'] }, /positive numbers/],
  [{ dividerCountX: 1, compartmentSizesX: [156.8] }, /positive final compartment/],
  [{ dividerCountY: 1, compartmentSizesY: [94] }, /positive final compartment/],
  [{ dividerCountX: 1, dividerThickness: 0 }, /dividerThickness must be positive/],
  [{ dividerCountY: 100 }, /no compartment space along Y/],
  [{ dividerCountX: 1, dividerHeight: 0 }, /dividerHeight must be positive/],
  [{ dividerCountX: 1, dividerHeight: 41.51 }, /must not exceed 41.5/],
  [{ withLid: true, dividerCountY: 1, dividerHeight: 44.51 }, /must not exceed 44.5/],
  [{ withStacking: false, dividerCountX: 1, dividerHeight: 48.01 }, /must not exceed 48/],
  [{ internalClearance: 0 }, /internalClearance must be positive/],
  [{ ...lidSettings, lidLogoDepth: 2 }, /Lid logo depth/],
  [{ ...lidSettings, lidLogoSize: 0 }, /Lid logo size/],
  [{ ...lidSettings, lidLogoMargin: 1 }, /Lid logo margin must clear/],
  [{ ...lidSettings, withLidArtwork: false, lidLogoSize: 100 }, /too small for the logo/],
  [{ ...lidSettings, lidArtworkAspect: 0 }, /aspect ratio must be positive/],
];

test('invalid parameters fail with actionable assertions rather than broken geometry', () => {
  for (const [settings, expected] of invalid) {
    const result = run({ itemsShown: 'box', ...settings }, 'csg');
    assert.match(result.log, /ERROR: Assertion/, JSON.stringify(settings));
    assert.match(result.log, expected, JSON.stringify(settings));
  }
});
