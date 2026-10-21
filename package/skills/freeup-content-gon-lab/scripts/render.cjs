#!/usr/bin/env node
'use strict';
/* Deterministic local rendering. Every image is an actual PNG; videos require FFmpeg. */
const F = require('./production-lib/files.cjs');
const { fs,path,crypto,fail,text } = F;
const { spawn } = require('node:child_process');
const FORMATS = new Set(['product_banner','personal_quote','visual_insight','carousel','infographic','broll_text','voice_video']);
function color(value, fallback) { if (value === undefined) return fallback; if (!/^#[a-f0-9]{6}$/i.test(value)) fail('Màu nhận diện cần #RRGGBB.'); return value; }
function dataImage(workspace,value) { const file=F.local(workspace,value),info=F.inspect(file); if (info.kind !== 'image') fail('Ảnh nguồn không hợp lệ.'); const mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp'}[info.ext];return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`; }
function normalizeCard(card) {
  if (!card || typeof card !== 'object' || Array.isArray(card)) fail('cards cần object.');
  const panels=card.panels || []; if (!Array.isArray(panels) || panels.length > 6) fail('Tối đa sáu panel trên một ảnh.');
  return { headline:text(card.headline,'headline',true,160), body:text(card.body,'body',false,550), cta:text(card.cta,'cta',false,100), kicker:text(card.kicker,'kicker',false,70), image:card.image || null, panels:panels.map(p=>({title:text(p.title,'panel.title',true,100),body:text(p.body,'panel.body',false,180)})) };
}
function makeHtml(workspace,input,card,index,count,transparent = false) {
  const brand=input.brand || {}; const c=brand.colors || {}; const width=1080,height=['broll_text','voice_video'].includes(input.format)?1920:input.format==='carousel'?1080:1350;
  const ink=color(c.text,'#18353e'),accent=color(c.accent,'#087f76'),paper=color(c.background,'#f6f3eb');
  const image=card.image?dataImage(workspace,card.image):null; const logo=brand.logo?dataImage(workspace,brand.logo):null;
  if (['product_banner','personal_quote'].includes(input.format) && !image) fail('Banner sản phẩm/ảnh cá nhân cần ảnh gốc thật.');
  const panels=card.panels.map((p,i)=>`<article><b>${String(i+1).padStart(2,'0')}</b><h2 data-fit>${F.escape(p.title)}</h2><p data-fit>${F.escape(p.body)}</p></article>`).join('');
  const photo=image?`<div class="photo"><img src="${image}" alt="Ảnh nguồn đã xác nhận"></div>`:'';
  return `<!doctype html><html lang="vi"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:"><style>*{box-sizing:border-box}html,body{width:${width}px;height:${height}px;margin:0;overflow:hidden}body{font-family:Arial,'Segoe UI',sans-serif;color:${ink};background:${transparent?'transparent':paper}}main{height:100%;padding:64px;display:flex;flex-direction:column;gap:28px}${transparent?'main{justify-content:flex-end;padding-bottom:250px}header{display:none}.text{background:#102c36d9;color:white;border-radius:24px;padding:38px}.text h1{font-size:68px}':''}header{height:80px;display:flex;align-items:center;justify-content:space-between;font-size:25px;gap:24px}header img{max-width:230px;max-height:72px;object-fit:contain}small{font-size:22px;letter-spacing:1.5px;color:${accent};font-weight:bold}.text{flex-shrink:0}h1{font-size:${input.format==='carousel'?66:72}px;line-height:1.12;letter-spacing:-2px;margin:0 0 22px;overflow-wrap:anywhere}p{font-size:32px;line-height:1.45;margin:0;white-space:pre-line}.photo{flex:1;min-height:0;border-radius:28px;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center}.photo img{width:100%;height:100%;object-fit:${input.format==='product_banner'?'contain':'cover'}}section{display:grid;gap:18px;grid-template-columns:1fr 1fr;flex:1;min-height:0}article{border:2px solid ${accent}40;border-radius:20px;padding:26px;background:#ffffffc9;overflow:hidden}article b{font-size:36px;color:${accent}}h2{font-size:33px;line-height:1.15;margin:15px 0}article p{font-size:26px}footer{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:auto;font-size:24px}.cta{display:inline-block;border-radius:100px;padding:18px 30px;background:${accent};color:white;font-size:28px}.counter{color:${accent};font-size:25px}</style><main><header>${logo?`<img src="${logo}" alt="Logo">`:`<span>${F.escape(brand.name || '')}</span>`}<span>${F.escape(card.kicker)}</span></header><div class="text"><h1 data-fit>${F.escape(card.headline)}</h1>${card.body?`<p data-fit>${F.escape(card.body)}</p>`:''}</div>${photo}${panels?`<section>${panels}</section>`:''}<footer>${card.cta?`<span class="cta" data-fit>${F.escape(card.cta)}</span>`:'<span></span>'}<span class="counter">${count>1?`${index+1} / ${count}`:''}</span></footer></main></html>`;
}
function moduleFrom(name,explicit) { try { return explicit?require(path.resolve(explicit)):require(name); } catch { fail(`Thiếu ${name}. Cài phụ thuộc render của gói hoặc cung cấp module có sẵn qua --${name==='puppeteer'?'browser-module':'ffmpeg'}.`); } }
async function launch(options) {
  const puppeteer=moduleFrom('puppeteer',options.browserModule);
  return puppeteer.launch({headless:true,...(options.browserExecutable?{executablePath:options.browserExecutable}:{}),args:['--disable-background-networking','--disable-dev-shm-usage']});
}
async function png(browser,html,file,width,height,transparent=false) {
  const page=await browser.newPage();
  try {
    await page.setViewport({width,height,deviceScaleFactor:1}); await page.setRequestInterception(true);page.on('request',request=> /^(?:data:|about:)/i.test(request.url())?request.continue():request.abort());
    await page.setContent(html,{waitUntil:'load',timeout:30000});await page.evaluate(()=>document.fonts.ready);
    const invalid=await page.evaluate(()=>({images:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length,overflow:[...document.querySelectorAll('[data-fit],main,section,article')].filter(e=>e.scrollHeight>e.clientHeight+3||e.scrollWidth>e.clientWidth+3).map(e=>e.tagName)}));
    if(invalid.images)fail('Ảnh nguồn không giải mã được trong trình dựng.');if(invalid.overflow.length)fail('Chữ/nội dung tràn bố cục: '+invalid.overflow.join(', ')+'. Hãy rút gọn hoặc tách thêm ảnh.');
    await page.screenshot({path:file,type:'png',omitBackground:transparent});F.inspect(file);
  } finally {await page.close();}
}
function ffmpeg(options={}) {
  if(options.ffmpeg){const f=F.local(process.cwd(),options.ffmpeg);return f;}
  if(process.env.FREEUP_FFMPEG_PATH)return F.local(process.cwd(),process.env.FREEUP_FFMPEG_PATH);
  try {const f=require('ffmpeg-static');if(f&&fs.existsSync(f))return f;}catch{}
  return 'ffmpeg';
}
function command(binary,args,timeout=180000) {
  return new Promise((resolve,reject)=>{
    const child=spawn(binary,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let err='',out='';const timer=setTimeout(()=>{child.kill();reject(new Error('FFmpeg vượt thời gian dựng.'));},timeout);
    child.stdout.on('data',d=>{out=(out+d).slice(-20000);});child.stderr.on('data',d=>{err=(err+d).slice(-20000);});child.on('error',e=>{clearTimeout(timer);reject(new Error('Không chạy được FFmpeg: '+e.message));});child.on('close',code=>{clearTimeout(timer);code===0?resolve({stdout:out,stderr:err}):reject(new Error('FFmpeg thất bại: '+err.slice(-3000)));});
  });
}
function number(value,label,min,max) {if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)fail(label+' ngoài phạm vi.');return value;}
function srtTime(seconds) {const ms=Math.round(seconds*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;}
function decodedDuration(probe){const m=/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(probe.stderr);return m?Number(m[1])*3600+Number(m[2])*60+Number(m[3]):null;}
function subtitleFile(workspace,folder,subtitles,duration) {
  if(!subtitles)return null;if(!Array.isArray(subtitles)||!subtitles.length||subtitles.length>200)fail('subtitles cần danh sách 1–200 dòng.');let previous=0;
  const content=subtitles.map((s,i)=>{const start=number(s.start,'subtitle.start',0,duration),end=number(s.end,'subtitle.end',0,duration);if(start<previous||end<=start)fail('Thời gian phụ đề chồng/không hợp lệ.');previous=end;return `${i+1}\n${srtTime(start)} --> ${srtTime(end)}\n${text(s.text,'subtitle.text',true,200)}\n`;}).join('\n');
  const file=F.within(workspace,folder,'Phụ đề.srt');fs.writeFileSync(file,content);return file;
}
async function renderVideo(workspace,input,folder,browser,options) {
  const clips=input.clips;if(!Array.isArray(clips)||!clips.length||clips.length>12)fail('Video cần 1–12 clip thực.');
  const binary=ffmpeg(options),segments=[];let total=0;const cards=(input.cards||[]).map(normalizeCard);if(!cards.length)fail('Video cần chữ trên video trong cards.');
  const duration=number(input.duration || 20,'duration',3,90);
  const voice=input.format==='voice_video'?F.local(workspace,input.voice?.path):null;
  if(voice&&F.inspect(voice).kind!=='audio')fail('voice.path cần audio thực.');
  const music=input.music?F.local(workspace,input.music):null;if(music&&F.inspect(music).kind!=='audio')fail('music cần audio thực.');
  for(let i=0;i<clips.length&&total<duration;i++){
    const clip=clips[i];const source=F.local(workspace,clip.path),info=F.inspect(source);if(info.kind!=='video')fail('Clip cần video MP4 thực.');
    const start=number(clip.start||0,'clip.start',0,36000),length=Math.min(number(clip.duration||duration/clips.length,'clip.duration',0.5,90),duration-total);
    const overlay=F.within(workspace,folder,`chu-${i+1}.png`),part=F.within(workspace,folder,`canh-${i+1}.mp4`);
    await png(browser,makeHtml(workspace,input,cards[Math.min(i,cards.length-1)],i,clips.length,true),overlay,1080,1920,true);
    await command(binary,['-hide_banner','-loglevel','error','-nostdin','-y','-ss',String(start),'-t',String(length),'-i',source,'-loop','1','-i',overlay,'-filter_complex','[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30[base];[base][1:v]overlay=0:0:shortest=1[v]','-map','[v]','-an','-t',String(length),'-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p',part]);
    const probe=await command(binary,['-hide_banner','-i',part,'-f','null','-']);if(!/Video:/.test(probe.stderr))fail('Không giải mã được clip đã dựng.');
    const actual=decodedDuration(probe);if(actual===null||Math.abs(actual-length)>0.15)fail('Clip nguồn ngắn hơn đoạn được chọn; hãy chọn lại thời gian bắt đầu/thời lượng.');
    segments.push(part);total+=length;
  }
  if(total<duration-0.1)fail('Tổng thời lượng clip chưa đủ thời lượng yêu cầu.');
  const joined=F.within(workspace,folder,'ghep-khong-tieng.mp4');
  const joinArgs=['-hide_banner','-loglevel','error','-nostdin','-y'];for(const segment of segments)joinArgs.push('-i',segment);
  joinArgs.push('-filter_complex',segments.map((_,i)=>`[${i}:v]`).join('')+`concat=n=${segments.length}:v=1:a=0[v]`,'-map','[v]','-an','-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p',joined);await command(binary,joinArgs);
  const video=F.within(workspace,folder,'Video.mp4');
  if(voice||music){
    const inputArgs=['-hide_banner','-loglevel','error','-nostdin','-y','-i',joined];if(voice)inputArgs.push('-i',voice);if(music)inputArgs.push('-stream_loop','-1','-i',music);
    let graph,map;
    if(voice&&music){graph='[1:a]apad,volume=1[voc];[2:a]volume=0.12[music];[voc][music]amix=inputs=2:duration=first[a]';map='[a]';}
    else {graph=`[1:a]${voice?'apad,volume=1':'volume=0.16'}[a]`;map='[a]';}
    inputArgs.push('-filter_complex',graph,'-map','0:v','-map',map,'-t',String(duration),'-c:v','copy','-c:a','aac','-b:a','160k','-movflags','+faststart',video);await command(binary,inputArgs);
  }else fs.copyFileSync(joined,video);
  const decoded=await command(binary,['-hide_banner','-i',video,'-f','null','-']);if(!/Video:/.test(decoded.stderr)||voice&&!/Audio:/.test(decoded.stderr))fail('Video/audio thành phẩm chưa giải mã được.');if(Math.abs(decodedDuration(decoded)-duration)>0.2)fail('Thời lượng video thành phẩm không khớp yêu cầu.');
  const subtitle=subtitleFile(workspace,folder,input.subtitles,duration);
  return [{path:video,role:'video',businessId:input.businessId,sourceId:input.sourceId,hasAudio:!!(voice||music),...F.inspect(video)},...(subtitle?[{path:subtitle,role:'subtitles',businessId:input.businessId,sourceId:input.sourceId,...F.inspect(subtitle)}]:[])];
}
async function render(workspace,input,options={}) {
  F.boundBusiness(workspace,input.businessId);
  text(input.businessId,'businessId');text(input.sourceId,'sourceId');if(!FORMATS.has(input.format))fail('Định dạng render không hỗ trợ.');
  if(input.format==='product_banner'&&input.product?.confirmed!==true)fail('Banner cần xác nhận đúng sản phẩm thật.');
  if(input.format==='personal_quote'&&input.person?.confirmed!==true)fail('Ảnh cá nhân cần xác nhận đúng người.');
  const id='render_'+crypto.randomUUID();const folder=F.within(workspace,'freeup-content-gon-lab-data','production','renders',id);fs.mkdirSync(folder,{recursive:true});
  const browser=await launch(options);let media;
  try{
    if(['broll_text','voice_video'].includes(input.format))media=await renderVideo(workspace,input,folder,browser,options);
    else{
      const cards=(input.cards||[]).map(normalizeCard);if(!cards.length||cards.length>12)fail('Cần 1–12 cards.');if(input.format==='carousel'&&cards.length<2)fail('Carousel cần ít nhất hai ảnh.');if(input.format!=='carousel'&&cards.length!==1)fail('Định dạng này cần đúng một card.');
      if(['visual_insight','infographic'].includes(input.format)&&cards.some(c=>!c.image&&c.panels.length<2))fail('Ảnh insight/infographic cần ảnh minh họa đã chọn hoặc ít nhất hai panel có cấu trúc; chữ đơn lẻ chưa đủ định dạng.');
      media=[];for(let i=0;i<cards.length;i++){
        const file=F.within(workspace,folder,`Ảnh ${String(i+1).padStart(2,'0')}.png`),html=makeHtml(workspace,input,cards[i],i,cards.length);
        const height=input.format==='carousel'?1080:1350;await png(browser,html,file,1080,height);media.push({path:file,role:input.format==='product_banner'?'product_banner':input.format==='personal_quote'?'portrait':'image',sourceId:input.sourceId,businessId:input.businessId,order:i+1,visualText:[cards[i].headline,cards[i].body,cards[i].cta,...cards[i].panels.map(p=>p.title+' '+p.body)].filter(Boolean).join('\n'),...F.inspect(file)});
      }
    }
  }finally{await browser.close();}
  const result={id,format:input.format,businessId:input.businessId,folder,media,requiresVisualReview:true,completePost:false,at:new Date().toISOString()};F.write(F.within(workspace,folder,'render.json'),result);return result;
}
async function main(argv=process.argv.slice(2)){const options=F.args(argv),workspace=F.workspace(options.workspace);if(!options.input)fail('Cần --input JSON.');return render(workspace,F.read(F.local(workspace,options.input)),{browserModule:options['browser-module'],browserExecutable:options['browser-executable'],ffmpeg:options.ffmpeg});}
if(require.main===module)main().then(result=>process.stdout.write(JSON.stringify(result,null,2)+'\n')).catch(error=>{process.stderr.write(error.message+'\n');process.exitCode=1;});
module.exports={main,render,makeHtml,normalizeCard,command,ffmpeg};
