'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
function fail(message) { throw new Error(message); }
function read(file) { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
function inside(base, candidate) { const rel = path.relative(base, candidate); return rel === '' || (!path.isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + path.sep)); }
function workspace(value) {
  if (!value || !path.isAbsolute(value)) fail('--workspace phải là đường dẫn tuyệt đối của workspace khách.');
  if (!fs.existsSync(value) || !fs.statSync(value).isDirectory()) fail('Workspace chưa tồn tại.');
  return fs.realpathSync(value);
}
function within(base, ...parts) {
  const out = path.resolve(base, ...parts);
  if (!inside(base, out)) fail('Đường dẫn vượt ra ngoài workspace.');
  let found = out;
  while (!fs.existsSync(found)) found = path.dirname(found);
  if (!inside(base, fs.realpathSync(found))) fail('Symlink/junction dẫn ra ngoài workspace.');
  return out;
}
function write(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = file + '.' + crypto.randomBytes(6).toString('hex') + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
  fs.renameSync(temp, file);
}
function hashFile(file) { const hash = crypto.createHash('sha256'),fd=fs.openSync(file,'r'),buffer=Buffer.allocUnsafe(1024*1024);try{let size;while((size=fs.readSync(fd,buffer,0,buffer.length,null))>0)hash.update(buffer.subarray(0,size));return hash.digest('hex');}finally{fs.closeSync(fd);} }
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) out._.push(a);
    else { const key = a.slice(2); if (!argv[i + 1] || argv[i + 1].startsWith('--')) fail('Thiếu giá trị ' + a); if (key in out) fail('Lặp tham số ' + a); out[key] = argv[++i]; }
  }
  return out;
}
function text(value, name, required = true, max = 200000) {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail(name + ' cần văn bản hợp lệ.');
  return value.trim();
}
function local(base, value) {
  if (typeof value !== 'string' || /^(?:https?|data|file):/i.test(value)) fail('Nguồn media cần đường dẫn file cục bộ thật.');
  const absolute = path.resolve(base, value);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) fail('Không đọc được file media: ' + absolute);
  return fs.realpathSync(absolute);
}
function inspect(file) {
  const stat = fs.statSync(file); if (!stat.isFile() || !stat.size) fail('Media rỗng/không phải file.');
  if(stat.size>1024*1024*1024)fail('Media lớn hơn 1GB; hãy cắt/ngắt thành clip ngắn trước khi nạp.');
  const ext = path.extname(file).toLowerCase(); const videoOrAudio=['.mp4','.m4a','.wav','.mp3'].includes(ext);
  let data,tail;
  if(videoOrAudio){const fd=fs.openSync(file,'r');try{data=Buffer.alloc(Math.min(stat.size,65536));fs.readSync(fd,data,0,data.length,0);tail=Buffer.alloc(Math.min(stat.size,2*1024*1024));fs.readSync(fd,tail,0,tail.length,stat.size-tail.length);}finally{fs.closeSync(fd);}}
  else{if(stat.size>64*1024*1024)fail('Ảnh/phụ đề lớn hơn 64MB; hãy dùng bản xuất gọn.');data=fs.readFileSync(file);tail=data;}let kind = null;
  if (ext === '.png' && data.length > 32 && data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && data.toString('ascii', 12, 16) === 'IHDR' && data.readUInt32BE(16) && data.readUInt32BE(20)) {
    const chunks=[];let offset=8,ended=false;
    while(offset+12<=data.length){const size=data.readUInt32BE(offset);if(offset+12+size>data.length)fail('PNG bị cắt/hỏng chunk.');const type=data.toString('ascii',offset+4,offset+8);if(type==='IDAT')chunks.push(data.subarray(offset+8,offset+8+size));offset+=size+12;if(type==='IEND'){ended=true;break;}}
    if(!ended||!chunks.length)fail('PNG thiếu dữ liệu ảnh.');
    try{const inflated=require('node:zlib').inflateSync(Buffer.concat(chunks),{maxOutputLength:64*1024*1024});if(!inflated.length)fail('PNG không có pixel.');}catch(error){fail('PNG không giải mã được: '+error.message);}
    kind='image';
  }
  if (['.jpg','.jpeg'].includes(ext) && data.length > 100 && data[0] === 255 && data[1] === 216 && data[data.length - 2] === 255 && data[data.length - 1] === 217) kind = 'image';
  if (ext === '.webp' && data.length > 20 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') kind = 'image';
  if (ext === '.gif' && data.length > 13 && /^GIF8[79]a$/.test(data.toString('ascii', 0, 6))) kind = 'image';
  if (ext === '.mp4' && data.length > 32 && data.toString('ascii', 4, 8) === 'ftyp' && (data.includes(Buffer.from('moov')) || tail.includes(Buffer.from('moov')))) kind = 'video';
  if (ext === '.wav' && data.length > 44 && data.toString('ascii',0,4) === 'RIFF' && data.toString('ascii',8,12) === 'WAVE') kind = 'audio';
  if (ext === '.mp3' && data.length > 32 && (data.toString('ascii',0,3) === 'ID3' || data[0] === 255 && (data[1] & 224) === 224)) kind = 'audio';
  if (ext === '.m4a' && data.length > 32 && data.toString('ascii',4,8) === 'ftyp') kind = 'audio';
  if (ext === '.srt' && /^\s*\d+\s+\d{2}:\d{2}:\d{2},\d{3}\s+-->\s+\d{2}:\d{2}:\d{2},\d{3}/.test(data.toString('utf8'))) kind = 'subtitles';
  if (!kind) fail('Đuôi/nội dung file không khớp hoặc media chưa hỗ trợ: ' + file);
  return { kind, ext, bytes: stat.size, sha256: hashFile(file) };
}
function escape(value) { return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]); }
function safeName(value, max = 70) { const name = String(value).normalize('NFC').replace(/[<>:"/\\|?*\x00-\x1f]/g, ' ').replace(/[. ]+$/g,'').trim().slice(0,max); return name && !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name) ? name : 'Nội dung'; }
function boundBusiness(workspace,businessId){const file=within(workspace,'freeup-content-gon-lab-data','onboarding','state.json');if(!fs.existsSync(file))return businessId;const state=read(file);if(state.businessId&&businessId&&state.businessId!==businessId)fail('Doanh nghiệp không khớp workspace đã thiết lập.');return state.businessId||businessId;}
module.exports = { fs, path, crypto, fail, read, inside, workspace, within, write, hashFile, hash, args, text, local, inspect, escape, safeName,boundBusiness };
