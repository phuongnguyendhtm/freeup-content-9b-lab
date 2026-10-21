#!/usr/bin/env node
'use strict';
/* Local production ledger. No API key, network call, publish, or live-system mutation. */
const F = require('./production-lib/files.cjs');
const { fs, path, crypto, fail, text } = F;
const TYPES = {
  text:'Bài viết', product_post:'Bài đăng kèm sản phẩm', personal_quote:'Ảnh cá nhân + quan điểm',
  visual_insight:'Ảnh minh họa insight', carousel_album:'Carousel - album', infographic_diagram:'Infographic - sơ đồ',
  broll_text:'Video B-roll có chữ', voice_video:'Video có giọng đọc', comment_thread:'Chuỗi bình luận'
};
const EDITABLE = new Set(['title','caption','comments','media','sources','product','claimRequirements','publishAt','brand','person','voice','taskKind','assetRequest']);
function root(workspace) { return F.within(workspace, 'freeup-content-gon-lab-data', 'production'); }
function jobFile(workspace, id) { if (!/^post_[0-9a-f-]{36}$/.test(id || '')) fail('ID bài không hợp lệ.'); return F.within(workspace, root(workspace), 'jobs', id, 'job.json'); }
function iso(value, label) { if (typeof value !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) fail(label + ' cần ISO có timezone.'); return value; }
function validateSources(job) {
  if (!Array.isArray(job.sources)) fail('sources cần là danh sách nguồn.');
  const ids = new Set();
  for (const source of job.sources) { text(source.id,'source.id'); if (ids.has(source.id)) fail('Trùng source.id.'); ids.add(source.id); if (source.businessId !== job.businessId) fail('Nguồn thuộc doanh nghiệp khác.'); }
}
function sourceConfirmed(job, id) { return job.sources.some(s => s.id === id && s.businessId === job.businessId && s.confirmed === true); }
function materialize(workspace, job, media) {
  if (!Array.isArray(media) || media.length > 30) fail('media phải là danh sách tối đa 30 file.');
  return media.map((m, i) => {
    if (!m || m.businessId !== job.businessId) fail('Media thiếu/mismatched businessId.');
    text(m.role, 'media.role'); text(m.sourceId, 'media.sourceId');
    if (!sourceConfirmed(job, m.sourceId)) fail('Media cần nguồn đã xác nhận của đúng doanh nghiệp.');
    const source = F.local(workspace, m.path); const info = F.inspect(source);
    const dest = F.within(workspace, root(workspace), 'jobs', job.id, 'media', `${String(i + 1).padStart(2,'0')}-${crypto.randomBytes(5).toString('hex')}${info.ext}`);
    fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(source, dest, fs.constants.COPYFILE_EXCL);
    return { ...m, path: path.relative(workspace,dest), originalPath:source, ...info };
  });
}
function digest(job) {
  const content = {}; for (const key of ['businessId','format','version',...EDITABLE]) if (key in job) content[key] = job[key];
  return F.hash(content);
}
function checks(workspace, job, now = new Date()) {
  const errors = []; const add = (condition,message) => { if (!condition) errors.push(message); };
  add(!!TYPES[job.format], 'Định dạng chưa hỗ trợ.');
  try { validateSources(job); } catch (error) { errors.push(error.message); }
  if (job.taskKind === 'asset') { add(!!job.assetRequest?.by && !!job.assetRequest?.instruction, 'Tác vụ ảnh lẻ cần yêu cầu rõ của khách.'); }
  else { add(typeof job.caption === 'string' && !!job.caption.trim(), 'Bài đăng hoàn chỉnh bắt buộc có bài viết/caption.'); }
  if (job.format === 'comment_thread') add(Array.isArray(job.comments) && job.comments.length > 0 && job.comments.every(c => typeof c === 'string' && c.trim()), 'Chuỗi bình luận cần bình luận có thứ tự.');
  const media = job.media || [];
  const images = media.filter(m => m.kind === 'image'); const videos = media.filter(m => m.kind === 'video');
  for (const m of media) {
    try { const file = F.within(workspace, m.path); const info = F.inspect(file); add(info.sha256 === m.sha256, 'Media đã thay đổi sau khi nhập.'); add(info.kind === m.kind, 'Loại media đã thay đổi.'); add(sourceConfirmed(job,m.sourceId), 'Nguồn media chưa xác nhận/khác doanh nghiệp.'); }
    catch (error) { errors.push(error.message); }
  }
  if (['product_post','personal_quote','visual_insight','infographic_diagram'].includes(job.format)) add(images.length >= 1, 'Định dạng này cần file ảnh thực.');
  if (job.format === 'carousel_album') add(images.length >= 2 && images.every((m,i) => m.order === i + 1), 'Carousel cần ít nhất hai ảnh với order liên tiếp từ 1.');
  if (['broll_text','voice_video'].includes(job.format)) add(videos.length === 1, 'Video cần đúng một file MP4 thành phẩm thực.');
  if (job.format === 'personal_quote') add(job.person?.confirmed === true && sourceConfirmed(job,job.person?.sourceId) && media.some(m => m.role === 'portrait'), 'Ảnh cá nhân cần xác nhận đúng người và nguồn chân dung.');
  if (job.format === 'voice_video') add(job.voice?.confirmed === true && sourceConfirmed(job,job.voice?.sourceId) && media.some(m => m.role === 'video' && m.hasAudio === true), 'Video giọng đọc cần nguồn giọng đã xác nhận và audio thực đã kiểm.');
  if (job.format === 'product_post') {
    const product = job.product || {};
    add(!!product.name && product.confirmed === true && sourceConfirmed(job,product.sourceId), 'Sản phẩm/dịch vụ cần thông tin đã xác nhận và nguồn đúng doanh nghiệp.');
    add(media.some(m => m.kind === 'image' && (m.role === 'product' || m.role === 'product_banner')), 'Cần ảnh sản phẩm/banner từ sản phẩm thật.');
    add(media.filter(m => m.kind === 'image').every(m => !!m.originalAssetId || sourceConfirmed(job,m.sourceId)), 'Cần truy vết ảnh sản phẩm.');
    const claimText=[job.caption,...media.map(m=>m.visualText||'')].join('\n');
    const priceMentioned = job.claimRequirements?.priceMentioned === true || /(?:\d[\d.,]*\s*(?:đ\b|đồng|vnđ|vnd|usd|\$)|giá\s*[:\d])/i.test(claimText);
    if (priceMentioned) add(!!product.price?.display && sourceConfirmed(job,product.price?.sourceId), 'Bài nhắc giá cần giá và nguồn xác nhận.');
    const promotional = job.claimRequirements?.promotional === true || /(?:giảm\s*\d|khuyến\s*mãi|ưu\s*đãi|chỉ\s*(?:còn|đến)|\d+\s*%)/i.test(claimText);
    if (promotional) {
      const offer = product.offer || {}; let start, end, target;
      try { start = Date.parse(iso(offer.startsAt,'offer.startsAt')); end = Date.parse(iso(offer.endsAt,'offer.endsAt')); target = job.publishAt ? Date.parse(iso(job.publishAt,'publishAt')) : now.getTime(); } catch (error) { errors.push(error.message); }
      add(!!offer.terms && sourceConfirmed(job,offer.sourceId), 'Ưu đãi cần điều kiện và nguồn xác nhận.');
      add(Number.isFinite(start) && Number.isFinite(end) && start <= end && start <= target && target <= end && end >= now.getTime(), 'Ưu đãi chưa bắt đầu/đã hết hạn hoặc không khớp thời điểm đăng.');
    }
  }
  return [...new Set(errors)];
}
function qaValid(job) { return job.qa?.hash === digest(job) && job.qa?.passed === true; }
function approvalValid(job) { return qaValid(job) && job.approval?.hash === digest(job); }
function save(workspace, job, event) { job.updatedAt = new Date().toISOString(); job.history.push({ event, at:job.updatedAt, version:job.version }); F.write(jobFile(workspace,job.id),job); return job; }
function create(workspace,input){
  F.boundBusiness(workspace,input.businessId);
  const folder=root(workspace);fs.mkdirSync(folder,{recursive:true});const lock=F.within(workspace,folder,'create.lock');let fd;
  try{fd=fs.openSync(lock,'wx');}catch(error){if(error.code==='EEXIST')fail('Đang tạo bài khác. Hãy thử lại; cùng idempotencyKey sẽ trả về đúng bài đã tạo.');throw error;}
  try{return createUnlocked(workspace,input);}finally{fs.closeSync(fd);fs.unlinkSync(lock);}
}
function createUnlocked(workspace, input) {
  const requestKey = input.idempotencyKey === undefined ? null : text(input.idempotencyKey,'idempotencyKey',true,300);
  if (requestKey) {
    const directory = F.within(workspace,root(workspace),'jobs');
    for (const id of fs.existsSync(directory) ? fs.readdirSync(directory) : []) { if (!/^post_[0-9a-f-]{36}$/.test(id)) continue; const old = F.read(jobFile(workspace,id)); if (old.businessId === input.businessId && old.idempotencyKey === requestKey) return old; }
  }
  const job = { id:'post_' + crypto.randomUUID(), businessId:text(input.businessId,'businessId'), format:text(input.format,'format'), title:text(input.title,'title',true,300), caption:input.caption || input.openingPost || '', taskKind:input.taskKind || 'post', comments:input.comments || [], media:[], sources:input.sources || [], version:1, createdAt:new Date().toISOString(), updatedAt:null, qa:null, approval:null, history:[] };
  job.idempotencyKey = requestKey; job.ideaId = input.ideaId || null;
  if (!TYPES[job.format]) fail('Định dạng không hợp lệ.'); if (!['post','asset'].includes(job.taskKind)) fail('taskKind chỉ là post hoặc asset.');
  for (const key of EDITABLE) if (key in input && key !== 'media') job[key] = input[key];
  validateSources(job); job.media = materialize(workspace, job, input.media || []);
  job.status = job.taskKind === 'asset' ? 'ASSET_DRAFT' : 'DRAFT';
  return save(workspace,job,'created');
}
function update(workspace,job,input) {
  F.boundBusiness(workspace,job.businessId);
  for (const key of Object.keys(input)) if (!EDITABLE.has(key)) fail('Không được sửa trường: ' + key);
  const next = { ...job, ...input, version:job.version + 1, qa:null, approval:null, status:job.taskKind === 'asset' ? 'ASSET_DRAFT' : 'DRAFT' };
  validateSources(next); if ('media' in input) next.media = materialize(workspace,next,input.media);
  if (next.taskKind !== job.taskKind) fail('Không đổi tác vụ bài đăng thành ảnh lẻ để bỏ qua kiểm tra; hãy tạo tác vụ riêng.');
  return save(workspace,next,'updated');
}
function qa(workspace,job,input,options={}) {
  F.boundBusiness(workspace,job.businessId);
  text(input.reviewer,'reviewer'); const errors = checks(workspace,job); const required = ['factual','brand'];
  if (job.taskKind === 'post' && !['text','comment_thread'].includes(job.format)) required.push('captionMediaMatch');
  if (job.format === 'product_post') required.push('productFidelity');
  if (job.format === 'personal_quote') required.push('personIdentity');
  if (['broll_text','voice_video'].includes(job.format)) required.push('videoPlayback','videoTextReadable');
  if (job.format === 'voice_video') required.push('voiceAudible');
  if(['broll_text','voice_video'].includes(job.format)){
    let binary=options.ffmpeg||process.env.FREEUP_FFMPEG_PATH;
    if(!binary){try{binary=require('ffmpeg-static');}catch{binary='ffmpeg';}}
    for(const media of job.media.filter(m=>m.kind==='video')){
      try{const args=['-hide_banner','-loglevel','error','-nostdin','-i',F.within(workspace,media.path),'-map','0:v:0'];if(job.format==='voice_video')args.push('-map','0:a:0');args.push('-f','null','-');const result=require('node:child_process').spawnSync(binary,args,{windowsHide:true,encoding:'utf8',timeout:300000,maxBuffer:1024*1024});if(result.error||result.status!==0)errors.push('Chưa giải mã được video/audio thành phẩm bằng FFmpeg: '+(result.error?.message||result.stderr?.slice(-500)||'Lỗi không xác định'));}catch(error){errors.push(error.message);}
    }
  }
  for (const key of required) if (input.checks?.[key] !== true) errors.push('Chưa kiểm đạt: ' + key);
  job.qa = { reviewer:input.reviewer, checks:input.checks, hash:digest(job), passed:!errors.length, errors, at:new Date().toISOString() }; job.approval = null;
  job.status = errors.length ? 'REVISE' : job.taskKind === 'asset' ? 'ASSET_READY' : 'READY_FOR_REVIEW'; return save(workspace,job,'qa');
}
function approve(workspace,job,input) {
  F.boundBusiness(workspace,job.businessId);
  if (job.taskKind === 'asset') fail('Ảnh lẻ không được đánh dấu duyệt bài đăng hoàn chỉnh.');
  const errors = checks(workspace,job); if (errors.length) fail(errors.join(' '));
  if (!qaValid(job)) fail('Cần QA đạt của đúng phiên bản hiện tại.');
  job.approval = { by:text(input.by,'by'), instruction:text(input.instruction,'instruction'), hash:digest(job), at:new Date().toISOString(), scope:'content' };
  job.status = 'APPROVED'; return save(workspace,job,'approved');
}
function exportJob(workspace,job) {
  F.boundBusiness(workspace,job.businessId);
  const errors = checks(workspace,job); if (errors.length) fail(errors.join(' '));
  if (!qaValid(job)) fail('Cần QA đạt của phiên bản hiện tại trước khi xuất bản xem thử.');
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`; const destinationFolder = F.within(workspace,'Nội dung của tôi','Nội dung đã tạo',date,`${TYPES[job.format]} - ${F.safeName(job.title,60)} - ${job.id.slice(-8)} - v${job.version}`);
  if (fs.existsSync(destinationFolder)) {
    if (!job.delivery || job.delivery.hash !== digest(job)) fail('Thư mục xuất đã có; không ghi đè.');
    for (const file of job.delivery.files) if (!fs.existsSync(file.path) || F.hashFile(file.path) !== file.sha256) fail('File đã giao bị thay đổi/thiếu; không nhận là bản giao hợp lệ.');
    return { job, folder:destinationFolder, files:job.delivery.files };
  }
  const folder=F.within(workspace,root(workspace),'exports-in-progress',crypto.randomUUID());
  fs.mkdirSync(folder,{recursive:true}); const files = []; let imageIndex = 0;
  for (const media of job.media) {
    const filename = media.kind === 'image' ? `Ảnh ${String(++imageIndex).padStart(2,'0')}${media.ext}` : media.kind === 'video' ? 'Video.mp4' : media.kind === 'subtitles' ? 'Phụ đề.srt' : media.role === 'voice' ? 'Giọng đọc' + media.ext : 'Nhạc nền' + media.ext;
    if (files.some(f => f.name === filename)) fail('Nhiều media trùng tên giao, cần chọn bản thành phẩm duy nhất.');
    const destination = F.within(workspace,folder,filename); fs.copyFileSync(F.within(workspace,media.path),destination,fs.constants.COPYFILE_EXCL); files.push({name:filename,path:destination,sha256:F.hashFile(destination),kind:media.kind});
  }
  if (job.taskKind === 'post') {
    const caption = job.caption + (job.format === 'comment_thread' ? '\n\n' + job.comments.map((c,i) => `Bình luận ${i+1}\n${c}`).join('\n\n') : '');
    const file = F.within(workspace,folder,'Bài viết.txt'); fs.writeFileSync(file,caption + '\n',{flag:'wx'}); files.push({name:'Bài viết.txt',path:file,sha256:F.hashFile(file),kind:'text'});
  }
  const visual = files.filter(f => ['image','video'].includes(f.kind)).map(f => f.kind === 'image' ? `<img alt="${F.escape(job.title)}" src="${encodeURIComponent(f.name)}">` : `<video controls src="${encodeURIComponent(f.name)}"></video>`).join('\n');
  const preview = F.within(workspace,folder,'Xem bài.html'); fs.writeFileSync(preview,`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'"><title>${F.escape(job.title)}</title><style>body{font:18px/1.7 system-ui;max-width:900px;margin:36px auto;padding:0 20px;color:#18313c;background:#fafaf7}pre{white-space:pre-wrap;font:inherit}img,video{display:block;max-width:100%;margin:20px auto}small{color:#546b76}</style><h1>${F.escape(job.title)}</h1><small>${F.escape(TYPES[job.format])} · Phiên bản ${job.version} · ${job.taskKind === 'asset' ? 'Tài nguyên riêng' : approvalValid(job) ? 'Đã duyệt nội dung' : 'Bản xem thử — chờ khách duyệt'}</small><pre>${F.escape(job.caption)}</pre>${visual}${job.format === 'comment_thread' ? job.comments.map((c,i)=>`<h2>Bình luận ${i+1}</h2><pre>${F.escape(c)}</pre>`).join('') : ''}</html>`,{flag:'wx'}); files.push({name:'Xem bài.html',path:preview,sha256:F.hashFile(preview),kind:'preview'});
  fs.mkdirSync(path.dirname(destinationFolder),{recursive:true});F.within(workspace,destinationFolder);fs.renameSync(folder,destinationFolder);
  for(const file of files)file.path=F.within(workspace,destinationFolder,file.name);
  job.delivery = { folder:destinationFolder, files, hash:digest(job), at:new Date().toISOString() }; job.status = job.taskKind === 'asset' ? 'ASSET_EXPORTED' : approvalValid(job)?'EXPORTED_APPROVED':'EXPORTED_FOR_REVIEW'; save(workspace,job,'exported'); return {job,folder:destinationFolder,files};
}
async function main(argv = process.argv.slice(2)) {
  const options = F.args(argv); const workspace = F.workspace(options.workspace); const command = options._[0]; const input = options.input ? F.read(F.local(workspace,options.input)) : {};
  const business=F.boundBusiness(workspace,options.business);
  if (command === 'create') return create(workspace,input);
  if (command === 'list') { const directory = F.within(workspace,root(workspace),'jobs'); return fs.existsSync(directory) ? fs.readdirSync(directory).filter(id=>/^post_[0-9a-f-]{36}$/.test(id)).map(id=>F.read(jobFile(workspace,id))).filter(j=>!business || j.businessId === business) : []; }
  const job = F.read(jobFile(workspace,options.id)); if (business && job.businessId !== business) fail('Bài thuộc doanh nghiệp khác.');
  if (command === 'show') return job;
  if (command === 'validate') return {id:job.id,valid:checks(workspace,job).length === 0,errors:checks(workspace,job),approvalValid:approvalValid(job)};
  if (command === 'update') return update(workspace,job,input);
  if (command === 'qa') return qa(workspace,job,input,{ffmpeg:options.ffmpeg});
  if (command === 'approve') return approve(workspace,job,input);
  if (command === 'export') return exportJob(workspace,job);
  fail('Lệnh hỗ trợ: create, list, show, update, validate, qa, approve, export.');
}
if (require.main === module) main().then(value=>process.stdout.write(JSON.stringify(value,null,2)+'\n')).catch(error=>{process.stderr.write(error.message+'\n');process.exitCode=1;});
module.exports = {main,create,update,checks,qa,approve,exportJob,digest,approvalValid,TYPES};
