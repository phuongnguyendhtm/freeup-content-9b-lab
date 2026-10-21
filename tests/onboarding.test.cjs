'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { main } = require('../package/skills/freeup-content-gon-lab/scripts/onboarding.cjs');
const CORE = ['company.name', 'company.industry', 'company.usp', 'audience.identity', 'audience.problems', 'marketing.goal', 'voice.personality', 'voice.pronouns', 'content.length_format'];
const VISUAL = ['brand.colors', 'brand.visual_style', 'brand.logo'];
const PRODUCT = ['offers.name', 'offers.description', 'offers.benefits'];
const fixture = t => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'freeup-onboarding-'));
  t.after(() => { if (path.dirname(workspace) !== fs.realpathSync(os.tmpdir())) throw Error('Unsafe cleanup'); fs.rmSync(workspace, { recursive: true, force: true }); });
  let tick = Date.now() - 100000;
  const cli = (command, ...args) => main([command, '--workspace', workspace, ...args]);
  const init = format => cli('init', '--business-id', 'cong-ty-an', '--agent-id', 'content-lab', ...(format ? ['--format', format] : []));
  const snapshot = (keys = CORE, format = 'text') => {
    const readAt = new Date(tick += 1000).toISOString();
    const values = Object.fromEntries(keys.map(key => [key, key === 'company.name' ? 'Công ty An' : 'Nội dung thật đã xác nhận cho ' + key]));
    const content = Object.entries(values).map(([key, value]) => key + ': ' + value).join('\n');
    return { schema_version: 1, businessId: 'cong-ty-an', agentId: 'content-lab', snapshotId: 'read-' + tick, readAt, selectedFormat: format, sources: [{ id: 'message-owner', businessId: 'cong-ty-an', kind: 'confirmed_context', tool: 'confirmed_user_message', read: true, readAt, content }], assessment: { fields: Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { status: 'confirmed', value, sourceIds: ['message-owner'], evidence: key + ': ' + value }])) } };
  };
  const input = value => { const file = path.join(workspace, 'snapshot.json'); fs.writeFileSync(file, JSON.stringify(value)); return file; };
  const assess = value => cli('assess', '--input', input(value));
  return { workspace, cli, init, snapshot, input, assess };
};

test('init persists missing fields and copies only relevant Vietnamese templates without overwriting edits', t => {
  const f = fixture(t), result = f.init();
  assert.equal(result.status, 'WAITING_KNOWLEDGE');
  assert.equal(result.menuAvailable, true);
  assert.deepEqual(result.missingFields.map(item => item.field), CORE);
  assert.ok(result.paths.knowledge_drafts.endsWith(path.join('Nội dung của tôi', 'Hồ sơ cần hoàn thiện')));
  const copied = f.cli('templates');
  assert.deepEqual(copied.templates.map(item => item.templateId).sort(), ['T01', 'T04', 'T06', 'T09', 'T10']);
  const target = copied.templates[0].path;
  fs.writeFileSync(target, 'Khách đã điền có dấu.');
  assert.equal(f.cli('templates').templates.every(item => item.created === false), true);
  assert.equal(fs.readFileSync(target, 'utf8'), 'Khách đã điền có dấu.');
  assert.ok(fs.existsSync(result.paths.state));
});

test('complete confirmed semantic evidence works regardless of filenames and survives a new invocation', t => {
  const f = fixture(t); f.init();
  const result = f.assess(f.snapshot());
  assert.equal(result.status, 'READY_MENU');
  assert.equal(result.missingFields.length, 0);
  assert.equal(result.missingMedia.length, 0);
  assert.equal(f.cli('status').acceptedFields['company.name'].value, 'Công ty An');
  assert.equal(f.cli('templates').templates.length, 0);
});

