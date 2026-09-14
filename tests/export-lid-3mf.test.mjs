import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { exportLid3mf, parse3mfArguments } from '../scripts/export-lid-3mf.mjs';
import { createBambuProject } from '../scripts/lib/bambu-project.mjs';
import { readZip as unpack } from './helpers/zip.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'scripts', 'export-lid-3mf.mjs');
const stl = `solid test
facet normal 0 0 1
outer loop
vertex 0 -10 0
vertex 1 -10 0
vertex 0 -9 0
endloop
endfacet
endsolid test
`;

function fixture(t) {
  const temporary = mkdtempSync(join(tmpdir(), 'lid 3mf test '));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const calls = [];
  const log = [];
  const render = (options, dependencies) => {
    calls.push({ options, dependencies });
    mkdirSync(options.outputDir);
    const files = ['lid_body.stl', 'lid_logo.stl', 'lid_text.stl'].map(name => join(options.outputDir, name));
    for (const file of files) writeFileSync(file, stl);
    return { files, colors: ['#FFFFFF', '#000000', '#008000'] };
  };
  return {
    temporary, output: join(temporary, 'output project.3mf'), calls, log,
    dependencies: { render, log: message => log.push(message), modelRoot: temporary },
  };
}

test('3MF CLI accepts one output, force, help and existing SCAD definitions', () => {
  assert.deepEqual(parse3mfArguments(['--output', 'a b.3mf', '--force', '-D', 'lidText="A B"']), {
    output: 'a b.3mf', force: true, definitions: ['lidText="A B"'], help: undefined,
  });
  assert.equal(parse3mfArguments(['--help']).help, true);
  for (const args of [
    ['--output'], ['--output', '--force'], ['--output-dir', 'dir'], ['-D'],
    ['-D', 'colorShown="all"'], ['--unknown'], ['--output', 'a', '--output', 'b'],
  ]) assert.throws(() => parse3mfArguments(args));
});

test('3MF export reuses renderer settings and publishes just one project', t => {
  const f = fixture(t);
  const definitions = ['lidText="A B"'];
  const output = exportLid3mf({ definitions, output: f.output }, f.dependencies);
  assert.equal(output, f.output);
  assert.deepEqual(readdirSync(f.temporary), ['output project.3mf']);
  assert.equal(f.calls.length, 1);
  assert.deepEqual(f.calls[0].options.definitions, definitions);
  assert.equal(f.calls[0].options.includeColors, true);
  const entries = unpack(readFileSync(output));
  assert.ok(entries.has('3D/3dmodel.model'));
  assert.ok(entries.has('Metadata/model_settings.config'));
  assert.ok(entries.has('Metadata/project_settings.config'));
  assert.ok(f.log.some(message => message.includes('already assigned')));
});

test('3MF default is a repository-relative file, not a directory of STLs', t => {
  const f = fixture(t);
  assert.equal(exportLid3mf({}, f.dependencies), join(f.temporary, 'exports', 'lid.3mf'));
  assert.deepEqual(readdirSync(join(f.temporary, 'exports')), ['lid.3mf']);
});

test('3MF refuses overwrite unless force is explicit and checks before rendering', t => {
  const f = fixture(t);
  writeFileSync(f.output, 'previous project');
  assert.throws(() => exportLid3mf({ output: f.output }, f.dependencies), /--force/);
  assert.equal(f.calls.length, 0);
  assert.equal(readFileSync(f.output, 'utf8'), 'previous project');
  exportLid3mf({ output: f.output, force: true }, f.dependencies);
  assert.ok(unpack(readFileSync(f.output)).has('3D/3dmodel.model'));
  assert.deepEqual(readdirSync(f.temporary), ['output project.3mf']);
});

test('3MF render failure preserves previous project even with force', t => {
  const f = fixture(t);
  writeFileSync(f.output, 'previous project');
  assert.throws(() => exportLid3mf({ output: f.output, force: true }, {
    ...f.dependencies, render: () => { throw new Error('OpenSCAD failed'); },
  }), /OpenSCAD failed/);
  assert.equal(readFileSync(f.output, 'utf8'), 'previous project');
  assert.deepEqual(readdirSync(f.temporary), ['output project.3mf']);
});

