#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const https = require('node:https');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const cp = require('node:child_process');
const PACKAGE_ID = 'freeup-content-gon-lab';
// Official registry metadata checked 2026-10-22. npm 10 supports every Node 22 minor.
const PINS = Object.freeze({
  'puppeteer-core': { version: '24.43.1', integrity: 'sha512-T5ScUMAsmhdNbgDR41AGESYeS6V9MSgetkSnVhhW+gXvzC42VesKCn5ld87gAZDJ6vLHL9GkRvY9WtQWSnwFbw==' },
  'ffmpeg-static': { version: '5.3.0', integrity: 'sha512-H+K6sW6TiIX6VGend0KQwthe+kaceeH/luE8dIZyOP35ik7ahYojDuqlTV1bOrtEwl01sy2HFNGQfi5IDJvotg==' },
  npm: { version: '10.9.9', integrity: 'sha512-1g+6jLQvaIuB4zwvHL7yrXuXcWZwDsCtBX8bbWDqbvJSSr9nPiDDWTHNgwXR27iIcTTW7v3A57hDW9RYv2W4Yg==', tarball: 'https://registry.npmjs.org/npm/-/npm-10.9.9.tgz' }
});
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function problem(code, message) { const error = new Error(message); error.code = code; return error; }
function fail(code, message) { throw problem(code, message); }
function read(file) { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
function inside(root, target) { const r = path.relative(root, target); return r !== '' && r !== '..' && !r.startsWith(`..${path.sep}`) && !path.isAbsolute(r); }
function safePath(root, target) {
  const full = path.resolve(target);
  if (!inside(root, full)) fail('PATH_OUTSIDE_WORKSPACE', 'Đường dẫn trình dựng phải nằm trong workspace lab.');
  let part = root;
  if (fs.lstatSync(root).isSymbolicLink()) fail('UNSAFE_LINK', 'Không dùng workspace liên kết.');
  for (const segment of path.relative(root, full).split(path.sep)) {
    part = path.join(part, segment);
    try { if (fs.lstatSync(part).isSymbolicLink()) fail('UNSAFE_LINK', 'Đường dẫn trình dựng đi qua symlink/junction.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return full;
}
function workspace(value) {
  if (typeof value !== 'string' || !path.isAbsolute(value)) fail('WORKSPACE_REQUIRED', 'Cần --workspace tuyệt đối của agent lab.');
  if (!fs.existsSync(value) || !fs.statSync(value).isDirectory()) fail('WORKSPACE_MISSING', 'Workspace lab phải tồn tại trước khi bổ sung trình dựng.');
  if (fs.lstatSync(value).isSymbolicLink()) fail('UNSAFE_LINK', 'Không dùng workspace liên kết.');
  const root = fs.realpathSync(value);
  if (root === path.parse(root).root) fail('WORKSPACE_REQUIRED', 'Không dùng gốc ổ đĩa làm workspace lab.');
  return root;
}
function atomicJson(root, file, value) {
  safePath(root, file); const temporary = safePath(root, `${file}.tmp-${crypto.randomUUID()}`);
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  try { fs.renameSync(temporary, file); } catch (error) { try { fs.unlinkSync(temporary); } catch {} throw error; }
}
function executable(file, platform = process.platform) {
  try { if (!path.isAbsolute(file) || !fs.statSync(file).isFile()) return null; if (platform !== 'win32') fs.accessSync(file, fs.constants.X_OK); return fs.realpathSync(file); } catch { return null; }
}
function pathExecutables(names, env = process.env, platform = process.platform) {
  const directories = String(env.PATH || env.Path || '').split(platform === 'win32' ? ';' : ':').filter(Boolean);
  const result = [];
  for (const directory of directories) for (const name of names) {
    const found = executable(path.join(directory.replace(/^"|"$/g, ''), name), platform); if (found) result.push(found);
  }
  return [...new Set(result)];
}
function findBrowser(explicit, env = process.env, platform = process.platform) {
  if (explicit) { const found = executable(explicit, platform); if (!found) fail('BROWSER_NOT_FOUND', '--browser-executable phải là đường dẫn tuyệt đối đến Chrome/Edge chạy được.'); return found; }
  const candidates = [];
  if (platform === 'win32') {
    for (const root of [env.ProgramFiles, env.PROGRAMFILES, env['ProgramFiles(x86)'], env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean)) {
      candidates.push(path.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'), path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'), path.join(root, 'Chromium', 'Application', 'chrome.exe'));
    }
  } else if (platform === 'darwin') {
    for (const root of ['/Applications', path.join(env.HOME || os.homedir(), 'Applications')]) candidates.push(path.join(root, 'Microsoft Edge.app/Contents/MacOS/Microsoft Edge'), path.join(root, 'Google Chrome.app/Contents/MacOS/Google Chrome'), path.join(root, 'Chromium.app/Contents/MacOS/Chromium'));
  }
  for (const candidate of candidates) { const found = executable(candidate, platform); if (found) return found; }
  return pathExecutables(platform === 'win32' ? ['msedge.exe', 'chrome.exe'] : ['microsoft-edge', 'microsoft-edge-stable', 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'], env, platform)[0] || null;
}
function npmCandidates(node = process.execPath, env = process.env, platform = process.platform) {
  const directory = path.dirname(node), parent = path.dirname(directory);
  const result = [path.join(directory, 'node_modules/npm/bin/npm-cli.js'), path.join(parent, 'lib/node_modules/npm/bin/npm-cli.js')];
  if (platform !== 'win32') result.push('/usr/share/nodejs/npm/bin/npm-cli.js', '/usr/lib/node_modules/npm/bin/npm-cli.js', '/usr/local/lib/node_modules/npm/bin/npm-cli.js');
  for (const launcher of pathExecutables(platform === 'win32' ? ['npm.cmd', 'npm.exe', 'npm'] : ['npm'], env, platform)) {
    if (path.basename(launcher) === 'npm-cli.js') result.push(launcher);
    const base = path.dirname(launcher); result.push(path.join(base, 'node_modules/npm/bin/npm-cli.js'), path.join(base, '../lib/node_modules/npm/bin/npm-cli.js'));
  }
  return [...new Set(result.map(file => path.resolve(file)))];
}
function findNpmCli(options = {}, dependencies = {}) {
  const spawnSync = dependencies.spawnSync || cp.spawnSync;
  for (const candidate of npmCandidates(options.node || process.execPath, options.env || process.env, options.platform || process.platform)) {
    try {
      const info = read(path.resolve(candidate, '../../package.json'));
      if (info.name !== 'npm' || !/^\d+\.\d+\.\d+/.test(info.version) || Number(info.version.split('.')[0]) < 10) continue;
      const result = spawnSync(options.node || process.execPath, [candidate, '--version'], { encoding: 'utf8', windowsHide: true, timeout: 15000 });
      if (result.status === 0 && String(result.stdout).trim() === info.version) return fs.realpathSync(candidate);
    } catch {}
  }
  return null;
}
function registryUrl(value) {
  let url; try { url = new URL(value); } catch { fail('UNTRUSTED_DOWNLOAD', 'Địa chỉ tải npm không hợp lệ.'); }
  if (url.protocol !== 'https:' || url.hostname !== 'registry.npmjs.org' || url.port && url.port !== '443' || url.username || url.password) fail('UNTRUSTED_DOWNLOAD', 'Chỉ tải npm bootstrap từ registry.npmjs.org qua HTTPS.');
  return url;
}
function fetchRegistry(value, redirects = 0) {
  const url = registryUrl(value);
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'User-Agent': 'FreeUp-Content-Gon-Lab/0.1', Accept: 'application/octet-stream' } }, response => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        response.resume(); if (redirects >= 3 || !response.headers.location) return reject(problem('DOWNLOAD_REDIRECT', 'Quá nhiều chuyển hướng khi tải npm.'));
        let next; try { next = registryUrl(new URL(response.headers.location, url).href).href; } catch (error) { return reject(error); }
        return fetchRegistry(next, redirects + 1).then(resolve, reject);
      }
      if (response.statusCode !== 200) { response.resume(); return reject(problem('NPM_BOOTSTRAP_DOWNLOAD_FAILED', `Không tải được npm bootstrap (HTTP ${response.statusCode}).`)); }
      let size = 0; const chunks = [];
      response.on('data', chunk => { size += chunk.length; if (size > 25 * 1024 * 1024) { request.destroy(problem('DOWNLOAD_TOO_LARGE', 'Gói npm bootstrap vượt giới hạn kích thước.')); return; } chunks.push(chunk); });
      response.on('end', () => resolve(Buffer.concat(chunks))); response.on('error', reject);
    });
    request.setTimeout(30000, () => request.destroy(problem('DOWNLOAD_TIMEOUT', 'Tải npm bootstrap vượt thời gian.')));
    request.on('error', reject);
  });
}
function verifyIntegrity(bytes, integrity) {
  if (typeof integrity !== 'string' || !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(integrity)) fail('INTEGRITY_INVALID', 'Cần SHA512 integrity hợp lệ.');
  const expected = Buffer.from(integrity.slice(7), 'base64'), actual = crypto.createHash('sha512').update(bytes).digest();
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) fail('INTEGRITY_MISMATCH', 'SHA512 npm bootstrap không khớp; không giải nén hoặc chạy gói tải về.');
  return true;
}
function tarString(bytes, start, length) { const end = bytes.indexOf(0, start); return bytes.toString('utf8', start, end >= start && end < start + length ? end : start + length); }
function tarNumber(bytes, start, length) {
  const value = tarString(bytes, start, length).trim(); if (!/^[0-7]*$/.test(value)) fail('TAR_INVALID', 'Số trong tar không hợp lệ.');
  const number = value ? parseInt(value, 8) : 0; if (!Number.isSafeInteger(number) || number < 0) fail('TAR_INVALID', 'Kích thước tar không hợp lệ.'); return number;
}
function tarPath(value) {
  const name = value.replace(/\/$/, '');
  if (!name.startsWith('package/') && name !== 'package') fail('TAR_PATH', 'Tar npm phải có gốc package/.');
  const relative = name === 'package' ? '' : name.slice(8);
  if (relative.includes('\\') || relative.startsWith('/') || relative.split('/').some(part => part === '.' || part === '..' || !part && relative || /[<>:"|?*\x00-\x1f]/.test(part) || /[. ]$/.test(part) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) fail('TAR_PATH', 'Tar chứa đường dẫn thoát thư mục hoặc không an toàn.');
  return relative;
}
function paxFields(bytes) {
  const fields = {}; let offset = 0;
  while (offset < bytes.length) {
    const space = bytes.indexOf(32, offset); if (space < 0) fail('TAR_INVALID', 'PAX record thiếu độ dài.');
    const text = bytes.toString('ascii', offset, space); if (!/^[1-9][0-9]*$/.test(text)) fail('TAR_INVALID', 'PAX record không hợp lệ.');
    const size = Number(text); if (size <= space - offset + 2 || offset + size > bytes.length || bytes[offset + size - 1] !== 10) fail('TAR_INVALID', 'PAX record bị cắt.');
    const record = bytes.toString('utf8', space + 1, offset + size - 1), equals = record.indexOf('='); if (equals < 1) fail('TAR_INVALID', 'PAX record không hợp lệ.');
    fields[record.slice(0, equals)] = record.slice(equals + 1); offset += size;
  }
  return fields;
}
function extractTarGz(archive, destination) {
  let bytes; try { bytes = zlib.gunzipSync(archive, { maxOutputLength: 80 * 1024 * 1024 }); } catch { fail('TAR_INVALID', 'Không giải nén được tar.gz npm trong giới hạn an toàn.'); }
  const entries = [], names = new Set(); let offset = 0, nextPath = null, nextPax = null, ended = false;
  while (offset + 512 <= bytes.length) {
    const header = bytes.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) { if (bytes.subarray(offset).some(byte => byte !== 0)) fail('TAR_INVALID', 'Tar có dữ liệu sau phần kết thúc.'); ended = true; break; }
    let checksum = 0; for (let i = 0; i < 512; i++) checksum += i >= 148 && i < 156 ? 32 : header[i];
    if (checksum !== tarNumber(header, 148, 8)) fail('TAR_INVALID', 'Checksum header tar không khớp.');
    const size = tarNumber(header, 124, 12), type = String.fromCharCode(header[156] || 48), start = offset + 512;
    if (size > 40 * 1024 * 1024 || start + size > bytes.length) fail('TAR_INVALID', 'Tar bị cắt hoặc file quá lớn.');
    const body = bytes.subarray(start, start + size); offset = start + Math.ceil(size / 512) * 512;
    if (type === 'x') { nextPax = paxFields(body); if (nextPax.linkpath || nextPax.size) fail('TAR_LINK', 'Không chấp nhận link hoặc đổi kích thước qua PAX.'); continue; }
    if (type === 'L') { nextPath = body.toString('utf8').replace(/\0.*$/s, '').replace(/\n$/, ''); continue; }
    if (!['0', '5'].includes(type)) fail('TAR_LINK', 'Tar npm chứa symlink/hardlink hoặc loại file không được phép.');
    const prefix = tarString(header, 345, 155), headerName = (prefix ? prefix + '/' : '') + tarString(header, 0, 100);
    const name = tarPath(nextPax?.path || nextPath || headerName); nextPath = null; nextPax = null;
    if (!name) { if (type !== '5') fail('TAR_PATH', 'Gốc tar phải là thư mục.'); continue; }
    const key = name.normalize('NFC').toLowerCase(); if (names.has(key)) fail('TAR_DUPLICATE', 'Tar chứa tên file trùng.'); names.add(key);
    entries.push({ name, directory: type === '5', body }); if (entries.length > 20000) fail('TAR_INVALID', 'Tar chứa quá nhiều file.');
  }
  if (!entries.length || nextPath || nextPax || offset > bytes.length || !ended) fail('TAR_INVALID', 'Tar npm chưa đầy đủ.');
  fs.mkdirSync(destination, { recursive: true });
  if (fs.lstatSync(destination).isSymbolicLink() || fs.readdirSync(destination).length) fail('TAR_DESTINATION', 'Chỉ giải nén npm vào thư mục stage mới và rỗng.');
  for (const entry of entries) {
    const output = safePath(destination, path.join(destination, entry.name));
    if (entry.directory) fs.mkdirSync(output, { recursive: true, mode: 0o755 });
    else { fs.mkdirSync(path.dirname(output), { recursive: true, mode: 0o755 }); fs.writeFileSync(output, entry.body, { flag: 'wx', mode: 0o644 }); }
  }
  return entries.length;
}
async function bootstrapNpm(root, runtime, dependencies = {}) {
  const spec = dependencies.npmSpec || PINS.npm;
  registryUrl(spec.tarball);
  if (spec.version !== PINS.npm.version) fail('NPM_VERSION', 'Chỉ bootstrap phiên bản npm đã được chốt.');
  const target = safePath(root, path.join(runtime, `npm-${spec.version}`));
  const cli = safePath(root, path.join(target, 'bin', 'npm-cli.js'));
  if (fs.existsSync(cli)) {
    const receipt = read(safePath(root, path.join(target, '.freeup-npm-bootstrap.json'))), info = read(safePath(root, path.join(target, 'package.json')));
    if (receipt.package_id !== PACKAGE_ID || receipt.integrity !== spec.integrity || info.name !== 'npm' || info.version !== spec.version) fail('NPM_OWNERSHIP', 'npm runtime hiện có không khớp receipt.');
    return cli;
  }
  if (fs.existsSync(target)) fail('NPM_OWNERSHIP', 'Thư mục npm runtime đã có nhưng chưa xác minh được.');
  const fetch = dependencies.fetch || fetchRegistry; let archive;
  try { archive = await fetch(spec.tarball); } catch (error) { if (error.code?.startsWith('INTEGRITY')) throw error; fail('NPM_BOOTSTRAP_DOWNLOAD_FAILED', 'Không tải được npm chính thức để tự bổ sung trình dựng. Kiểm kết nối registry rồi thử lại trong 9B.'); }
  verifyIntegrity(archive, spec.integrity);
  const stage = safePath(root, path.join(runtime, `.npm-stage-${crypto.randomUUID()}`));
  extractTarGz(archive, stage);
  const info = read(path.join(stage, 'package.json'));
  if (info.name !== 'npm' || info.version !== spec.version || !fs.existsSync(path.join(stage, 'bin', 'npm-cli.js'))) fail('NPM_VERSION', 'Gói bootstrap không phải npm đúng phiên bản.');
  atomicJson(root, path.join(stage, '.freeup-npm-bootstrap.json'), { package_id: PACKAGE_ID, version: spec.version, integrity: spec.integrity });
  fs.renameSync(stage, target); return cli;
}
function npmEnvironment(env, runtime, node) {
  const allowed = new Set(['path', 'systemroot', 'windir', 'home', 'userprofile', 'temp', 'tmp', 'tmpdir', 'lang', 'lc_all', 'appdata', 'localappdata', 'programfiles', 'programfiles(x86)', 'https_proxy', 'http_proxy', 'no_proxy']);
  const clean = Object.fromEntries(Object.entries(env).filter(([key]) => allowed.has(key.toLowerCase())));
  const inheritedPath = clean.PATH || clean.Path || ''; delete clean.Path;
  clean.PATH = path.dirname(node) + path.delimiter + inheritedPath;
  return { ...clean, PUPPETEER_SKIP_DOWNLOAD: 'true', npm_config_registry: 'https://registry.npmjs.org/', npm_config_cache: path.join(runtime, 'npm-cache'), npm_config_userconfig: path.join(runtime, 'user.npmrc'), npm_config_globalconfig: path.join(runtime, 'global.npmrc'), npm_config_update_notifier: 'false', npm_config_audit: 'false', npm_config_fund: 'false' };
}
function verifyLock(stage, includeFfmpeg) {
  const lock = read(path.join(stage, 'package-lock.json'));
  for (const name of ['puppeteer-core', ...(includeFfmpeg ? ['ffmpeg-static'] : [])]) {
    const entry = lock.packages?.[`node_modules/${name}`];
    if (entry?.version !== PINS[name].version || entry.integrity !== PINS[name].integrity || entry.resolved !== `https://registry.npmjs.org/${name}/-/${name}-${PINS[name].version}.tgz`) fail('DEPENDENCY_INTEGRITY', 'Phụ thuộc render không khớp phiên bản/integrity chính thức đã chốt.');
  }
  for (const entry of Object.values(lock.packages || {})) if (entry.resolved) registryUrl(entry.resolved);
  return true;
}
function verifyFfmpeg(file, dependencies = {}) {
  if (!file || !executable(file, dependencies.platform || process.platform)) return false;
  const result = (dependencies.spawnSync || cp.spawnSync)(file, ['-hide_banner', '-version'], { encoding: 'utf8', windowsHide: true, timeout: 15000, maxBuffer: 1024 * 1024 });
  return result.status === 0 && /ffmpeg version/i.test(String(result.stdout) + String(result.stderr));
}
function loadModule(file, dependencies = {}) { return dependencies.loadModule ? dependencies.loadModule(file) : require(file); }
async function verifyBrowser(moduleFolder, browserExecutable, dependencies = {}) {
  const puppeteer = loadModule(moduleFolder, dependencies); let browser;
  if (typeof puppeteer.launch !== 'function') fail('BROWSER_MODULE_INVALID', 'Module trình duyệt không có hàm launch.');
  try {
    browser = await puppeteer.launch({ executablePath: browserExecutable, headless: true, timeout: 20000, args: ['--disable-background-networking', '--disable-dev-shm-usage'] });
    const page = await browser.newPage();
    try { await page.setViewport({ width: 32, height: 32 }); await page.setContent('<!doctype html><html><body>FreeUp</body></html>', { waitUntil: 'load', timeout: 10000 }); const screenshot = await page.screenshot({ type: 'png' }); if (!Buffer.from(screenshot).subarray(0, 8).equals(PNG)) fail('BROWSER_RENDER_FAILED', 'Trình duyệt chưa trả PNG thực.'); }
    finally { await page.close(); }
  } catch (error) { if (error.code === 'BROWSER_RENDER_FAILED') throw error; fail('BROWSER_LAUNCH_FAILED', 'Chưa mở/dựng được Chrome hoặc Edge bằng module local. Kiểm trình duyệt hiện có rồi thử lại; chưa báo trình dựng sẵn sàng.'); }
  finally { if (browser) await browser.close(); }
  return true;
}
function existingModule(root, runtime) {
  const folder = safePath(root, path.join(runtime, 'renderer-deps', 'node_modules', 'puppeteer-core'));
  try { const info = read(safePath(root, path.join(folder, 'package.json'))); return info.name === 'puppeteer-core' && info.version === PINS['puppeteer-core'].version ? folder : null; } catch (error) { if (error.code === 'UNSAFE_LINK') throw error; return null; }
}
function savedConfig(root, runtime) {
  const file = safePath(root, path.join(runtime, 'renderer.json'));
  if (!fs.existsSync(file)) return null;
  const config = read(file);
  if (config.package_id !== PACKAGE_ID || config.schema_version !== 1) fail('CONFIG_OWNERSHIP', 'renderer.json hiện có không thuộc bộ lab này.');
  return config;
}
function locateFfmpeg(root, runtime, config, env, dependencies) {
  const candidates = [];
  if (config?.ffmpeg) candidates.push(config.ffmpeg);
  if (env.FREEUP_FFMPEG_PATH) candidates.push(env.FREEUP_FFMPEG_PATH);
  const local = safePath(root, path.join(runtime, 'renderer-deps', 'node_modules', 'ffmpeg-static'));
  if (fs.existsSync(local)) { const binary = loadModule(local, dependencies); if (typeof binary === 'string') candidates.push(binary); }
  candidates.push(...pathExecutables((dependencies.platform || process.platform) === 'win32' ? ['ffmpeg.exe', 'ffmpeg'] : ['ffmpeg'], env, dependencies.platform || process.platform));
  for (const candidate of candidates) if (verifyFfmpeg(candidate, dependencies)) return fs.realpathSync(candidate);
  return null;
}
async function setup(options = {}, dependencies = {}) {
  if (Number(process.versions.node.split('.')[0]) < 22) fail('NODE_VERSION', 'Cần Node.js 22 trở lên của 9B.');
  const root = workspace(options.workspace), env = dependencies.env || process.env;
  const runtime = safePath(root, path.join(root, 'freeup-content-gon-lab-data', 'runtime'));
  const configPath = safePath(root, path.join(runtime, 'renderer.json'));
  const destination = safePath(root, path.join(runtime, 'renderer-deps'));
  if (fs.existsSync(destination)) {
    const marker = safePath(root, path.join(destination, '.freeup-renderer-owner.json'));
    if (!fs.existsSync(marker) || read(marker).package_id !== PACKAGE_ID) fail('RUNTIME_OWNERSHIP', 'Thư mục phụ thuộc render hiện có không thuộc bộ lab này.');
  }
  const config = savedConfig(root, runtime);
  const savedBrowser = config?.browserExecutable && executable(config.browserExecutable, dependencies.platform || process.platform);
  const browser = findBrowser(options.browserExecutable || savedBrowser, env, dependencies.platform || process.platform);
  let moduleFolder = existingModule(root, runtime), binary = locateFfmpeg(root, runtime, config, env, dependencies);
  const checks = { browser: Boolean(browser), browserModule: Boolean(moduleFolder), ffmpeg: Boolean(binary) };
  if (!options.install) return { ok: true, mode: 'probe', ready: Object.values(checks).every(Boolean), configPath, config: config || null, checks, browserExecutable: browser, ffmpeg: binary, browserLaunch: 'not_probed', installed: false, downloads: false };
  if (!browser) fail('BROWSER_NOT_FOUND', 'Chưa tìm thấy Chrome/Edge trên máy khách. Cung cấp --browser-executable từ host; có thể dùng tạo media native trong lúc trình duyệt local chưa có.');
  fs.mkdirSync(runtime, { recursive: true });
  const lock = safePath(root, path.join(runtime, '.setup-renderer.lock')); let descriptor;
  try { descriptor = fs.openSync(lock, 'wx', 0o600); } catch (error) { if (error.code === 'EEXIST') fail('SETUP_BUSY', 'Một lượt bổ sung trình dựng khác đang chạy hoặc cần đối chiếu khóa cũ.'); throw error; }
  let stage = null, backup = null, swapped = false;
  try {
    let changed = false, usedNpm = false;
    if (!moduleFolder || !binary) {
      const npm = (dependencies.findNpmCli || findNpmCli)({ env }, dependencies) || await bootstrapNpm(root, runtime, dependencies);
      const includeFfmpeg = !binary;
      stage = safePath(root, path.join(runtime, `.renderer-stage-${crypto.randomUUID()}`)); fs.mkdirSync(stage);
      fs.writeFileSync(path.join(stage, 'package.json'), JSON.stringify({ name: 'freeup-content-lab-render-runtime', version: '1.0.0', private: true }));
      for (const name of ['user.npmrc', 'global.npmrc']) {
        const file = safePath(root, path.join(runtime, name)); if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') !== '') fail('NPM_CONFIG_OWNERSHIP', 'Cấu hình npm runtime đã bị thay đổi; không dùng registry/quyền ngoài bộ lab.'); fs.writeFileSync(file, '', { mode: 0o600 });
      }
      const args = [npm, 'install', '--prefix', stage, '--save-exact', '--package-lock=true', '--omit=dev', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org/', `puppeteer-core@${PINS['puppeteer-core'].version}`, ...(includeFfmpeg ? [`ffmpeg-static@${PINS['ffmpeg-static'].version}`] : [])];
      const result = (dependencies.spawnSync || cp.spawnSync)(process.execPath, args, { cwd: stage, env: npmEnvironment(env, runtime, process.execPath), encoding: 'utf8', windowsHide: true, timeout: 10 * 60 * 1000, maxBuffer: 4 * 1024 * 1024 });
      if (result.error || result.status !== 0) fail('NPM_INSTALL_FAILED', `Chưa tự cài được phụ thuộc render (npm exit ${result.status ?? 'error'}). Kiểm kết nối registry/binary download rồi thử lại; chưa ghi renderer sẵn sàng.`);
      verifyLock(stage, includeFfmpeg);
      moduleFolder = safePath(root, path.join(stage, 'node_modules', 'puppeteer-core'));
      const moduleInfo = read(path.join(moduleFolder, 'package.json')); if (moduleInfo.name !== 'puppeteer-core' || moduleInfo.version !== PINS['puppeteer-core'].version) fail('DEPENDENCY_INTEGRITY', 'Module render đã cài không đúng phiên bản.');
      if (includeFfmpeg) binary = loadModule(safePath(root, path.join(stage, 'node_modules', 'ffmpeg-static')), dependencies);
      if (!verifyFfmpeg(binary, dependencies)) fail('FFMPEG_FAILED', 'FFmpeg chưa chạy được sau cài; không công bố trình dựng sẵn sàng.');
      await verifyBrowser(moduleFolder, browser, dependencies);
      atomicJson(root, path.join(stage, '.freeup-renderer-owner.json'), { package_id: PACKAGE_ID, schema_version: 1 });
      if (fs.existsSync(destination)) {
        const owner = read(safePath(root, path.join(destination, '.freeup-renderer-owner.json'))); if (owner.package_id !== PACKAGE_ID) fail('RUNTIME_OWNERSHIP', 'Thư mục phụ thuộc render đã có nhưng không thuộc bộ lab.');
        backup = safePath(root, path.join(runtime, `.renderer-backup-${crypto.randomUUID()}`)); fs.renameSync(destination, backup);
      }
      const oldStage = stage; fs.renameSync(stage, destination); stage = null; swapped = true;
      moduleFolder = path.join(destination, 'node_modules', 'puppeteer-core');
      if (inside(oldStage, binary)) binary = path.join(destination, path.relative(oldStage, binary));
      changed = true; usedNpm = true;
    } else { await verifyBrowser(moduleFolder, browser, dependencies); if (!verifyFfmpeg(binary, dependencies)) fail('FFMPEG_FAILED', 'FFmpeg hiện có chưa chạy được.'); }
    const value = { schema_version: 1, package_id: PACKAGE_ID, browserModule: moduleFolder, browserExecutable: browser, ffmpeg: binary, versions: { puppeteerCore: PINS['puppeteer-core'].version, ffmpegStatic: fs.existsSync(path.join(destination, 'node_modules/ffmpeg-static/package.json')) ? PINS['ffmpeg-static'].version : null }, verifiedAt: new Date().toISOString(), checks: { browserLaunch: true, screenshotPng: true, ffmpeg: true } };
    atomicJson(root, configPath, value);
    const readback = read(configPath); if (readback.browserModule !== moduleFolder || readback.ffmpeg !== binary) fail('CONFIG_READBACK', 'Cấu hình trình dựng đọc lại không khớp.');
    return { ok: true, mode: 'install', ready: true, changed, usedNpm, configPath, config: value, checks: value.checks, installed: changed, downloads: usedNpm, backup };
  } catch (error) {
    if (swapped) {
      const failed = safePath(root, path.join(runtime, `.renderer-failed-${crypto.randomUUID()}`)); if (fs.existsSync(destination)) fs.renameSync(destination, failed); if (backup && fs.existsSync(backup)) fs.renameSync(backup, destination);
      if (config) atomicJson(root, configPath, config); else if (fs.existsSync(configPath)) fs.renameSync(configPath, safePath(root, path.join(runtime, `.renderer-failed-config-${crypto.randomUUID()}.json`)));
    }
    throw error;
  } finally { fs.closeSync(descriptor); fs.unlinkSync(lock); }
}
function parse(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--probe') options.probe = true;
    else if (argv[i] === '--install') options.install = true;
    else if (argv[i] === '--workspace' || argv[i] === '--browser-executable') { const key = argv[i] === '--workspace' ? 'workspace' : 'browserExecutable'; if (!argv[i + 1] || argv[i + 1].startsWith('--')) fail('ARGUMENT', 'Thiếu giá trị ' + argv[i]); options[key] = argv[++i]; }
    else fail('ARGUMENT', 'Tham số bổ sung trình dựng chưa được hỗ trợ.');
  }
  if (options.probe && options.install) fail('ARGUMENT', 'Chỉ chọn --probe hoặc --install.'); return options;
}
async function main(argv = process.argv.slice(2), dependencies = {}) { return setup(parse(argv), dependencies); }
if (require.main === module) main().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(JSON.stringify({ ok: false, error: { code: error.code || 'SETUP_FAILED', message: error.message } })); process.exitCode = 1; });
module.exports = { main, setup, parse, PINS, safePath, findBrowser, findNpmCli, npmCandidates, registryUrl, fetchRegistry, verifyIntegrity, extractTarGz, bootstrapNpm, verifyLock, npmEnvironment, verifyBrowser, verifyFfmpeg };
