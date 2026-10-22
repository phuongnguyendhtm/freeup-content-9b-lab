#!/usr/bin/env node
'use strict';
// One native route: install files, then activate-9b --apply. Never rewrites host config.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const PACKAGE = 'freeup-content-gon-lab';
const SKILL = 'contentlab';
const USAGE = 'node install-9b.cjs [--workspace ABS_AGENT_WORKSPACE] [--agent REGISTERED_ID] [--config ABS_JSON] [--node ABS_NODE] [--openclaw-entrypoint ABS_JS] [--session CHAT_ID] [--check]\nWorkspace comes from the current agent runtime or OPENCLAW_WORKSPACE_DIR, never cwd. Default installs + scoped native activation; --check writes nothing.';
function fail(code, message) { const error = new Error(message); error.code = code; error.publicMessage = true; throw error; }
function object(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function read(file) { try { const data = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); if (!object(data)) throw Error(); return data; } catch { fail('INVALID_JSON', 'Không đọc được JSON của đúng host/gói; không hiển thị nội dung cấu hình.'); } }
function inside(root, file) { const r = path.relative(root, file); return r !== '' && r !== '..' && !r.startsWith('..' + path.sep) && !path.isAbsolute(r); }
function regular(value, directory, label) {
  if (typeof value !== 'string' || !path.isAbsolute(value) || !fs.existsSync(value) || fs.lstatSync(value).isSymbolicLink() || !(directory ? fs.statSync(value).isDirectory() : fs.statSync(value).isFile())) fail('INVALID_PATH', label + ' phải là đường dẫn tuyệt đối thực, đã tồn tại và đúng loại.');
  return fs.realpathSync(value);
}
function contained(root, value) {
  const full = path.resolve(value); if (!inside(root, full)) fail('UNSAFE_PATH', 'File điều phối phải nằm trong workspace agent đã xác minh.');
  let cursor = root;
  for (const segment of path.relative(root, full).split(path.sep)) {
    cursor = path.join(cursor, segment);
    try { if (fs.lstatSync(cursor).isSymbolicLink()) fail('UNSAFE_PATH', 'Không ghi qua symlink/junction.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return full;
}
function relative(value) { if (typeof value !== 'string' || !value || value.includes('\\') || value.startsWith('/') || value.split('/').some(part => !part || part === '.' || part === '..' || /[<>:"|?*\x00-\x1f]/.test(part))) fail('INVALID_INVENTORY', 'Inventory có đường dẫn không hợp lệ.'); return value; }
function parse(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]; if (!arg.startsWith('--')) fail('INVALID_ARGUMENT', 'Chỉ dùng tham số có tên; xem --help.');
    const key = arg.slice(2);
    if (!['workspace', 'agent', 'config', 'node', 'openclaw-entrypoint', 'source', 'session', 'help', 'check', 'apply'].includes(key) || Object.hasOwn(result, key)) fail('INVALID_ARGUMENT', 'Tham số không hợp lệ hoặc bị lặp.');
    if (['help', 'check', 'apply'].includes(key)) result[key] = true;
    else { if (!argv[i + 1] || argv[i + 1].startsWith('--')) fail('INVALID_ARGUMENT', 'Tham số thiếu giá trị.'); result[key] = argv[++i]; }
  }
  if (result.check && result.apply) fail('INVALID_ARGUMENT', 'Chỉ chọn --check hoặc --apply.'); return result;
}
function sameSelection(explicit, trusted, directory, label) {
  const a = explicit ? regular(explicit, directory, label) : null;
  const b = trusted ? regular(trusted, directory, label) : null;
  if (a && b && a !== b) fail('HOST_CONTEXT_CONFLICT', label + ' được truyền khác ngữ cảnh host hiện tại; không trộn hai host.');
  return a || b;
}
function inferredRoot(file, kind) {
  const normalized = file.split(path.sep).join('/');
  const expression = kind === 'node' ? /^(.*)\/vendor\/node\/(?:bin\/)?node(?:\.exe)?$/i : /^(.*)\/vendor\/node_modules\/openclaw\/openclaw\.mjs$/i;
  const match = normalized.match(expression); return match && fs.existsSync(match[1]) ? fs.realpathSync(match[1]) : null;
}
function discover(options = {}, env = process.env) {
  const rootHints = [env.NINEBIZ_CLI_ROOT, env.NINEBIZ_INSTALL_ROOT].filter(Boolean).map(value => regular(value, true, '9B install root'));
  const hintedNode = sameSelection(options.node, env.NINEBIZ_NODE, false, 'Node');
  if (hintedNode) { const inferred = inferredRoot(hintedNode, 'node'); if (inferred) rootHints.push(inferred); }
  const uniqueRoots = [...new Set(rootHints)]; if (uniqueRoots.length > 1) fail('HOST_CONTEXT_CONFLICT', 'Có nhiều install root 9B khác nhau trong ngữ cảnh; không chọn mặc định.');
  let hostRoot = uniqueRoots[0] || null;
  const state = env.OPENCLAW_STATE_DIR ? regular(env.OPENCLAW_STATE_DIR, true, 'State directory') : null;
  let config = sameSelection(options.config, env.OPENCLAW_CONFIG_PATH, false, 'Config');
  if (!config && state) config = regular(path.join(state, 'openclaw.json'), false, 'Config');
  if (!config && hostRoot) config = regular(path.join(hostRoot, 'openclaw-state', 'openclaw.json'), false, 'Config');
  if (!config) {
    const candidates = [];
    if (env.APPDATA) for (const name of ['9BizClaw-v3', '9bizclaw-v2']) {
      const metadataRoot = path.join(env.APPDATA, name), metadataFile = path.join(metadataRoot, 'install-root.json');
      if (!fs.existsSync(metadataFile)) continue;
      const metadata = read(metadataFile);
      if (typeof metadata.path !== 'string' || !path.isAbsolute(metadata.path)) fail('INVALID_HOST_METADATA', 'Metadata vị trí cài 9B không hợp lệ.');
      const root = regular(metadata.path, true, '9B install root'), candidate = path.join(root, 'openclaw-state', 'openclaw.json');
      if (fs.existsSync(candidate)) candidates.push({ config: regular(candidate, false, 'Config'), root });
    }
    const distinct = [...new Map(candidates.map(item => [item.config, item])).values()];
    if (distinct.length !== 1) fail('CONFIG_NOT_UNIQUE', 'Chưa xác định duy nhất config của phiên 9B; agent truyền --config từ host, không hỏi khách chọn thư mục.');
    config = distinct[0].config; hostRoot = distinct[0].root;
  }
  if (state && path.dirname(config) !== state) fail('HOST_CONTEXT_CONFLICT', 'Config và state directory thuộc ngữ cảnh khác nhau.');
  if (!hostRoot && path.basename(path.dirname(config)).toLowerCase() === 'openclaw-state') hostRoot = fs.realpathSync(path.dirname(path.dirname(config)));
  if (hostRoot && path.dirname(config) !== regular(path.join(hostRoot, 'openclaw-state'), true, 'State directory')) fail('HOST_CONTEXT_CONFLICT', 'Config không thuộc install root 9B đã xác minh.');
  const configData = read(config), entries = configData.agents?.entries;
  if (!object(entries)) fail('AGENT_SCHEMA_UNSUPPORTED', 'Config chưa có agents.entries đúng schema; không tự chuyển đổi hoặc tạo agent.');
  if (options.agent && env.OPENCLAW_AGENT_ID && options.agent !== env.OPENCLAW_AGENT_ID) fail('HOST_CONTEXT_CONFLICT', 'Agent ID khác với phiên host hiện tại.');
  const agentHint = options.agent || env.OPENCLAW_AGENT_ID || null;
  if (agentHint && (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(agentHint) || ['__proto__', 'prototype', 'constructor'].includes(agentHint))) fail('INVALID_AGENT', 'Agent ID phải là ID đã đăng ký, hợp lệ.');
  const workspaceHint = sameSelection(options.workspace, env.OPENCLAW_WORKSPACE_DIR, true, 'Agent workspace');
  if (!agentHint && !workspaceHint) fail('CURRENT_AGENT_REQUIRED', 'Cần workspace/agent hiện tại từ runtime prompt hoặc host env; không dùng cwd, agents.defaults hay tên lab mặc định.');
  if (agentHint && !Object.hasOwn(entries, agentHint)) fail('AGENT_NOT_REGISTERED', 'Agent ID không có trong agents.entries của host này.');
  const roster = Object.entries(entries).filter(([, value]) => object(value) && typeof value.workspace === 'string' && path.isAbsolute(value.workspace) && fs.existsSync(value.workspace)).map(([id, value]) => ({ id, workspace: regular(value.workspace, true, 'Registered agent workspace') }));
  const matches = roster.filter(item => (!agentHint || item.id === agentHint) && (!workspaceHint || item.workspace === workspaceHint));
  if (matches.length !== 1) fail('AGENT_WORKSPACE_NOT_UNIQUE', 'Workspace không khớp duy nhất agent đã đăng ký; không cài sang thư mục vừa mở hoặc agent khác.');
  const current = matches[0];
  if (roster.filter(item => item.workspace === current.workspace).length !== 1) fail('SHARED_AGENT_WORKSPACE', 'Nhiều agent cùng dùng workspace này; chưa có phạm vi cài riêng rõ ràng.');
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(current.id) || ['__proto__', 'prototype', 'constructor'].includes(current.id)) fail('INVALID_AGENT', 'Agent ID từ config không an toàn để chọn path native.');
  let node = hintedNode;
  if (!node && hostRoot) for (const name of ['vendor/node/node.exe', 'vendor/node/bin/node', 'vendor/node/node']) { const candidate = path.join(hostRoot, name); if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { node = regular(candidate, false, 'Node'); break; } }
  if (!node) node = regular(process.execPath, false, 'Node');
  const nodeRoot = inferredRoot(node, 'node'); if (nodeRoot && hostRoot && nodeRoot !== hostRoot) fail('HOST_CONTEXT_CONFLICT', 'Node đi kèm một host 9B khác; không trộn runtime.');
  let entrypoint = options['openclaw-entrypoint'] ? regular(options['openclaw-entrypoint'], false, 'OpenClaw entrypoint') : null;
  if (!entrypoint) {
    const choices = [];
    if (hostRoot) choices.push(path.join(hostRoot, 'vendor/node_modules/openclaw/openclaw.mjs'));
    else choices.push(path.join(path.dirname(node), 'node_modules/openclaw/openclaw.mjs'), path.resolve(path.dirname(node), '../lib/node_modules/openclaw/openclaw.mjs'), path.resolve(path.dirname(node), '../node_modules/openclaw/openclaw.mjs'));
    const available = [...new Set(choices.filter(file => fs.existsSync(file)).map(file => regular(file, false, 'OpenClaw entrypoint')))];
    if (available.length !== 1) fail('ENTRYPOINT_NOT_UNIQUE', 'Chưa xác định duy nhất native CLI entrypoint; agent truyền --openclaw-entrypoint của đúng host.');
    entrypoint = available[0];
  }
  const entryRoot = inferredRoot(entrypoint, 'entry'); if (entryRoot && hostRoot && entryRoot !== hostRoot) fail('HOST_CONTEXT_CONFLICT', 'Native CLI entrypoint thuộc host 9B khác.');
  if (hostRoot && !inside(hostRoot, entrypoint)) fail('HOST_CONTEXT_CONFLICT', 'Native CLI entrypoint nằm ngoài install root 9B đã xác minh.');
  return { config, stateDir: path.dirname(config), hostRoot, node, entrypoint, agentId: current.id, workspace: current.workspace, configData };
}
function launch(node, file, args, env, cwd, timeout = 90000) {
  return new Promise((resolve, reject) => {
    const child = spawn(node, [file, ...args], { env, cwd, windowsHide: true, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', settled = false;
    const timer = setTimeout(() => { child.kill(); }, timeout);
    const collect = (chunk, output) => { if (output === 'stdout') stdout += chunk.toString('utf8'); else stderr += chunk.toString('utf8'); if (Buffer.byteLength(stdout) + Buffer.byteLength(stderr) > 12 * 1024 * 1024) { child.kill(); if (!settled) { settled = true; clearTimeout(timer); reject(Object.assign(new Error('Helper output limit'), { code: 'HELPER_OUTPUT_LIMIT' })); } } };
    child.stdout.on('data', chunk => collect(chunk, 'stdout')); child.stderr.on('data', chunk => collect(chunk, 'stderr'));
    child.on('error', () => { clearTimeout(timer); if (!settled) { settled = true; reject(Object.assign(new Error('Cannot run helper'), { code: 'HELPER_START_FAILED' })); } });
    child.on('close', code => { clearTimeout(timer); if (!settled) { settled = true; resolve({ code, stdout, stderr }); } });
  });
}
async function jsonCommand(context, file, args, env, code, runner) {
  const result = await runner(context.node, file, args, env, path.dirname(file));
  let data; try { data = JSON.parse(result.stdout); } catch { fail(code, 'Helper chưa trả kết quả JSON đã kiểm; không hiển thị log hoặc thử đường cấu hình khác.'); }
  if (result.code !== 0 || data.ok === false) {
    const nativeCode = data.error?.code;
    fail(typeof nativeCode === 'string' && /^[A-Z][A-Z0-9_]{1,80}$/.test(nativeCode) ? nativeCode : code, 'Bước native/helper chưa hoàn tất. Dừng ở đây; không ghi config trực tiếp hoặc thử đường khác sau khi bị từ chối.');
  }
  return data;
}
function effectiveAllowed(config, agent) {
  const entry = config.agents?.entries?.[agent]; if (!object(entry)) return false;
  const list = Object.hasOwn(entry, 'skills') ? entry.skills : config.agents.defaults?.skills;
  if (list === undefined) return true;
  if (!Array.isArray(list) || list.some(item => typeof item !== 'string')) fail('INVALID_ALLOWLIST', 'Danh sách skill chưa hợp lệ; không thay giới hạn bằng mặc định mới.');
  return list.includes(SKILL);
}
function sourceComplete(source, installer) {
  const plan = installer.sourcePlan(source), paths = new Set(plan.files.map(item => item.path));
  for (const name of ['scripts/contentlab.cjs', 'scripts/onboarding.cjs', 'scripts/sheet.cjs', 'scripts/production.cjs', 'scripts/render.cjs', 'scripts/setup-renderer.cjs', 'references/onboarding.md', 'references/production.md', 'references/sheets.md', 'references/host-adapters.md', 'references/sheet-template.json']) if (!paths.has(name)) fail('SOURCE_INCOMPLETE', 'Gói chưa đủ helper/reference bắt buộc; không cài bản rút gọn rồi nhận hoàn tất.');
  const reference = read(path.join(source, 'package/skills', PACKAGE, 'references/sheet-template.json'));
  for (const [asset, expected] of [[reference.xlsxAsset, reference.xlsxSha256], [reference.schemaAsset, reference.schemaSha256]]) {
    relative(asset); const mapped = plan.files.find(file => file.path === 'assets/' + asset);
    if (!mapped || mapped.sha256 !== expected) fail('SOURCE_INCOMPLETE', 'Gói thiếu/sai mẫu Sheet đi kèm; không tạo bảng trắng thay thế.');
  }
  for (const number of Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, '0'))) if (!plan.files.some(item => item.path.startsWith('assets/knowledge/' + number + '-'))) fail('SOURCE_INCOMPLETE', 'Gói chưa có đủ mười mẫu Tri thức.');
  return plan;
}
function verifyInstall(context, receipt, installer) {
  const target = contained(context.workspace, path.join(context.workspace, 'skills', PACKAGE));
  const file = contained(context.workspace, path.join(context.workspace, PACKAGE + '-data/install/receipt.json'));
  const saved = read(file);
  if (receipt.verified !== true || saved.verified !== true || saved.package_id !== PACKAGE || saved.host !== '9bizclaw' || saved.status !== 'files-installed' || saved.workspace !== context.workspace || saved.target !== target || receipt.target !== target || receipt.receipt !== file || !Array.isArray(saved.files)) fail('INSTALL_NOT_VERIFIED', 'Receipt cài file chưa khớp đúng host/agent workspace.');
  for (const item of saved.files) { relative(item.path); contained(context.workspace, path.join(target, item.path)); }
  const actual = installer.inventory(target);
  if (JSON.stringify(actual) !== JSON.stringify(saved.files) || crypto.createHash('sha256').update(JSON.stringify(actual)).digest('hex') !== saved.inventory_sha256) fail('INSTALL_NOT_VERIFIED', 'Inventory cài thật không khớp SHA256 receipt.');
  const skill = fs.readFileSync(path.join(target, 'SKILL.md'), 'utf8');
  if (!/^---\r?\n[\s\S]*?^name:\s*["']?contentlab["']?\s*$/m.test(skill)) fail('INSTALL_NOT_VERIFIED', 'Skill chưa có đúng tên slash command contentlab.');
  return { target, receiptPath: file, version: saved.version, files: actual.length, releaseManifestVerified: saved.release_manifest_verified === true };
}
function writeReport(context, file, value) {
  contained(context.workspace, file); const temporary = contained(context.workspace, file + '.tmp-' + crypto.randomUUID());
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); fs.renameSync(temporary, file);
}
async function run(options = {}, dependencies = {}) {
  const result = { ok: false, packageId: PACKAGE, host: '9bizclaw', installed: false, configured: false, configuredScope: 'current-agent-skill-allowlist', chatVerified: false, onboardingRequired: true, stage: 'discovery' };
  let context, descriptor, lock, reportPath;
  try {
    const env = dependencies.env || process.env;
    context = discover(options, env);
    const source = regular(options.source || __dirname, true, 'Gốc gói giải nén');
    if (source === context.workspace || inside(source, context.workspace) || inside(context.workspace, source)) fail('SOURCE_WORKSPACE_OVERLAP', 'Gói giải nén và workspace agent phải là hai cây riêng.');
    const installer = require(path.join(source, 'install.cjs')), activation = require(path.join(source, 'activate-9b.cjs'));
    if (typeof installer.sourcePlan !== 'function' || typeof installer.inventory !== 'function' || typeof activation.otherHash !== 'function') fail('SOURCE_INCOMPLETE', 'Gói chưa có bộ cài/kích hoạt đầy đủ.');
    sourceComplete(source, installer);
    const beforeHash = activation.otherHash(context.configData, context.agentId);
    const runner = dependencies.launch || launch;
    const childEnv = { ...env, OPENCLAW_CONFIG_PATH: context.config, OPENCLAW_STATE_DIR: context.stateDir, OPENCLAW_AGENT_ID: context.agentId, OPENCLAW_WORKSPACE_DIR: context.workspace };
    const nodeVersion = await runner(context.node, '-p', ['process.versions.node'], childEnv, source, 15000);
    if (nodeVersion.code !== 0 || !/^\d+\.\d+\.\d+\s*$/.test(nodeVersion.stdout) || Number(nodeVersion.stdout.split('.')[0]) < 22) fail('NODE_VERSION', 'Node của host phải chạy được và từ 22 trở lên.');
    Object.assign(result, { agentId: context.agentId, workspace: context.workspace, version: read(path.join(source, 'package.json')).version });
    if (options.check) {
      let installed = false;
      if (fs.existsSync(path.join(context.workspace, 'skills', PACKAGE))) {
        const saved = read(contained(context.workspace, path.join(context.workspace, PACKAGE + '-data/install/receipt.json'))); verifyInstall(context, saved, installer); installed = true;
      }
      return { ...result, ok: true, stage: 'checked', status: 'ready-to-install', dryRun: true, installed, configured: effectiveAllowed(context.configData, context.agentId), message: 'Đã xác định đúng host/agent/workspace và gói đầy đủ. Chưa cài, chưa đổi config, chưa kiểm chat hoặc onboarding.' };
    }
    const data = contained(context.workspace, path.join(context.workspace, PACKAGE + '-data/install')); fs.mkdirSync(data, { recursive: true });
    lock = contained(context.workspace, path.join(data, '.install-9b.lock')); reportPath = contained(context.workspace, path.join(data, 'install-9b-receipt.json'));
    try { descriptor = fs.openSync(lock, 'wx', 0o600); } catch (error) { if (error.code === 'EEXIST') fail('INSTALL_BUSY', 'Một lượt điều phối cài 9B khác đang chạy; không kích hoạt song song.'); throw error; }
    fs.writeFileSync(descriptor, JSON.stringify({ package_id: PACKAGE, pid: process.pid, agentId: context.agentId, startedAt: new Date().toISOString() }));
    result.stage = 'file-install';
    const installed = await jsonCommand(context, path.join(source, 'install.cjs'), ['--host', '9bizclaw', '--workspace', context.workspace], childEnv, 'FILE_INSTALL_FAILED', runner);
    const evidence = verifyInstall(context, installed, installer);
    Object.assign(result, { installed: true, installation: { ...evidence, changed: installed.changed, installMode: installed.install_mode }, receiptPath: reportPath });
    if (activation.otherHash(read(context.config), context.agentId) !== beforeHash) fail('OTHER_CONFIG_CHANGED', 'Cấu hình ngoài scope thay đổi trong lúc cài; chưa gọi kích hoạt.');
    result.stage = 'native-activation';
    const configured = await jsonCommand(context, path.join(source, 'activate-9b.cjs'), ['--workspace', context.workspace, '--agent', context.agentId, '--config', context.config, '--openclaw-entrypoint', context.entrypoint, '--node', context.node, '--apply'], childEnv, 'ACTIVATION_FAILED', runner);
    const after = read(context.config);
    if (activation.otherHash(after, context.agentId) !== beforeHash) fail('OTHER_CONFIG_CHANGED', 'Cấu hình ngoài danh sách skill mục tiêu đã đổi; không tự rollback hoặc ghi lại config.');
    if (configured.configured !== true || configured.agentId !== context.agentId || configured.workspace !== context.workspace || !effectiveAllowed(after, context.agentId)) fail('CONFIGURATION_NOT_VERIFIED', 'Native activation chưa được đọc lại đúng agent/workspace.');
    result.configured = true; result.activation = { changed: configured.changed === true, status: configured.status, otherSettingsUnchanged: true };
    result.stage = 'prepare-assets';
    const entry = contained(context.workspace, path.join(evidence.target, 'scripts/contentlab.cjs'));
    const session = options.session || 'install-preview-' + crypto.randomUUID();
    const menu = await jsonCommand(context, entry, ['menu', '--workspace', context.workspace, '--session', session], childEnv, 'MENU_PREPARATION_FAILED', runner);
    const menuPath = contained(context.workspace, menu.mediaPath || ''), png = fs.readFileSync(menuPath);
    const packagedMenu = fs.readFileSync(contained(context.workspace, path.join(evidence.target, 'assets/menu/he-thong-content-ngang-v2.png')));
    if (!menu.ok || menu.startsProduction !== false || menu.attachment !== 'MEDIA:' + menuPath || menu.items?.length !== 9 || menu.items[1].label !== 'Bài đăng kèm sản phẩm' || png.length < 33 || !png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || png.toString('ascii', 12, 16) !== 'IHDR' || png.readUInt32BE(16) <= png.readUInt32BE(20) || !png.equals(packagedMenu)) fail('MENU_PREPARATION_FAILED', 'Chưa xác minh được menu ngang PNG đủ chín định dạng.');
    const template = await jsonCommand(context, entry, ['sheet', 'template', '--workspace', context.workspace], childEnv, 'TEMPLATE_PREPARATION_FAILED', runner);
    if (template.template?.verified !== true) fail('TEMPLATE_PREPARATION_FAILED', 'Mẫu Sheet chưa được helper kiểm SHA256.');
    for (const [key, hashKey] of [['xlsxPath', 'xlsxSha256'], ['schemaPath', 'schemaSha256']]) {
      contained(context.workspace, template.template[key] || ''); regular(template.template[key], false, 'Template asset');
      if (crypto.createHash('sha256').update(fs.readFileSync(template.template[key])).digest('hex') !== template.template[hashKey]) fail('TEMPLATE_PREPARATION_FAILED', 'SHA256 file mẫu thực không khớp kết quả helper.');
    }
    verifyInstall(context, installed, installer);
    if (activation.otherHash(read(context.config), context.agentId) !== beforeHash) fail('OTHER_CONFIG_CHANGED', 'Cấu hình khác đã đổi sau khi chuẩn bị tài sản; không xác nhận hoàn tất.');
    if (!effectiveAllowed(read(context.config), context.agentId)) fail('CONFIGURATION_NOT_VERIFIED', 'Danh sách skill mục tiêu đã đổi; chưa xác nhận cấu hình.');
    Object.assign(result, { ok: true, stage: 'complete', status: 'installed-and-configured', menu: { mediaPath: menuPath, attachment: menu.attachment, prepared: true, session, items: menu.items, shortcut: menu.shortcut, displayedInChat: false }, template: template.template, next: 'Dùng /contentlab hoặc hệ thống content ở lượt tiếp theo trong cùng chat để kiểm snapshot skill và attachment thật. Agent phải đọc hồ sơ/Tri thức/ảnh qua native tools rồi chạy assess từ nguồn thực; cài gói và đếm file không hoàn tất onboarding.' });
    writeReport(context, reportPath, result); return result;
  } catch (error) {
    const code = typeof error.code === 'string' && /^[A-Z][A-Z0-9_]{1,80}$/.test(error.code) ? error.code : 'INSTALL_9B_FAILED';
    if (['OTHER_CONFIG_CHANGED', 'CONFIGURATION_NOT_VERIFIED'].includes(code)) result.configured = false;
    Object.assign(result, { ok: false, status: result.installed ? 'files-installed-incomplete' : 'not-installed', error: { code, message: error.publicMessage ? error.message : 'Chưa hoàn tất cài/kích hoạt 9B. Không hiển thị config, credential hoặc log CLI; không thử route khác.' } });
    if (context && reportPath && descriptor !== undefined) { try { writeReport(context, reportPath, result); } catch {} }
    return result;
  } finally { if (descriptor !== undefined) { fs.closeSync(descriptor); fs.unlinkSync(lock); } }
}
async function main(argv = process.argv.slice(2), dependencies = {}) { const options = parse(argv); return options.help ? { help: true, usage: USAGE } : run(options, dependencies); }
module.exports = { main, run, parse, discover, launch, sourceComplete, effectiveAllowed, verifyInstall };
if (require.main === module) main().then(value => { process.stdout.write((value.help ? value.usage : JSON.stringify(value, null, 2)) + '\n'); if (value.ok === false) process.exitCode = 1; }).catch(error => { process.stdout.write(JSON.stringify({ ok: false, installed: false, configured: false, chatVerified: false, onboardingRequired: true, error: { code: error.code || 'INVALID_ARGUMENT', message: error.code ? error.message : 'Không đọc được tham số điều phối; xem --help.' } }, null, 2) + '\n'); process.exitCode = 1; });
