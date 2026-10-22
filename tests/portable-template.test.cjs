'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const installer=require('../install.cjs'),sheet=require('../package/skills/freeup-content-gon-lab/scripts/sheet.cjs');
const repo=path.resolve(__dirname,'..');
function temp(t){const root=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'freeup-portable-'));t.after(()=>{assert.ok(path.basename(root).startsWith('freeup-portable-'));fs.rmSync(root,{recursive:true,force:true});});return root;}
for(const host of ['openclaw','9bizclaw','claude','codex'])test(`full package installs and runs on ${host} layout`,t=>{
  const ws=path.join(temp(t),'Dự án khách');fs.mkdirSync(ws);
  const first=installer.install({host,workspace:ws,source:repo});assert.equal(first.verified,true);assert.equal(first.host,host);
  const relative=host==='claude'?'.claude/skills/contentlab':host==='codex'?'.agents/skills/contentlab':'skills/freeup-content-gon-lab';
  assert.equal(path.relative(ws,first.target).split(path.sep).join('/'),relative);
  const localSheet=require(path.join(first.target,'scripts/sheet.cjs'));const ref=localSheet.main(['template']).template;
  assert.equal(ref.verified,true);assert.ok(ref.xlsxPath.startsWith(first.target));assert.equal(ref.allowBlankWorkbookCreation,false);
  const menu=require(path.join(first.target,'scripts/contentlab.cjs')).main(['menu','--workspace',ws]);assert.ok(fs.statSync(menu.mediaPath).size>1000);
  const next=installer.install({host,workspace:ws,source:repo});assert.equal(next.changed,false);
});
test('host detection uses current session and refuses uncertain multi-host workspace',t=>{
  assert.equal(installer.detectHost({host:'auto',env:{CLAUDECODE:'1'}}),'claude');
  assert.equal(installer.detectHost({host:'auto',env:{CODEX_THREAD_ID:'test'}}),'codex');
  assert.equal(installer.detectHost({host:'auto',env:{OPENCLAW_STATE_DIR:'/state'}}),'openclaw');
  assert.equal(installer.detectHost({host:'auto',env:{NINEBIZ_NODE:'/node'}}),'9bizclaw');
  const ws=temp(t);fs.mkdirSync(path.join(ws,'.claude'));fs.mkdirSync(path.join(ws,'.agents'));
  assert.throws(()=>installer.detectHost({host:'auto',workspace:ws,env:{}}),/nhiều host/);
  assert.throws(()=>installer.detectHost({host:'auto',env:{}}),/Chưa nhận diện/);
  assert.throws(()=>installer.detectHost({host:'other',env:{}}),/--host/);
});
test('sheet template is pinned, generic workbook creation is unavailable and unproven binding is rejected',t=>{
  const ws=temp(t),ref=sheet.template();assert.equal(ref.verified,true);assert.equal(sheet.main(['schema']).createBody,undefined);
  const m={spreadsheetId:'customer-new',businessId:'demo',sheets:sheet.schema().tabs.map((s,i)=>({properties:{sheetId:i,title:s.title}})),headers:Object.fromEntries(sheet.schema().tabs.map(s=>[s.key,s.headers]))};
  const file=path.join(ws,'metadata.json');const bind=()=>sheet.main(['bind','--workspace',ws,'--input',file]);
  fs.writeFileSync(file,JSON.stringify(m));assert.throws(bind,/templateOrigin/);
  m.templateOrigin={templateId:ref.templateId,revision:ref.revision,xlsxSha256:ref.xlsxSha256,method:'blank',resultSpreadsheetId:m.spreadsheetId,verified:true};
  fs.writeFileSync(file,JSON.stringify(m));assert.throws(bind,/templateOrigin/);
  m.templateOrigin.method='drive_copy';m.templateOrigin.sourceSpreadsheetId='wrong';fs.writeFileSync(file,JSON.stringify(m));assert.throws(bind,/đúng nguồn/);
  m.templateOrigin.sourceSpreadsheetId=ref.spreadsheetId;fs.writeFileSync(file,JSON.stringify(m));assert.equal(bind().ok,true);
});
test('tampered installed XLSX stops sheet setup instead of silently choosing a replacement',t=>{
  const ws=temp(t),receipt=installer.install({host:'claude',workspace:ws,source:repo});
  const local=require(path.join(receipt.target,'scripts/sheet.cjs')),ref=local.template();fs.appendFileSync(ref.xlsxPath,'tampered');
  assert.throws(()=>local.main(['template']),/SHA256/);
});
