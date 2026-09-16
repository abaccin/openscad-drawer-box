import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, test } from 'node:test';
import { readStlVertices } from '../scripts/export-lid-stls.mjs';
import { inspectMesh } from './helpers/mesh.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const executable = (process.env.OPENSCAD || 'openscad').replace(/openscad\.com$/i, 'openscad.exe');
const temporary = mkdtempSync(join(tmpdir(), 'drawer-sliding-test-'));
after(() => rmSync(temporary, { recursive: true, force: true }));
let sequence = 0;
const defaults = {
  boxLength: 100, boxWidth: 95, boxHeight: 50, wallThickness: 2.5, cornerRadius: 5,
  bottomThickness: 2, lidThickness: 2, lidClearance: 0.2, internalClearance: 0.5,
  slidingSkirtDepth: 6, slidingSkirtThickness: 1.4, slidingRailDepth: 0.4,
  slidingVerticalClearance: 0.2, slidingFloorRadius: 2, slidingEdgeChamfer: 0.5,
  withSlidingGrip: true, withNotch: true, withLid: true, lidStyle: 'sliding',
  withStacking: false, dividerCountX: 0, dividerCountY: 0,
  compartmentSizesX: [], compartmentSizesY: [], pullLedges: 'none',
  withLidArtwork: false, withLidLogo: false, withLidText: false, withColorInlay: false,
  itemsShown: 'box', colorShown: 'all',
};

function run(settings = {}, body, extension = 'stl') {
  const config = { ...defaults, ...settings };
  const output = join(temporary, `${sequence++}.${extension}`);
  let source = join(root, 'round_box_drawer.scad');
  if (body) {
    source = join(temporary, `${sequence}-fixture.scad`);
    writeFileSync(source, `include <round_box_drawer.scad>\nslidingChecks() { ${body} }\n`);
    config.withLid = false;
    config.itemsShown = 'lid';
  }
  const result = spawnSync(executable, [
    '-o', output, ...(extension === 'stl' ? ['--export-format', 'asciistl'] : []),
    ...Object.entries(config).flatMap(([key, value]) => ['-D', `${key}=${JSON.stringify(value)}`]), source,
  ], {
    cwd: root, encoding: 'utf8', timeout: 600_000, maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, OPENSCADPATH: [root, process.env.OPENSCADPATH].filter(Boolean).join(delimiter) },
  });
  assert.ifError(result.error);
  return { ...result, output, log: result.stdout + result.stderr };
}

function render(settings, body, shells = 1) {
  const result = run(settings, body);
  assert.equal(result.status, 0, result.log);
  assert.doesNotMatch(result.log, /ERROR:|WARNING:|not a valid 2-manifold/i);
  return inspectMesh(readStlVertices(readFileSync(result.output)), shells);
}

function empty(result) {
  assert.doesNotMatch(result.log, /ERROR:|WARNING:/i);
  if (!/Current top level object is empty/.test(result.log)) {
    assert.doesNotMatch(readFileSync(result.output, 'utf8'), /facet normal/);
  }
}

function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 0.003, `${actual} must be near ${expected}`);
}

