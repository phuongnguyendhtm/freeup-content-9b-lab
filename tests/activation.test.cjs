'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { main } = require('../activate-9b.cjs');
function fixture(t, change = () => {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'freeup-activation-'));
  t.after(() => { if (path.dirname(root) !== fs.realpathSync(os.tmpdir())) throw Error('Unsafe cleanup'); fs.rmSync(root, { recursive: true, force: true }); });
  const workspace = path.join(root, 'Workspace có dấu'); fs.mkdirSync(workspace);
  const skill = path.join(workspace, 'skills', 'freeup-content-gon-lab'); fs.mkdirSync(skill, { recursive: true });
  fs.writeFileSync(path.join(skill, '.freeup-content-gon-lab-owner.json'), JSON.stringify({ schema_version: 1, package_id: 'freeup-content-gon-lab' }));
  fs.writeFileSync(path.join(skill, 'SKILL.md'), '---\nname: contentlab\ndescription: Content lab thử nghiệm\n---\n');
  const configFile = path.join(root, 'openclaw.json');
  const cfg = { agents: { defaults: { skills: ['old-one', 'old-two'] }, entries: { 'content-gon-test': { workspace, name: 'Lab' }, untouched: { workspace: path.join(root, 'other'), skills: ['unchanged'] } } }, credentials: { token: 'NEVER_PRINT_SECRET' } };
  change(cfg);
  fs.writeFileSync(configFile, JSON.stringify(cfg, null, 2));
  const entry = path.join(root, 'mock-openclaw.cjs');
  fs.writeFileSync(entry, String.raw`const fs=require('node:fs');
const file=process.env.OPENCLAW_CONFIG_PATH, cfg=JSON.parse(fs.readFileSync(file,'utf8')), a=process.argv.slice(2);
const m=a[2]?.match(/^agents\.entries\[(".*")\]\.skills$/);
if(!m){process.stderr.write('Unsupported path');process.exit(1);}
const id=JSON.parse(m[1]), agent=cfg.agents.entries[id];
if(a[0]!=='config'||!agent)process.exit(1);
if(a[1]==='get'){
  if(cfg.testing?.denyGet){process.stdout.write(JSON.stringify({ok:false,error:{type:'cli_error',message:'Permission denied NEVER_PRINT_SECRET'}}));process.exit(1);}
  if(!Object.hasOwn(agent,'skills')){process.stdout.write(JSON.stringify({ok:false,error:{type:'cli_error',message:'Config path is valid but unset: '+a[2]+'. Use config set to override.'}}));process.exit(1);}
  process.stdout.write(JSON.stringify(agent.skills));process.exit(cfg.testing?.rejectGetAfterOutput?1:0);
}

if(a[1]!=='set'||cfg.testing?.noSet)process.exit(1);
if(a.includes('--expect-current-absent')&&Object.hasOwn(agent,'skills'))process.exit(1);
const expected=a.indexOf('--expect-current-json');
if(expected>=0&&JSON.stringify(agent.skills)!==a[expected+1])process.exit(1);
agent.skills=JSON.parse(a[3]);
if(cfg.testing?.changeOthers)cfg.credentials.token='CHANGED';
if(cfg.testing?.touchMetadata)cfg.meta={...cfg.meta,lastTouchedAt:'2026-10-22T12:00:00.000Z',lastTouchedVersion:'host-native-test'};
if(cfg.testing?.changeOtherMetadata)cfg.meta={...cfg.meta,custom:'CHANGED'};
fs.writeFileSync(file,JSON.stringify(cfg,null,2));console.log('Updated agent skills');
if(cfg.testing?.rejectAfterWrite)process.exit(1);
if(cfg.testing?.hangAfterWrite)setInterval(()=>{},1000);`);
  const args = ['--workspace', workspace, '--agent', 'content-gon-test', '--config', configFile, '--openclaw-entrypoint', entry, '--node', process.execPath];
  return { root, workspace, skill, configFile, entry, args, read: () => JSON.parse(fs.readFileSync(configFile, 'utf8')) };
}
test('activation help explains scoped use without requiring or reading configuration', async () => {
  const result = await main(['--help']);
  assert.equal(result.ok, true); assert.ok(result.usage.includes('--check|--apply'));
  assert.equal(result.configured, undefined);
});

