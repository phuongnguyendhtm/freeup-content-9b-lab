'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const router = path.resolve(__dirname, '../package/skills/freeup-content-gon-lab/scripts/contentlab.cjs');
const values = {
  'company.name': 'Xưởng Mẫu An', 'company.industry': 'Vật phẩm tổng hợp để thử nghiệm', 'company.usp': 'Giữ đúng mẫu đã được duyệt',
  'audience.identity': 'Người tham gia phiên thử', 'audience.problems': 'Cần kiểm tra bài đăng trước khi giao', 'marketing.goal': 'Giới thiệu mẫu thử',
  'voice.personality': 'Rõ ràng và gần gũi', 'voice.pronouns': 'Tôi và bạn', 'content.length_format': 'Bài ngắn có ví dụ',
  'brand.colors': 'Xanh và trắng', 'brand.visual_style': 'Nền sáng và chữ lớn', 'brand.logo': 'Chỉ dùng tên chữ',
  'offers.name': 'Mẫu xanh', 'offers.description': 'Vật phẩm tổng hợp cho kiểm thử', 'offers.benefits': 'Dùng để đối chiếu cùng một mẫu'
};
const confirmed = new Set(['company.usp', 'voice.personality', 'voice.pronouns', 'content.length_format', 'brand.colors', 'brand.visual_style', 'brand.logo']);
function fixture(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'freeup-forward-'));
  t.after(() => { if (path.dirname(workspace) !== fs.realpathSync(os.tmpdir())) throw Error('Unsafe cleanup'); fs.rmSync(workspace, { recursive: true, force: true }); });
  const businessId = 'synthetic-an', agentId = 'fresh-session-agent'; let sequence = 0;
  const call = (...args) => {
    const run = spawnSync(process.execPath, [router, ...args, '--workspace', workspace], { encoding: 'utf8' });
    if (run.status !== 0) throw Error(run.stderr || run.stdout);
    return JSON.parse(run.stdout);
  };
  const input = (name, data) => { const file = path.join(workspace, name); fs.writeFileSync(file, JSON.stringify(data)); return file; };
  const imageFile = path.join(workspace, 'Ảnh sản phẩm tổng hợp.png');
  fs.writeFileSync(imageFile, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'));
  const snapshot = (fields, ownerConfirmed = true) => {
    const readAt = new Date(Date.now() - 5000 + (++sequence * 100)).toISOString();
    const content = Object.entries(fields).map(([key, value]) => `${key}: ${value}`).join('\n');
    const image = { id: 'native-synthetic-blue', businessId, sourceId: 'catalog-read', purpose: 'product', mimeType: 'image/png', sizeBytes: fs.statSync(imageFile).size, mediaStatus: 'ready', origin: 'upload', inspected: true, confirmedMatch: true };
    return { schema_version: 1, businessId, agentId, snapshotId: 'fresh-read-' + sequence, readAt, selectedFormat: 'product_post', sources: [
      { id: 'profile-read', businessId, kind: 'profile', tool: 'trusted_business_profile', read: true, readAt, content },
      { id: 'catalog-read', businessId, kind: 'media_catalog', tool: 'company_media_search', read: true, readAt, content: JSON.stringify([image]) }
    ], assessment: { fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, { status: confirmed.has(key) ? 'confirmed' : 'provided', value, sourceIds: ['profile-read'], evidence: `${key}: ${value}`, ...(confirmed.has(key) && ownerConfirmed ? { confirmedByOwner: true } : {}) }])) }, media: { nativeImages: [image] } };
  };
  return { workspace, businessId, agentId, imageFile, call, input, snapshot };
}