for (const [name, overrides] of [
  ['saved dimensions', {}],
  ['reference proportions', { boxLength: 76.8, boxWidth: 56.8, boxHeight: 19, cornerRadius: 8, wallThickness: 3.4 }],
  ['long custom fit', { boxLength: 180, boxWidth: 70, boxHeight: 35, cornerRadius: 7, wallThickness: 3,
    lidThickness: 2.4, lidClearance: 0.3, slidingSkirtDepth: 7.5, slidingSkirtThickness: 1.5,
    slidingRailDepth: 0.45, slidingVerticalClearance: 0.3, slidingFloorRadius: 1.5, slidingEdgeChamfer: 0.4 }],
]) {
  test(`sliding ${name}: full footprint, skirt, rim, floor, and collision-free travel`, () => {
    const s = { ...defaults, ...overrides };
    const box = render(s), lid = render({ ...s, itemsShown: 'lid' });
    const { boxLength: l, boxWidth: w, boxHeight: h, lidThickness: t, wallThickness: wt,
      slidingSkirtDepth: depth, slidingSkirtThickness: skirt, slidingRailDepth: rail } = s;
    const inset = skirt + s.lidClearance / 2, seat = h - t, railZ = seat - depth / 3;
    box.bounds.flat().forEach((v, i) => near(v, [0, 0, 0, l, w, seat - s.slidingVerticalClearance][i]));
    lid.bounds.flat().forEach((v, i) => near(v, [0, -w - 2 * wt, 0, l, -2 * wt, t + depth][i]));
    const lidPoint = (x, y, z) => [x, y - w - 2 * wt, z];
    assert.equal(box.contains([l / 2, w / 2, s.bottomThickness - 0.1]), true);
    assert.equal(box.contains([l / 2, w / 2, s.bottomThickness + 0.1]), false);
    assert.equal(box.contains([l / 2, inset - rail + 0.1, railZ]), true, 'External retaining bead');
    assert.equal(box.contains([l / 2, inset - 0.1, railZ - rail - 0.5]), false, 'Inset wall below bead');
    assert.equal(lid.contains(lidPoint(l / 2, skirt - rail + 0.1, t + depth / 3)), false, 'Matching groove');
    assert.equal(lid.contains(lidPoint(l / 2, skirt - rail + 0.1, t + 0.3)), true, 'Skirt above groove');
    assert.equal(lid.contains(lidPoint(s.cornerRadius - 0.1, 0.7, t + 1)), false, 'Open skirt end');
    assert.equal(lid.contains(lidPoint(s.cornerRadius + s.lidClearance / 2 + 0.2, 0.7, t + 1)), true);
    assert.equal(box.contains([s.cornerRadius - 0.1, 0.5, seat - s.slidingVerticalClearance - 0.1]), true, 'Rear stop');
    empty(run(s, `
      for (travel=[0,0.01,lidClearance/2,lidClearance,0.5,1,cornerRadius/2,cornerRadius,
                   boxLength/4,boxLength/2,boxLength])
        intersection() {
          slidingBox();
          slidingAssemblyPlacement(travel) slidingLidBody(false);
        }
    `));
  });
}

test('sliding print layout separates both parts and the closed assembly has the requested envelope', () => {
  const print = render({ itemsShown: 'both' }, undefined, 2);
  print.bounds.flat().forEach((v, i) => near(v, [0, -100, 0, 100, 95, 47.8][i]));
  const closed = render({}, `
    union() { slidingBox(); slidingAssemblyPlacement() slidingLidBody(false); }
  `, 2);
  closed.bounds.flat().forEach((v, i) => near(v, [0, 0, 0, 100, 95, 50][i]));
});

test('sliding rails capture the lid vertically and the rear stop prevents overclosing', () => {
  for (const transform of [
    'translate([0,0,0.8]) slidingAssemblyPlacement()',
    'slidingAssemblyPlacement(-0.3)',
  ]) {
    const result = run({}, `intersection() { slidingBox(); ${transform} slidingLidBody(false); }`);
    assert.equal(result.status, 0, result.log);
    assert.doesNotMatch(result.log, /ERROR:|WARNING:/i);
    assert.ok(readStlVertices(readFileSync(result.output)).length > 0, 'Retaining features must physically engage');
  }
});

test('sliding tall dividers and pull ledges stay out of the moving skirt', () => {
  const settings = { dividerCountX: 1, dividerCountY: 1, dividerHeight: 45.5,
    pullLedges: 'both', pullWidth: 20, pullProjection: 4, pullTopOffset: 2.5 };
  render(settings);
  empty(run(settings, `
    for (travel=[0,0.1,1,10,50,100])
      intersection() { slidingBox(); slidingAssemblyPlacement(travel) slidingLidBody(false); }
  `));
});