test('3MF invalid geometry and missing colors fail without partial output', t => {
  for (const corrupt of ['mesh', 'palette']) {
    const f = fixture(t);
    assert.throws(() => exportLid3mf({ output: f.output }, {
      ...f.dependencies,
      render: (...args) => {
        const result = f.dependencies.render(...args);
        if (corrupt === 'mesh') writeFileSync(result.files[0], 'not STL');
        else result.colors = [];
        return result;
      },
    }), /STL|colors/);
    assert.deepEqual(readdirSync(f.temporary), []);
  }
});

test('3MF protects files created during rendering and rejects invalid destinations', t => {
  const f = fixture(t);
  assert.throws(() => exportLid3mf({ output: f.output }, {
    ...f.dependencies,
    render: (...args) => {
      writeFileSync(f.output, 'concurrent project');
      return f.dependencies.render(...args);
    },
  }), /already exists/);
  assert.equal(readFileSync(f.output, 'utf8'), 'concurrent project');
  assert.throws(() => exportLid3mf({ output: join(f.temporary, 'model.scad') }, f.dependencies), /end in .3mf/);
  mkdirSync(join(f.temporary, 'directory.3mf'));
  assert.throws(() => exportLid3mf({ output: join(f.temporary, 'directory.3mf'), force: true }, f.dependencies), /regular file/);
});

test('3MF CLI help and errors work when invoked outside the repository', t => {
  const f = fixture(t);
  const help = spawnSync(process.execPath, [script, '--help'], { cwd: f.temporary, encoding: 'utf8' });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /No manual STL importing/);
  const missing = spawnSync(process.execPath, [script, '--output', f.output], {
    cwd: f.temporary, encoding: 'utf8',
    env: { ...process.env, OPENSCAD: join(f.temporary, 'missing renderer.exe') },
  });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Set OPENSCAD/);
  assert.equal(existsSync(f.output), false);
  assert.deepEqual(readdirSync(f.temporary), []);
});

test('Bambu package stores one build object with named parts and shared filament slots', () => {
  const vertices = [[0, -10, 0], [1, -10, 0], [0, -9, 0]];
  const parts = [
    { name: 'Lid & body', color: '#ffffff', vertices },
    { name: 'Logo "AB"', color: '#000000', vertices },
    { name: 'Robot', color: '#000000', vertices },
    { name: 'Text', color: '#008000', vertices },
  ];
  const entries = unpack(createBambuProject(parts));
  const model = entries.get('3D/3dmodel.model');
  const meshes = entries.get('3D/Objects/lid.model');
  const metadata = entries.get('Metadata/model_settings.config');
  const settings = JSON.parse(entries.get('Metadata/project_settings.config'));
  assert.equal((model.match(/<object /g) ?? []).length, 1);
  assert.equal((model.match(/<item /g) ?? []).length, 1);
  assert.equal((model.match(/<component /g) ?? []).length, 4);
  assert.equal((meshes.match(/<object /g) ?? []).length, 4);
  assert.match(model, /objectid="5"/);
  assert.match(model, /transform="1 0 0 0 1 0 0 0 1 10 20 0"/);
  assert.equal((model.match(/transform="1 0 0 0 1 0 0 0 1 0 0 0"/g) ?? []).length, 4);
  assert.match(metadata, /Lid &amp; body/);
  assert.match(metadata, /Logo &quot;AB&quot;/);
  assert.deepEqual([...metadata.matchAll(/<part\b[\s\S]*?key="extruder" value="(\d+)"/g)].map(match => Number(match[1])),
    [1, 2, 2, 3]);
  assert.deepEqual(settings.filament_colour, ['#FFFFFF', '#000000', '#008000']);
  assert.deepEqual(settings.filament_type, ['PLA', 'PLA', 'PLA']);
  assert.equal(settings.printer_model, '');
  assert.equal(settings.flush_volumes_matrix.length, 9);
  assert.deepEqual(settings.flush_volumes_matrix.filter((value, index) => index % 4 === 0), ['0', '0', '0']);
  assert.equal(settings.inherits_group.length, 5);
  assert.equal(settings.different_settings_to_system.length, 5);
  assert.deepEqual(settings.nozzle_diameter, ['0.4']);
  assert.ok(Number(settings.printable_height) > 0);
  assert.match(model, /name="Application">BambuStudio-/);
  assert.match(entries.get('_rels/.rels'), /Target="\/3D\/3dmodel.model"/);
  assert.match(entries.get('3D/_rels/3dmodel.model.rels'), /Target="\/3D\/Objects\/lid.model"/);
  assert.match(entries.get('[Content_Types].xml'), /PartName="\/Metadata\/project_settings.config"/);
  const actualVertices = [...meshes.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)]
    .map(match => match.slice(1).map(Number));
  assert.deepEqual(actualVertices, parts.flatMap(part => part.vertices));
  assert.equal((meshes.match(/<triangle v1="0" v2="1" v3="2"\/>/g) ?? []).length, 4);
});

