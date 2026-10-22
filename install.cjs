#!/usr/bin/env node
'use strict';

// Dependency-free file installer. Host activation is deliberately a separate, verified step.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const PACKAGE_ID = 'freeup-content-gon-lab';
const DATA_DIR = 'freeup-content-gon-lab-data';
const OWNER_FILE = '.freeup-content-gon-lab-owner.json';
const RECEIPT_SCHEMA = 1;
const MENU = 'he-thong-content-ngang-v2.png';
const sha = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const hashFile = file => sha(fs.readFileSync(file));
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));

function fail(message) { throw new Error(message); }
function inside(root, target) {
  const relative = path.relative(root, target);
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}
function relativePath(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.startsWith('/') || value.split('/').some(part => !part || part === '.' || part === '..' || /[<>:"|?*\x00-\x1f]/.test(part) || /[. ]$/.test(part) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) fail('Đường dẫn tương đối trong gói không hợp lệ.');
  return value;
}
function checked(root, target) {
  const absolute = path.resolve(target);
  if (!inside(root, absolute)) fail('Đường dẫn phải nằm trong workspace đã xác minh.');
  let current = root;
  if (fs.lstatSync(root).isSymbolicLink()) fail('Không cài qua liên kết workspace.');
  for (const segment of path.relative(root, absolute).split(path.sep)) {
    current = path.join(current, segment);
    try { if (fs.lstatSync(current).isSymbolicLink()) fail('Không cài qua liên kết thư mục/file.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return absolute;
}
function listFiles(root, relative = '') {
  const base = path.join(root, relative);
  if (fs.lstatSync(base).isSymbolicLink()) fail('Gói hoặc thư mục cài chứa liên kết không được hỗ trợ.');
  const result = [];
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) fail('Gói hoặc thư mục cài chứa liên kết không được hỗ trợ.');
    const item = relative ? `${relative}/${entry.name}` : entry.name;
    relativePath(item);
    if (entry.isDirectory()) result.push(...listFiles(root, item));
    else if (entry.isFile()) result.push(item);
    else fail('Gói chứa loại file không được hỗ trợ.');
  }
  return result.sort();
}
function inventory(root) {
  return listFiles(root).map(item => ({ path: item, sha256: hashFile(path.join(root, item)), size: fs.statSync(path.join(root, item)).size }));
}
function sameInventory(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function atomicJson(root, target, value) {
  checked(root, target);
  const temporary = checked(root, `${target}.tmp-${crypto.randomUUID()}`);
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  try { fs.renameSync(temporary, target); }
  catch (error) { try { fs.unlinkSync(temporary); } catch {} throw error; }
}
function ownerAt(target) {
  const file = path.join(target, OWNER_FILE);
  if (!fs.existsSync(file)) fail('Thư mục skill đã có nhưng không thuộc bộ lab này; không ghi đè.');
  const owner = readJson(file);
  if (owner.package_id !== PACKAGE_ID || owner.schema_version !== 1) fail('Thư mục skill thuộc chủ khác; không ghi đè.');
  return owner;
}
function validateReceipt(receipt, workspace, target) {
  if (receipt.package_id !== PACKAGE_ID || receipt.schema_version !== RECEIPT_SCHEMA || receipt.workspace !== workspace || receipt.target !== target) fail('Receipt cài đặt không thuộc đúng bộ lab/workspace này.');
}

function renameRetry(root, from, to, platform = process.platform) {
  for (let attempt = 0; ; attempt++) {
    checked(root, from); checked(root, to);
    try { fs.renameSync(from, to); return; }
    catch (error) {
      if (platform !== 'win32' || !['EPERM', 'EACCES'].includes(error.code) || attempt >= 2) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
    }
  }
}
function directories(root, relative = '') {
  const result = [];
  for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
    if (entry.isSymbolicLink()) fail('Không cập nhật qua liên kết thư mục/file.');
    if (entry.isDirectory()) { const item = relative ? `${relative}/${entry.name}` : entry.name; relativePath(item); result.push(item, ...directories(root, item)); }
  }
  return result.sort();
}
function atomicFile(root, source, target, expected, platform) {
  checked(root, source); checked(root, target);
  fs.mkdirSync(checked(root, path.dirname(target)), { recursive: true });
  const temporary = checked(root, `${target}.freeup-install-tmp-${crypto.randomUUID()}`);
  try {
    fs.copyFileSync(source, temporary, fs.constants.COPYFILE_EXCL);
    if (hashFile(temporary) !== expected.sha256 || fs.statSync(temporary).size !== expected.size) fail('File tạm cập nhật không khớp SHA256.');
    renameRetry(root, temporary, target, platform);
  } catch (error) {
    try { if (fs.existsSync(temporary)) { checked(root, temporary); fs.unlinkSync(temporary); } } catch {}
    throw error;
  }
}
function removeEmptyDirectory(root, directory) {
  checked(root, directory);
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) fail('Không thể đổi cấu trúc thư mục skill khi còn file chưa xác minh.');
    removeEmptyDirectory(root, checked(root, path.join(directory, entry.name)));
  }
  // Non-recursive removal of a verified empty directory only; the skill root is never removed.
  fs.rmdirSync(checked(root, directory));
}
function replaceOwnedFiles(root, target, source, wanted, allowed, archive, platform) {
  checked(root, target); checked(root, source);
  const current = inventory(target), desired = new Map(wanted.map(file => [file.path, file]));
  for (const file of current) if (!allowed.has(file.path)) fail('Skill có file ngoài receipt/giao dịch; không xóa hoặc ghi đè khi cập nhật tại chỗ.');
  for (const file of current) {
    if (desired.has(file.path)) continue;
    const from = checked(root, path.join(target, file.path)), to = checked(root, path.join(archive, file.path));
    fs.mkdirSync(checked(root, path.dirname(to)), { recursive: true });
    renameRetry(root, from, to, platform);
  }
  // Keep the old owner/version and entrypoint until the other payload files are in place.
  const rank = file => file.path === OWNER_FILE ? 2 : file.path === 'SKILL.md' ? 1 : 0;
  for (const file of [...wanted].sort((a, b) => rank(a) - rank(b) || a.path.localeCompare(b.path))) {
    const output = checked(root, path.join(target, file.path));
    if (fs.existsSync(output) && fs.statSync(output).isDirectory()) removeEmptyDirectory(root, output);
    if (fs.existsSync(output) && hashFile(output) === file.sha256 && fs.statSync(output).size === file.size) continue;
    atomicFile(root, checked(root, path.join(source, file.path)), output, file, platform);
  }
  if (!sameInventory(inventory(target), wanted)) fail('Inventory cập nhật từng file chưa khớp SHA256.');
}
function prepareInPlace(root, target, stage, backup, receiptFile, previous, wanted) {
  if (!previous || previous.verified !== true || previous.status !== 'files-installed' || !Array.isArray(previous.files)) fail('Cần receipt đã xác minh của đúng bộ lab để cập nhật từng file.');
  const known = new Set();
  for (const file of previous.files) {
    relativePath(file.path);
    if (known.has(file.path) || !/^[a-f0-9]{64}$/.test(file.sha256) || !Number.isSafeInteger(file.size) || file.size < 0) fail('Inventory receipt cũ không hợp lệ để cập nhật từng file.');
    known.add(file.path);
  }
  if (!known.has(OWNER_FILE)) fail('Receipt cũ thiếu dấu sở hữu skill.');
  checked(root, target); ownerAt(target);
  const before = inventory(target), beforeDirectories = directories(target);
  for (const file of before) if (!known.has(file.path)) fail('Skill có file chưa thuộc receipt; giữ nguyên thay vì cập nhật tại chỗ.');
  fs.mkdirSync(checked(root, backup), { recursive: true });
  for (const directory of beforeDirectories) fs.mkdirSync(checked(root, path.join(backup, directory)), { recursive: true });
  for (const file of before) {
    const from = checked(root, path.join(target, file.path)), to = checked(root, path.join(backup, file.path));
    fs.mkdirSync(checked(root, path.dirname(to)), { recursive: true });
    fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL);
  }
  if (!sameInventory(inventory(backup), before)) fail('Chưa xác minh được backup đầy đủ; không cập nhật tại chỗ.');
  const savedReceipt = checked(root, path.join(path.dirname(backup), 'receipt.json'));
  if (!fs.existsSync(savedReceipt) || hashFile(savedReceipt) !== hashFile(receiptFile)) fail('Backup receipt không khớp; không cập nhật tại chỗ.');
  const journalFile = checked(root, path.join(path.dirname(backup), 'in-place-transaction.json'));
  const journal = { schema_version: 1, package_id: PACKAGE_ID, target, backup, staged_source: stage, state: 'prepared', before, before_directories: beforeDirectories, wanted, prepared_at: new Date().toISOString() };
  atomicJson(root, journalFile, journal);
  return { before, beforeDirectories, allowed: new Set([...before.map(file => file.path), ...wanted.map(file => file.path)]), journalFile, journal, savedReceipt, receiptFile };
}
function rollbackInPlace(root, target, backup, transaction, platform) {
  try { atomicJson(root, transaction.journalFile, { ...transaction.journal, state: 'rolling-back' }); } catch {}
  replaceOwnedFiles(root, target, backup, transaction.before, transaction.allowed, checked(root, path.join(path.dirname(backup), 'removed-during-rollback')), platform);
  for (const directory of transaction.beforeDirectories) fs.mkdirSync(checked(root, path.join(target, directory)), { recursive: true });
  const originalDirectories = new Set(transaction.beforeDirectories);
  for (const directory of directories(target).sort((a, b) => b.split('/').length - a.split('/').length)) {
    const full = checked(root, path.join(target, directory));
    if (!originalDirectories.has(directory) && fs.readdirSync(full).length === 0) fs.rmdirSync(full);
  }
  const saved = { sha256: hashFile(transaction.savedReceipt), size: fs.statSync(transaction.savedReceipt).size };
  atomicFile(root, transaction.savedReceipt, checked(root, transaction.receiptFile), saved, platform);
  try { atomicJson(root, transaction.journalFile, { ...transaction.journal, state: 'rolled-back', rolled_back_at: new Date().toISOString() }); } catch {}
}