test('sliding finishing features round the floor, soften edges, and recess grip ribs', () => {
  const plain = { slidingFloorRadius: 0, slidingEdgeChamfer: 0, withSlidingGrip: false, withNotch: false };
  const box = render(), plainBox = render(plain);
  const lid = render({ itemsShown: 'lid' }), plainLid = render({ ...plain, itemsShown: 'lid' });
  for (const [point, decorated, undecorated] of [
    [[2.75, 47.5, 2.25], true, false],
    [[0.1, 47.5, 0.1], false, true],
    [[99.9, 48.5, 38.8], false, true],
  ]) {
    assert.equal(box.contains(point), decorated);
    assert.equal(plainBox.contains(point), undecorated);
  }
  for (const point of [[99.9, -51.5, 2.5], [99.5, -52.5, 7.5], [0.1, -52.5, 0.1]]) {
    assert.equal(lid.contains(point), false);
    assert.equal(plainLid.contains(point), true);
  }
  assert.equal(box.contains([99.9, 47.5, 38.8]), true, 'Material between grip grooves remains');
});

test('sliding limits reject invalid fits and preserve the minimum rim skin', () => {
  render({ wallThickness: 2.3 });
  for (const [settings, message] of [
    [{ wallThickness: 2.299 }, /rim must retain 0.8/],
    [{ lidClearance: 0 }, /lidClearance must be positive/],
    [{ lidClearance: 0.8, wallThickness: 3, cornerRadius: 6 }, /must exceed lidClearance/],
    [{ slidingVerticalClearance: -0.1 }, /slidingVerticalClearance must be positive/],
    [{ slidingSkirtThickness: 1.3 }, /groove must retain 0.8/],
    [{ slidingSkirtDepth: 4 }, /rail must retain 0.8 mm below/],
    [{ slidingSkirtDepth: 50 }, /shoulder must clear/],
    [{ slidingRailDepth: 'deep' }, /slidingRailDepth must be positive/],
    [{ slidingFloorRadius: -1 }, /slidingFloorRadius must be nonnegative/],
    [{ slidingFloorRadius: 3 }, /corner radius must exceed/],
    [{ slidingEdgeChamfer: 2 }, /chamfer must be smaller/i],
    [{ withSlidingGrip: 'yes' }, /withSlidingGrip must be true or false/],
    [{ dividerCountX: 1, dividerHeight: 45.51 }, /dividerHeight must not exceed 45.5/],
    [{ pullLedges: 'both', pullTopOffset: 2.49 }, /pullTopOffset must clear the sliding plate/],
  ]) {
    const result = run(settings, undefined, 'csg');
    assert.match(result.log, /ERROR: Assertion/, JSON.stringify(settings));
    assert.match(result.log, message, JSON.stringify(settings));
    assert.doesNotMatch(result.log, /WARNING:/i);
  }
});

test('inactive sliding controls and the retired bevel do not alter other modes', () => {
  for (const settings of [{ withLid: false }, { withLid: true, lidStyle: 'magnetic' }]) {
    const normal = run(settings, undefined, 'csg');
    const ignored = run({ ...settings, slidingSkirtDepth: -1, slidingSkirtThickness: 'unused',
      slidingRailDepth: -1, slidingVerticalClearance: -1, slidingFloorRadius: -1,
      slidingEdgeChamfer: -1, withSlidingGrip: 'unused', lidEdgeThickness: 'unused' }, undefined, 'csg');
    assert.doesNotMatch(ignored.log, /ERROR:|WARNING:/i);
    assert.equal(readFileSync(normal.output, 'utf8'), readFileSync(ignored.output, 'utf8'));
  }
  const normal = run({}, undefined, 'csg');
  const ignored = run({ lidEdgeThickness: 'unused' }, undefined, 'csg');
  assert.doesNotMatch(ignored.log, /ERROR:|WARNING:/i);
  assert.equal(readFileSync(normal.output, 'utf8'), readFileSync(ignored.output, 'utf8'));
});
