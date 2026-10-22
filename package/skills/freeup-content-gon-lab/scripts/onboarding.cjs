#!/usr/bin/env node
'use strict';

// No network, LLM, host configuration, or credential access. The host supplies readback evidence.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const PACKAGE = 'freeup-content-gon-lab';
const CORE = ['company.name', 'company.industry', 'company.usp', 'audience.identity', 'audience.problems', 'marketing.goal', 'voice.personality', 'voice.pronouns', 'content.length_format'];
const VISUAL = ['brand.colors', 'brand.visual_style', 'brand.logo'];
const KINDS = new Set(['knowledge', 'profile', 'confirmed_context', 'media_catalog', 'capability']);
const SOURCE_TOOLS = {
  knowledge: new Set(['read_business_document', 'search_business_documents', 'read_local_document', 'connected_document_read']),
  profile: new Set(['trusted_business_profile']),
  confirmed_context: new Set(['confirmed_user_message']),
  media_catalog: new Set(['company_media_search', 'trusted_local_media_catalog']),
  capability: new Set(['trusted_host_capabilities'])
};
function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
function object(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function text(value) { return typeof value === 'string' && value.trim().length > 0; }
function id(value) { return text(value) && value.length <= 200 && !/[\x00-\x1f]/.test(value); }
function timestamp(value) { return typeof value === 'string' && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value)); }
function placeholder(value) {
  if (!text(value)) return true;
  const s = value.trim().toLocaleLowerCase('vi');
  return /^(?:chưa có|chưa cung cấp|chưa biết|chưa xác nhận|còn thiếu|n\/a|tbd|todo|test|example|ví dụ|placeholder|null|undefined|\.\.\.)[.!]?$/.test(s) || /\[(?:điền|nhập|tên|câu trả lời|ví dụ)|\{\{[^}]+\}\}|<điền/i.test(s);
}
function within(root, candidate) { const relative = path.relative(root, candidate); return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative)); }
function safe(root, candidate) {
  const absolute = path.resolve(candidate);
  if (!within(root, absolute)) fail('UNSAFE_PATH', 'Đường dẫn phải nằm trong workspace lab.');
  let cursor = root;
  for (const part of path.relative(root, absolute).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part);
    let entry; try { entry = fs.lstatSync(cursor); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (entry?.isSymbolicLink()) fail('UNSAFE_PATH', 'Không dùng symlink/junction cho dữ liệu lab.');
    if (fs.existsSync(cursor) && !within(root, fs.realpathSync(cursor))) fail('UNSAFE_PATH', 'Đường dẫn thực nằm ngoài workspace lab.');
  }
  return absolute;
}
function readJson(file, maxBytes = 2 * 1024 * 1024) {
  if (!fs.statSync(file).isFile() || fs.statSync(file).size > maxBytes) fail('INVALID_INPUT', 'JSON phải là file trong giới hạn kích thước cho phép.');
  let result;
  try { result = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); } catch { fail('INVALID_INPUT', 'Không đọc được JSON hợp lệ.'); }
  if (!object(result)) fail('INVALID_INPUT', 'JSON đầu vào phải là object.');
  return result;
}
function parse(argv) {
  const args = [...argv], options = {}, commands = [];
  while (args.length) {
    const arg = args.shift();
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (!['workspace', 'business-id', 'agent-id', 'format', 'input'].includes(key) || options[key] !== undefined || !args.length || args[0].startsWith('--')) fail('INVALID_ARGUMENT', 'Tham số không hợp lệ: ' + arg);
      options[key] = args.shift();
    } else commands.push(arg);
  }
  if (commands.length !== 1 || !['init', 'status', 'assess', 'resume', 'media', 'templates'].includes(commands[0])) fail('INVALID_COMMAND', 'Dùng init/status/assess/resume/media/templates.');
  return { command: commands[0], options };
}
function assets() {
  const skill = path.resolve(__dirname, '..');
  const installed = path.join(skill, 'assets', 'onboarding');
  const repo = path.resolve(skill, '..', '..', '..');
  const catalogDir = fs.existsSync(path.join(installed, 'knowledge-catalog.json')) ? installed : path.join(repo, 'onboarding');
  return { skill, repo, catalog: readJson(path.join(catalogDir, 'knowledge-catalog.json')), menu: readJson(path.join(catalogDir, 'menu-catalog.json')), paths: readJson(path.join(catalogDir, 'customer-paths.json')) };
}
function context(options) {
  const requested = options.workspace || process.env.FREEUP_CONTENT_WORKSPACE;
  if (!requested || !path.isAbsolute(requested)) fail('WORKSPACE_REQUIRED', 'Cần --workspace là đường dẫn tuyệt đối hoặc FREEUP_CONTENT_WORKSPACE.');
  if (!fs.existsSync(requested) || !fs.statSync(requested).isDirectory()) fail('WORKSPACE_REQUIRED', 'Workspace phải là thư mục đã có.');
  const workspace = fs.realpathSync(requested), a = assets();
  const runtime = safe(workspace, path.join(workspace, PACKAGE + '-data', 'onboarding'));
  const stateFile = safe(workspace, path.join(runtime, 'state.json'));
  const customerRoot = safe(workspace, path.join(workspace, a.paths.root));
  const paths = Object.fromEntries(Object.entries(a.paths.paths).map(([key, value]) => [key, safe(workspace, path.join(customerRoot, value))]));
  return { ...a, workspace, runtime, stateFile, customerRoot, paths };
}
function save(ctx, state) {
  safe(ctx.workspace, ctx.stateFile); fs.mkdirSync(ctx.runtime, { recursive: true });
  const references = new Set([...Object.values(state.fields).flatMap(field => field.sourceIds || []), ...state.nativeImages.map(image => image.sourceId)]);
  state.sources = Object.fromEntries(Object.entries(state.sources).filter(([key]) => references.has(key)));
  const encoded = JSON.stringify(state, null, 2) + '\n';
  if (Buffer.byteLength(encoded) > 8 * 1024 * 1024) fail('STATE_TOO_LARGE', 'Chỉ giữ đoạn nguồn liên quan đã đọc; state onboarding tối đa 8 MiB.');
  const temporary = safe(ctx.workspace, path.join(ctx.runtime, 'state-' + crypto.randomUUID() + '.tmp'));
  fs.writeFileSync(temporary, encoded, { flag: 'wx', mode: 0o600 });
  fs.renameSync(temporary, ctx.stateFile);
}
function loadState(ctx, options, command) {
  let state;
  if (fs.existsSync(ctx.stateFile)) state = readJson(ctx.stateFile, 8 * 1024 * 1024);
  else {
    if (command !== 'init') fail('NOT_INITIALIZED', 'Chạy init với business-id và agent-id trước.');
    if (!id(options['business-id']) || !id(options['agent-id'])) fail('IDENTITY_REQUIRED', 'init cần --business-id và --agent-id từ ngữ cảnh host tin cậy.');
    state = { schema_version: 1, packageId: PACKAGE, businessId: options['business-id'], agentId: options['agent-id'], selectedFormat: options.format || 'text', fields: {}, sources: {}, nativeImages: [], needs: {}, snapshots: [], pending: [], status: 'AUDITING', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), templatesSent: [] };
  }
  if (state.packageId !== PACKAGE || state.schema_version !== 1) fail('STATE_INVALID', 'State không thuộc namespace lab.');
  if ((options['business-id'] && options['business-id'] !== state.businessId) || (options['agent-id'] && options['agent-id'] !== state.agentId)) fail('BRAND_MISMATCH', 'Workspace đã gắn doanh nghiệp/agent khác; dùng workspace riêng.');
  if (options.format && !ctx.menu.items.some(item => item.key === options.format)) fail('FORMAT_INVALID', 'Format phải là key trong menu-catalog.');
  if (options.format && !['status', 'templates'].includes(command)) state.selectedFormat = options.format;
  if (!ctx.menu.items.some(item => item.key === state.selectedFormat)) fail('FORMAT_INVALID', 'Format trong state không hợp lệ.');
  return state;
}
function ensureFolders(ctx) {
  for (const name of ['resources', 'broll', 'music', 'voice', 'knowledge_drafts', 'outputs']) {
    safe(ctx.workspace, ctx.paths[name]); fs.mkdirSync(ctx.paths[name], { recursive: true });
  }
}
function knownFields(ctx) { return new Set(ctx.catalog.templates.flatMap(template => template.coverage)); }
function validateSnapshot(ctx, state, snapshot, resume) {
  if (snapshot.schema_version !== 1 || snapshot.businessId !== state.businessId || snapshot.agentId !== state.agentId) fail('BRAND_MISMATCH', 'Snapshot phải đúng schema, businessId và agentId đang dùng.');
  if (!id(snapshot.snapshotId) || !timestamp(snapshot.readAt) || Date.parse(snapshot.readAt) > Date.now() + 60000) fail('INVALID_SNAPSHOT', 'Snapshot cần ID và readAt ISO hợp lệ.');
  if (state.snapshots.includes(snapshot.snapshotId) || (state.lastReadAt && Date.parse(snapshot.readAt) <= Date.parse(state.lastReadAt))) fail('STALE_READBACK', 'Cần truy vấn và đọc lại thật; snapshot này đã dùng hoặc cũ.');
  if (!Array.isArray(snapshot.sources) || snapshot.sources.length > 200) fail('INVALID_SNAPSHOT', 'Snapshot cần sources đã đọc.');
  const sources = {};
  for (const source of snapshot.sources) {
    if (!object(source) || source.businessId !== state.businessId) fail('BRAND_MISMATCH', 'Nguồn không thuộc doanh nghiệp hiện tại.');
    if (!id(source.id) || sources[source.id] || ['__proto__', 'constructor', 'prototype'].includes(source.id) || !KINDS.has(source.kind) || !SOURCE_TOOLS[source.kind].has(source.tool)) fail('INVALID_SOURCE', 'Nguồn cần ID duy nhất và tool đúng loại nguồn.');
    if (source.read !== true || !timestamp(source.readAt) || Date.parse(source.readAt) > Date.parse(snapshot.readAt) + 1000 || !text(source.content) || source.content.length > 200000 || placeholder(source.content)) fail('SOURCE_NOT_READ', 'Nguồn phải có nội dung đọc được và thời điểm đọc thực.');
    sources[source.id] = { id: source.id, businessId: state.businessId, kind: source.kind, tool: source.tool, read: true, readAt: source.readAt, content: source.content, revision: typeof source.revision === 'string' ? source.revision : null };
  }
  if (snapshot.selectedFormat !== undefined) {
    if (!ctx.menu.items.some(item => item.key === snapshot.selectedFormat)) fail('FORMAT_INVALID', 'selectedFormat phải trùng menu key.');
    state.selectedFormat = snapshot.selectedFormat;
  }
  const fields = snapshot.assessment?.fields || {};
  if (!object(fields)) fail('INVALID_ASSESSMENT', 'assessment.fields phải là object.');
  const allowed = knownFields(ctx), previousReadAt = state.lastReadAt;
  for (const [key, entry] of Object.entries(fields)) {
    if (!allowed.has(key) || !object(entry)) fail('INVALID_FIELD', 'Trường assessment không có trong knowledge catalog.');
    const refs = entry.sourceIds;
    let reason;
    if (!['confirmed', 'provided'].includes(entry.status)) reason = entry.status === 'conflict' ? 'conflict' : 'unconfirmed';
    else if (placeholder(entry.value)) reason = 'placeholder';
    else if (!Array.isArray(refs) || !refs.length || refs.some(ref => !Object.hasOwn(sources, ref))) reason = 'missing_source';
    else if (!text(entry.evidence) || !entry.evidence.includes(entry.value.trim()) || !refs.some(ref => sources[ref].content.includes(entry.evidence)) || placeholder(entry.evidence)) reason = 'evidence_not_in_source';
    else if (resume && state.pending.some(item => item.field === key) && previousReadAt && !refs.some(ref => Date.parse(sources[ref].readAt) > Date.parse(previousReadAt))) reason = 'stale_readback';
    else if (entry.status === 'confirmed' && !refs.some(ref => sources[ref].kind === 'confirmed_context') && entry.confirmedByOwner !== true) reason = 'confirmation_missing';
    const old = state.fields[key];
    const resolution = !reason && entry.resolvesConflict === true && refs.some(ref => sources[ref].kind === 'confirmed_context');
    if (old?.status === 'conflict' && !resolution) reason = 'conflict';
    if (!reason && old?.status === 'accepted' && old.value !== entry.value && !resolution) reason = 'conflict';
    if (reason) {
      // A bad new inference does not erase a previously accepted fact; conflicts do block it.
      if (!old || old.status !== 'accepted' || reason === 'conflict') state.fields[key] = { status: reason, ...(old?.value ? { value: old.value } : {}), sourceIds: Array.isArray(refs) ? refs : [] };
    } else state.fields[key] = { status: 'accepted', value: entry.value.trim(), sourceIds: [...new Set(refs)], evidence: entry.evidence, confirmed: entry.status === 'confirmed', readAt: snapshot.readAt };
  }
  // Merge only sources actually read; assertions in assessment never become source content.
  Object.assign(state.sources, sources);
  for (const field of Object.values(state.fields)) {
    if (field.status === 'accepted' && !field.sourceIds.some(ref => state.sources[ref]?.content.includes(field.evidence))) field.status = 'source_changed';
  }
  if (resume && ['product_post', 'personal_quote'].includes(state.selectedFormat) && !Array.isArray(snapshot.media?.nativeImages)) fail('READBACK_REQUIRED', 'Nhánh này cần tìm/đọc lại thư viện ảnh và trả nativeImages mới.');
  if (snapshot.media !== undefined) {
    if (!object(snapshot.media)) fail('INVALID_MEDIA', 'media phải là object.');
    if (snapshot.media.needs !== undefined) {
      if (!object(snapshot.media.needs) || Object.entries(snapshot.media.needs).some(([key, value]) => !['music', 'voice', 'promotional', 'mentionPrice'].includes(key) || typeof value !== 'boolean')) fail('INVALID_MEDIA', 'media.needs chỉ nhận cờ boolean đã chọn.');
      state.needs = { ...state.needs, ...snapshot.media.needs };
    }
    if (snapshot.media.nativeImages !== undefined) {
      if (!Array.isArray(snapshot.media.nativeImages)) fail('INVALID_MEDIA', 'nativeImages phải là mảng.');
      state.nativeImages = snapshot.media.nativeImages.map(image => {
        if (!object(image) || image.businessId !== state.businessId) fail('BRAND_MISMATCH', 'Ảnh native sai doanh nghiệp.');
        const source = sources[image.sourceId];
        if (!id(image.id) || !source || source.kind !== 'media_catalog' || !source.content.includes(image.id)) fail('INVALID_MEDIA', 'Ảnh cần ID có trong kết quả thư viện ảnh đã đọc.');
        if (resume && previousReadAt && Date.parse(source.readAt) <= Date.parse(previousReadAt)) fail('STALE_READBACK', 'Kết quả thư viện ảnh cần đọc lại sau lần chờ trước.');
        let raw; try { raw = JSON.parse(source.content); } catch { fail('INVALID_MEDIA', 'Nguồn ảnh cần JSON kết quả tool nguyên vẹn.'); }
        const candidates = Array.isArray(raw) ? raw : object(raw) ? raw.items || raw.assets || raw.results : null;
        const record = Array.isArray(candidates) ? candidates.find(item => object(item) && item.id === image.id) : null;
        if (!record || ['mimeType', 'mediaStatus', 'sizeBytes', 'origin'].some(key => record[key] !== image[key])) fail('INVALID_MEDIA', 'Trường ảnh phải khớp bản ghi native đã đọc.');
        if (!['product', 'service', 'person', 'brand', 'general'].includes(image.purpose)) fail('INVALID_MEDIA', 'Ảnh cần purpose đã xác định.');
        return { id: image.id, businessId: state.businessId, sourceId: image.sourceId, purpose: image.purpose, mimeType: image.mimeType, mediaStatus: image.mediaStatus, sizeBytes: image.sizeBytes, inspected: image.inspected === true, confirmedMatch: image.confirmedMatch === true, origin: image.origin, explicitlySelected: image.explicitlySelected === true };
      });
    }
  }
  state.lastReadAt = snapshot.readAt;
  state.lastSnapshotId = snapshot.snapshotId;
  state.snapshots.push(snapshot.snapshotId);
  // A bounded log is informational; lastReadAt also rejects replay of older snapshots.
  state.snapshots = state.snapshots.slice(-200);
}
function fileSignature(buffer, ext) {
  if (ext === '.mp4' || ext === '.mov' || ext === '.m4v' || ext === '.m4a') return buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp';
  if (ext === '.webm' || ext === '.mkv') return buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (ext === '.wav') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE';
  if (ext === '.mp3') return buffer.toString('ascii', 0, 3) === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
  if (ext === '.ogg') return buffer.toString('ascii', 0, 4) === 'OggS';
  if (ext === '.flac') return buffer.toString('ascii', 0, 4) === 'fLaC';
  if (ext === '.aac') return buffer[0] === 0xff && (buffer[1] & 0xf6) === 0xf0;
  return false;
}
function scanMedia(ctx) {
  const groups = { broll: ['.mp4', '.mov', '.m4v', '.webm', '.mkv'], music: ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac'], voice: ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac'] }, result = {};
  for (const [key, extensions] of Object.entries(groups)) {
    const found = [], rejected = [];
    const walk = (directory, depth) => {
      safe(ctx.workspace, directory); if (!fs.existsSync(directory)) return;
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (found.length + rejected.length >= 500) fail('MEDIA_LIMIT', 'Tối đa 500 file mỗi nhóm tài nguyên.');
        const filename = path.join(directory, entry.name);
        if (entry.isSymbolicLink()) { rejected.push({ path: filename, reason: 'symlink' }); continue; }
        if (entry.isDirectory()) { if (depth < 4) walk(filename, depth + 1); continue; }
        if (!entry.isFile() || !extensions.includes(path.extname(entry.name).toLowerCase())) continue;
        try {
          safe(ctx.workspace, filename); const stat = fs.statSync(filename);
          if (stat.size < 16) { rejected.push({ path: filename, reason: 'empty_or_too_short' }); continue; }
          const handle = fs.openSync(filename, 'r'); const head = Buffer.alloc(64); let n;
          try { n = fs.readSync(handle, head, 0, 64, 0); } finally { fs.closeSync(handle); }
          if (!fileSignature(head.subarray(0, n), path.extname(entry.name).toLowerCase())) { rejected.push({ path: filename, reason: 'signature_mismatch' }); continue; }
          found.push({ path: filename, sizeBytes: stat.size, modifiedAt: stat.mtime.toISOString(), signatureVerified: true, decodeVerified: false });
        } catch (error) { if (error.code === 'UNSAFE_PATH') throw error; rejected.push({ path: filename, reason: 'unreadable' }); }
      }
    };
    walk(ctx.paths[key], 0); result[key] = { ready: found.length > 0, files: found, rejected, folder: ctx.paths[key] };
  }
  return result;
}
function requiredFields(state, format) {
  const required = [...CORE];
  if (!['text', 'comment_thread'].includes(format)) required.push(...VISUAL);
  if (format === 'product_post') required.push('offers.name', 'offers.description', 'offers.benefits');
  if (format === 'personal_quote') required.push('founder.name', 'founder.viewpoints');
  if (state.needs.mentionPrice) required.push('offers.price_policy');
  if (state.needs.promotional) required.push('offers.name', 'offers.description', 'offers.benefits', 'marketing.campaigns');
  return [...new Set(required)];
}
function requirements(ctx, state, format) {
  const missingFields = requiredFields(state, format).filter(key => state.fields[key]?.status !== 'accepted' || (['company.usp', 'voice.personality', 'voice.pronouns', 'content.length_format', ...VISUAL].includes(key) && !state.fields[key].confirmed)).map(key => {
    const template = ctx.catalog.templates.find(item => item.coverage.includes(key));
    return { field: key, reason: state.fields[key]?.status === 'accepted' ? 'confirmation_required' : state.fields[key]?.status || 'missing', templateId: template.id, templateTitle: template.title, templateUrl: template.github_url, downloadUrl: template.download_url, localTemplatePath: safe(ctx.workspace, path.join(ctx.paths.knowledge_drafts, template.customer_filename)) };
  });
  const local = scanMedia(ctx), missingMedia = [];
  const goodNative = image => image.mediaStatus === 'ready' && /^image\/(png|jpeg|webp)$/.test(image.mimeType || '') && Number.isFinite(image.sizeBytes) && image.sizeBytes > 0 && image.inspected && image.confirmedMatch && (image.origin !== 'generated' || image.explicitlySelected);
  if (format === 'product_post' && !state.nativeImages.some(image => goodNative(image) && ['product', 'service'].includes(image.purpose))) missingMedia.push({ kind: 'product_reference', destination: 'Hình ảnh doanh nghiệp', reason: 'Cần ảnh đúng sản phẩm/biến thể hoặc screenshot/asset dịch vụ đã mở và xác nhận.' });
  if (format === 'personal_quote' && !state.nativeImages.some(image => goodNative(image) && image.purpose === 'person')) missingMedia.push({ kind: 'person_reference', destination: 'Hình ảnh doanh nghiệp', reason: 'Cần ảnh đúng người đã mở và xác nhận.' });
  if (['broll_text', 'voice_video'].includes(format) && !local.broll.ready) missingMedia.push({ kind: 'broll', destination: ctx.paths.broll, reason: 'Cần clip có chữ ký file hợp lệ; thư mục rỗng chưa đủ.' });
  if ((format === 'voice_video' || state.needs.voice) && !local.voice.ready) missingMedia.push({ kind: 'voice', destination: ctx.paths.voice, reason: 'Cần file giọng đọc thật; provider phải được xác minh và xuất file trước bước này.' });
  if (state.needs.music && !local.music.ready) missingMedia.push({ kind: 'music', destination: ctx.paths.music, reason: 'Chỉ yêu cầu nhạc khi đã chọn sử dụng.' });
  return { missingFields, missingMedia, local, status: missingFields.length ? 'WAITING_KNOWLEDGE' : missingMedia.length ? 'WAITING_MEDIA' : 'READY_MENU' };
}
function report(ctx, state, format = state.selectedFormat) {
  if (!ctx.menu.items.some(item => item.key === format)) fail('FORMAT_INVALID', 'Format phải là menu key.');
  const req = requirements(ctx, state, format);
  const groups = [...new Set(req.missingFields.map(item => item.templateId))].map(templateId => {
    const fields = req.missingFields.filter(item => item.templateId === templateId), first = fields[0];
    return { templateId, title: first.templateTitle, fields: fields.map(item => item.field), url: first.templateUrl, localPath: first.localTemplatePath };
  });
  return { ok: true, packageId: PACKAGE, businessId: state.businessId, agentId: state.agentId, selectedFormat: format, status: req.status, ready: req.status === 'READY_MENU', menuAvailable: true, missingFields: req.missingFields, missingMedia: req.missingMedia, questions: groups, instruction: req.missingFields.length ? 'Hoàn thiện đúng các mục thiếu, tải vào Tri thức của đúng doanh nghiệp rồi nhắn Tôi đã hoàn tất. Agent phải đọc lại nội dung thật.' : req.missingMedia.length ? 'Bổ sung đúng tài nguyên đang thiếu rồi nhắn Tôi đã hoàn tất để kiểm lại.' : 'Đủ đầu vào cho định dạng đã chọn; chưa phải thành phẩm được duyệt.', paths: { workspace: ctx.workspace, state: ctx.stateFile, customerRoot: ctx.customerRoot, ...ctx.paths }, media: req.local, lastSnapshotId: state.lastSnapshotId || null, lastReadAt: state.lastReadAt || null, acceptedFields: Object.fromEntries(Object.entries(state.fields).filter(([, value]) => value.status === 'accepted').map(([key, value]) => [key, { value: value.value, confirmed: value.confirmed, sourceIds: value.sourceIds }])) };
}
function persistProgress(ctx, state) {
  const result = report(ctx, state);
  state.status = result.status; state.pending = result.missingFields.map(({ field, reason }) => ({ field, reason }));
  state.pendingMedia = result.missingMedia; state.updatedAt = new Date().toISOString(); save(ctx, state);
  return result;
}
function copyTemplates(ctx, state) {
  const result = report(ctx, state), copied = [];
  for (const question of result.questions) {
    const template = ctx.catalog.templates.find(item => item.id === question.templateId);
    const basename = path.basename(template.file);
    const installedSource = path.join(ctx.skill, 'assets', 'knowledge', basename);
    const source = fs.existsSync(installedSource) ? installedSource : path.join(ctx.repo, template.file);
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) fail('TEMPLATE_MISSING', 'Package thiếu mẫu ' + template.id);
    const target = safe(ctx.workspace, question.localPath); fs.mkdirSync(ctx.paths.knowledge_drafts, { recursive: true });
    let created = false;
    if (!fs.existsSync(target)) { fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL); created = true; }
    else if (!fs.statSync(target).isFile()) fail('UNSAFE_PATH', 'Đích mẫu phải là file.');
    copied.push({ templateId: template.id, path: target, created, fields: question.fields, destination: 'Tri thức của đúng doanh nghiệp' });
    if (!state.templatesSent.includes(template.id)) state.templatesSent.push(template.id);
  }
  state.updatedAt = new Date().toISOString(); save(ctx, state);
  return { ...result, templates: copied };
}
function main(argv = process.argv.slice(2)) {
  const { command, options } = parse(argv), ctx = context(options);
  if (command === 'status') { const state = loadState(ctx, options, command); return report(ctx, state, options.format || state.selectedFormat); }
  safe(ctx.workspace, ctx.runtime); fs.mkdirSync(ctx.runtime, { recursive: true });
  const lock = safe(ctx.workspace, path.join(ctx.runtime, 'operation.lock'));
  let handle;
  try { handle = fs.openSync(lock, 'wx'); } catch (error) { if (error.code === 'EEXIST') fail('ONBOARDING_BUSY', 'Đang có thao tác onboarding khác; chờ hoàn tất rồi thử lại.'); throw error; }
  try { return run(ctx, options, command); }
  finally { fs.closeSync(handle); fs.unlinkSync(lock); }
}
function run(ctx, options, command) {
  const state = loadState(ctx, options, command);
  if (command === 'init') { ensureFolders(ctx); return persistProgress(ctx, state); }
  if (command === 'templates') return copyTemplates(ctx, state);
  if (command === 'resume' && !options.input) return { ...report(ctx, state), ready: false, status: 'READBACK_REQUIRED', code: 'READBACK_REQUIRED', instruction: 'Câu hoàn tất không xác nhận đủ dữ liệu. Truy vấn/đọc lại Tri thức và ảnh rồi cung cấp snapshot mới; quét lại media local.' };
  if (command === 'assess' || options.input) {
    if (!options.input) fail('INPUT_REQUIRED', 'assess cần --input snapshot JSON đã đọc lại.');
    const input = safe(ctx.workspace, path.resolve(ctx.workspace, options.input));
    validateSnapshot(ctx, state, readJson(input), command === 'resume');
  }
  ensureFolders(ctx); return persistProgress(ctx, state);
}
module.exports = { main, fileSignature, placeholder };
if (require.main === module) {
  try { process.stdout.write(JSON.stringify(main(), null, 2) + '\n'); }
  catch (error) { process.stdout.write(JSON.stringify({ ok: false, error: { code: error.code || 'ONBOARDING_ERROR', message: error.code ? error.message : 'Không hoàn thành thao tác onboarding; kiểm quyền đọc/ghi và dữ liệu đầu vào.' } }, null, 2) + '\n'); process.exitCode = 1; }
}