function sourcePlan(source) {
  const packageFile = path.join(source, 'package.json');
  const packageInfo = readJson(packageFile);
  if (packageInfo.name !== PACKAGE_ID || typeof packageInfo.version !== 'string' || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(packageInfo.version)) fail('package.json không đúng bộ Content Gọn lab hoặc phiên bản không hợp lệ.');
  const skill = path.join(source, 'package', 'skills', PACKAGE_ID);
  if (!fs.existsSync(path.join(skill, 'SKILL.md'))) fail('Thiếu package/skills/freeup-content-gon-lab/SKILL.md. Hãy giải nén bản phát hành đầy đủ.');
  const mapping = new Map();
  const portableNames = new Map();
  function add(file, destination) {
    relativePath(destination);
    const portable = destination.normalize('NFC').toLowerCase();
    if (portableNames.has(portable) && portableNames.get(portable) !== destination) fail('Tên file trong gói trùng nhau khi chuyển hệ điều hành.');
    portableNames.set(portable, destination);
    if (destination === OWNER_FILE) fail('Gói nguồn không được tự mang dấu sở hữu của bản cài.');
    const full = path.resolve(file);
    checked(source, full);
    const item = { source: full, path: destination, sha256: hashFile(full), size: fs.statSync(full).size };
    if (mapping.has(destination) && mapping.get(destination).sha256 !== item.sha256) fail(`Hai nguồn khác nhau ghi cùng tài sản: ${destination}`);
    mapping.set(destination, item);
  }
  for (const file of listFiles(skill)) add(path.join(skill, file), file);
  const knowledge = path.join(source, 'templates', 'knowledge');
  for (const file of listFiles(knowledge)) if (file.endsWith('.md')) add(path.join(knowledge, file), `assets/knowledge/${file}`);
  const onboarding = path.join(source, 'onboarding');
  for (const file of listFiles(onboarding)) if (!file.includes('/') && file.endsWith('.json')) add(path.join(onboarding, file), `assets/onboarding/${file}`);
  for (const required of ['menu-catalog.json', 'knowledge-catalog.json', 'customer-paths.json']) if (!mapping.has(`assets/onboarding/${required}`)) fail(`Thiếu onboarding/${required}.`);
  const sheets = path.join(source, 'templates', 'sheets');
  if (fs.existsSync(sheets)) for (const file of listFiles(sheets)) if (/\.(?:json|xlsx)$/.test(file)) add(path.join(sheets, file), `assets/sheets/${file}`);
  if (!mapping.has('assets/sheets/content-sheet-schema.json')) fail('Thiếu templates/sheets/content-sheet-schema.json.');
  const [major, minor] = packageInfo.version.split('.').map(Number);
  if (major > 0 || minor >= 2) {
    const reference = mapping.get('references/sheet-template.json');
    if (!reference || !mapping.has('references/sheet-template.md')) fail('Thiếu reference Sheet mẫu bắt buộc.');
    const contract = readJson(reference.source);
    for (const [name, expected] of [[contract.xlsxAsset, contract.xlsxSha256], [contract.schemaAsset, contract.schemaSha256]]) {
      const item = mapping.get(`assets/${name}`);
      if (!item || item.sha256 !== expected) fail('Sheet mẫu thiếu hoặc sai hash so với reference; không tạo bảng thay thế.');
    }
  }
  const menuFile = path.join(source, 'assets', 'menu', MENU);
  add(menuFile, `assets/menu/${MENU}`);
  const menuBytes = fs.readFileSync(menuFile);
  if (menuBytes.length < 33 || !menuBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || menuBytes.toString('ascii', 12, 16) !== 'IHDR' || menuBytes.readUInt32BE(16) <= menuBytes.readUInt32BE(20) || !menuBytes.readUInt32BE(20)) fail('Menu v2 phải là tệp PNG ngang có dữ liệu ảnh thực.');
  const files = [...mapping.values()].sort((a, b) => a.path.localeCompare(b.path, 'en'));
  const fingerprint = sha(JSON.stringify({ package_id: PACKAGE_ID, version: packageInfo.version, files: files.map(({ path: name, sha256, size }) => ({ path: name, sha256, size })) }));
  const manifestFile = path.join(source, 'release-manifest.json');
  let releaseVerified = false;
  if (fs.existsSync(manifestFile)) {
    const manifest = readJson(manifestFile);
    if (manifest.package_id !== PACKAGE_ID || manifest.version !== packageInfo.version || !Array.isArray(manifest.files)) fail('Release manifest không đúng gói/phiên bản.');
    const seen = new Set();
    for (const item of manifest.files) {
      relativePath(item.path);
      if (seen.has(item.path) || !/^[a-f0-9]{64}$/.test(item.sha256)) fail('Release manifest có mục không hợp lệ hoặc trùng lặp.');
      seen.add(item.path);
      const file = checked(source, path.join(source, item.path));
      if (!fs.existsSync(file) || hashFile(file) !== item.sha256 || fs.statSync(file).size !== item.size) fail(`File phát hành thiếu hoặc sai SHA256: ${item.path}`);
    }
    for (const item of [...files, { source: packageFile }]) {
      const relative = path.relative(source, item.source).split(path.sep).join('/');
      if (!seen.has(relative)) fail(`File cài không được liệt kê trong release manifest: ${relative}`);
    }
    releaseVerified = true;
  }
  return { packageInfo, files, fingerprint, releaseVerified };
}