test('wrong business snapshot/source and rebinding do not change persisted state', t => {
  const f = fixture(t), initial = f.init(), before = fs.readFileSync(initial.paths.state, 'utf8');
  const wrong = f.snapshot(); wrong.businessId = 'cong-ty-khac';
  assert.throws(() => f.assess(wrong), { code: 'BRAND_MISMATCH' });
  const sourceWrong = f.snapshot(); sourceWrong.sources[0].businessId = 'khac';
  assert.throws(() => f.assess(sourceWrong), { code: 'BRAND_MISMATCH' });
  assert.throws(() => f.cli('init', '--business-id', 'khac', '--agent-id', 'content-lab'), { code: 'BRAND_MISMATCH' });
  assert.equal(fs.readFileSync(initial.paths.state, 'utf8'), before);
});

test('a completion sentence, reused snapshot, or stale readback cannot satisfy pending facts', t => {
  const f = fixture(t); f.init();
  const partial = f.snapshot(CORE.slice(0, -1)); f.assess(partial);
  const waiting = f.cli('resume');
  assert.equal(waiting.status, 'READBACK_REQUIRED');
  assert.equal(waiting.ready, false);
  assert.equal(f.cli('status').missingFields[0].field, 'content.length_format');
  assert.throws(() => f.cli('resume', '--input', f.input(partial)), { code: 'STALE_READBACK' });
  const stale = f.snapshot(); stale.sources[0].readAt = partial.readAt;
  const rejected = f.cli('resume', '--input', f.input(stale));
  assert.equal(rejected.ready, false);
  assert.equal(rejected.missingFields[0].reason, 'stale_readback');
  const reread = f.snapshot();
  assert.equal(f.cli('resume', '--input', f.input(reread)).ready, true);
});

test('placeholder, inferred values, unread sources and unrelated evidence are not semantic coverage', t => {
  const f = fixture(t); f.init();
  const snapshot = f.snapshot();
  snapshot.assessment.fields['company.name'].value = '[Điền câu trả lời thật]';
  snapshot.assessment.fields['company.usp'].status = 'inferred';
  snapshot.assessment.fields['audience.problems'].evidence = 'Không nằm trong nguồn';
  const result = f.assess(snapshot);
  assert.deepEqual(result.missingFields.map(item => item.field), ['company.name', 'company.usp', 'audience.problems']);
  const unread = f.snapshot(); unread.sources[0].read = false;
  assert.throws(() => f.assess(unread), { code: 'SOURCE_NOT_READ' });
});

test('new conflicting facts require an explicit owner-confirmed resolution', t => {
  const f = fixture(t); f.init(); f.assess(f.snapshot());
  const changed = f.snapshot(); changed.sources[0].content += '\nTên khác'; changed.assessment.fields['company.name'].value = 'Tên khác'; changed.assessment.fields['company.name'].evidence = 'Tên khác';
  assert.equal(f.assess(changed).missingFields[0].reason, 'conflict');
  const unconfirmed = f.snapshot(); unconfirmed.assessment.fields['company.name'].status = 'inferred';
  assert.equal(f.assess(unconfirmed).missingFields[0].reason, 'conflict');
  const resolution = f.snapshot(); resolution.sources[0].content += '\nTên khác'; resolution.assessment.fields['company.name'].value = 'Tên khác'; resolution.assessment.fields['company.name'].evidence = 'Tên khác'; resolution.assessment.fields['company.name'].resolvesConflict = true;
  assert.equal(f.assess(resolution).ready, true);
});

test('empty media folders and fake extensions do not count; a new readable file is rescanned', t => {
  const f = fixture(t); const initial = f.init('broll_text');
  let result = f.assess(f.snapshot([...CORE, ...VISUAL], 'broll_text'));
  assert.equal(result.status, 'WAITING_MEDIA');
  assert.deepEqual(result.missingMedia.map(item => item.kind), ['broll']);
  fs.writeFileSync(path.join(initial.paths.broll, 'clip giả.mp4'), 'Đây chỉ là chữ, không phải clip video.');
  result = f.cli('media');
  assert.equal(result.media.broll.ready, false);
  assert.equal(result.media.broll.rejected[0].reason, 'signature_mismatch');
  const bytes = Buffer.alloc(32); bytes.writeUInt32BE(24); bytes.write('ftypisom', 4, 'ascii');
  fs.writeFileSync(path.join(initial.paths.broll, 'Cảnh quay mới có dấu.mp4'), bytes);
  result = f.cli('media');
  assert.equal(result.ready, true);
  assert.equal(result.media.broll.files[0].decodeVerified, false);
  assert.equal(result.media.music.ready, false); // Optional audio does not block this format.
});

