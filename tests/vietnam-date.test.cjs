'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const P=require('../package/skills/freeup-content-gon-lab/scripts/production.cjs');
test('export uses the Vietnamese calendar day after local midnight even when UTC is the previous day',t=>{
 const ws=fs.mkdtempSync(path.join(os.tmpdir(),'content-vn-date-'));t.after(()=>fs.rmSync(ws,{recursive:true,force:true}));
 const RealDate=Date;
 global.Date=class extends RealDate {constructor(...args){super(...(args.length?args:['2026-10-21T17:05:00Z']));}static now(){return new RealDate('2026-10-21T17:05:00Z').getTime();}};
 try{
  const j=P.create(ws,{businessId:'test',format:'text',title:'Bài sau nửa đêm',caption:'Nội dung thử ngày Việt Nam.',sources:[{id:'s1',businessId:'test',confirmed:true}]});
  const q=P.qa(ws,j,{reviewer:'Test',checks:{factual:true,brand:true}});
  const result=P.exportJob(ws,q);assert.equal(path.basename(path.dirname(result.folder)),'2026-10-22');assert.ok(fs.existsSync(path.join(result.folder,'Bài viết.txt')));
 }finally{global.Date=RealDate;}
});
