#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {args}=require('./contentlab.cjs');
const F=require('./production-lib/files.cjs');
const PKG='freeup-content-gon-lab';
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function schema(){
  const p=path.resolve(__dirname,'../assets/sheets/content-sheet-schema.json');
  return JSON.parse(fs.readFileSync(fs.existsSync(p)?p:path.resolve(__dirname,'../../../../templates/sheets/content-sheet-schema.json'),'utf8'));
}
function ctx(o){
  const w=o.workspace||process.env.FREEUP_CONTENT_WORKSPACE;
  if(typeof w!=='string'||!path.isAbsolute(w))throw Error('Cần --workspace tuyệt đối.');
  const ws=path.resolve(w),root=F.within(ws,PKG+'-data','sheet');fs.mkdirSync(root,{recursive:true});
  const file=F.within(ws,root,'state.json');
  const state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{schema_version:1,package_id:PKG,binding:null,events:{},ideas:{},sources:{}};
  return {ws,root,file,state};
}
function save(c){const t=c.file+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(t,JSON.stringify(c.state,null,2));fs.renameSync(t,c.file);}
function input(c,o){if(!o.input)throw Error('Cần --input snapshot JSON.');const p=F.within(c.ws,o.input);return JSON.parse(fs.readFileSync(p,'utf8'));}
function properties(m){return (m.sheets||[]).map(s=>s.properties||s);}
function verifyMetadata(m){
  if(!m.spreadsheetId||!m.businessId)throw Error('Thiếu spreadsheetId hoặc businessId.');
  const s=schema(),props=properties(m);
  if(props.length!==3||s.tabs.some((t,i)=>props[i]?.title!==t.title)||props.some(p=>p.hidden===true))throw Error('Cần đúng ba tab theo thứ tự, không tab ẩn.');
  if(new Set(props.map(p=>p.sheetId)).size!==3||props.some(p=>!Number.isInteger(p.sheetId)))throw Error('sheetId không hợp lệ.');
  for(const t of s.tabs)if(m.headers?.[t.key]&&JSON.stringify(m.headers[t.key])!==JSON.stringify(t.headers))throw Error('Header không khớp: '+t.title);
  return props;
}
function setupPlan(m){
  const props=verifyMetadata(m),s=schema(),requests=[];
  s.tabs.forEach((t,i)=>{
    const id=props[i].sheetId;
    requests.push({updateCells:{range:{sheetId:id,startRowIndex:0,endRowIndex:1,startColumnIndex:0,endColumnIndex:t.headers.length},rows:[{values:t.headers.map(v=>({userEnteredValue:{stringValue:v}}))}],fields:'userEnteredValue'}});
    requests.push({updateSheetProperties:{properties:{sheetId:id,gridProperties:{frozenRowCount:1}},fields:'gridProperties.frozenRowCount'}});
    for(const [index,options] of Object.entries(t.options))requests.push({setDataValidation:{range:{sheetId:id,startRowIndex:1,endRowIndex:1000,startColumnIndex:Number(index),endColumnIndex:Number(index)+1},rule:{condition:{type:'ONE_OF_LIST',values:options.map(v=>({userEnteredValue:v}))},strict:true,showCustomUi:true}}});
    requests.push({addProtectedRange:{protectedRange:{range:{sheetId:id,startRowIndex:0,endRowIndex:1,startColumnIndex:0,endColumnIndex:t.headers.length},description:'Header Content Gọn',warningOnly:true}}});
  });
  return {ok:true,spreadsheetId:m.spreadsheetId,requests,applyOnlyToNewEmptyOrVerifiedLabTemplate:true};
}
function bind(c,m){
  verifyMetadata(m);
  for(const t of schema().tabs)if(!Array.isArray(m.headers?.[t.key])||JSON.stringify(m.headers[t.key])!==JSON.stringify(t.headers))throw Error('Phải đọc đủ header của ba tab trước khi bind.');
  if(c.state.binding&&(c.state.binding.spreadsheetId!==m.spreadsheetId||c.state.binding.businessId!==m.businessId))throw Error('Workspace đã nối bảng/doanh nghiệp khác; không tự ghi đè binding.');
  c.state.binding={spreadsheetId:m.spreadsheetId,businessId:m.businessId,timezone:'Asia/Ho_Chi_Minh',schema_version:schema().schema_version,sheets:properties(m),boundAt:new Date().toISOString()};save(c);
  return {ok:true,binding:c.state.binding};
}
function checkSnapshot(c,m){
  const b=c.state.binding;if(!b)throw Error('Chưa nối Sheet lab.');
  if(m.spreadsheetId!==b.spreadsheetId||m.businessId!==b.businessId)throw Error('Snapshot sai bảng hoặc doanh nghiệp.');
  if(!m.readAt||!Number.isFinite(Date.parse(m.readAt)))throw Error('Thiếu thời điểm đọc bảng.');
  if(Date.parse(m.readAt)>Date.now()+60000)throw Error('Thời điểm đọc nằm trong tương lai; đọc lại bảng.');
  if(Date.now()-Date.parse(m.readAt)>10*60*1000)throw Error('Snapshot quá cũ; đọc lại lựa chọn trước khi đồng bộ.');
  return b;
}
function ingest(c,m){
  checkSnapshot(c,m);const s=schema(),events=[],seen=new Set(),patches=[];
  const addEvent=(type,id,payload)=>{
    const eventId=digest({type,id,payload});
    if(!c.state.events[eventId])c.state.events[eventId]={eventId,type,id,payload,status:'pending',createdAt:new Date().toISOString()};
    const ev=c.state.events[eventId];if(ev.status!=='done')events.push(ev);
  };
  const rows=m.rows||{};
  for(const key of ['sources','ideas','posts']){
    const tab=s.tabs.find(t=>t.key===key),list=rows[key]||[];
    for(const r of list){
      if(!Number.isInteger(r.row)||r.row<2)throw Error('Số dòng không hợp lệ.');
      const values=r.values;if(!Array.isArray(values)||values.length<tab.visible_columns)throw Error('Snapshot thiếu cột tại '+key);
      if(values.every(v=>v===''||v==null))continue;
      const hasTitle=String(values[key==='sources'?1:key==='ideas'?1:0]||'').trim();
      if(!hasTitle){
        const actionable=key==='ideas'&&values[5]==='Làm bài'||key==='posts'&&values[5]&&values[5]!=='Chưa chọn';
        if(actionable)throw Error('Cần nội dung/tên bài trước khi chọn làm.');
        continue;
      }
      let id=String(values[tab.visible_columns]||'').trim();
      if(!id){id=key.slice(0,3)+'-'+crypto.randomUUID();patches.push({sheet:key,row:r.row,column:tab.visible_columns+1,value:id});}
      if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id)||seen.has(key+':'+id))throw Error('Mã dòng trùng hoặc không hợp lệ.');
      seen.add(key+':'+id);
      if(key==='sources'){
        if(!['Bật','Tắt',''].includes(values[0]))throw Error('Dùng nguồn phải là Bật/Tắt.');
        c.state.sources[id]={id,values,row:r.row};continue;
      }
      if(key==='ideas'){
        c.state.ideas[id]={id,values,row:r.row};
        if(values[5]==='Làm bài'){
          const menu=JSON.parse(fs.readFileSync(require('./contentlab.cjs').asset('onboarding/menu-catalog.json'),'utf8'));
          const format=menu.items.find(x=>x.label===values[4]||x.key===values[4]);if(!format)throw Error('Chọn đúng một định dạng cho ý '+id);
          addEvent('produce',id,{businessId:m.businessId,ideaId:id,title:values[1],brief:values[2],source:values[3],format:format.key,notes:values[6]});
        }
      }else{
        const action=values[5];if(!action||action==='Chưa chọn')continue;
        if(!['Yêu cầu sửa','Duyệt nội dung','Đăng theo lịch','Tôi tự đăng'].includes(action))throw Error('Hành động chưa hợp lệ.');
        const version=String(values[12]||'');
        if(!version)throw Error('Bài chưa có phiên bản để nhận yêu cầu duyệt/sửa.');
        addEvent(action==='Yêu cầu sửa'?'revise':action==='Duyệt nội dung'?'approve':action==='Tôi tự đăng'?'export':'publish_request',id,{businessId:m.businessId,jobId:id,version,title:values[0],caption:values[1],mediaPreview:values[2],channel:values[3],publishAt:values[4],feedback:values[6],instruction:action});
      }
    }
  }
  // A new ID must be written and read back before dispatch, so repeated reads cannot duplicate work.
  if(patches.length)return {ok:true,phase:'assign_ids_then_read_back',idPatches:patches,events:[],requiresReadBack:true};
  c.state.lastReadAt=m.readAt;save(c);
  return {ok:true,phase:'dispatch',events,automaticPublishing:false,next:'Thực hiện từng event bằng helper, ghi kết quả và ack sau khi thành công.'};
}
function ack(c,m){
  const ev=c.state.events[m.eventId];if(!ev)throw Error('Không tìm thấy event.');
  if(m.success!==true||!m.resultId)throw Error('Chỉ ack sau kết quả thành công có ID thật.');
  if(ev.type==='publish_request'&&!m.verifiedPermalink)throw Error('Yêu cầu đăng cần link đã đối chiếu; chưa có thì giữ chờ.');
  ev.status='done';ev.resultId=m.resultId;ev.completedAt=new Date().toISOString();if(m.verifiedPermalink)ev.permalink=m.verifiedPermalink;save(c);return {ok:true,event:ev};
}
function main(argv=process.argv.slice(2)){
  const o=args(argv),cmd=o._[0]||'schema';
  if(cmd==='schema')return {ok:true,schema:schema(),createBody:{properties:{title:'FreeUp Content Gọn',locale:'vi_VN',timeZone:'Asia/Ho_Chi_Minh'},sheets:schema().tabs.map((t,i)=>({properties:{sheetId:100+i,title:t.title,gridProperties:{rowCount:1000,columnCount:t.headers.length,frozenRowCount:1}}}))}};
  const c=ctx(o);
  if(cmd==='status')return {ok:true,binding:c.state.binding,pending:Object.values(c.state.events).filter(e=>e.status!=='done')};
  const m=input(c,o);
  if(cmd==='setup-plan')return setupPlan(m);
  if(cmd==='bind')return bind(c,m);
  if(cmd==='ingest')return ingest(c,m);
  if(cmd==='ack')return ack(c,m);
  throw Error('Lệnh Sheet chưa được hỗ trợ.');
}
if(require.main===module){try{console.log(JSON.stringify(main(),null,2));}catch(e){console.error(JSON.stringify({ok:false,error:e.message}));process.exitCode=1;}}
module.exports={main,schema};
