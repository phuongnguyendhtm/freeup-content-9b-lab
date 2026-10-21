'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { spawnSync } = require('node:child_process');
const { install, parseArgs, discoverWorkspace, inventory, PACKAGE_ID, OWNER_FILE } = require('../install.cjs');
const { buildRelease, crc32 } = require('../scripts/build-release.cjs');
const digest = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

function write(root, relative, content) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}
function png() {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(2, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 2;
  function chunk(type, data) { const name = Buffer.from(type); const header = Buffer.alloc(4); header.writeUInt32BE(data.length); const tail = Buffer.alloc(4); tail.writeUInt32BE(crc32(Buffer.concat([name, data]))); return Buffer.concat([header, name, data, tail]); }
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.from([0, 255, 255, 255, 0, 128, 64]))), chunk('IEND', Buffer.alloc(0))]);
}
function fixture(t) {
  const parent = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(parent, 'freeup-installer-test-'));
  t.after(() => {
    const relative = path.relative(parent, root);
    assert.ok(relative.startsWith('freeup-installer-test-') && !relative.includes(path.sep));
    fs.rmSync(root, { recursive: true, force: true });
  });
  const source = path.join(root, 'Bộ cài có dấu');
  const workspace = path.join(root, 'Khách hàng thử', 'Workspace lab');
  fs.mkdirSync(source, { recursive: true }); fs.mkdirSync(workspace, { recursive: true });
  write(source, 'package.json', JSON.stringify({ name: PACKAGE_ID, version: '0.1.0' }));
  write(source, `package/skills/${PACKAGE_ID}/SKILL.md`, '---\nname: freeup-content-gon-lab\ndescription: test fixture\n---\nLab only.\n');
  write(source, `package/skills/${PACKAGE_ID}/scripts/contentlab.cjs`, 'module.exports = { version: 1 };\n');
  write(source, 'templates/knowledge/03-san-pham-va-dich-vu.md', '# Sản phẩm và dịch vụ\n');
  write(source, 'templates/knowledge/Mẫu tiếng Việt.md', '# Dữ liệu thử\n');
  write(source, 'templates/sheets/content-sheet-schema.json', '{"tabs":3}');
  for (const name of ['menu-catalog', 'knowledge-catalog', 'customer-paths']) write(source, `onboarding/${name}.json`, JSON.stringify({ schema_version: 1, package_id: PACKAGE_ID }));
  write(source, 'assets/menu/he-thong-content-ngang-v2.png', png());
  write(source, 'gift-manifest.json', JSON.stringify({ schema_version: 1, package_id: PACKAGE_ID, version: '0.1.0' }));
  for (const file of ['install.cjs', 'bootstrap.ps1', 'bootstrap.sh', 'README.md']) write(source, file, `fixture ${file}\n`);
  write(source, 'docs/Guide.md', '# Hướng dẫn công khai\n');
  return { root, source, workspace, target: path.join(workspace, 'skills', PACKAGE_ID), receipt: path.join(workspace, 'freeup-content-gon-lab-data', 'install', 'receipt.json') };
}
function extractZip(archive, destination) {
  const bytes = fs.readFileSync(archive);
  let offset = 0;
  const names = [];
  while (bytes.readUInt32LE(offset) === 0x04034b50) {
    const flags = bytes.readUInt16LE(offset + 6), method = bytes.readUInt16LE(offset + 8);
    const compressedLength = bytes.readUInt32LE(offset + 18), nameLength = bytes.readUInt16LE(offset + 26), extra = bytes.readUInt16LE(offset + 28);
    assert.equal(flags & 0x0800, 0x0800);
    const name = bytes.toString('utf8', offset + 30, offset + 30 + nameLength);
    assert.ok(!name.startsWith('/') && !name.split('/').includes('..'));
    const start = offset + 30 + nameLength + extra;
    const compressed = bytes.subarray(start, start + compressedLength);
    const body = method === 8 ? zlib.inflateRawSync(compressed) : compressed;
    assert.equal(crc32(body), bytes.readUInt32LE(offset + 14));
    write(destination, name, body); names.push(name);
    offset = start + compressedLength;
  }
  assert.equal(bytes.readUInt32LE(offset), 0x02014b50);
  return names;
}

