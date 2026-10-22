'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { RELEASE, main, download, unzip, verifyManifest } = require('../download-release.cjs');
const { zip } = require('../scripts/build-release.cjs');
const archive = () => fs.readFileSync(path.join(__dirname, '../downloads/freeup-content-gon-lab-0.3.1.zip'));
function fixture(t) { const parent=fs.realpathSync(os.tmpdir()),root=fs.mkdtempSync(path.join(parent,'freeup-download-test-'));t.after(()=>{assert.equal(path.dirname(root),parent);assert.ok(path.basename(root).startsWith('freeup-download-test-'));fs.rmSync(root,{recursive:true,force:true});});return root; }
function reply(data,headers={}) { return new Response(data,{status:200,headers:{'content-type':'application/octet-stream',...headers}}); }
test('help performs no network or writes and caller cannot select arbitrary URL/path',async()=>{
 assert.equal((await main(['--help'],{fetch:()=>assert.fail('network')})).ok,true);
 await assert.rejects(main(['--url','https://example.com']),{code:'INVALID_ARGUMENT'});
});
test('downloads binary through Node fetch, preserves Vietnamese names and verifies every payload file',async t=>{
 const root=fixture(t),data=archive();let calls=0;
 const result=await main([],{tmpRoot:root,fetch:async(url,opt)=>{calls++;assert.equal(url,RELEASE.url);assert.equal(opt.redirect,'manual');return reply(data,{'content-length':String(data.length)});}});
 assert.equal(calls,1);assert.equal(result.archiveVerified,true);assert.equal(result.releaseManifestVerified,true);assert.equal(result.sha256,RELEASE.sha256);assert.equal(result.downloadedBytes,RELEASE.bytes);
 assert.equal(result.workspaceChanged,false);assert.equal(result.hostConfigChanged,false);
 assert.ok(fs.existsSync(path.join(result.sourcePath,'templates/sheets/Content Gọn - 3 trang tính.xlsx')));
 assert.ok(fs.existsSync(result.orchestratorPath));assert.deepEqual(fs.readFileSync(result.archivePath),data);
 const installer=require(path.join(result.sourcePath,'install.cjs'));assert.equal(installer.sourcePlan(result.sourcePath).releaseVerified,true);
});
test('follows only authorized HTTPS GitHub asset redirects without a web reading tool',async()=>{
 let calls=0;const data=await download(async(url)=>{calls++;if(calls===1)return new Response(null,{status:302,headers:{location:'https://release-assets.githubusercontent.com/github-production-release-asset/test'}});assert.ok(url.startsWith('https://release-assets.githubusercontent.com/'));return reply(archive());});
 assert.equal(calls,2);assert.equal(data.length,RELEASE.bytes);
});
test('rejects private/credentialed/non-GitHub redirects before making another request',async()=>{
 for(const location of ['http://github.com/file','https://127.0.0.1/file','https://example.com/file','https://user:pass@github.com/file']){let calls=0;await assert.rejects(download(async()=>{calls++;return new Response(null,{status:302,headers:{location}});}),{code:'DOWNLOAD_REDIRECT_REJECTED'});assert.equal(calls,1);}
});
test('partial binary/text returned by a web reader cannot pass integrity and creates no temp files',async t=>{
 const root=fixture(t),data=archive();
 const corrupted=Buffer.from(data);corrupted[100]^=0xff;
 for(const body of [data.subarray(0,8000),Buffer.from('PK partial web excerpt'),corrupted]){
  await assert.rejects(main([],{tmpRoot:root,fetch:async()=>reply(body)}),{code:'ARCHIVE_HASH_MISMATCH'});assert.deepEqual(fs.readdirSync(root),[]);
 }
});
test('fails cleanly on HTML, HTTP errors, truncated transfer or oversized declarations',async()=>{
 await assert.rejects(download(async()=>new Response('<html>login</html>',{headers:{'content-type':'text/html'}})),{code:'DOWNLOAD_NOT_ARCHIVE'});
 await assert.rejects(download(async()=>new Response('no',{status:403})),{code:'DOWNLOAD_HTTP_FAILED'});
 await assert.rejects(download(async()=>reply(Buffer.from('abc'),{'content-length':'4'})),{code:'DOWNLOAD_TRUNCATED'});
 await assert.rejects(download(async()=>reply(Buffer.from('abc'),{'content-length':'999999999'})),{code:'DOWNLOAD_SIZE_INVALID'});
 await assert.rejects(download(async()=>{throw Error('private transport detail');}),{code:'DOWNLOAD_NETWORK_FAILED'});
});
test('rejects traversal, Windows aliases and duplicate Unicode/case paths',()=>{
 for(const name of ['../escape','/absolute','C:/escape','folder\\escape','folder/NUL.txt','folder/file.'])assert.throws(()=>unzip(zip([{path:name,data:Buffer.from('x')} ])),{code:'ZIP_UNSAFE_PATH'});
 assert.throws(()=>unzip(zip([{path:'Folder/A.txt',data:Buffer.from('a')},{path:'folder/a.txt',data:Buffer.from('b')} ])),{code:'ZIP_DUPLICATE_PATH'});
});
test('rejects symbolic links and central/local mismatches',()=>{
 const symbolic=zip([{path:'folder/link',data:Buffer.from('target')}]);const cd=symbolic.readUInt32LE(symbolic.length-22+16);symbolic.writeUInt32LE((0o120777<<16)>>>0,cd+38);assert.throws(()=>unzip(symbolic),{code:'ZIP_UNSUPPORTED'});
 const changed=zip([{path:'folder/file',data:Buffer.from('data')}]);changed.writeUInt32LE(999,18);assert.throws(()=>unzip(changed),{code:'ZIP_INVALID'});
 assert.throws(()=>unzip(archive().subarray(0,-20)),{code:'ZIP_INVALID'});
});
test('pinned release manifest matches all files and detects modified payload',()=>{
 const files=unzip(archive());assert.equal(verifyManifest(files),'freeup-content-gon-lab-0.3.1');
 const changed=files.map(x=>({...x}));changed.find(x=>x.name.endsWith('/install-9b.cjs')).data=Buffer.from('changed');assert.throws(()=>verifyManifest(changed),{code:'RELEASE_FILE_MISMATCH'});
});