function discoverWorkspace(env = process.env) {
  const candidates = new Set();
  const add = value => { if (typeof value === 'string' && path.isAbsolute(value) && fs.existsSync(value) && fs.statSync(value).isDirectory()) candidates.add(fs.realpathSync(value)); };
  if (env.FREEUP_CONTENT_LAB_WORKSPACE) {
    add(env.FREEUP_CONTENT_LAB_WORKSPACE);
    if (candidates.size !== 1) fail('FREEUP_CONTENT_LAB_WORKSPACE phải là workspace tuyệt đối đang tồn tại.');
  }
  if (candidates.size === 1) return [...candidates][0];
  const configs = new Set();
  if (env.OPENCLAW_CONFIG_PATH) configs.add(env.OPENCLAW_CONFIG_PATH);
  if (env.OPENCLAW_STATE_DIR) configs.add(path.join(env.OPENCLAW_STATE_DIR, 'openclaw.json'));
  configs.add(path.join(env.HOME || env.USERPROFILE || os.homedir(), '.openclaw', 'openclaw.json'));
  if (env.APPDATA) {
    for (const name of ['9BizClaw-v3', '9bizclaw-v2']) {
      const metadataRoot = path.join(env.APPDATA, name);
      const metadata = path.join(metadataRoot, 'install-root.json');
      try { const root = fs.existsSync(metadata) ? readJson(metadata).path : metadataRoot; if (typeof root === 'string') configs.add(path.join(root, 'openclaw-state', 'openclaw.json')); } catch {}
    }
  }
  for (const file of configs) {
    try {
      const config = readJson(file);
      const agents = Array.isArray(config.agents?.list) ? config.agents.list : Object.entries(config.agents?.entries || {}).map(([id, entry]) => ({ id, ...entry }));
      for (const agent of agents) if (['content-gon-test', PACKAGE_ID].includes(agent.id)) add(agent.workspace || agent.workspaceDir);
    } catch { /* Config contents, including credentials, are never logged. */ }
  }
  if (candidates.size !== 1) fail('Chưa xác định duy nhất workspace agent lab. Tạo/chọn agent lab trong 9B rồi truyền --workspace với đường dẫn tuyệt đối.');
  return [...candidates][0];
}

