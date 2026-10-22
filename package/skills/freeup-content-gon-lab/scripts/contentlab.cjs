#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const F = require('./production-lib/files.cjs');
const base = path.resolve(__dirname, '..');
const VERSION = JSON.parse(fs.readFileSync(path.join(base, 'package.json'), 'utf8')).version;
function args(argv) {
  const out={_:[]};
  for(let i=0;i<argv.length;i++) {
    if(argv[i].startsWith('--')) {const k=argv[i].slice(2); if(!k || out[k]!==undefined) throw Error('Tham số trùng/không hợp lệ.'); out[k]=argv[i+1] && !argv[i+1].startsWith('--') ? argv[++i] : true;}
    else out._.push(argv[i]);
  }
  return out;
}
function asset(rel) {
  const installed=path.join(base,'assets',rel);
  if(fs.existsSync(installed)) return installed;
  const root=path.resolve(base,'../../..');
  const dev=rel.startsWith('onboarding/')?path.join(root,rel):rel.startsWith('menu/')?path.join(root,'assets',rel):path.join(root,rel);
  return dev;
}
function workspace(opt) {
  const w=opt.workspace || process.env.FREEUP_CONTENT_WORKSPACE;
  if(typeof w!=='string'||!path.isAbsolute(w)) throw Error('Cần --workspace là đường dẫn tuyệt đối của bản lab.');
  const abs=path.resolve(w);fs.mkdirSync(abs,{recursive:true});return fs.realpathSync(abs);
}
function sessionFile(ws,opt) {
  const id=String(opt.session||'owner');
  const dir=F.within(ws,'freeup-content-gon-lab-data','menu');fs.mkdirSync(dir,{recursive:true});
  return F.within(ws,dir,crypto.createHash('sha256').update(id).digest('hex')+'.json');
}
function catalog(){return JSON.parse(fs.readFileSync(asset('onboarding/menu-catalog.json'),'utf8'));}
function rendererConfig(opt){
  if(!opt.workspace&&!process.env.FREEUP_CONTENT_WORKSPACE)return {};
  const ws=workspace(opt),file=F.within(ws,'freeup-content-gon-lab-data','runtime','renderer.json');
  return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
}
function menu(opt){
  const ws=workspace(opt),cat=catalog(),file=asset('menu/he-thong-content-ngang-v2.png');
  if(!fs.existsSync(file)) throw Error('Không tìm thấy ảnh menu; kiểm lại bộ cài.');
  const png=fs.readFileSync(file);if(png.length<24||!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Ảnh menu không đọc được.');
  const dest=F.within(ws,'freeup-content-gon-lab-data','help','Menu hệ thống content.png');fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.copyFileSync(file,dest);
  fs.writeFileSync(sessionFile(ws,opt),JSON.stringify({schema_version:1,awaiting:true,openedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+2*60*60*1000).toISOString()},null,2));
  return {ok:true,action:'show_menu',mediaPath:dest,attachment:'MEDIA:'+dest,mimeType:'image/png',items:cat.items.map(({number,key,label})=>({number,key,label})),shortcut:cat.shortcut,text:'Chọn số 1–9 hoặc tên kiểu content, kèm chủ đề. Chọn 0 để làm theo lịch.',startsProduction:false};
}
function select(opt){
  const ws=workspace(opt),cat=catalog(),value=String(opt.value||'').trim(),file=sessionFile(ws,opt);
  if(!value)throw Error('Cần --value số hoặc tên đã chọn.');
  const normal=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim();
  const n=normal(value),m=n.match(/^(?:chon )?([0-9])$/);
  if(/^\d$/.test(value)) {
    const prior=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
    if(!prior?.awaiting||Date.parse(prior.expiresAt)<Date.now())throw Error('Chưa có menu đang chờ chọn; hãy mở hệ thống content.');
  }
  const all=[...cat.items,cat.shortcut];
  const item=m?all.find(x=>x.number===Number(m[1])):all.find(x=>n===normal(x.label)||n===normal(x.key));
  if(!item)throw Error('Lựa chọn chưa khớp chín kiểu content hoặc mục 0.');
  fs.writeFileSync(file,JSON.stringify({schema_version:1,awaiting:false,selectedAt:new Date().toISOString(),format:item.key,number:item.number},null,2));
  return {ok:true,action:item.number===0?'plan_content':'assess_selected_format',selection:item,startsProduction:false,next:'Đọc dữ liệu đã có, hỏi đúng phần còn thiếu rồi sản xuất theo brief.'};
}
function doctor(opt){
  const rc=rendererConfig(opt);
  const checks={node:Number(process.versions.node.split('.')[0])>=22,menu:fs.existsSync(asset('menu/he-thong-content-ngang-v2.png')),knowledgeCatalog:fs.existsSync(asset('onboarding/knowledge-catalog.json'))};
  let puppeteer=false;try {require.resolve(String(opt['browser-module']||rc.browserModule||'puppeteer'));puppeteer=true;}catch{}
  const ffmpeg=cp.spawnSync(opt.ffmpeg||rc.ffmpeg||process.env.FREEUP_FFMPEG_PATH||process.env.FREEUP_FFMPEG||'ffmpeg',['-version'],{encoding:'utf8',windowsHide:true,timeout:10000});
  return {ok:Object.values(checks).every(Boolean),version:VERSION,checks,render:{localPng:puppeteer,ffmpeg:ffmpeg.status===0,nativeImages:'host_tool_required'},nativeConnections:'not_probed',publishing:'manual_or_host_approved_only',workspace:opt.workspace?workspace(opt):null};
}
function main(argv=process.argv.slice(2)){
  const opt=args(argv),cmd=opt._[0]||'help';
  if(['onboarding','production','render','sheet','renderer-setup'].includes(cmd)){
    const rest=argv.slice();rest.splice(rest.indexOf(cmd),1);
    if(cmd==='render'||cmd==='production'&&opt._[1]==='qa'){
      const rc=rendererConfig(opt);
      for(const [flag,key]of Object.entries(cmd==='render'?{'browser-module':'browserModule','browser-executable':'browserExecutable',ffmpeg:'ffmpeg'}:{ffmpeg:'ffmpeg'}))if(!opt[flag]&&rc[key])rest.push('--'+flag,rc[key]);
    }
    const r=cp.spawnSync(process.execPath,[path.join(__dirname,(cmd==='renderer-setup'?'setup-renderer':cmd)+'.cjs'),...rest],{encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});
    if(r.error)throw r.error;
    if(r.status!==0)throw Error((r.stderr||r.stdout||'Lệnh chưa hoàn tất.').trim());
    try{return JSON.parse(r.stdout);}catch{throw Error('Helper không trả JSON hợp lệ.');}
  }
  if(cmd==='menu')return menu(opt);
  if(cmd==='select')return select(opt);
  if(cmd==='scope'){
    const ws=workspace(opt),agentId=String(opt['agent-id']||'').trim();
    if(!agentId||!/^[a-zA-Z0-9_-]{1,100}$/.test(agentId))throw Error('Cần agent ID thật từ ngữ cảnh host.');
    return {ok:true,agentId,businessId:'local-9b-'+crypto.createHash('sha256').update(ws+'\0'+agentId).digest('hex').slice(0,24),scopeType:'local_workspace_binding',isNativeBusinessId:false,note:'Chỉ dùng khi host không cấp business ID; quyền đọc dữ liệu vẫn do native tools quyết định.'};
  }
  if(cmd==='doctor')return doctor(opt);
  if(cmd==='help')return {commands:['menu','select --value 2','doctor','onboarding','production','render','sheet'],workspace:'--workspace ABS',version:VERSION};
  throw Error('Lệnh chưa được hỗ trợ: '+cmd);
}
if(require.main===module){try{console.log(JSON.stringify(main(),null,2));}catch(e){console.error(JSON.stringify({ok:false,error:e.message}));process.exitCode=1;}}
module.exports={main,args,asset};