test('check reports inherited restriction without changing any config byte', async t => {
  const f = fixture(t), before = fs.readFileSync(f.configFile, 'utf8');
  const result = await main([...f.args, '--check']);
  assert.equal(result.status, 'activation-required'); assert.equal(result.configured, false); assert.equal(result.chatVerified, false);
  assert.equal(result.nextSkillCount, 3); assert.equal(fs.readFileSync(f.configFile, 'utf8'), before);
  assert.ok(!JSON.stringify(result).includes('NEVER_PRINT_SECRET'));
});
test('apply appends contentlab only on selected agent and retains inherited/default lists', async t => {
  const f = fixture(t), old = f.read();
  const result = await main([...f.args, '--apply']); const updated = f.read();
  assert.equal(result.status, 'activation-configured'); assert.equal(result.changed, true); assert.equal(result.otherSettingsUnchanged, true); assert.equal(result.chatVerified, false);
  assert.deepEqual(updated.agents.entries['content-gon-test'].skills, ['old-one', 'old-two', 'contentlab']);
  assert.deepEqual(updated.agents.defaults, old.agents.defaults); assert.deepEqual(updated.agents.entries.untouched, old.agents.entries.untouched); assert.deepEqual(updated.credentials, old.credentials);
  assert.equal((await main([...f.args, '--apply'])).changed, false);
});
test('explicit per-agent list overrides defaults and remains intact when appended', async t => {
  const f = fixture(t, cfg => { cfg.agents.entries['content-gon-test'].skills = ['agent-only']; });
  const result = await main([...f.args, '--apply']);
  assert.equal(result.inheritedList, false); assert.deepEqual(f.read().agents.entries['content-gon-test'].skills, ['agent-only', 'contentlab']);
});
test('unrestricted defaults do not get replaced with a restrictive one-skill allowlist', async t => {
  const f = fixture(t, cfg => { delete cfg.agents.defaults.skills; });
  const result = await main([...f.args, '--apply']);
  assert.equal(result.configured, true); assert.equal(result.changed, false); assert.equal(Object.hasOwn(f.read().agents.entries['content-gon-test'], 'skills'), false);
});
test('registered workspace, owner marker and slash name must match before activation', async t => {
  const wrong = fixture(t, cfg => { cfg.agents.entries['content-gon-test'].workspace = os.tmpdir(); });
  await assert.rejects(main([...wrong.args, '--apply']), { code: 'WORKSPACE_MISMATCH' });
  const unowned = fixture(t); fs.writeFileSync(path.join(unowned.skill, '.freeup-content-gon-lab-owner.json'), JSON.stringify({ schema_version: 1, package_id: 'another' }));
  await assert.rejects(main([...unowned.args, '--apply']), { code: 'NOT_OWNED' });
  const oldName = fixture(t); fs.writeFileSync(path.join(oldName.skill, 'SKILL.md'), '---\nname: freeup-content-gon-lab\ndescription: Old\n---\n');
  await assert.rejects(main([...oldName.args, '--apply']), { code: 'SKILL_NAME_MISMATCH' });
});
test('CLI that rejects mutation does not trigger direct config rewriting', async t => {
  const f = fixture(t, cfg => { cfg.testing = { noSet: true }; }); const before = fs.readFileSync(f.configFile, 'utf8');
  await assert.rejects(main([...f.args, '--apply']), { code: 'ACTIVATION_NOT_CONFIRMED' });
  assert.equal(fs.readFileSync(f.configFile, 'utf8'), before);
});
test('inherited native read denial with exit 1 never becomes an accepted unset path', async t => {
  const f = fixture(t, cfg => { cfg.testing = { denyGet: true }; }); const before = fs.readFileSync(f.configFile, 'utf8');
  await assert.rejects(main([...f.args, '--apply']), { code: 'NATIVE_GET_FAILED' });
  assert.equal(fs.readFileSync(f.configFile, 'utf8'), before);
});

test('explicit native failure stays a failure even if output or concurrent state resembles success', async t => {
  const deniedRead=fixture(t,cfg=>{cfg.agents.entries['content-gon-test'].skills=['old'];cfg.testing={rejectGetAfterOutput:true};});
  await assert.rejects(main([...deniedRead.args,'--apply']),{code:'NATIVE_GET_FAILED'});
  assert.deepEqual(deniedRead.read().agents.entries['content-gon-test'].skills,['old']);
  const deniedWrite=fixture(t,cfg=>{cfg.testing={rejectAfterWrite:true};});
  await assert.rejects(main([...deniedWrite.args,'--apply']),{code:'ACTIVATION_NOT_CONFIRMED'});
  assert.ok(deniedWrite.read().agents.entries['content-gon-test'].skills.includes('contentlab'));
});
test('native CLI lingering after completion is stopped and fresh readback determines success', async t => {
  const f = fixture(t, cfg => { cfg.testing = { hangAfterWrite: true }; });
  const started = Date.now(), result = await main([...f.args, '--apply']);
  assert.equal(result.configured, true); assert.equal(result.nativeCompletionDetected, true); assert.ok(Date.now() - started < 10000);
});
test('changes to any other configuration are reported instead of silently accepted or reverted', async t => {
  const f = fixture(t, cfg => { cfg.testing = { changeOthers: true }; });
  await assert.rejects(main([...f.args, '--apply']), { code: 'OTHER_CONFIG_CHANGED' });
  assert.equal(f.read().credentials.token, 'CHANGED'); // The helper never rewrites a live configuration to roll back another writer.
});
test('only native lastTouched metadata can change without a false unrelated-config failure', async t => {
  const f = fixture(t, cfg => { cfg.testing = { touchMetadata: true }; cfg.meta = { custom: 'KEEP' }; });
  const result = await main([...f.args, '--apply']);
  assert.equal(result.configured, true); assert.equal(result.otherSettingsUnchanged, true);
  assert.equal(f.read().meta.custom, 'KEEP'); assert.equal(f.read().meta.lastTouchedVersion, 'host-native-test');
  const absent = fixture(t, cfg => { cfg.testing = { touchMetadata: true }; });
  assert.equal((await main([...absent.args, '--apply'])).configured, true);
});
test('other metadata remains protected even when native timestamps are updated', async t => {
  const f = fixture(t, cfg => { cfg.testing = { touchMetadata: true, changeOtherMetadata: true }; cfg.meta = { custom: 'KEEP' }; });
  await assert.rejects(main([...f.args, '--apply']), { code: 'OTHER_CONFIG_CHANGED' });
});
test('CLI emits sanitized JSON for validation failures', t => {
  const f = fixture(t), result = spawnSync(process.execPath, [path.resolve(__dirname, '../activate-9b.cjs'), ...f.args, '--check', '--apply'], { encoding: 'utf8' });
  assert.equal(result.status, 1); assert.equal(JSON.parse(result.stdout).error.code, 'MODE_REQUIRED'); assert.equal(result.stderr, ''); assert.ok(!result.stdout.includes('NEVER_PRINT_SECRET'));
});