test('argument parser supports safe install, dry-run and uninstall flags', () => {
  assert.deepEqual(parseArgs(['--workspace', '/tmp/lab', '--dry-run', '--uninstall-lab']), { workspace: '/tmp/lab', dryRun: true, uninstallLab: true });
  assert.throws(() => parseArgs(['--workspace']), /Thiếu/);
  assert.throws(() => parseArgs(['--force']), /không hỗ trợ/);
});
test('dry-run checks payload but writes no workspace file', t => {
  const f = fixture(t);
  const result = install({ ...f, dryRun: true });
  assert.equal(result.status, 'dry-run'); assert.equal(result.changed, false);
  assert.deepEqual(fs.readdirSync(f.workspace), []);
});
test('install verifies a SHA256 inventory and Unicode supplemental assets', t => {
  const f = fixture(t); const result = install(f);
  assert.equal(result.status, 'files-installed'); assert.equal(result.verified, true); assert.equal(result.activation, 'not_verified');
  assert.equal(result.capabilities.local_png, 'not_verified');
  assert.ok(fs.existsSync(path.join(f.target, 'assets/knowledge/Mẫu tiếng Việt.md')));
  assert.ok(fs.existsSync(path.join(f.target, 'assets/onboarding/menu-catalog.json')));
  assert.ok(fs.existsSync(path.join(f.target, 'assets/sheets/content-sheet-schema.json')));
  assert.ok(fs.existsSync(path.join(f.target, 'assets/menu/he-thong-content-ngang-v2.png')));
  assert.deepEqual(result.files, inventory(f.target));
  assert.equal(result.inventory_sha256, digest(JSON.stringify(result.files)));
  assert.deepEqual(JSON.parse(fs.readFileSync(f.receipt)), result);
});
test('reinstall is idempotent and preserves customer data', t => {
  const f = fixture(t); install(f);
  const customer = write(f.workspace, 'Nội dung của tôi/Nội dung đã tạo/2026-10-22/Bài viết - Thử có dấu/Bài viết.txt', 'Dữ liệu khách');
  write(f.workspace, 'freeup-content-gon-lab-data/state/customer.json', '{"keep":true}');
  const result = install(f);
  assert.equal(result.changed, false); assert.equal(result.backup, null);
  assert.equal(fs.readFileSync(customer, 'utf8'), 'Dữ liệu khách');
  assert.equal(fs.readdirSync(path.dirname(f.target)).length, 1);
});
test('upgrade archives owned code and previous receipt, preserves customer data', t => {
  const f = fixture(t); const old = install(f);
  const customer = write(f.workspace, 'freeup-content-gon-lab-data/customer.json', '{"keep":true}');
  write(f.source, 'package.json', JSON.stringify({ name: PACKAGE_ID, version: '0.2.0' }));
  write(f.source, `package/skills/${PACKAGE_ID}/scripts/contentlab.cjs`, 'module.exports = { version: 2 };\n');
  const result = install(f);
  assert.equal(result.version, '0.2.0'); assert.equal(result.changed, true);
  assert.equal(JSON.parse(fs.readFileSync(path.join(result.backup, OWNER_FILE))).version, '0.1.0');
  assert.equal(JSON.parse(fs.readFileSync(path.join(path.dirname(result.backup), 'receipt.json'))).inventory_sha256, old.inventory_sha256);
  assert.equal(fs.readFileSync(customer, 'utf8'), '{"keep":true}');
});
test('a foreign skill is never overwritten or given an owner marker', t => {
  const f = fixture(t); const foreign = write(f.target, 'SKILL.md', 'Someone else owns this.');
  assert.throws(() => install(f), /không thuộc/);
  assert.equal(fs.readFileSync(foreign, 'utf8'), 'Someone else owns this.');
  assert.equal(fs.existsSync(path.join(f.target, OWNER_FILE)), false);
  assert.equal(fs.existsSync(f.receipt), false);
});
test('foreign receipt and relative workspace fail before mutation', t => {
  const f = fixture(t);
  assert.throws(() => install({ ...f, workspace: 'relative-lab' }), /tuyệt đối/);
  write(f.workspace, 'freeup-content-gon-lab-data/install/receipt.json', JSON.stringify({ package_id: 'other' }));
  assert.throws(() => install(f), /Receipt/);
  assert.equal(fs.existsSync(f.target), false);
});
test('source links cannot escape the release tree', t => {
  const f = fixture(t);
  const external = path.join(f.root, 'outside'); fs.mkdirSync(external); write(external, 'outside.txt', 'outside');
  try { fs.symlinkSync(external, path.join(f.source, 'package/skills', PACKAGE_ID, 'escape'), process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) { if (error.code === 'EPERM') return t.skip('Symlink creation unavailable on this host.'); throw error; }
  assert.throws(() => install(f), /liên kết/);
  assert.deepEqual(fs.readdirSync(f.workspace), []);
});
test('target junction or symlink is refused without touching its destination', t => {
  const f = fixture(t); const external = path.join(f.root, 'outside'); fs.mkdirSync(external);
  write(external, 'keep.txt', 'keep'); fs.mkdirSync(path.dirname(f.target), { recursive: true });
  try { fs.symlinkSync(external, f.target, process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) { if (error.code === 'EPERM') return t.skip('Symlink creation unavailable on this host.'); throw error; }
  assert.throws(() => install(f), /liên kết/);
  assert.equal(fs.readFileSync(path.join(external, 'keep.txt'), 'utf8'), 'keep');
});
test('uninstall archives only owned skill, preserves outputs/data and is repeatable', t => {
  const f = fixture(t); install(f);
  const output = write(f.workspace, 'Nội dung của tôi/Nội dung đã tạo/Bài viết.txt', 'customer');
  const state = write(f.workspace, 'freeup-content-gon-lab-data/customer.json', 'customer state');
  const result = install({ ...f, uninstallLab: true });
  assert.equal(result.status, 'uninstalled'); assert.equal(result.verified, true); assert.equal(fs.existsSync(f.target), false);
  assert.ok(fs.existsSync(path.join(result.backup, 'SKILL.md')));
  assert.equal(fs.readFileSync(output, 'utf8'), 'customer'); assert.equal(fs.readFileSync(state, 'utf8'), 'customer state');
  assert.equal(install({ ...f, uninstallLab: true }).changed, false);
  assert.equal(install(f).status, 'files-installed');
});
test('a live install lock blocks a second installer', t => {
  const f = fixture(t); write(f.workspace, 'freeup-content-gon-lab-data/install/.install.lock', 'existing lock');
  assert.throws(() => install(f), /khóa/);
  assert.equal(fs.existsSync(f.target), false);
});
test('auto discovery ignores main and only chooses an unambiguous lab agent', t => {
  const f = fixture(t); const main = path.join(f.root, 'main'); fs.mkdirSync(main);
  const config = write(f.root, 'openclaw.json', JSON.stringify({ secret: 'not-printed', agents: { list: [{ id: 'main', workspace: main }, { id: 'content-gon-test', workspace: f.workspace }] } }));
  const env = { OPENCLAW_CONFIG_PATH: config, HOME: path.join(f.root, 'empty-home') };
  assert.equal(discoverWorkspace(env), fs.realpathSync(f.workspace));
  write(f.root, 'openclaw.json', JSON.stringify({ agents: { list: [{ id: 'main', workspace: main }] } }));
  assert.throws(() => discoverWorkspace(env), /duy nhất/);
  write(f.root, 'openclaw.json', JSON.stringify({ agents: { list: [{ id: 'content-gon-test', workspace: f.workspace }, { id: PACKAGE_ID, workspace: main }] } }));
  assert.throws(() => discoverWorkspace(env), /duy nhất/);
});
test('invalid explicit environment workspace cannot silently fall back', t => {
  const f = fixture(t);
  assert.throws(() => discoverWorkspace({ FREEUP_CONTENT_LAB_WORKSPACE: path.join(f.root, 'missing'), HOME: f.root }), /FREEUP_CONTENT_LAB_WORKSPACE/);
});
test('failed atomic upgrade restores previous skill and receipt', t => {
  const f = fixture(t); const old = install(f); const before = fs.readFileSync(f.receipt, 'utf8');
  write(f.source, 'package.json', JSON.stringify({ name: PACKAGE_ID, version: '0.2.0' }));
  const rename = fs.renameSync;
  fs.renameSync = function (from, to) { if (String(from).includes('-stage-') && to === f.target) { const error = new Error('simulated atomic swap failure'); error.code = 'EACCES'; throw error; } return rename.apply(this, arguments); };
  try { assert.throws(() => install(f), /simulated atomic/); }
  finally { fs.renameSync = rename; }
  assert.deepEqual(inventory(f.target), old.files);
  assert.equal(fs.readFileSync(f.receipt, 'utf8'), before);
  assert.equal(fs.existsSync(path.join(path.dirname(f.receipt), '.install.lock')), false);
});
test('wrong package and non-image menu fail before any workspace change', t => {
  const f = fixture(t);
  write(f.source, 'package.json', JSON.stringify({ name: 'foreign', version: '0.1.0' }));
  assert.throws(() => install(f), /package.json/);
  write(f.source, 'package.json', JSON.stringify({ name: PACKAGE_ID, version: '0.1.0' }));
  write(f.source, 'assets/menu/he-thong-content-ngang-v2.png', 'not an image');
  assert.throws(() => install(f), /PNG ngang/);
  assert.deepEqual(fs.readdirSync(f.workspace), []);
});
test('receipt commit failure on first install restores the absent skill state', t => {
  const f = fixture(t); const rename = fs.renameSync; let failed = false;
  fs.renameSync = function (from, to) {
    if (!failed && to === f.receipt && String(from).includes('receipt.json.tmp-')) { failed = true; throw new Error('simulated receipt commit failure'); }
    return rename.apply(this, arguments);
  };
  try { assert.throws(() => install(f), /simulated receipt/); }
  finally { fs.renameSync = rename; }
  assert.equal(fs.existsSync(f.target), false); assert.equal(fs.existsSync(f.receipt), false);
  assert.equal(install(f).verified, true);
});
test('receipt commit failure on upgrade restores old code and receipt', t => {
  const f = fixture(t); const old = install(f); const before = fs.readFileSync(f.receipt, 'utf8');
  write(f.source, 'package.json', JSON.stringify({ name: PACKAGE_ID, version: '0.2.0' }));
  const rename = fs.renameSync; let failed = false;
  fs.renameSync = function (from, to) {
    if (!failed && to === f.receipt && String(from).includes('receipt.json.tmp-')) { failed = true; throw new Error('simulated receipt commit failure'); }
    return rename.apply(this, arguments);
  };
  try { assert.throws(() => install(f), /simulated receipt/); }
  finally { fs.renameSync = rename; }
  assert.deepEqual(inventory(f.target), old.files); assert.equal(fs.readFileSync(f.receipt, 'utf8'), before);
});
test('release ZIP is deterministic, UTF-8, clean, extractable and installable', t => {
  const f = fixture(t);
  write(f.source, 'tests/fixtures/private-customer.json', 'must not ship');
  write(f.source, '.env', 'must not ship');
  write(f.source, 'assets/menu/he-thong-content-ngang-v1.png', 'old menu');
  write(f.source, 'templates/sheets/content-sheet-schema.json', '{"tabs":3}');
  const first = buildRelease({ root: f.source, output: path.join(f.root, 'dist1') });
  const second = buildRelease({ root: f.source, output: path.join(f.root, 'dist2') });
  assert.equal(first.sha256, second.sha256); assert.equal(first.published, false);
  const extracted = path.join(f.root, 'Giải nén có dấu'); const names = extractZip(first.archive, extracted);
  assert.ok(names.some(name => name.endsWith('Mẫu tiếng Việt.md')));
  assert.ok(names.some(name => name.endsWith('templates/sheets/content-sheet-schema.json')));
  assert.ok(!names.some(name => /private-customer|\.env$|ngang-v1|node_modules/.test(name)));
  const extractedRoot = path.join(extracted, `${PACKAGE_ID}-0.1.0`);
  const result = install({ source: extractedRoot, workspace: f.workspace });
  assert.equal(result.release_manifest_verified, true); assert.equal(result.verified, true);
  assert.ok(fs.readFileSync(first.checksums, 'utf8').includes(first.sha256));
});
test('tampered extracted release is rejected before installation', t => {
  const f = fixture(t); const release = buildRelease({ root: f.source, output: path.join(f.root, 'dist') });
  const extracted = path.join(f.root, 'unpacked'); extractZip(release.archive, extracted);
  const source = path.join(extracted, `${PACKAGE_ID}-0.1.0`);
  write(source, `package/skills/${PACKAGE_ID}/scripts/contentlab.cjs`, 'tampered');
  assert.throws(() => install({ source, workspace: f.workspace }), /SHA256/);
  assert.deepEqual(fs.readdirSync(f.workspace), []);
});
test('unlisted new payload and traversal manifest are rejected', t => {
  const f = fixture(t); const release = buildRelease({ root: f.source, output: path.join(f.root, 'dist') });
  const extracted = path.join(f.root, 'unpacked'); extractZip(release.archive, extracted);
  const source = path.join(extracted, `${PACKAGE_ID}-0.1.0`);
  const extra = write(source, `package/skills/${PACKAGE_ID}/new.cjs`, 'new');
  assert.throws(() => install({ source, workspace: f.workspace }), /không được liệt kê/);
  fs.unlinkSync(extra);
  const manifest = JSON.parse(fs.readFileSync(path.join(source, 'release-manifest.json')));
  manifest.files.push({ path: '../escape', sha256: '0'.repeat(64), size: 0 });
  write(source, 'release-manifest.json', JSON.stringify(manifest));
  assert.throws(() => install({ source, workspace: f.workspace }), /không hợp lệ/);
});
test('release refuses private fixture directories inside the installed skill', t => {
  const f = fixture(t); write(f.source, `package/skills/${PACKAGE_ID}/fixtures/customer.json`, 'private');
  assert.throws(() => buildRelease({ root: f.source, output: path.join(f.root, 'dist') }), /không được đóng gói/);
});
test('CLI prints a verified dry-run report without leaking config fields', t => {
  const f = fixture(t);
  const config = write(f.root, 'config.json', JSON.stringify({ apiKey: 'fixture-secret-do-not-log', agents: { list: [{ id: 'content-gon-test', workspace: f.workspace }] } }));
  const result = spawnSync(process.execPath, [path.join(__dirname, '..', 'install.cjs'), '--source', f.source, '--dry-run'], { encoding: 'utf8', env: { ...process.env, FREEUP_CONTENT_LAB_WORKSPACE: '', OPENCLAW_CONFIG_PATH: config, OPENCLAW_STATE_DIR: '', APPDATA: '', HOME: path.join(f.root, 'empty-home'), USERPROFILE: path.join(f.root, 'empty-home') } });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, 'dry-run');
  assert.ok(!`${result.stdout}${result.stderr}`.includes('fixture-secret-do-not-log'));
});

function lockedRootRename(f, options = {}) {
  const original = fs.renameSync; let attempts = 0;
  fs.renameSync = function (from, to) {
    if (from === f.target && String(to).includes(`${path.sep}backups${path.sep}`)) {
      attempts++;
      if (!options.transient || attempts < 3) { const error = new Error('simulated Windows locked skill root'); error.code = options.code || 'EPERM'; throw error; }
    }
    if (options.failFile && to === path.join(f.target, options.failFile) && String(from).includes('.freeup-install-tmp-') && !options.failed) { options.failed = true; const error = new Error('simulated per-file update failure'); error.code = 'EIO'; throw error; }
    if (options.failReceipt && to === f.receipt && String(from).includes('receipt.json.tmp-') && !options.failed) { options.failed = true; const error = new Error('simulated in-place receipt failure'); error.code = 'EIO'; throw error; }
    return original.apply(this, arguments);
  };
  return { restore: () => { fs.renameSync = original; }, attempts: () => attempts };
}
function changedFixture(t) {
  const f = fixture(t);
  write(f.source, `package/skills/${PACKAGE_ID}/old/deprecated.cjs`, 'old owned file');
  const old = install(f), oldReceipt = fs.readFileSync(f.receipt, 'utf8');
  fs.unlinkSync(path.join(f.source, `package/skills/${PACKAGE_ID}/old/deprecated.cjs`));
  write(f.source, `package/skills/${PACKAGE_ID}/a-new.cjs`, 'new owned file');
  write(f.source, `package/skills/${PACKAGE_ID}/scripts/contentlab.cjs`, 'module.exports = { version: 2 };\n');
  write(f.source, 'package.json', JSON.stringify({ name: PACKAGE_ID, version: '0.2.0' }));
  return { ...f, old, oldReceipt };
}
test('transient Windows directory locks are retried before a normal atomic swap', t => {
  const f = changedFixture(t), mock = lockedRootRename(f, { transient: true }); let result;
  try { result = install({ ...f, platform: 'win32' }); } finally { mock.restore(); }
  assert.equal(mock.attempts(), 3); assert.equal(result.install_mode, 'directory-swap'); assert.equal(result.verified, true);
  assert.deepEqual(inventory(result.backup), f.old.files);
});
test('persistent Windows root lock uses verified per-file transaction and preserves all customer data', t => {
  const f = changedFixture(t);
  const customer = write(f.workspace, 'Nội dung của tôi/Nội dung đã tạo/Bài viết.txt', 'nội dung khách');
  const runtime = write(f.workspace, 'freeup-content-gon-lab-data/runtime/keep.json', '{"keep":true}');
  const mock = lockedRootRename(f, { code: 'EACCES' }); let result;
  try { result = install({ ...f, platform: 'win32' }); } finally { mock.restore(); }
  assert.equal(mock.attempts(), 3); assert.equal(result.install_mode, 'in-place-files'); assert.equal(result.verified, true); assert.equal(result.activation, 'not_verified');
  assert.ok(result.staged_source.startsWith(path.dirname(f.receipt) + path.sep)); assert.equal(fs.readdirSync(path.dirname(f.target)).length, 1);
  assert.deepEqual(inventory(result.backup), f.old.files); assert.deepEqual(inventory(f.target), result.files);
  assert.equal(fs.readFileSync(path.join(path.dirname(result.backup), 'receipt.json'), 'utf8'), f.oldReceipt);
  assert.equal(fs.existsSync(path.join(f.target, 'old/deprecated.cjs')), false); assert.ok(fs.existsSync(path.join(f.target, 'a-new.cjs')));
  assert.equal(fs.readFileSync(customer, 'utf8'), 'nội dung khách'); assert.equal(fs.readFileSync(runtime, 'utf8'), '{"keep":true}');
  const journal = JSON.parse(fs.readFileSync(path.join(path.dirname(result.backup), 'in-place-transaction.json'))); assert.equal(journal.state, 'committed');
  assert.equal(install(f).changed, false);
});
test('per-file failure under a locked root restores original files, removed files and exact receipt', t => {
  const f = changedFixture(t), mock = lockedRootRename(f, { failFile: 'scripts/contentlab.cjs' });
  try { assert.throws(() => install({ ...f, platform: 'win32' }), /simulated per-file/); } finally { mock.restore(); }
  assert.equal(mock.attempts(), 3); assert.deepEqual(inventory(f.target), f.old.files); assert.equal(fs.readFileSync(f.receipt, 'utf8'), f.oldReceipt);
  assert.ok(fs.existsSync(path.join(f.target, 'old/deprecated.cjs'))); assert.equal(fs.existsSync(path.join(f.target, 'a-new.cjs')), false);
  const backups = path.join(path.dirname(f.receipt), 'backups'); const journals = fs.readdirSync(backups).map(id => path.join(backups, id, 'in-place-transaction.json')).filter(file => fs.existsSync(file));
  assert.equal(JSON.parse(fs.readFileSync(journals[0])).state, 'rolled-back'); assert.equal(fs.existsSync(path.join(path.dirname(f.receipt), '.install.lock')), false);
});
test('receipt failure after locked-root update rolls back all code and the previous receipt', t => {
  const f = changedFixture(t), mock = lockedRootRename(f, { failReceipt: true });
  try { assert.throws(() => install({ ...f, platform: 'win32' }), /simulated in-place receipt/); } finally { mock.restore(); }
  assert.deepEqual(inventory(f.target), f.old.files); assert.equal(fs.readFileSync(f.receipt, 'utf8'), f.oldReceipt);
});
test('locked-root fallback refuses unknown files outside the previous ownership inventory', t => {
  const f = changedFixture(t), foreign = write(f.target, 'customer-note.txt', 'must preserve'), before = inventory(f.target), mock = lockedRootRename(f);
  try { assert.throws(() => install({ ...f, platform: 'win32' }), /chưa thuộc receipt/); } finally { mock.restore(); }
  assert.deepEqual(inventory(f.target), before); assert.equal(fs.readFileSync(foreign, 'utf8'), 'must preserve'); assert.equal(fs.readFileSync(f.receipt, 'utf8'), f.oldReceipt);
});
test('failed full backup leaves locked original tree untouched', t => {
  const f = changedFixture(t), mock = lockedRootRename(f), copy = fs.copyFileSync;
  fs.copyFileSync = function (from, to) {
    if (String(from).startsWith(f.target + path.sep) && String(to).includes(`${path.sep}backups${path.sep}`)) { const error = new Error('simulated backup copy failure'); error.code = 'EIO'; throw error; }
    return copy.apply(this, arguments);
  };
  try { assert.throws(() => install({ ...f, platform: 'win32' }), /simulated backup/); } finally { fs.copyFileSync = copy; mock.restore(); }
  assert.deepEqual(inventory(f.target), f.old.files); assert.equal(fs.readFileSync(f.receipt, 'utf8'), f.oldReceipt);
});
test('non-Windows permission failures and uninstall never use per-file fallback', t => {
  const f = changedFixture(t), mock = lockedRootRename(f);
  try { assert.throws(() => install({ ...f, platform: 'linux' }), /simulated Windows/); assert.equal(mock.attempts(), 1); } finally { mock.restore(); }
  assert.deepEqual(inventory(f.target), f.old.files);
  const uninstallMock = lockedRootRename(f);
  try { assert.throws(() => install({ ...f, platform: 'win32', uninstallLab: true }), /simulated Windows/); assert.equal(uninstallMock.attempts(), 1); } finally { uninstallMock.restore(); }
  assert.deepEqual(inventory(f.target), f.old.files); assert.equal(fs.readFileSync(f.receipt, 'utf8'), f.oldReceipt);
});
test('locked-root update handles owned file-directory shape changes without renaming root', t => {
  const f = fixture(t);
  write(f.source, `package/skills/${PACKAGE_ID}/to-directory`, 'old file'); write(f.source, `package/skills/${PACKAGE_ID}/to-file/old.cjs`, 'old nested file'); install(f);
  fs.unlinkSync(path.join(f.source, `package/skills/${PACKAGE_ID}/to-directory`));
  fs.rmSync(path.join(f.source, `package/skills/${PACKAGE_ID}/to-file`), { recursive: true });
  write(f.source, `package/skills/${PACKAGE_ID}/to-directory/new.cjs`, 'new nested file'); write(f.source, `package/skills/${PACKAGE_ID}/to-file`, 'new file');
  const mock = lockedRootRename(f); let result;
  try { result = install({ ...f, platform: 'win32' }); } finally { mock.restore(); }
  assert.equal(result.install_mode, 'in-place-files'); assert.equal(fs.readFileSync(path.join(f.target, 'to-directory/new.cjs'), 'utf8'), 'new nested file'); assert.equal(fs.readFileSync(path.join(f.target, 'to-file'), 'utf8'), 'new file');
});