test('native product asset needs provenance, correct purpose, inspection and confirmed match', t => {
  const f = fixture(t); f.init('product_post');
  const complete = f.snapshot([...CORE, ...VISUAL, ...PRODUCT], 'product_post');
  assert.equal(f.assess(complete).missingMedia[0].kind, 'product_reference');
  const image = { id: 'native-product-1', businessId: 'cong-ty-an', sourceId: 'media-result', purpose: 'service', mimeType: 'image/png', sizeBytes: 123, mediaStatus: 'ready', inspected: true, confirmedMatch: true, origin: 'upload' };
  const reread = f.snapshot([...CORE, ...VISUAL, ...PRODUCT], 'product_post');
  reread.sources.push({ id: 'media-result', businessId: 'cong-ty-an', kind: 'media_catalog', tool: 'company_media_search', read: true, readAt: reread.readAt, content: JSON.stringify({ items: [image] }) });
  reread.media = { nativeImages: [image] };
  assert.equal(f.cli('resume', '--input', f.input(reread)).ready, true);
  const fake = f.snapshot([...CORE, ...VISUAL, ...PRODUCT], 'product_post');
  fake.media = { nativeImages: [{ ...image, id: 'not-in-result' }] }; fake.sources.push(reread.sources[1]);
  assert.throws(() => f.assess(fake), { code: 'INVALID_MEDIA' });
});

test('voice format blocks without real audio, while unrelated text format stays available', t => {
  const f = fixture(t); f.init(); f.assess(f.snapshot([...CORE, ...VISUAL], 'voice_video'));
  const waiting = f.cli('status');
  assert.deepEqual(waiting.missingMedia.map(item => item.kind), ['broll', 'voice']);
  assert.equal(f.cli('status', '--format', 'text').ready, true);
});

test('workspace/input traversal is rejected and legacy format IDs are not accepted', t => {
  const f = fixture(t); f.init();
  assert.throws(() => f.cli('assess', '--input', path.join(f.workspace, '..', 'outside.json')), { code: 'UNSAFE_PATH' });
  assert.throws(() => f.cli('status', '--format', 'story'), { code: 'FORMAT_INVALID' });
  assert.throws(() => main(['init', '--workspace', 'relative', '--business-id', 'b', '--agent-id', 'a']), { code: 'WORKSPACE_REQUIRED' });
});

test('updating a source cannot silently keep facts whose quoted evidence disappeared', t => {
  const f = fixture(t); f.init(); f.assess(f.snapshot());
  const update = f.snapshot([]); update.sources[0].content = 'Tài liệu mới chưa có thông tin công ty cũ.';
  const result = f.assess(update);
  assert.equal(result.ready, false);
  assert.equal(result.missingFields.every(field => field.reason === 'source_changed'), true);
});

test('customer junctions/symlinks cannot redirect runtime writes or scans outside workspace', t => {
  const f = fixture(t); const state = f.init();
  const outside = path.join(f.workspace, 'outside'); fs.mkdirSync(outside);
  fs.rmdirSync(state.paths.broll);
  try { fs.symlinkSync(outside, state.paths.broll, process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) { if (['EPERM', 'EACCES'].includes(error.code)) { t.skip('Host does not allow symlink creation'); return; } throw error; }
  assert.throws(() => f.cli('media'), { code: 'UNSAFE_PATH' });
});

test('CLI errors are one JSON result with a nonzero exit code', () => {
  const cli = spawnSync(process.execPath, [path.resolve(__dirname, '../package/skills/freeup-content-gon-lab/scripts/onboarding.cjs'), 'status', '--workspace', 'relative'], { encoding: 'utf8' });
  assert.equal(cli.status, 1);
  assert.equal(JSON.parse(cli.stdout).error.code, 'WORKSPACE_REQUIRED');
  assert.equal(cli.stderr, '');
});
