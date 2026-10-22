#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { listFiles, sourcePlan, PACKAGE_ID } = require('../install.cjs');
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : value >>> 1;
  return value >>> 0;
});
function crc32(buffer) { let value = 0xffffffff; for (const byte of buffer) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8); return (value ^ 0xffffffff) >>> 0; }
function zip(entries) {
  if (entries.length > 65535) throw new Error('Bản phát hành vượt giới hạn ZIP cơ bản.');
  const chunks = [], central = [];
  let offset = 0, centralSize = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.path, 'utf8');
    const data = entry.data;
    const compressed = zlib.deflateRawSync(data, { level: 9 });
    if (name.length > 65535 || data.length > 0xffffffff || compressed.length > 0xffffffff || offset > 0xffffffff) throw new Error('Bản phát hành vượt giới hạn ZIP cơ bản.');
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0, 10); local.writeUInt16LE(0x21, 12); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(name.length, 26);
    chunks.push(local, name, compressed);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0); record.writeUInt16LE(0x0314, 4); record.writeUInt16LE(20, 6); record.writeUInt16LE(0x0800, 8); record.writeUInt16LE(8, 10);
    record.writeUInt16LE(0, 12); record.writeUInt16LE(0x21, 14); record.writeUInt32LE(crc, 16);
    record.writeUInt32LE(compressed.length, 20); record.writeUInt32LE(data.length, 24); record.writeUInt16LE(name.length, 28);
    record.writeUInt32LE(((entry.path.endsWith('bootstrap.sh') ? 0o100755 : 0o100644) << 16) >>> 0, 38); record.writeUInt32LE(offset, 42);
    central.push(record, name); centralSize += record.length + name.length;
    offset += local.length + name.length + compressed.length;
  }
  if (centralSize + offset > 0xffffffff) throw new Error('Bản phát hành vượt giới hạn ZIP cơ bản.');
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, ...central, end]);
}
function buildRelease(options = {}) {
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Cần Node.js 22 trở lên.');
  const root = fs.realpathSync(options.root || path.join(__dirname, '..'));
  const plan = sourcePlan(root);
  const selected = new Set();
  const addFile = name => { if (fs.existsSync(path.join(root, name))) selected.add(name); };
  for (const file of ['install.cjs', 'install-9b.cjs', 'activate-9b.cjs', 'bootstrap.ps1', 'bootstrap.sh', 'package.json', 'gift-manifest.json', 'README.md', 'SKILL.md', 'INSTALL.md', 'CAI-TRONG-9B.md', 'AGENTS.md', 'LICENSE', 'LICENSE.md', 'downloads/10-mau-tri-thuc-9bizclaw.zip', 'assets/menu/he-thong-content-ngang-v2.png']) addFile(file);
  for (const directory of ['package/skills/freeup-content-gon-lab', 'templates/knowledge', 'onboarding', 'templates/sheets', 'docs']) {
    const absolute = path.join(root, directory);
    if (!fs.existsSync(absolute)) continue;
    for (const relative of listFiles(absolute)) {
      const name = `${directory}/${relative}`;
      if (name.split('/').some(part => /^(?:node_modules|\.git|fixtures?|tests?|outputs?|dist|backups?)$/i.test(part)) || /(?:^|\/)\.env(?:\.|$)/i.test(name)) throw new Error(`File riêng hoặc phụ thuộc không được đóng gói: ${name}`);
      if (directory === 'onboarding' && (relative.includes('/') || !relative.endsWith('.json'))) continue;
      if (directory === 'templates/knowledge' && !relative.endsWith('.md')) continue;
      if (directory === 'templates/sheets' && !/\.(?:json|xlsx)$/.test(relative)) continue;
      if (directory === 'docs' && !['HUONG-DAN-KHACH-HANG.md','CAI-DAT-VA-CAP-NHAT.md','BO-SUNG-TRINH-DUNG.md','KICH-HOAT-9B.md','MODEL-VA-CHI-PHI.md','BAN-THU-0.3.0.md','KET-QUA-BO-TAI-9B.md','THIET-LAP-0.3.1.md'].includes(relative)) continue;
      selected.add(name);
    }
  }
  if (!selected.has('gift-manifest.json')) throw new Error('Thiếu gift-manifest.json của bản phát hành.');
  const entries = [...selected].sort().map(name => {
    const file = path.join(root, name);
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Không đóng gói liên kết file.');
    // The online guide pins a downloader which pins this ZIP. Keep the offline
    // guide independent of archive hashes to avoid a circular release digest.
    const offlineGuide = '# Cài từ gói đã giải nén\n\nBạn đã có gói đầy đủ: bỏ qua bước tải. Đọc [INSTALL.md](INSTALL.md), dùng install-9b.cjs --prepare → công cụ openclaw của host → --finalize cho workspace agent hiện tại. Sau đó đọc SKILL đã cài và làm init → đọc Tri thức/ảnh → assess → setup; hiển thị customerMessage với câu hỏi, mẫu còn thiếu và ba thư mục tài nguyên rồi gửi menu. Cập nhật giữ dữ liệu.\n\nChưa có gói đầy đủ hoặc cần bản mới: đọc [hướng dẫn trực tuyến hiện tại](https://github.com/phuongnguyendhtm/freeup-content-9b-lab/blob/main/CAI-TRONG-9B.md). Không dùng web reader để tải ZIP.\n';
    return { path: name, data: name === 'CAI-TRONG-9B.md' ? Buffer.from(offlineGuide, 'utf8') : fs.readFileSync(file) };
  });
  const manifest = {
    schema_version: 1, package_id: PACKAGE_ID, version: plan.packageInfo.version,
    checksum: 'sha256', files: entries.map(entry => ({ path: entry.path, sha256: hash(entry.data), size: entry.data.length }))
  };
  const manifestData = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  const basename = `${PACKAGE_ID}-${plan.packageInfo.version}`;
  const archive = zip([...entries, { path: 'release-manifest.json', data: manifestData }].map(entry => ({ ...entry, path: `${basename}/${entry.path}` })));
  const output = path.resolve(options.output || path.join(root, 'dist'));
  fs.mkdirSync(output, { recursive: true });
  const archiveFile = path.join(output, `${basename}.zip`);
  const manifestFile = path.join(output, 'release-manifest.json');
  const sumsFile = path.join(output, 'SHA256SUMS.txt');
  const claudeFile = path.join(output, `contentlab-claude-${plan.packageInfo.version}.zip`);
  const claudeArchive = zip(plan.files.map(file => ({ path: `contentlab/${file.path}`, data: fs.readFileSync(file.source) }))); 
  function write(file, content) {
    const temporary = `${file}.tmp-${crypto.randomUUID()}`;
    fs.writeFileSync(temporary, content, { flag: 'wx' }); fs.renameSync(temporary, file);
  }
  write(archiveFile, archive); write(manifestFile, manifestData); write(claudeFile, claudeArchive);
  write(sumsFile, `${hash(archive)}  ${path.basename(archiveFile)}\n${hash(manifestData)}  release-manifest.json\n${hash(claudeArchive)}  ${path.basename(claudeFile)}\n`);
  return { package_id: PACKAGE_ID, version: plan.packageInfo.version, archive: archiveFile, sha256: hash(archive), file_count: entries.length, release_manifest: manifestFile, checksums: sumsFile, claude_archive: claudeFile, published: false };
}
if (require.main === module) {
  try { const args = process.argv.slice(2); if (args.length && (args.length !== 2 || args[0] !== '--out')) throw new Error('Dùng: node scripts/build-release.cjs [--out <thư mục>].'); console.log(JSON.stringify(buildRelease({ output: args[1] }), null, 2)); }
  catch (error) { console.error(`Build Content Gọn lab: ${error.message}`); process.exitCode = 1; }
}
module.exports = { buildRelease, zip, crc32 };
