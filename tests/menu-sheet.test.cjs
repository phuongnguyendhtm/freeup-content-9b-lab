'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const menu=require('../package/skills/freeup-content-gon-lab/scripts/contentlab.cjs');
const sheet=require('../package/skills/freeup-content-gon-lab/scripts/sheet.cjs');
function temp(t){const p=fs.mkdtempSync(path.join(os.tmpdir(),'content-gon-menu-'));t.after(()=>fs.rmSync(p,{recursive:true,force:true}));return p;}
function call(m,w,cmd,data){const f=path.join(w,'snapshot.json');if(data)fs.writeFileSync(f,JSON.stringify(data));return m.main([cmd,'--workspace',w,...(data?['--input',f]:[])]);}
function metadata(){return {spreadsheetId:'test-sheet',businessId:'demo-business',sheets:sheet.schema().tabs.map((t,i)=>({properties:{title:t.title,sheetId:i,hidden:false}})),headers:Object.fromEntries(sheet.schema().tabs.map(t=>[t.key,t.headers]))};}
test('menu can open without onboarding and does not create a production job',t=>{
 const w=temp(t);assert.throws(()=>menu.main(['select','--workspace',w,'--value','2']),/menu/);
 const r=menu.main(['menu','--workspace',w,'--session','chat-a']);assert.equal(r.items[1].label,'Bài đăng kèm sản phẩm');assert.equal(r.startsProduction,false);assert.ok(fs.statSync(r.mediaPath).size>1000);
 assert.throws(()=>menu.main(['select','--workspace',w,'--session','chat-b','--value','2']),/menu/);
 const selected=menu.main(['select','--workspace',w,'--session','chat-a','--value','2']);assert.equal(selected.selection.key,'product_post');assert.equal(selected.startsProduction,false);
 assert.ok(!fs.existsSync(path.join(w,'freeup-content-gon-lab-data','production')));
});
test('sheet binding refuses wrong workbook layout and accidental rebinding',t=>{
 const w=temp(t),m=metadata();call(sheet,w,'bind',m);
 assert.throws(()=>call(sheet,w,'bind',{...m,spreadsheetId:'other'}),/binding/);
 assert.throws(()=>call(sheet,temp(t),'bind',{...m,sheets:[...m.sheets,{properties:{title:'Thiết lập',sheetId:9}}]}),/ba tab/);
 assert.throws(()=>call(sheet,temp(t),'bind',{...m,headers:{ideas:['bad']}}),/Header/);
});
test('selecting an idea requires stable IDs and repeated reads create only one acknowledged event',t=>{
 const w=temp(t),m=metadata();call(sheet,w,'bind',m);
 const v=['','Lợi ích sản phẩm','Dùng dữ kiện thật','','Bài đăng kèm sản phẩm','Làm bài','','Chờ chọn',''];
 const snap={spreadsheetId:m.spreadsheetId,businessId:m.businessId,readAt:new Date().toISOString(),rows:{ideas:[{row:2,values:v}]}};
 const first=call(sheet,w,'ingest',snap);assert.equal(first.events.length,0);assert.equal(first.idPatches.length,1);
 v[8]=first.idPatches[0].value;const next=call(sheet,w,'ingest',snap);assert.equal(next.events.length,1);assert.equal(next.events[0].payload.format,'product_post');
 assert.equal(call(sheet,w,'ingest',snap).events[0].eventId,next.events[0].eventId);
 call(sheet,w,'ack',{eventId:next.events[0].eventId,success:true,resultId:'job-real'});
 assert.equal(call(sheet,w,'ingest',snap).events.length,0);
 assert.throws(()=>call(sheet,w,'ingest',{...snap,businessId:'other'}),/sai bảng/);
 assert.throws(()=>call(sheet,w,'ingest',{...snap,readAt:'2020-01-01T00:00:00Z'}),/quá cũ/);
});
test('blank template defaults do not produce IDs or jobs; duplicate rows fail',t=>{
 const w=temp(t),m=metadata();call(sheet,w,'bind',m);
 const snap={spreadsheetId:m.spreadsheetId,businessId:m.businessId,readAt:new Date().toISOString(),rows:{ideas:[{row:2,values:['','','','','Bài viết','Chưa chọn','','Chờ chọn','']}]}};
 assert.equal(call(sheet,w,'ingest',snap).events.length,0);
 snap.rows.ideas=[2,3].map(row=>({row,values:['','Tên bài','','','Bài viết','Làm bài','','','same']}));
 assert.throws(()=>call(sheet,w,'ingest',snap),/trùng/);
});
test('publish selection remains pending without verified permalink',t=>{
 const w=temp(t),m=metadata();call(sheet,w,'bind',m);
 const snap={spreadsheetId:m.spreadsheetId,businessId:m.businessId,readAt:new Date().toISOString(),rows:{posts:[{row:2,values:['Tên bài','Caption','preview','Page','2026-11-01','Đăng theo lịch','','','','','job-a','','1']}]}};
 const ev=call(sheet,w,'ingest',snap).events[0];assert.equal(ev.type,'publish_request');
 assert.throws(()=>call(sheet,w,'ack',{eventId:ev.eventId,success:true,resultId:'claimed'}),/đối chiếu/);
});
