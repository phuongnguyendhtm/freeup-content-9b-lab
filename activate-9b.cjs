#!/usr/bin/env node
'use strict';
// Scoped native activation only. Never edits config directly or prints CLI/config contents.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const PACKAGE = 'freeup-content-gon-lab';
const SKILL = 'contentlab';
function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
function record(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function read(file) { try { const value = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); if (!record(value)) throw Error(); return value; } catch { fail('INVALID_CONFIG', 'Cần file JSON đọc được của đúng host; không tự chuyển đổi cấu hình.'); } }
function inside(root, target) { const relative = path.relative(root, target); return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith('..' + path.sep)); }
function regular(value, directory, label) {
  if (typeof value !== 'string' || !path.isAbsolute(value) || !fs.existsSync(value) || fs.lstatSync(value).isSymbolicLink() || !(directory ? fs.statSync(value).isDirectory() : fs.statSync(value).isFile())) fail('INVALID_PATH', label + ' phải là đường dẫn tuyệt đối thực, đúng loại và đã tồn tại.');
  return fs.realpathSync(value);
}
function parse(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (!arg.startsWith('--')) fail('INVALID_ARGUMENT', 'Chỉ nhận tham số có tên.');
    const key = arg.slice(2);
    if (Object.hasOwn(result, key) || !['workspace', 'agent', 'config', 'openclaw-entrypoint', 'node', 'check', 'apply'].includes(key)) fail('INVALID_ARGUMENT', 'Tham số không hợp lệ hoặc bị lặp.');
    if (key === 'check' || key === 'apply') result[key] = true;
    else { if (!argv[index + 1] || argv[index + 1].startsWith('--')) fail('INVALID_ARGUMENT', 'Tham số thiếu giá trị.'); result[key] = argv[++index]; }
  }
  if (Boolean(result.check) === Boolean(result.apply)) fail('MODE_REQUIRED', 'Chọn đúng một trong --check hoặc --apply.');
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(result.agent || '') || ['__proto__', 'prototype', 'constructor'].includes(result.agent)) fail('INVALID_AGENT', 'Cần agent ID thực, rõ ràng của bản lab.');
  return result;
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (record(value)) return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
function otherHash(config, agent) {
  const copy = structuredClone(config);
  if (copy.agents?.entries?.[agent]) delete copy.agents.entries[agent].skills;
  if (record(copy.meta)) {
    delete copy.meta.lastTouchedAt;
    delete copy.meta.lastTouchedVersion;
    if (Object.keys(copy.meta).length === 0) delete copy.meta;
  }
  return crypto.createHash('sha256').update(JSON.stringify(stable(copy))).digest('hex');
}
function state(config, options) {
  if (!record(config.agents?.entries) || !Object.hasOwn(config.agents.entries, options.agent)) fail('AGENT_NOT_REGISTERED', 'Không tìm thấy agent trong agents.entries; host cũ/khác schema cần được kiểm riêng.');
  const agent = config.agents.entries[options.agent];
  if (!record(agent) || typeof agent.workspace !== 'string' || !path.isAbsolute(agent.workspace) || !fs.existsSync(agent.workspace) || fs.realpathSync(agent.workspace) !== options.workspace) fail('WORKSPACE_MISMATCH', 'Workspace không khớp agent đã đăng ký; chưa kích hoạt.');
  const explicit = Object.hasOwn(agent, 'skills');
  const current = explicit ? agent.skills : config.agents.defaults?.skills;
  if (current !== undefined && (!Array.isArray(current) || current.some(value => typeof value !== 'string' || !value.trim()))) fail('INVALID_ALLOWLIST', 'Danh sách skill hiện tại không hợp lệ; không tự thay hoặc bỏ giới hạn.');
  const allowed = current === undefined || current.includes(SKILL);
  return { explicit, current, allowed, next: current === undefined ? undefined : [...current, ...(allowed ? [] : [SKILL])] };
}
function owner(options) {
  const target = path.join(options.workspace, 'skills', PACKAGE);
  if (!fs.existsSync(target) || !inside(options.workspace, fs.realpathSync(target))) fail('NOT_OWNED', 'Chưa có bản cài lab thuộc workspace này.');
  let cursor = options.workspace;
  for (const part of path.relative(options.workspace, target).split(path.sep)) { cursor = path.join(cursor, part); if (fs.lstatSync(cursor).isSymbolicLink()) fail('NOT_OWNED', 'Không kích hoạt skill qua symlink/junction.'); }
  const markerFile = regular(path.join(target, '.freeup-content-gon-lab-owner.json'), false, 'Dấu sở hữu');
  const marker = read(markerFile);
  if (marker.package_id !== PACKAGE || marker.schema_version !== 1) fail('NOT_OWNED', 'Dấu sở hữu không thuộc bộ lab này.');
  const skillFile = regular(path.join(target, 'SKILL.md'), false, 'SKILL.md');
  const content = fs.readFileSync(skillFile, 'utf8');
  const header = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!header || !/^name:\s*["']?contentlab["']?\s*$/m.test(header[1])) fail('SKILL_NAME_MISMATCH', 'Bản cài cần frontmatter name: contentlab để đăng ký đúng slash command.');
  return target;
}
function runNative(options, args, mode) {
  return new Promise((resolve, reject) => {
    let child;
    try { child = spawn(options.node, [options.entrypoint, ...args], { cwd: path.dirname(options.entrypoint), env: { ...process.env, OPENCLAW_CONFIG_PATH: options.config, OPENCLAW_STATE_DIR: path.dirname(options.config) }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], shell: false }); }
    catch { fail('NATIVE_START_FAILED', 'Không chạy được native CLI đã chỉ định.'); }
    let stdout = '', stderr = '', quietTimer, finished = false, timedOut = false, completionDetected = false, terminatedAfterCompletion = false;
    const finish = (code, signal) => {
      if (finished) return; finished = true; clearTimeout(timeout); clearTimeout(quietTimer);
      resolve({ code, signal, timedOut, completionDetected, terminatedAfterCompletion, stdout });
    };
    const timeout = setTimeout(() => { timedOut = true; child.kill(); }, 20000);
    const quiet = () => {
      clearTimeout(quietTimer);
      let complete = false;
      if (mode === 'get') { try { complete = Array.isArray(JSON.parse(stdout.trim())); } catch {} }
      else complete = /\bUpdated\b|\bconfig (?:updated|written)\b|Đã cập nhật/iu.test(stdout + '\n' + stderr);
      if (complete) { completionDetected = true; quietTimer = setTimeout(() => { terminatedAfterCompletion = true; child.kill(); }, 500); }
    };
    const collect = (chunk, which) => {
      if (which === 'stdout') stdout += chunk.toString('utf8'); else stderr += chunk.toString('utf8');
      if (Buffer.byteLength(stdout) + Buffer.byteLength(stderr) > 1024 * 1024) { child.kill(); reject(Object.assign(new Error('Native CLI trả quá nhiều dữ liệu; chưa xác nhận kích hoạt.'), { code: 'NATIVE_OUTPUT_LIMIT' })); return; }
      quiet();
    };
    child.stdout.on('data', chunk => collect(chunk, 'stdout')); child.stderr.on('data', chunk => collect(chunk, 'stderr'));
    child.on('error', () => { clearTimeout(timeout); clearTimeout(quietTimer); if (!finished) { finished = true; reject(Object.assign(new Error('Không chạy được native CLI đã chỉ định.'), { code: 'NATIVE_START_FAILED' })); } });
    child.on('close', finish);
  });
}
async function main(argv = process.argv.slice(2)) {
  if (argv.length === 1 && ['--help', '-h'].includes(argv[0])) return { ok: true, usage: 'node activate-9b.cjs --workspace ABS --agent ID --config ABS_JSON --openclaw-entrypoint ABS_ENTRY --node ABS_NODE (--check|--apply)', purpose: 'Chỉ bật contentlab trong danh sách skill của đúng agent đã đăng ký; không đổi policy, tools, defaults hoặc agent khác.', customerEntrypoint: 'node install-9b.cjs --workspace ABS_CURRENT_WORKSPACE', chatVerification: 'Sau configured:true, lượt chat tiếp theo kiểm host đã nạp contentlab.' };
  const raw = parse(argv);
  const options = { ...raw, workspace: regular(raw.workspace, true, 'Workspace'), config: regular(raw.config, false, 'Config'), entrypoint: regular(raw['openclaw-entrypoint'], false, 'OpenClaw entrypoint'), node: regular(raw.node, false, 'Node') };
  owner(options);
  const config = read(options.config), before = state(config, options), hash = otherHash(config, options.agent);
  const targetPath = `agents.entries[${JSON.stringify(options.agent)}].skills`;
  const base = { ok: true, packageId: PACKAGE, agentId: options.agent, workspace: options.workspace, skillName: SKILL, targetPath, chatVerified: false, configured: before.allowed, changed: false, inheritedList: !before.explicit, previousSkillCount: before.current?.length ?? null, nextSkillCount: before.next?.length ?? null };
  // Native exit 1 also covers denials: accept only its exact valid-but-unset envelope.
  const get = await runNative(options, ['config', 'get', targetPath, '--json'], 'get');
  if (otherHash(read(options.config), options.agent) !== hash) fail('OTHER_CONFIG_CHANGED', 'Cấu hình khác đã đổi trong lúc kiểm; không xác nhận kích hoạt.');
  if (before.explicit) {
    if (get.code !== 0 && !get.terminatedAfterCompletion && !get.timedOut) fail('NATIVE_GET_FAILED', 'Native CLI từ chối đọc danh sách skill của agent; không chuyển sang đường đọc/ghi khác.');
    let list; try { list = JSON.parse(get.stdout.trim()); } catch { fail('NATIVE_GET_FAILED', 'Native CLI chưa đọc được danh sách skill của agent.'); }
    if (JSON.stringify(list) !== JSON.stringify(before.current)) fail('NATIVE_GET_FAILED', 'Danh sách native không khớp file cấu hình đã chỉ định.');
  } else {
    let value; try { value = JSON.parse(get.stdout.trim()); } catch { fail('NATIVE_GET_FAILED', 'Native CLI chưa xác nhận được path skill của agent.'); }
    const validUnset = get.code === 1 && value?.ok === false && value?.error?.type === 'cli_error' && typeof value.error.message === 'string' && value.error.message.startsWith(`Config path is valid but unset: ${targetPath}.`);
    const validList = (get.code === 0 || get.terminatedAfterCompletion) && Array.isArray(value) && JSON.stringify(value) === JSON.stringify(before.current);
    if (!validUnset && !validList) fail('NATIVE_GET_FAILED', 'Native CLI từ chối hoặc chưa xác nhận đọc path skill; không chuyển sang đường đọc/ghi khác.');
  }
  if (raw.check) return { ...base, status: before.allowed ? 'activation-configured' : 'activation-required', mode: 'check', instruction: before.allowed ? 'Danh sách hiện cho phép skill; cần lượt chat thật để kiểm host đã nạp.' : 'Có thể dùng --apply để thêm đúng contentlab cho agent này.' };
  if (before.allowed) return { ...base, status: 'activation-configured', mode: 'apply', instruction: 'Không cần sửa danh sách; chưa kiểm chat đã nạp skill.' };
  const expected = before.explicit ? ['--expect-current-json', JSON.stringify(before.current)] : ['--expect-current-absent'];
  const set = await runNative(options, ['config', 'set', targetPath, JSON.stringify(before.next), '--strict-json', ...expected], 'set');
  const afterConfig = read(options.config), after = state(afterConfig, options);
  if (otherHash(afterConfig, options.agent) !== hash) fail('OTHER_CONFIG_CHANGED', 'Ngoài danh sách skill mục tiêu còn có cấu hình khác đổi; không tự ghi đè/rollback, cần kiểm thay đổi native.');
  if (set.code !== 0 && !set.terminatedAfterCompletion && !set.timedOut) fail('ACTIVATION_NOT_CONFIRMED', 'Native CLI từ chối hoặc không hoàn tất kích hoạt; không thử đường ghi cấu hình khác.');
  if (!after.explicit || JSON.stringify(after.current) !== JSON.stringify(before.next)) fail('ACTIVATION_NOT_CONFIRMED', 'Native CLI chưa ghi đúng danh sách skill; không sửa file cấu hình thay thế.');
  return { ...base, configured: true, changed: true, status: 'activation-configured', mode: 'apply', otherSettingsUnchanged: true, nativeTimedOutAfterWrite: set.timedOut, nativeCompletionDetected: set.completionDetected, instruction: 'Đã đọc lại cấu hình cho phép contentlab riêng agent này. Gửi hệ thống content trong lượt chat mới để kiểm skill và attachment; chưa coi là chat đã xác minh.' };
}
module.exports = { main, otherHash };
if (require.main === module) main().then(result => process.stdout.write(JSON.stringify(result, null, 2) + '\n')).catch(error => { process.stdout.write(JSON.stringify({ ok: false, error: { code: error.code || 'ACTIVATION_ERROR', message: error.code ? error.message : 'Chưa hoàn tất kích hoạt native; không hiển thị nội dung cấu hình hoặc CLI.' } }, null, 2) + '\n'); process.exitCode = 1; });