test('3MF mesh serialization shares vertices without moving them or changing winding', () => {
  const a = [-1, -2, 0], b = [3, -2, 0], c = [3, 4, 0], d = [-1, 4, 0];
  const entries = unpack(createBambuProject([{ name: 'lid', color: '#FFFFFF', vertices: [a, b, c, a, c, d] }]));
  const meshes = entries.get('3D/Objects/lid.model');
  assert.equal((meshes.match(/<vertex /g) ?? []).length, 4);
  assert.match(meshes, /<triangle v1="0" v2="1" v3="2"\/><triangle v1="0" v2="2" v3="3"\/>/);
});

test('3MF package rejects missing parts, invalid colors, and invalid triangle geometry', () => {
  const valid = { name: 'lid', color: '#FFFFFF', vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] };
  assert.throws(() => createBambuProject([]), /at least one/);
  for (const override of [
    { name: '' }, { color: 'red' }, { vertices: [] }, { vertices: [[0, 0, 0]] },
    { vertices: [[NaN, 0, 0], [1, 0, 0], [0, 1, 0]] },
  ]) assert.throws(() => createBambuProject([{ ...valid, ...override }]), /finite triangle/);
});

function partBounds(entries) {
  const model = entries.get('3D/3dmodel.model');
  const result = [];
  for (const component of model.matchAll(/<component\b[^>]*\/>/g)) {
    const id = component[0].match(/objectid="(\d+)"/)[1];
    const path = component[0].match(/p:path="\/([^"]+)"/)[1];
    const transform = component[0].match(/transform="([^"]+)"/)[1].split(/\s+/).map(Number);
    assert.deepEqual(transform.slice(0, 9), [1, 0, 0, 0, 1, 0, 0, 0, 1]);
    const mesh = [...entries.get(path).matchAll(/<object\b[^>]*id="(\d+)"[^>]*>([\s\S]*?)<\/object>/g)]
      .find(match => match[1] === id)[2];
    const vertices = [...mesh.matchAll(/<vertex\b[^>]*x="([^"]+)"[^>]*y="([^"]+)"[^>]*z="([^"]+)"[^>]*\/>/g)]
      .map(match => match.slice(1).map((value, axis) => Number(value) + transform[axis + 9]));
    result.push({
      triangles: (mesh.match(/<triangle\b/g) ?? []).length,
      bounds: [Math.min, Math.max].map(fn => [0, 1, 2].map(axis => vertices.reduce(
        (bound, vertex) => fn(bound, vertex[axis]), fn === Math.min ? Infinity : -Infinity))),
    });
  }
  return result;
}

const bambu = process.env.BAMBU_STUDIO || (process.platform === 'win32'
  ? join(process.env.ProgramFiles || 'C:\\Program Files', 'Bambu Studio', 'bambu-studio.exe') : undefined);