test('fresh session: menu, selection 2, missing template, readback resume, and product-only post QA', t => {
  const f = fixture(t);
  const menu = f.call('menu', '--session', 'new-user');
  assert.equal(menu.startsProduction, false);
  assert.ok(fs.existsSync(menu.mediaPath));
  assert.equal(fs.existsSync(path.join(f.workspace, 'freeup-content-gon-lab-data/onboarding/state.json')), false);
  assert.equal(f.call('select', '--value', '2', '--session', 'new-user').selection.key, 'product_post');
  f.call('onboarding', 'init', '--business-id', f.businessId, '--agent-id', f.agentId, '--format', 'product_post');
  const partial = { ...values }; delete partial['offers.benefits'];
  let result = f.call('onboarding', 'assess', '--input', f.input('Hồ sơ đã đọc.json', f.snapshot(partial)));
  assert.deepEqual(result.missingFields.map(field => field.field), ['offers.benefits']);
  const templates = f.call('onboarding', 'templates');
  assert.deepEqual(templates.templates.map(item => item.templateId), ['T03']);
  assert.ok(templates.templates[0].path.includes('Hồ sơ cần hoàn thiện'));
  // The user uploads the filled document to Tri thức. Only an actual new tool readback is supplied next.
  fs.appendFileSync(templates.templates[0].path, '\nLợi ích đã điền: Dùng để đối chiếu cùng một mẫu.\n');
  assert.equal(f.call('onboarding', 'resume').status, 'READBACK_REQUIRED');
  const reread = f.snapshot(values);
  const source = reread.sources[0]; source.id = 'uploaded-training-document'; source.kind = 'knowledge'; source.tool = 'read_business_document';
  for (const field of Object.values(reread.assessment.fields)) field.sourceIds = [source.id];
  result = f.call('onboarding', 'resume', '--input', f.input('Tri thức đọc lại.json', reread));
  assert.equal(result.ready, true);
  assert.equal(result.missingFields.length, 0);
  const productOnly = { businessId: f.businessId, format: 'product_post', title: 'Giới thiệu Mẫu xanh', taskKind: 'post', idempotencyKey: 'forward-product-only', sources: [{ id: 'product-facts', businessId: f.businessId, confirmed: true }, { id: 'photo', businessId: f.businessId, confirmed: true }], product: { name: 'Mẫu xanh', confirmed: true, sourceId: 'product-facts' }, media: [{ path: f.imageFile, businessId: f.businessId, role: 'product', sourceId: 'photo', originalAssetId: 'native-synthetic-blue' }] };
  const job = f.call('production', 'create', '--input', f.input('Bài chưa có chữ.json', productOnly));
  const reviewed = f.call('production', 'qa', '--id', job.id, '--input', f.input('Kết quả kiểm.json', { reviewer: 'synthetic-test', checks: { factual: true, brand: true, productFidelity: true, captionMediaMatch: true } }));
  assert.equal(reviewed.status, 'REVISE');
  assert.equal(reviewed.qa.passed, false);
  assert.ok(reviewed.qa.errors.some(error => /caption/i.test(error)));
  assert.equal(f.call('production', 'validate', '--id', job.id).valid, false);
  const update = f.call('production', 'update', '--id', job.id, '--input', f.input('Bổ sung bài viết.json', { caption: 'Mẫu xanh là vật phẩm tổng hợp dùng cho phiên thử. Bạn có thể dùng cùng một mẫu để đối chiếu bài viết và hình.' }));
  assert.equal(update.version, 2);
  assert.equal(update.approval, null);
});

test('an existing native profile needs only missing confirmations, not all 53 intake questions', t => {
  const f = fixture(t); f.call('onboarding', 'init', '--business-id', f.businessId, '--agent-id', f.agentId, '--format', 'product_post');
  let result = f.call('onboarding', 'assess', '--input', f.input('Profile chưa có chứng cứ duyệt.json', f.snapshot(values, false)));
  assert.deepEqual(result.missingFields.map(field => field.field).sort(), [...confirmed].sort());
  assert.ok(result.missingFields.every(field => field.reason === 'confirmation_missing'));
  result = f.call('onboarding', 'resume', '--input', f.input('Profile có xác nhận thực.json', f.snapshot(values, true)));
  assert.equal(result.ready, true);
  assert.equal(result.questions.length, 0);
});
