'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const setup = require('../package/skills/freeup-content-gon-lab/scripts/setup-renderer.cjs');
function fixture(t) {
  const parent = fs.realpathSync(os.tmpdir()), root = fs.mkdtempSync(path.join(parent, 'freeup-render-setup-'));
  t.after(() => { const relative = path.relative(parent, root); assert.ok(relative.startsWith('freeup-render-setup-') && !relative.includes(path.sep)); fs.rmSync(root, { recursive: true, force: true }); });
  const workspace = path.join(root, 'Khách có dấu', 'Workspace riêng'); fs.mkdirSync(workspace, { recursive: true });
  return { root, workspace, runtime: path.join(workspace, 'freeup-content-gon-lab-data', 'runtime') };
}
function write(root, name, content, mode) { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content, mode ? { mode } : undefined); return file; }
function tar(entries) {
  const chunks = [];
  for (const entry of entries) {
    const body = Buffer.from(entry.body || ''), header = Buffer.alloc(512);
    header.write(entry.name, 0, 100, 'utf8'); header.write('0000644\0', 100); header.write('0000000\0', 108); header.write('0000000\0', 116);
    header.write(body.length.toString(8).padStart(11, '0') + '\0', 124); header.write('00000000000\0', 136); header.fill(32, 148, 156);
    header[156] = (entry.type || '0').charCodeAt(0); header.write('ustar\0', 257); header.write('00', 263);
    const checksum = header.reduce((sum, byte) => sum + byte, 0); header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148);
    chunks.push(header, body, Buffer.alloc((512 - body.length % 512) % 512));
  }
  return zlib.gzipSync(Buffer.concat([...chunks, Buffer.alloc(1024)]));
}
function sha512(bytes) { return 'sha512-' + crypto.createHash('sha512').update(bytes).digest('base64'); }
function fakeBootstrap() {
  const archive = tar([{ name: 'package/package.json', body: JSON.stringify({ name: 'npm', version: setup.PINS.npm.version }) }, { name: 'package/bin/npm-cli.js', body: '// test npm CLI\n' }]);
  return { archive, npmSpec: { ...setup.PINS.npm, integrity: sha512(archive) } };
}
function mockDependencies(f, overrides = {}) {
  const browser = write(f.root, 'Trình duyệt có dấu/Edge.exe', 'test browser', 0o755), npm = write(f.root, 'node_modules/npm/bin/npm-cli.js', '// npm');
  const calls = [], counts = { npm: 0, launches: 0, closed: 0 };
  const dependencies = {
    env: { PATH: '', NPM_TOKEN: 'must-not-forward', NODE_AUTH_TOKEN: 'must-not-forward', NODE_OPTIONS: '--require unwanted', npm_config_registry: 'https://untrusted.invalid' },
    findNpmCli: () => npm,
    loadModule: folder => {
      if (folder.endsWith('ffmpeg-static')) return path.join(folder, 'ffmpeg.exe');
      return { launch: async options => { counts.launches++; assert.equal(options.executablePath, fs.realpathSync(browser)); return { newPage: async () => ({ setViewport: async () => {}, setContent: async () => {}, screenshot: async () => Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]), close: async () => {} }), close: async () => { counts.closed++; } }; } };
    },
    spawnSync: (binary, args, options = {}) => {
      calls.push({ binary, args, options });
      if (args[1] === 'install') {
        counts.npm++; const stage = args[args.indexOf('--prefix') + 1];
        const packages = {};
        for (const name of ['puppeteer-core', ...(args.some(value => value.startsWith('ffmpeg-static@')) ? ['ffmpeg-static'] : [])]) {
          write(stage, `node_modules/${name}/package.json`, JSON.stringify({ name, version: setup.PINS[name].version }));
          write(stage, `node_modules/${name}/index.js`, 'module.exports = {};');
          if (name === 'ffmpeg-static') write(stage, `node_modules/${name}/ffmpeg.exe`, 'fake executable', 0o755);
          packages[`node_modules/${name}`] = { version: setup.PINS[name].version, integrity: setup.PINS[name].integrity, resolved: `https://registry.npmjs.org/${name}/-/${name}-${setup.PINS[name].version}.tgz` };
        }
        write(stage, 'package-lock.json', JSON.stringify({ lockfileVersion: 3, packages }));
        return { status: 0, stdout: 'installed', stderr: '' };
      }
      if (args.includes('-version')) return { status: 0, stdout: 'ffmpeg version 7.0 test', stderr: '' };
      return { status: 0, stdout: setup.PINS.npm.version + '\n', stderr: '' };
    },
    ...overrides
  };
  return { dependencies, browser, npm, calls, counts };
}