test('real OpenSCAD project round-trips through Bambu with colors, parts and alignment intact', {
  skip: !bambu || !existsSync(bambu) ? 'Set BAMBU_STUDIO to enable the real Bambu Studio compatibility test.' : false,
}, t => {
  const f = fixture(t);
  const definitions = {
    lidStyle: 'magnetic', boxLength: 100, boxWidth: 95, boxHeight: 50,
    wallThickness: 2.5, bottomThickness: 2, dividerCountX: 0, dividerCountY: 0,
    compartmentSizesX: [], compartmentSizesY: [], pullLedges: 'none',
    withLidArtwork: false, withLidLogo: true, withLidText: true, lidText: 'AB',
    lidLogoSize: 15, lidTextSize: 6, lidTextPositionX: 70, lidTextPositionY: 25,
    lidColor: 'white', logoColor: [0, 0, 0], textColor: '#008000', $fn: 16,
  };
  const sourceBefore = readFileSync(join(root, 'round_box_drawer.scad'));
  const args = [script, '--output', f.output,
    ...Object.entries(definitions).flatMap(([key, value]) => ['-D', `${key}=${JSON.stringify(value)}`])];
  const exported = spawnSync(process.execPath, args, { cwd: f.temporary, encoding: 'utf8', timeout: 2_400_000 });
  assert.ifError(exported.error);
  assert.equal(exported.status, 0, exported.stdout + exported.stderr);
  const original = unpack(readFileSync(f.output));
  const expectedColors = ['#FFFFFF', '#000000', '#008000'];
  assert.deepEqual(JSON.parse(original.get('Metadata/project_settings.config')).filament_colour, expectedColors);
  const output = join(f.temporary, 'bambu-saved.3mf');
  const saved = spawnSync(bambu, ['--export-3mf', output, f.output], {
    cwd: f.temporary, encoding: 'utf8', timeout: 120_000,
  });
  assert.ifError(saved.error);
  const diagnostics = join(f.temporary, 'result.json');
  assert.equal(saved.status, 0, saved.stdout + saved.stderr
    + (existsSync(diagnostics) ? readFileSync(diagnostics, 'utf8') : ''));
  assert.ok(existsSync(output), 'Bambu must successfully save the imported project');
  const imported = unpack(readFileSync(output));
  const settings = JSON.parse(imported.get('Metadata/project_settings.config'));
  assert.deepEqual(settings.filament_colour, expectedColors, 'Bambu must load the palette, not just the meshes');
  const metadata = imported.get('Metadata/model_settings.config');
  assert.equal((metadata.match(/<object\b/g) ?? []).length, 1);
  const parts = [...metadata.matchAll(/<part\b[\s\S]*?<\/part>/g)].map(match => ({
    name: match[0].match(/key="name" value="([^"]+)"/)[1],
    extruder: Number(match[0].match(/key="extruder" value="(\d+)"/)[1]),
  }));
  assert.deepEqual(parts, [
    { name: 'lid_body', extruder: 1 }, { name: 'lid_logo', extruder: 2 }, { name: 'lid_text', extruder: 3 },
  ]);
  const expected = partBounds(original), actual = partBounds(imported);
  assert.equal(actual.length, 3);
  for (let part = 0; part < 3; part++) {
    assert.equal(actual[part].triangles, expected[part].triangles);
    for (let bound = 0; bound < 2; bound++) {
      for (let axis = 0; axis < 3; axis++) {
        const expectedRelative = expected[part].bounds[bound][axis] - expected[0].bounds[0][axis];
        const actualRelative = actual[part].bounds[bound][axis] - actual[0].bounds[0][axis];
        assert.ok(Math.abs(expectedRelative - actualRelative) < 0.001, 'Bambu must preserve inter-part alignment');
      }
    }
  }
  assert.deepEqual(readFileSync(join(root, 'round_box_drawer.scad')), sourceBefore);
});
