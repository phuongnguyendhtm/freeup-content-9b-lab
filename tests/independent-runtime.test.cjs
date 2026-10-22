'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const installer = require('../install.cjs');
const menu = require('../package/skills/freeup-content-gon-lab/scripts/contentlab.cjs');
const sheet = require('../package/skills/freeup-content-gon-lab/scripts/sheet.cjs');
function temp(t) {
  const parent = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(parent, 'freeup-independent-'));
  t.after(() => { assert.ok(path.relative(parent, root).startsWith('freeup-independent-')); fs.rmSync(root, { recursive: true, force: true }); });
  const workspace = path.join(root, 'Khách có dấu', 'Workspace lab'); fs.mkdirSync(workspace, { recursive: true });
  return { root, workspace };
}
function origin(id){const r=sheet.template();return {templateId:r.templateId,revision:r.revision,xlsxSha256:r.xlsxSha256,method:'xlsx_import',resultSpreadsheetId:id,verified:true};}
function metadata() { return { templateOrigin:origin('independent-sheet'), spreadsheetId: 'independent-sheet', businessId: 'independent-business', sheets: sheet.schema().tabs.map((tab, index) => ({ properties: { title: tab.title, sheetId: index, hidden: false } })), headers: Object.fromEntries(sheet.schema().tabs.map(tab => [tab.key, tab.headers])) }; }
function call(helper, workspace, command, input) {
  const file = path.join(workspace, 'input.json');
  if (input) fs.writeFileSync(file, JSON.stringify(input));
  return helper.main([command, '--workspace', workspace, ...(input ? ['--input', file] : [])]);
}
function junction(target, link) { fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir'); }

test('fresh installed helper finds menu, catalogs and sheet schema; uninstall preserves customer files', t => {
  const f = temp(t);
  const report = installer.install({ source: path.resolve(__dirname, '..'), workspace: f.workspace });
  const entry = path.join(report.target, 'scripts', 'contentlab.cjs');
  function cli(args) {
    const result = spawnSync(process.execPath, [entry, ...args, '--workspace', f.workspace], { encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, result.stderr); return JSON.parse(result.stdout);
  }
  const doctor = cli(['doctor', '--ffmpeg', path.join(f.root, 'missing-ffmpeg')]);
  assert.equal(doctor.ok, true); assert.equal(doctor.render.ffmpeg, false);
  const opened = cli(['menu', '--session', 'fresh-install']);
  assert.equal(opened.items.length, 9); assert.equal(opened.items[1].label, 'Bài đăng kèm sản phẩm');
  assert.equal(opened.startsProduction, false); assert.ok(fs.existsSync(opened.mediaPath));
  assert.equal(cli(['select', '--session', 'fresh-install', '--value', '2']).selection.key, 'product_post');
  assert.equal(cli(['sheet', 'schema']).schema.tabs.length, 3);
  const customer = path.join(f.workspace, 'Nội dung của tôi', 'Nội dung đã tạo', 'Bài viết.txt'); fs.mkdirSync(path.dirname(customer), { recursive: true }); fs.writeFileSync(customer, 'Nội dung khách');
  assert.equal(installer.install({ source: path.resolve(__dirname, '..'), workspace: f.workspace, uninstallLab: true }).status, 'uninstalled');
  assert.equal(fs.readFileSync(customer, 'utf8'), 'Nội dung khách'); assert.ok(fs.existsSync(opened.mediaPath));
});

test('menu selection accepts uppercase Vietnamese names containing Đ', t => {
  const f = temp(t);
  const result = menu.main(['select', '--workspace', f.workspace, '--value', 'BÀI ĐĂNG KÈM SẢN PHẨM']);
  assert.equal(result.selection.key, 'product_post');
});
test('binding requires actual header readback for all three tabs', t => {
  const f = temp(t); const meta = metadata(); delete meta.headers;
  assert.throws(() => call(sheet, f.workspace, 'bind', meta), /header|cột|đọc/i);
});
test('runtime menu and sheet state never write through a data-directory junction', t => {
  const f = temp(t); const external = path.join(f.root, 'outside'); fs.mkdirSync(external);
  junction(external, path.join(f.workspace, 'freeup-content-gon-lab-data'));
  assert.throws(() => menu.main(['menu', '--workspace', f.workspace]), /liên kết|symlink|junction|workspace/i);
  assert.throws(() => sheet.main(['status', '--workspace', f.workspace]), /liên kết|symlink|junction|workspace/i);
  assert.deepEqual(fs.readdirSync(external), []);
});
test('sheet snapshots cannot be read through a junction outside the lab workspace', t => {
  const f = temp(t); const meta = metadata(); call(sheet, f.workspace, 'bind', meta);
  const external = path.join(f.root, 'outside'); fs.mkdirSync(external);
  fs.writeFileSync(path.join(external, 'snapshot.json'), JSON.stringify({ spreadsheetId: meta.spreadsheetId, businessId: meta.businessId, readAt: new Date().toISOString(), rows: {} }));
  junction(external, path.join(f.workspace, 'linked-input'));
  assert.throws(() => sheet.main(['ingest', '--workspace', f.workspace, '--input', 'linked-input/snapshot.json']), /liên kết|symlink|junction|workspace/i);
});
test('a far-future snapshot timestamp cannot bypass freshness validation', t => {
  const f = temp(t); const meta = metadata(); call(sheet, f.workspace, 'bind', meta);
  assert.throws(() => call(sheet, f.workspace, 'ingest', { spreadsheetId: meta.spreadsheetId, businessId: meta.businessId, readAt: '2100-01-01T00:00:00.000Z', rows: {} }), /thời|cũ|mới|hợp lệ|future/i);
});