test('probe defaults to no installation, no network, no runtime directory', async t => {
  const f = fixture(t); let network = false;
  const result = await setup.main(['--workspace', f.workspace, '--probe'], { env: { PATH: '' }, fetch: async () => { network = true; throw Error('unexpected'); }, findNpmCli: () => { throw Error('probe must not find/install npm'); } });
  assert.equal(result.mode, 'probe'); assert.equal(result.ready, false); assert.equal(result.downloads, false); assert.equal(network, false); assert.equal(fs.existsSync(f.runtime), false);
});
test('actual host probe runs without installing or writing customer files', async t => {
  const f = fixture(t); const result = await setup.main(['--workspace', f.workspace, '--probe']);
  assert.equal(result.installed, false); assert.equal(result.checks.browserModule, false); assert.equal(result.ready, false); assert.equal(fs.existsSync(f.runtime), false);
});
test('workspace and mutually exclusive mode arguments are enforced', async t => {
  const f = fixture(t);
  assert.throws(() => setup.parse(['--install', '--probe']), /--probe/);
  await assert.rejects(() => setup.setup({ workspace: 'relative', install: true }), error => error.code === 'WORKSPACE_REQUIRED');
  await assert.rejects(() => setup.setup({ workspace: path.join(f.root, 'missing') }), error => error.code === 'WORKSPACE_MISSING');
});
test('automatic browser discovery handles standard Windows Edge paths with spaces/Unicode', t => {
  const f = fixture(t); const programFiles = path.join(f.root, 'Program Files Có Dấu');
  const edge = write(programFiles, 'Microsoft/Edge/Application/msedge.exe', 'fake', 0o755);
  assert.equal(setup.findBrowser(null, { ProgramFiles: programFiles, PATH: '' }, 'win32'), fs.realpathSync(edge));
  assert.equal(setup.findBrowser(edge, { PATH: '' }), fs.realpathSync(edge));
});
test('npm discovery calls an installed CLI with Node and argument arrays, never a shell launcher', t => {
  const f = fixture(t); const node = write(f.root, 'Node có dấu/node.exe', '', 0o755);
  const cli = write(path.dirname(node), 'node_modules/npm/bin/npm-cli.js', '// npm'); write(path.dirname(node), 'node_modules/npm/package.json', JSON.stringify({ name: 'npm', version: '10.9.9' }));
  let called = false;
  const found = setup.findNpmCli({ node, platform: 'win32', env: { PATH: '' } }, { spawnSync: (binary, args, options) => { called = true; assert.equal(binary, node); assert.deepEqual(args, [cli, '--version']); assert.ok(!options.shell); return { status: 0, stdout: '10.9.9\n' }; } });
  assert.equal(found, fs.realpathSync(cli)); assert.equal(called, true);
  assert.equal(setup.findNpmCli({ node: path.join(f.root, 'missing/node.exe'), platform: 'win32', env: { PATH: '' } }), null);
});
test('verified bootstrap extracts only npm into a new isolated stage and reuses receipt', async t => {
  const f = fixture(t); fs.mkdirSync(f.runtime, { recursive: true }); const { archive, npmSpec } = fakeBootstrap(); let downloads = 0;
  const cli = await setup.bootstrapNpm(f.workspace, f.runtime, { npmSpec, fetch: async url => { downloads++; assert.equal(url, setup.PINS.npm.tarball); return archive; } });
  assert.ok(cli.startsWith(f.runtime)); assert.equal(JSON.parse(fs.readFileSync(path.join(path.dirname(path.dirname(cli)), 'package.json'))).name, 'npm');
  assert.equal(await setup.bootstrapNpm(f.workspace, f.runtime, { npmSpec, fetch: async () => { throw Error('must not download twice'); } }), cli); assert.equal(downloads, 1);
});
test('SHA512 mismatch aborts before extraction or executable creation', async t => {
  const f = fixture(t); fs.mkdirSync(f.runtime, { recursive: true }); const { archive } = fakeBootstrap();
  await assert.rejects(() => setup.bootstrapNpm(f.workspace, f.runtime, { fetch: async () => archive }), error => error.code === 'INTEGRITY_MISMATCH');
  assert.deepEqual(fs.readdirSync(f.runtime), []);
});
test('tar extractor rejects traversal, absolute/drive paths, symlinks and hardlinks', t => {
  const f = fixture(t);
  for (const [index, entry] of [{ name: 'package/../escaped.txt', body: 'bad' }, { name: '/absolute.txt', body: 'bad' }, { name: 'package/C:/drive.txt', body: 'bad' }, { name: 'package/link', type: '2' }, { name: 'package/hardlink', type: '1' }].entries()) {
    assert.throws(() => setup.extractTarGz(tar([entry]), path.join(f.root, 'extract-' + index)), error => ['TAR_PATH', 'TAR_LINK'].includes(error.code));
  }
  assert.equal(fs.existsSync(path.join(f.root, 'escaped.txt')), false);
});
test('tar extraction preserves Unicode and rejects corrupt/truncated archives', t => {
  const f = fixture(t); const archive = tar([{ name: 'package/Tài liệu tiếng Việt.txt', body: 'Nội dung' }]);
  const destination = path.join(f.root, 'Giải nén có dấu'); assert.equal(setup.extractTarGz(archive, destination), 1); assert.equal(fs.readFileSync(path.join(destination, 'Tài liệu tiếng Việt.txt'), 'utf8'), 'Nội dung');
  const unpacked = zlib.gunzipSync(archive); unpacked[10] ^= 1;
  assert.throws(() => setup.extractTarGz(zlib.gzipSync(unpacked), path.join(f.root, 'corrupt')), error => error.code === 'TAR_INVALID');
  assert.throws(() => setup.extractTarGz(zlib.gzipSync(zlib.gunzipSync(archive).subarray(0, 1024)), path.join(f.root, 'truncated')), error => error.code === 'TAR_INVALID');
});
test('bootstrap rejects off-registry URLs and unsafe redirects', async t => {
  const f = fixture(t); fs.mkdirSync(f.runtime, { recursive: true });
  assert.throws(() => setup.registryUrl('http://registry.npmjs.org/npm.tgz'), error => error.code === 'UNTRUSTED_DOWNLOAD');
  assert.throws(() => setup.registryUrl('https://registry.npmjs.org.evil.invalid/npm.tgz'), error => error.code === 'UNTRUSTED_DOWNLOAD');
  await assert.rejects(() => setup.bootstrapNpm(f.workspace, f.runtime, { npmSpec: { ...setup.PINS.npm, tarball: 'https://evil.invalid/npm.tgz' } }), error => error.code === 'UNTRUSTED_DOWNLOAD');
});
test('install creates verified renderer config in Unicode workspace and repeated install skips npm', async t => {
  const f = fixture(t); const mock = mockDependencies(f);
  const result = await setup.setup({ workspace: f.workspace, browserExecutable: mock.browser, install: true }, mock.dependencies);
  assert.equal(result.ready, true); assert.equal(result.changed, true); assert.equal(mock.counts.npm, 1); assert.equal(mock.counts.launches, 1); assert.equal(mock.counts.closed, 1);
  assert.ok(result.config.browserModule.startsWith(f.runtime)); assert.ok(result.config.ffmpeg.startsWith(f.runtime)); assert.equal(result.config.browserExecutable, fs.realpathSync(mock.browser));
  assert.deepEqual(JSON.parse(fs.readFileSync(result.configPath)), result.config);
  const invocation = mock.calls.find(call => call.args[1] === 'install'); assert.equal(invocation.binary, process.execPath); assert.ok(!invocation.options.shell); assert.ok(invocation.args.includes('puppeteer-core@24.43.1')); assert.ok(invocation.args.includes('ffmpeg-static@5.3.0'));
  assert.equal(invocation.options.env.NPM_TOKEN, undefined); assert.equal(invocation.options.env.NODE_AUTH_TOKEN, undefined); assert.equal(invocation.options.env.NODE_OPTIONS, undefined); assert.equal(invocation.options.env.npm_config_registry, 'https://registry.npmjs.org/'); assert.equal(invocation.options.env.PUPPETEER_SKIP_DOWNLOAD, 'true');
  const repeated = await setup.setup({ workspace: f.workspace, install: true }, mock.dependencies); assert.equal(repeated.changed, false); assert.equal(mock.counts.npm, 1); assert.equal(mock.counts.launches, 2);
  const probe = await setup.setup({ workspace: f.workspace }, mock.dependencies); assert.equal(probe.ready, true); assert.equal(probe.browserLaunch, 'not_probed'); assert.equal(mock.counts.launches, 2);
});
test('missing npm is bootstrapped automatically with verified mocked registry data', async t => {
  const f = fixture(t); const mock = mockDependencies(f); const { archive, npmSpec } = fakeBootstrap(); let downloads = 0;
  const result = await setup.setup({ workspace: f.workspace, browserExecutable: mock.browser, install: true }, { ...mock.dependencies, findNpmCli: () => null, npmSpec, fetch: async () => { downloads++; return archive; } });
  assert.equal(result.ready, true); assert.equal(downloads, 1); const command = mock.calls.find(call => call.args[1] === 'install'); assert.ok(command.args[0].startsWith(path.join(f.runtime, 'npm-10.9.9')));
});
test('missing npm plus unavailable registry returns actionable failure without claiming ready', async t => {
  const f = fixture(t); const mock = mockDependencies(f);
  await assert.rejects(() => setup.setup({ workspace: f.workspace, browserExecutable: mock.browser, install: true }, { ...mock.dependencies, findNpmCli: () => null, fetch: async () => { throw Error('network offline'); } }), error => error.code === 'NPM_BOOTSTRAP_DOWNLOAD_FAILED');
  assert.equal(fs.existsSync(path.join(f.runtime, 'renderer.json')), false); assert.equal(fs.existsSync(path.join(f.runtime, '.setup-renderer.lock')), false);
});
test('npm failure does not leak subprocess output or publish a ready config', async t => {
  const f = fixture(t); const mock = mockDependencies(f);
  await assert.rejects(() => setup.setup({ workspace: f.workspace, browserExecutable: mock.browser, install: true }, { ...mock.dependencies, spawnSync: () => ({ status: 1, stderr: 'secret-token must-not-leak' }) }), error => error.code === 'NPM_INSTALL_FAILED' && !error.message.includes('secret-token'));
  assert.equal(fs.existsSync(path.join(f.runtime, 'renderer.json')), false); assert.equal(fs.existsSync(path.join(f.runtime, '.setup-renderer.lock')), false);
});
test('a mismatched dependency integrity or non-registry resolution never passes verification', t => {
  const f = fixture(t), stage = path.join(f.root, 'stage');
  write(stage, 'package-lock.json', JSON.stringify({ packages: { 'node_modules/puppeteer-core': { version: setup.PINS['puppeteer-core'].version, integrity: 'sha512-bad', resolved: 'https://registry.npmjs.org/puppeteer-core/-/puppeteer-core-24.43.1.tgz' } } }));
  assert.throws(() => setup.verifyLock(stage, false), error => error.code === 'DEPENDENCY_INTEGRITY');
  write(stage, 'package-lock.json', JSON.stringify({ packages: { 'node_modules/puppeteer-core': { version: setup.PINS['puppeteer-core'].version, integrity: setup.PINS['puppeteer-core'].integrity, resolved: 'https://registry.npmjs.org/puppeteer-core/-/puppeteer-core-24.43.1.tgz' }, 'node_modules/transitive-test': { resolved: 'https://untrusted.invalid/package.tgz' } } }));
  assert.throws(() => setup.verifyLock(stage, false), error => error.code === 'UNTRUSTED_DOWNLOAD');
});
test('browser failure, invalid PNG or failed ffmpeg never produce renderer.json', async t => {
  for (const scenario of ['launch', 'png', 'ffmpeg']) {
    const f = fixture(t); const mock = mockDependencies(f);
    const dependencies = { ...mock.dependencies };
    if (scenario === 'ffmpeg') { const original = dependencies.spawnSync; dependencies.spawnSync = (binary, args, options) => args.includes('-version') ? { status: 1, stdout: '' } : original(binary, args, options); }
    else {
      const original = dependencies.loadModule;
      dependencies.loadModule = folder => folder.endsWith('ffmpeg-static') ? original(folder) : { launch: async () => { if (scenario === 'launch') throw Error('cannot launch'); return { newPage: async () => ({ setViewport: async () => {}, setContent: async () => {}, screenshot: async () => Buffer.from('not png'), close: async () => {} }), close: async () => {} }; } };
    }
    await assert.rejects(() => setup.setup({ workspace: f.workspace, browserExecutable: mock.browser, install: true }, dependencies), error => ['BROWSER_LAUNCH_FAILED', 'BROWSER_RENDER_FAILED', 'FFMPEG_FAILED'].includes(error.code));
    assert.equal(fs.existsSync(path.join(f.runtime, 'renderer.json')), false);
  }
});
test('missing browser does not download Chrome or install dependencies', async t => {
  const f = fixture(t); let called = false;
  await assert.rejects(() => setup.setup({ workspace: f.workspace, install: true }, { env: { PATH: '' }, fetch: async () => { called = true; }, findNpmCli: () => { called = true; } }), error => error.code === 'BROWSER_NOT_FOUND');
  assert.equal(called, false); assert.equal(fs.existsSync(f.runtime), false);
});
test('data junctions and foreign dependency folders are refused without writes', async t => {
  const f = fixture(t); const outside = path.join(f.root, 'outside'); fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(f.workspace, 'freeup-content-gon-lab-data'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(() => setup.setup({ workspace: f.workspace }), error => error.code === 'UNSAFE_LINK'); assert.deepEqual(fs.readdirSync(outside), []);
  const other = fixture(t); fs.mkdirSync(path.join(other.runtime, 'renderer-deps'), { recursive: true });
  await assert.rejects(() => setup.setup({ workspace: other.workspace }), error => error.code === 'RUNTIME_OWNERSHIP');
});