function detectHost(options = {}) {
  const env = options.env || process.env;
  const requested = options.host || env.FREEUP_CONTENT_HOST || 'auto';
  if (!['auto', 'openclaw', '9bizclaw', 'claude', 'codex'].includes(requested)) fail('--host phải là auto, openclaw, 9bizclaw, claude hoặc codex.');
  if (requested !== 'auto') return requested;
  // Process/host evidence takes precedence over unrelated installed applications.
  if (env.NINEBIZ_INSTALL_ROOT || env.NINEBIZ_CLI_ROOT || env.NINEBIZ_NODE) return '9bizclaw';
  if (env.CLAUDECODE || env.CLAUDE_CODE_ENTRYPOINT) return 'claude';
  if (env.CODEX_THREAD_ID || env.CODEX_INTERNAL_ORIGINATOR_OVERRIDE) return 'codex';
  if (env.OPENCLAW_CONFIG_PATH || env.OPENCLAW_STATE_DIR || env.OPENCLAW_AGENT_ID) return 'openclaw';
  const workspace = options.workspace;
  if (workspace && path.isAbsolute(workspace)) {
    const matches = [['.claude', 'claude'], ['.agents', 'codex']].filter(([dir]) => fs.existsSync(path.join(workspace, dir)));
    if (matches.length === 1) return matches[0][1];
    if (matches.length > 1) fail('Workspace có nhiều host; agent phải truyền --host theo phiên hiện tại.');
  }
  fail('Chưa nhận diện được host. Agent truyền --host theo nền tảng hiện tại; không hỏi khách chọn đường dẫn kỹ thuật.');
}

