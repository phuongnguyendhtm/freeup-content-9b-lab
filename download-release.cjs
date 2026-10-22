#!/usr/bin/env node
'use strict';
// Binary downloader only. No shell, remote code execution, workspace or host-config writes.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const RELEASE = Object.freeze({
  packageId: 'freeup-content-gon-lab', version: '0.3.0',
  url: 'https://github.com/phuongnguyendhtm/freeup-content-9b-lab/releases/download/v0.3.0/freeup-content-gon-lab-0.3.0.zip',
  sha256: 'a4da860a5a5a0922cd78f51f490595959dbbe033a3b559eab7b20d33489aa4a4',
  bytes: 1954330
});
const MAX_ARCHIVE = 32 * 1024 * 1024, MAX_FILE = 16 * 1024 * 1024, MAX_TOTAL = 64 * 1024 * 1024;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function fail(code, message) { throw Object.assign(new Error(message), { code }); }
function allowedUrl(value) {
  let url; try { url = new URL(value); } catch { fail('DOWNLOAD_URL_INVALID', 'Địa chỉ tải không hợp lệ.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !['github.com', 'release-assets.githubusercontent.com', 'objects.githubusercontent.com'].includes(url.hostname)) fail('DOWNLOAD_REDIRECT_REJECTED', 'Địa chỉ tải chuyển tới nguồn không được phép.');
  return url.href;
}
async function download(fetchImpl = globalThis.fetch) {
  let url = RELEASE.url;
  const signal = AbortSignal.timeout(120000);
  for (let redirects = 0; redirects <= 4; redirects++) {
    let response; try { response = await fetchImpl(allowedUrl(url), { redirect: 'manual', signal, headers: { 'User-Agent': 'FreeUp-Content-Installer/1', Accept: 'application/octet-stream' } }); }
    catch (error) { if (error.code) throw error; fail('DOWNLOAD_NETWORK_FAILED', 'Không tải được gói qua kết nối HTTPS của Node; chưa thay đổi workspace hoặc cấu hình.'); }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location || redirects === 4) fail('DOWNLOAD_REDIRECT_LIMIT', 'Gói tải chuyển hướng quá nhiều hoặc thiếu địa chỉ.');
      url = allowedUrl(new URL(location, url).href); continue;
    }
    if (!response.ok) fail('DOWNLOAD_HTTP_FAILED', 'Nguồn tải trả HTTP ' + response.status + '; chưa cài đặt.');
    if (!response.body || /text\/html/i.test(response.headers.get('content-type') || '')) fail('DOWNLOAD_NOT_ARCHIVE', 'Nguồn tải không trả tệp ZIP nhị phân.');
    const length = response.headers.get('content-length');
    if (length && (!/^\d+$/.test(length) || Number(length) > MAX_ARCHIVE)) fail('DOWNLOAD_SIZE_INVALID', 'Kích thước gói tải không hợp lệ.');
    const chunks = []; let bytes = 0;
    try { for await (const chunk of response.body) { const data = Buffer.from(chunk); bytes += data.length; if (bytes > MAX_ARCHIVE) fail('DOWNLOAD_TOO_LARGE', 'Gói tải vượt giới hạn kích thước.'); chunks.push(data); } }
    catch (error) { if (error.code?.startsWith('DOWNLOAD_')) throw error; fail('DOWNLOAD_INTERRUPTED', 'Tệp ZIP tải chưa hoàn tất; chưa cài đặt.'); }
    if (length && Number(length) !== bytes) fail('DOWNLOAD_TRUNCATED', 'Số byte nhận được không đủ theo phản hồi nguồn tải.');
    const archive = Buffer.concat(chunks);
    if (archive.length !== RELEASE.bytes || hash(archive) !== RELEASE.sha256) fail('ARCHIVE_HASH_MISMATCH', 'Tệp nhận được không khớp số byte/SHA256 đã ghim; không giải nén hoặc cài.');
    return archive;
  }
}
const crcTable = Array.from({ length: 256 }, (_, index) => { let value = index; for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1; return value >>> 0; });
function crc32(buffer) { let value = 0xffffffff; for (const byte of buffer) value = crcTable[(value ^ byte) & 255] ^ value >>> 8; return (value ^ 0xffffffff) >>> 0; }
function validName(name) {
  if (!name || name.includes('\\') || name.startsWith('/') || name.endsWith('/') || name.split('/').some(part => !part || part === '.' || part === '..' || /[<>:"|?*\x00-\x1f]/.test(part) || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(part))) fail('ZIP_UNSAFE_PATH', 'ZIP có đường dẫn không an toàn.');
}
function decodeName(bytes) { try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { fail('ZIP_NAME_ENCODING', 'Tên tệp ZIP không phải UTF-8 hợp lệ.'); } }
function unzip(archive) {
  if (!Buffer.isBuffer(archive) || archive.length < 22 || archive.length > MAX_ARCHIVE) fail('ZIP_INVALID', 'ZIP thiếu hoặc sai kích thước.');
  // Our pinned release has no comment, data descriptor or ZIP64 records.
  const end = archive.length - 22;
  if (archive.readUInt32LE(end) !== 0x06054b50 || archive.readUInt16LE(end + 20) !== 0 || archive.readUInt16LE(end + 4) !== 0 || archive.readUInt16LE(end + 6) !== 0) fail('ZIP_INVALID', 'ZIP bị cắt hoặc dùng cấu trúc không được hỗ trợ.');
  const count = archive.readUInt16LE(end + 10), centralSize = archive.readUInt32LE(end + 12), centralOffset = archive.readUInt32LE(end + 16);
  if (!count || count > 1000 || archive.readUInt16LE(end + 8) !== count || centralOffset + centralSize !== end) fail('ZIP_INVALID', 'Mục lục ZIP không hợp lệ.');
  const names = new Set(), spans = [], files = []; let cursor = centralOffset, total = 0;
  for (let index = 0; index < count; index++) {
    if (cursor + 46 > end || archive.readUInt32LE(cursor) !== 0x02014b50) fail('ZIP_INVALID', 'Mục lục ZIP bị cắt.');
    const flags = archive.readUInt16LE(cursor + 8), method = archive.readUInt16LE(cursor + 10), crc = archive.readUInt32LE(cursor + 16), compressed = archive.readUInt32LE(cursor + 20), size = archive.readUInt32LE(cursor + 24), nameLength = archive.readUInt16LE(cursor + 28), extraLength = archive.readUInt16LE(cursor + 30), commentLength = archive.readUInt16LE(cursor + 32), disk = archive.readUInt16LE(cursor + 34), attributes = archive.readUInt32LE(cursor + 38), offset = archive.readUInt32LE(cursor + 42);
    if (cursor + 46 + nameLength + extraLength + commentLength > end || flags !== 0x0800 || ![0, 8].includes(method) || disk || size > MAX_FILE || compressed > MAX_ARCHIVE || ((attributes >>> 16) & 0xf000) === 0xa000) fail('ZIP_UNSUPPORTED', 'ZIP có mục quá lớn, liên kết hoặc cấu trúc không được hỗ trợ.');
    const nameBytes = archive.subarray(cursor + 46, cursor + 46 + nameLength), name = decodeName(nameBytes); validName(name);
    const identity = name.normalize('NFC').toLowerCase(); if (names.has(identity)) fail('ZIP_DUPLICATE_PATH', 'ZIP có đường dẫn trùng hoặc xung đột tên.'); names.add(identity);
    if (offset + 30 > centralOffset || archive.readUInt32LE(offset) !== 0x04034b50) fail('ZIP_INVALID', 'Header tệp ZIP không hợp lệ.');
    const localNameLength = archive.readUInt16LE(offset + 26), localExtra = archive.readUInt16LE(offset + 28), start = offset + 30 + localNameLength + localExtra, stop = start + compressed;
    if (stop > centralOffset || localNameLength !== nameLength || !archive.subarray(offset + 30, offset + 30 + localNameLength).equals(nameBytes) || archive.readUInt16LE(offset + 6) !== flags || archive.readUInt16LE(offset + 8) !== method || archive.readUInt32LE(offset + 14) !== crc || archive.readUInt32LE(offset + 18) !== compressed || archive.readUInt32LE(offset + 22) !== size) fail('ZIP_INVALID', 'Header và mục lục ZIP không khớp.');
    if (spans.some(([a, b]) => offset < b && stop > a)) fail('ZIP_OVERLAP', 'ZIP có các vùng dữ liệu chồng nhau.'); spans.push([offset, stop]);
    let data; try { data = method === 8 ? zlib.inflateRawSync(archive.subarray(start, stop), { maxOutputLength: MAX_FILE }) : Buffer.from(archive.subarray(start, stop)); } catch { fail('ZIP_DECODE_FAILED', 'Không giải nén được dữ liệu ZIP.'); }
    total += data.length;
    if (data.length !== size || total > MAX_TOTAL || crc32(data) !== crc) fail('ZIP_CONTENT_INVALID', 'Nội dung ZIP không khớp kích thước/CRC.');
    files.push({ name, data }); cursor += 46 + nameLength + extraLength + commentLength;
  }
  if (cursor !== end) fail('ZIP_INVALID', 'Mục lục ZIP có dữ liệu thừa.');
  return files;
}
function verifyManifest(files) {
  const prefix = RELEASE.packageId + '-' + RELEASE.version + '/';
  if (files.some(file => !file.name.startsWith(prefix))) fail('RELEASE_PATH_INVALID', 'ZIP chứa tệp ngoài thư mục gói đã ghim.');
  const manifestFile = files.find(file => file.name === prefix + 'release-manifest.json');
  let manifest; try { manifest = JSON.parse(manifestFile.data.toString('utf8')); } catch { fail('RELEASE_MANIFEST_INVALID', 'Thiếu hoặc sai release manifest.'); }
  if (manifest.schema_version !== 1 || manifest.package_id !== RELEASE.packageId || manifest.version !== RELEASE.version || manifest.checksum !== 'sha256' || !Array.isArray(manifest.files) || manifest.files.length !== files.length - 1) fail('RELEASE_MANIFEST_INVALID', 'Release manifest không khớp gói.');
  const seen = new Set();
  for (const item of manifest.files) {
    if (typeof item.path !== 'string') fail('RELEASE_MANIFEST_INVALID', 'Manifest thiếu tên tệp.'); validName(item.path);
    const file = files.find(file => file.name === prefix + item.path);
    if (seen.has(item.path) || !file || item.path === 'release-manifest.json' || file.data.length !== item.size || hash(file.data) !== item.sha256) fail('RELEASE_FILE_MISMATCH', 'Tệp gói không khớp manifest.'); seen.add(item.path);
  }
  if (!seen.has('install-9b.cjs') || !seen.has('templates/sheets/Content Gọn - 3 trang tính.xlsx')) fail('RELEASE_INCOMPLETE', 'Gói thiếu bộ cài hoặc mẫu Sheet tiếng Việt.');
  return prefix.slice(0, -1);
}
async function main(argv = process.argv.slice(2), dependencies = {}) {
  if (argv.length === 1 && ['--help', '-h'].includes(argv[0])) return { ok: true, usage: 'node download-release.cjs', purpose: 'Tải ZIP nhị phân trực tiếp, kiểm số byte/SHA256/manifest và giải nén UTF-8; không cài workspace hoặc đổi config.' };
  if (argv.length) fail('INVALID_ARGUMENT', 'Bộ tải không nhận URL, thư mục hoặc lệnh tùy ý.');
  if (Number(process.versions.node.split('.')[0]) < 22) fail('NODE_VERSION', 'Cần Node 22 trở lên của host.');
  const archive = await download(dependencies.fetch || globalThis.fetch), files = unzip(archive), folder = verifyManifest(files);
  const parent = fs.realpathSync(dependencies.tmpRoot || os.tmpdir()), temporary = fs.mkdtempSync(path.join(parent, 'freeup-content-download-'));
  fs.chmodSync(temporary, 0o700);
  const archivePath = path.join(temporary, folder + '.zip'); fs.writeFileSync(archivePath, archive, { flag: 'wx', mode: 0o600 });
  for (const file of files) {
    const target = path.resolve(temporary, ...file.name.split('/')), relative = path.relative(temporary, target);
    if (!relative || path.isAbsolute(relative) || relative === '..' || relative.startsWith('..' + path.sep)) fail('ZIP_UNSAFE_PATH', 'Đường dẫn giải nén vượt thư mục tạm.');
    let directory = temporary;
    for (const segment of path.relative(temporary, path.dirname(target)).split(path.sep).filter(Boolean)) { directory = path.join(directory, segment); if (!fs.existsSync(directory)) fs.mkdirSync(directory, { mode: 0o700 }); if (fs.lstatSync(directory).isSymbolicLink() || !fs.statSync(directory).isDirectory()) fail('EXTRACTION_PATH_CHANGED', 'Thư mục giải nén đã thay đổi; dừng.'); }
    fs.writeFileSync(target, file.data, { flag: 'wx', mode: 0o600 });
  }
  const sourcePath = path.join(temporary, folder);
  const report = { ok: true, packageId: RELEASE.packageId, version: RELEASE.version, downloadedBytes: archive.length, sha256: hash(archive), archiveVerified: true, releaseManifestVerified: true, fileCount: files.length, unicodeNamesPreserved: true, archivePath, sourcePath, orchestratorPath: path.join(sourcePath, 'install-9b.cjs'), workspaceChanged: false, hostConfigChanged: false, next: 'Agent dùng orchestratorPath --prepare với workspace/session hiện tại; bật qua công cụ openclaw của host, rồi --finalize. Khách không tự tải ZIP hoặc chạy lệnh.' };
  fs.writeFileSync(path.join(temporary, 'download-receipt.json'), JSON.stringify(report, null, 2), { flag: 'wx', mode: 0o600 }); return report;
}
module.exports = { RELEASE, download, unzip, verifyManifest, main };
if (require.main === module) main().then(value => process.stdout.write(JSON.stringify(value, null, 2) + '\n')).catch(error => { process.stdout.write(JSON.stringify({ ok: false, workspaceChanged: false, hostConfigChanged: false, error: { code: error.code || 'DOWNLOAD_FAILED', message: error.code ? error.message : 'Chưa hoàn tất tải/kiểm gói. Không hiển thị URL chuyển hướng, log hoặc cấu hình.' } }, null, 2) + '\n'); process.exitCode = 1; });