function rendererStatus(target, source) {
  let puppeteer = false;
  try { require.resolve('puppeteer', { paths: [target, source] }); puppeteer = true; } catch {}
  return {
    node: process.version,
    local_render_script: fs.existsSync(path.join(target, 'scripts', 'render.cjs')),
    puppeteer_module_detected: puppeteer,
    local_png: 'not_verified',
    native_media: 'host_capability_verification_required',
    note: 'Không cần npm để cài/chạy điều phối chat; tạo media cần công cụ native đã kiểm hoặc renderer được kiểm riêng.'
  };
}

function install(options = {}) {
  if (Number(process.versions.node.split('.')[0]) < 22) fail('Cần Node.js 22 trở lên. Agent dùng Node của host hoặc bootstrap để tìm runtime đã có.');
  const sourceInput = options.source || __dirname;
  if (!path.isAbsolute(sourceInput)) fail('--source phải là đường dẫn tuyệt đối.');
  const source = fs.realpathSync(sourceInput);
  const host = (options.host || (options.env || process.env).FREEUP_CONTENT_HOST) ? detectHost(options) : 'openclaw';
  const workspaceInput = options.workspace || (['claude', 'codex'].includes(host) ? process.cwd() : discoverWorkspace(options.env || process.env));
  if (!path.isAbsolute(workspaceInput)) fail('--workspace phải là đường dẫn tuyệt đối.');
  if (!fs.existsSync(workspaceInput) || !fs.statSync(workspaceInput).isDirectory()) fail('Workspace chưa tồn tại. Hãy tạo/chọn workspace agent lab trong 9B trước.');
  if (fs.lstatSync(workspaceInput).isSymbolicLink()) fail('Không cài qua liên kết workspace.');
  const workspace = fs.realpathSync(workspaceInput);
  if (workspace === path.parse(workspace).root || workspace === source || inside(source, workspace) || inside(workspace, source)) fail('Workspace phải là thư mục riêng, không phải gốc ổ đĩa hoặc cây mã nguồn bộ cài.');
  const portable = ['claude', 'codex'].includes(host);
  const target = checked(workspace, path.join(workspace, ...(host === 'claude' ? ['.claude', 'skills', 'contentlab'] : host === 'codex' ? ['.agents', 'skills', 'contentlab'] : ['skills', PACKAGE_ID])));
  const installRoot = checked(workspace, path.join(workspace, DATA_DIR, 'install', ...(portable ? [host] : [])));
  const receiptFile = checked(workspace, path.join(installRoot, 'receipt.json'));
  let previousReceipt = null;
  if (fs.existsSync(receiptFile)) { previousReceipt = readJson(receiptFile); validateReceipt(previousReceipt, workspace, target); }
  if (fs.existsSync(target)) { listFiles(target); ownerAt(target); }
  const plan = options.uninstallLab ? null : sourcePlan(source);
  const dryRun = options.dryRun === true;
  const report = {
    schema_version: RECEIPT_SCHEMA, package_id: PACKAGE_ID,
    version: plan?.packageInfo.version || previousReceipt?.version || null,
    workspace, target, host, receipt: receiptFile,
    operation: options.uninstallLab ? 'uninstall-lab' : 'install',
    dry_run: dryRun,
    activation: 'not_verified',
    customer_data_preserved: true
  };
  if (dryRun) return { ...report, status: 'dry-run', changed: false, file_count: plan?.files.length || 0, source_sha256: plan?.fingerprint || null, release_manifest_verified: plan?.releaseVerified || false };
  fs.mkdirSync(installRoot, { recursive: true });
  const lock = checked(workspace, path.join(installRoot, '.install.lock'));
  let lockHandle;
  try { lockHandle = fs.openSync(lock, 'wx', 0o600); }
  catch (error) { if (error.code === 'EEXIST') fail('Một lượt cài lab khác đang chạy hoặc còn khóa sau khi bị ngắt. Kiểm tiến trình/receipt trước khi xử lý khóa.'); throw error; }
  let stage = null;
  let backup = null;
  let committed = false;
  let targetSwapped = false;
  let transactionId = null;
  let backupMoved = false;
  let inPlace = null;
  const platform = options.platform || process.platform;
  try {
    fs.writeFileSync(lockHandle, JSON.stringify({ package_id: PACKAGE_ID, pid: process.pid, started_at: new Date().toISOString() }));
    // Recheck after obtaining the lock, including links and ownership.
    checked(workspace, target);
    if (fs.existsSync(target)) { listFiles(target); ownerAt(target); }
    if (fs.existsSync(receiptFile)) { previousReceipt = readJson(receiptFile); validateReceipt(previousReceipt, workspace, target); }
    const id = crypto.randomUUID();
    transactionId = id;
    const makeBackup = () => {
      const directory = checked(workspace, path.join(installRoot, 'backups', id));
      fs.mkdirSync(directory, { recursive: true });
      if (fs.existsSync(receiptFile)) fs.copyFileSync(receiptFile, checked(workspace, path.join(directory, 'receipt.json')));
      return checked(workspace, path.join(directory, 'skill'));
    };
    if (options.uninstallLab) {
      report.version = previousReceipt?.version || (fs.existsSync(target) ? ownerAt(target).version : null);
      if (fs.existsSync(target)) { backup = makeBackup(); fs.renameSync(target, backup); backupMoved = true; }
      const receipt = { ...report, status: 'uninstalled', changed: Boolean(backup), verified: !fs.existsSync(target), installed_at: previousReceipt?.installed_at || null, updated_at: new Date().toISOString(), backup, files: [] };
      atomicJson(workspace, receiptFile, receipt);
      validateReceipt(readJson(receiptFile), workspace, target);
      committed = true;
      return receipt;
    }
    fs.mkdirSync(checked(workspace, path.dirname(target)), { recursive: true });
    stage = checked(workspace, path.join(installRoot, `.${PACKAGE_ID}-stage-${id}`));
    fs.mkdirSync(stage);
    for (const file of plan.files) {
      const output = checked(workspace, path.join(stage, file.path));
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.copyFileSync(file.source, output);
      if (hashFile(output) !== file.sha256) fail(`Không kiểm được bản sao: ${file.path}`);
    }
    atomicJson(workspace, path.join(stage, OWNER_FILE), { schema_version: 1, package_id: PACKAGE_ID, version: plan.packageInfo.version });
    const wanted = inventory(stage);
    const unchanged = fs.existsSync(target) && sameInventory(inventory(target), wanted);
    if (unchanged) {
      // Only this validated, freshly-created stage is removed.
      fs.rmSync(checked(workspace, stage), { recursive: true });
      stage = null;
    } else {
      if (fs.existsSync(target)) {
        backup = makeBackup();
        try { renameRetry(workspace, target, backup, platform); backupMoved = true; }
        catch (error) {
          if (platform !== 'win32' || !['EPERM', 'EACCES'].includes(error.code)) throw error;
          inPlace = prepareInPlace(workspace, target, stage, backup, receiptFile, previousReceipt, wanted);
          atomicJson(workspace, inPlace.journalFile, { ...inPlace.journal, state: 'applying' });
          replaceOwnedFiles(workspace, target, stage, wanted, inPlace.allowed, checked(workspace, path.join(path.dirname(backup), 'removed-during-update')), platform);
        }
      }
      if (!inPlace) {
        fs.renameSync(stage, target);
        stage = null;
        targetSwapped = true;
      }
    }
    if (!sameInventory(inventory(target), wanted)) fail('Inventory sau cài không khớp SHA256; chưa công bố cài thành công.');
    const receipt = {
      ...report, status: 'files-installed', changed: !unchanged, verified: true,
      installed_at: previousReceipt?.installed_at || new Date().toISOString(), updated_at: new Date().toISOString(),
      source_sha256: plan.fingerprint, release_manifest_verified: plan.releaseVerified,
      inventory_sha256: sha(JSON.stringify(wanted)), files: wanted, backup,
      install_mode: inPlace ? 'in-place-files' : 'directory-swap',
      staged_source: inPlace ? stage : null,
      capabilities: rendererStatus(target, source),
      next: portable ? `Mở dự án trong ${host}; kiểm host đã phát hiện skill contentlab rồi nhắn “hệ thống content”. Receipt chỉ xác nhận file, chưa xác nhận kích hoạt chat hoặc tài khoản.` : 'Chọn đúng agent; kiểm skills.status/lệnh contentlab của agent rồi nhắn “hệ thống content”. Receipt file chưa xác nhận kích hoạt chat hoặc tạo media.'
    };
    atomicJson(workspace, receiptFile, receipt);
    const readback = readJson(receiptFile);
    validateReceipt(readback, workspace, target);
    if (readback.inventory_sha256 !== sha(JSON.stringify(inventory(target)))) fail('Receipt đọc lại không khớp inventory thực.');
    if (inPlace) atomicJson(workspace, inPlace.journalFile, { ...inPlace.journal, state: 'committed', committed_at: new Date().toISOString() });
    committed = true;
    return receipt;
  } catch (error) {
    if (!committed && inPlace) {
      try { rollbackInPlace(workspace, target, backup, inPlace, platform); }
      catch (rollbackError) {
        error.message += ` Khôi phục từng file chưa hoàn tất (${rollbackError.message}); giữ backup và journal tại ${path.dirname(backup)} để đối chiếu, chưa xác nhận cài thành công.`;
      }
    } else if (!committed && backupMoved && backup && fs.existsSync(backup)) {
      if (fs.existsSync(target)) {
        const failed = checked(workspace, path.join(path.dirname(backup), 'failed-new-skill'));
        fs.renameSync(target, failed);
      }
      fs.renameSync(backup, target);
      const savedReceipt = path.join(path.dirname(backup), 'receipt.json');
      if (fs.existsSync(savedReceipt)) atomicJson(workspace, receiptFile, readJson(savedReceipt));
    } else if (!committed && targetSwapped && fs.existsSync(target)) {
      const failedRoot = checked(workspace, path.join(installRoot, 'backups', transactionId));
      fs.mkdirSync(failedRoot, { recursive: true });
      fs.renameSync(target, checked(workspace, path.join(failedRoot, 'failed-new-skill')));
      if (fs.existsSync(receiptFile)) fs.renameSync(receiptFile, checked(workspace, path.join(failedRoot, 'failed-receipt.json')));
      if (previousReceipt) atomicJson(workspace, receiptFile, previousReceipt);
    }
    throw error;
  } finally {
    fs.closeSync(lockHandle);
    fs.unlinkSync(lock);
    // Failed stages remain identifiable for recovery, rather than risking a broad cleanup.
  }
}

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const argument = argv[i];
    if (argument === '--dry-run') result.dryRun = true;
    else if (argument === '--uninstall-lab') result.uninstallLab = true;
    else if (argument === '--help' || argument === '-h') result.help = true;
    else if (argument === '--workspace' || argument === '--source' || argument === '--host') {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) fail(`Thiếu giá trị ${argument}.`);
      result[argument.slice(2)] = argv[++i];
    } else fail(`Tham số không hỗ trợ: ${argument}`);
  }
  return result;
}
if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log('node install.cjs --host <auto|openclaw|9bizclaw|claude|codex> --workspace <absolute-workspace> [--dry-run] [--uninstall-lab]\nKhông cần Git/npm/API key. Agent nhận diện host và kiểm kích hoạt riêng sau khi cài file.');
    else console.log(JSON.stringify(install(options), null, 2));
  } catch (error) { console.error(`Content Gọn lab: ${error.message}`); process.exitCode = 1; }
}
module.exports = { install, parseArgs, discoverWorkspace, detectHost, sourcePlan, listFiles, inventory, PACKAGE_ID, OWNER_FILE };
