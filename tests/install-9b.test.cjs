'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const orchestrator = require('../install-9b.cjs');
const repository = path.resolve(__dirname, '..');
// The test runner may itself be 9B's vendor/node executable. A fixture must not
// claim that real host's bundled Node belongs to its synthetic install root.
const nodeTempParent = fs.realpathSync(os.tmpdir());
const nodeTempRoot = fs.mkdtempSync(path.join(nodeTempParent, 'freeup-orchestrator-node-'));
const fixtureNode = path.join(nodeTempRoot, process.platform === 'win32' ? 'node.exe' : 'node');
fs.copyFileSync(process.execPath, fixtureNode);
if (process.platform !== 'win32') fs.chmodSync(fixtureNode, 0o755);
test.after(() => {
  const relative = path.relative(nodeTempParent, fs.realpathSync(nodeTempRoot));
  assert.ok(relative.startsWith('freeup-orchestrator-node-') && !relative.includes(path.sep));
  fs.rmSync(nodeTempRoot, { recursive: true, force: true });
});
function write(root, name, value) { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); return file; }
function copyFixtureTree(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.isDirectory()) copyFixtureTree(path.join(source, entry.name), path.join(target, entry.name));
    else if (entry.isFile()) fs.copyFileSync(path.join(source, entry.name), path.join(target, entry.name));
    else throw Error('Fixture source must contain regular files/directories only');
  }
}
function fixture(t, change = () => {}) {
  const parent = fs.realpathSync(os.tmpdir()), root = fs.mkdtempSync(path.join(parent, 'freeup-install-9b-'));
  t.after(() => { const relative = path.relative(parent, root); assert.ok(relative.startsWith('freeup-install-9b-') && !relative.includes(path.sep)); fs.rmSync(root, { recursive: true, force: true }); });
  const source = path.join(root, 'Giải nén bộ quà'), hostRoot = path.join(root, '9B hiện tại'), workspace = path.join(hostRoot, 'openclaw-state', 'workspace-customer');
  fs.mkdirSync(source, { recursive: true }); fs.mkdirSync(workspace, { recursive: true });
  for (const directory of ['package', 'templates', 'onboarding']) copyFixtureTree(path.join(repository, directory), path.join(source, directory));
  for (const file of ['package.json', 'install.cjs', 'activate-9b.cjs']) fs.copyFileSync(path.join(repository, file), path.join(source, file));
  fs.mkdirSync(path.join(source, 'assets/menu'), { recursive: true }); fs.copyFileSync(path.join(repository, 'assets/menu/he-thong-content-ngang-v2.png'), path.join(source, 'assets/menu/he-thong-content-ngang-v2.png'));
  const other = path.join(hostRoot, 'openclaw-state/workspace-main'), lab = path.join(hostRoot, 'openclaw-state/workspace-content-gon-test'); fs.mkdirSync(other); fs.mkdirSync(lab);
  const config = { agents: { defaults: { skills: ['old-one', 'old-two'], model: 'UNCHANGED' }, entries: { 'customer-agent': { workspace, name: 'Current customer' }, main: { workspace: other, skills: ['main-only'] }, 'content-gon-test': { workspace: lab, skills: ['lab-only'] } } }, tools: { preset: 'unchanged' }, channels: { keep: true }, credentials: { token: 'NEVER_PRINT_CONFIG_SECRET' }, policy: { keep: 'all-existing-guards' } };
  change(config);
  const configPath = write(hostRoot, 'openclaw-state/openclaw.json', JSON.stringify(config, null, 2));
  const entrypoint = write(hostRoot, 'vendor/node_modules/openclaw/openclaw.mjs', String.raw`import fs from 'node:fs';
import path from 'node:path';
const file=process.env.OPENCLAW_CONFIG_PATH,c=JSON.parse(fs.readFileSync(file,'utf8')),a=process.argv.slice(2);
fs.appendFileSync(path.join(path.dirname(file),'native-calls.jsonl'),JSON.stringify(a)+'\n');
const m=a[2]?.match(/^agents\.entries\[(".*")\]\.skills$/);if(!m||a[0]!=='config'){process.stderr.write('Unsupported native route');process.exit(1);}
const id=JSON.parse(m[1]),agent=c.agents.entries[id];if(!agent)process.exit(1);
if(a[1]==='get'){
 if(c.testing?.denyGet){process.stderr.write('native policy denied '+c.credentials.token);process.exit(c.testing?.denyGetExit1?1:77);}
 if(!Object.hasOwn(agent,'skills')){process.stdout.write(JSON.stringify({ok:false,error:{type:'cli_error',message:'Config path is valid but unset: '+a[2]+'.'}}));process.exit(1);}
 process.stdout.write(JSON.stringify(agent.skills));process.exit(0);
}
if(a[1]!=='set')process.exit(1);
if(c.testing?.denySet){process.stderr.write('native policy denied '+c.credentials.token);process.exit(77);}
if(a.includes('--expect-current-absent')&&Object.hasOwn(agent,'skills'))process.exit(1);
const expected=a.indexOf('--expect-current-json');if(expected>=0&&JSON.stringify(agent.skills)!==a[expected+1])process.exit(1);
agent.skills=JSON.parse(a[3]);if(c.testing?.changeOthers)c.tools.preset='NATIVE_CHANGED_OTHER_SETTING';
fs.writeFileSync(file,JSON.stringify(c,null,2));process.stdout.write('Updated agent skills');`);
  const env = { ...process.env, NINEBIZ_CLI_ROOT: hostRoot, NINEBIZ_INSTALL_ROOT: '', NINEBIZ_NODE: fixtureNode, OPENCLAW_CONFIG_PATH: configPath, OPENCLAW_STATE_DIR: path.dirname(configPath), OPENCLAW_WORKSPACE_DIR: workspace, OPENCLAW_AGENT_ID: '' };
  const args = ['--source', source];
  const calls = () => { const file = path.join(path.dirname(configPath), 'native-calls.jsonl'); return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : []; };
  return { root, source, hostRoot, workspace, other, lab, configPath, entrypoint, env, args, calls, config: () => JSON.parse(fs.readFileSync(configPath, 'utf8')) };
}

test('help names exact one-command flags without touching host context', async () => {
  const result = await orchestrator.main(['--help'], { env: {} });
  assert.equal(result.help, true); for (const flag of ['--workspace', '--agent', '--config', '--node', '--openclaw-entrypoint', '--check', '--prepare', '--finalize']) assert.ok(result.usage.includes(flag));
  assert.throws(() => orchestrator.parse(['--workspace']), { code: 'INVALID_ARGUMENT' });
  const modes = ['--check', '--apply', '--prepare', '--finalize'];
  for (const a of modes) for (const b of modes) if (a !== b) assert.throws(() => orchestrator.parse([a, b]), { code: 'INVALID_ARGUMENT' });
});
test('prepare installs and verifies the real menu/template without native config calls or config writes', async t => {
  const f = fixture(t), before = fs.readFileSync(f.configPath, 'utf8');
  const result = await orchestrator.main([...f.args, '--prepare'], { env: f.env });
  assert.equal(result.ok, true, JSON.stringify(result)); assert.equal(result.mode, 'prepare'); assert.equal(result.installed, true); assert.equal(result.configured, false); assert.equal(result.chatVerified, false); assert.equal(result.onboardingRequired, true); assert.equal(result.configWritesPerformed, false);
  assert.equal(result.status, 'files-prepared-awaiting-tool-config'); assert.equal(result.template.verified, true); assert.ok(fs.existsSync(result.menu.mediaPath)); assert.equal(result.menu.displayedInChat, false);
  assert.equal(fs.readFileSync(f.configPath, 'utf8'), before); assert.equal(f.calls().length, 0);
  const plan = result.configActivation;
  assert.equal(plan.targetPath, 'agents.entries["customer-agent"].skills'); assert.equal(plan.expectedAbsent, true); assert.equal(plan.needed, true); assert.deepEqual(plan.expectedEffectiveList, ['old-one', 'old-two']); assert.deepEqual(plan.nextList, ['old-one', 'old-two', 'contentlab']); assert.equal(Object.hasOwn(plan, 'currentExplicitList'), false);
  assert.equal(plan.getMessage, 'config get agents.entries["customer-agent"].skills'); assert.equal(plan.inheritedGetMessage, 'config get agents.defaults.skills');
  assert.equal(plan.setMessage, 'config set agents.entries["customer-agent"].skills ["old-one","old-two","contentlab"]'); assert.ok(!plan.setMessage.includes('--')); assert.ok(plan.instruction.includes('cắt ngắn'));
  const baseline = JSON.parse(fs.readFileSync(result.preparationReceiptPath, 'utf8'));
  assert.equal(baseline.agentId, 'customer-agent'); assert.equal(baseline.workspace, fs.realpathSync(f.workspace)); assert.match(baseline.otherSettingsSha256, /^[a-f0-9]{64}$/); assert.equal(baseline.inventorySha256, result.installation.inventorySha256);
  assert.ok(!JSON.stringify(result).includes('NEVER_PRINT_CONFIG_SECRET')); assert.ok(!JSON.stringify(baseline).includes('NEVER_PRINT_CONFIG_SECRET'));
});
test('fresh prepare preserves full inherited lists and observes a changed explicit list before typed set', async t => {
  const inherited = Array.from({ length: 167 }, (_, i) => 'existing-long-skill-name-' + i);
  const f = fixture(t, config => { config.agents.defaults.skills = inherited; });
  const first = await orchestrator.main([...f.args, '--prepare'], { env: f.env }); assert.equal(first.ok, true); assert.equal(first.configActivation.nextList.length, 168); assert.deepEqual(first.configActivation.nextList, [...inherited, 'contentlab']); assert.ok(first.configActivation.setMessage.length > 2000);
  const config = f.config(); config.agents.entries['customer-agent'].skills = ['newly-enabled-skill']; fs.writeFileSync(f.configPath, JSON.stringify(config));
  const second = await orchestrator.main([...f.args, '--prepare'], { env: f.env }); assert.equal(second.ok, true); assert.equal(second.installation.changed, false); assert.equal(second.configActivation.expectedAbsent, false); assert.deepEqual(second.configActivation.currentExplicitList, ['newly-enabled-skill']); assert.deepEqual(second.configActivation.nextList, ['newly-enabled-skill', 'contentlab']);
  assert.equal(f.calls().length, 0);
});
function externalTypedSet(f, plan) {
  // A fixture for the external typed tool's scoped write, outside the orchestrator.
  assert.equal(plan.setMessage, 'config set ' + plan.targetPath + ' ' + JSON.stringify(plan.nextList));
  return spawnSync(fixtureNode, [f.entrypoint, 'config', 'set', plan.targetPath, JSON.stringify(plan.nextList)], { env: f.env, encoding: 'utf8' });
}
test('finalize verifies an external typed tool write and is repeatable without reinstalling or native calls', async t => {
  const f = fixture(t), prepared = await orchestrator.main([...f.args, '--prepare'], { env: f.env }); assert.equal(prepared.ok, true);
  assert.equal(externalTypedSet(f, prepared.configActivation).status, 0); const before = fs.readFileSync(f.configPath, 'utf8');
  const readsOnly = async (...args) => { assert.notEqual(path.basename(args[1]), 'install.cjs'); assert.notEqual(path.basename(args[1]), 'activate-9b.cjs'); assert.notEqual(args[1], f.entrypoint); return orchestrator.launch(...args); };
  for (let repeat = 0; repeat < 2; repeat++) {
    const result = await orchestrator.main([...f.args, '--finalize'], { env: f.env, launch: readsOnly });
    assert.equal(result.ok, true, JSON.stringify(result)); assert.equal(result.mode, 'finalize'); assert.equal(result.installed, true); assert.equal(result.configured, true); assert.equal(result.chatVerified, false); assert.equal(result.onboardingRequired, true); assert.equal(result.configWritesPerformed, false); assert.equal(result.activation.route, 'openclaw-tool'); assert.equal(result.activation.otherSettingsUnchanged, true); assert.equal(result.menu.session, prepared.menu.session); assert.equal(result.template.verified, true);
  }
  assert.equal(f.calls().length, 1); assert.equal(f.calls()[0][1], 'set'); assert.equal(fs.readFileSync(f.configPath, 'utf8'), before);
});
test('finalize without prepare fails before installing or calling any native route', async t => {
  const f = fixture(t), result = await orchestrator.main([...f.args, '--finalize'], { env: f.env });
  assert.equal(result.ok, false); assert.equal(result.error.code, 'PREPARATION_REQUIRED'); assert.equal(result.installed, false); assert.equal(result.configured, false); assert.equal(f.calls().length, 0); assert.equal(fs.existsSync(path.join(f.workspace, 'freeup-content-gon-lab-data')), false);
});
test('a denied typed write or no config change makes finalize fail without a fallback write', async t => {
  const f = fixture(t, config => { config.testing = { denySet: true }; }), before = fs.readFileSync(f.configPath, 'utf8');
  const prepared = await orchestrator.main([...f.args, '--prepare'], { env: f.env }); assert.equal(prepared.ok, true); assert.equal(f.calls().length, 0);
  assert.equal(externalTypedSet(f, prepared.configActivation).status, 77);
  const result = await orchestrator.main([...f.args, '--finalize'], { env: f.env });
  assert.equal(result.ok, false); assert.equal(result.installed, true); assert.equal(result.configured, false); assert.equal(result.error.code, 'CONFIGURATION_NOT_VERIFIED'); assert.equal(f.calls().length, 1); assert.equal(fs.readFileSync(f.configPath, 'utf8'), before);
  assert.ok(fs.existsSync(prepared.preparationReceiptPath)); assert.ok(!JSON.stringify(result).includes('NEVER_PRINT_CONFIG_SECRET')); assert.ok(!fs.readFileSync(result.receiptPath, 'utf8').includes('NEVER_PRINT_CONFIG_SECRET'));
});
test('finalize rejects unrelated changes after prepare and never rolls back another setting', async t => {
  const f = fixture(t), prepared = await orchestrator.main([...f.args, '--prepare'], { env: f.env }); assert.equal(prepared.ok, true); assert.equal(externalTypedSet(f, prepared.configActivation).status, 0);
  const changed = f.config(); changed.tools.preset = 'changed-outside-scope'; fs.writeFileSync(f.configPath, JSON.stringify(changed)); const before = fs.readFileSync(f.configPath, 'utf8');
  const result = await orchestrator.main([...f.args, '--finalize'], { env: f.env }); assert.equal(result.ok, false); assert.equal(result.configured, false); assert.equal(result.error.code, 'OTHER_CONFIG_CHANGED'); assert.equal(fs.readFileSync(f.configPath, 'utf8'), before); assert.equal(f.calls().length, 1);
});
test('finalize requires the exact planned allowlist rather than only the contentlab name', async t => {
  const f = fixture(t, config => { config.agents.entries['customer-agent'].skills = ['keep-this']; });
  const prepared = await orchestrator.main([...f.args, '--prepare'], { env: f.env }); assert.equal(prepared.ok, true); assert.deepEqual(prepared.configActivation.currentExplicitList, ['keep-this']);
  const changed = f.config(); changed.agents.entries['customer-agent'].skills = ['contentlab']; fs.writeFileSync(f.configPath, JSON.stringify(changed));
  const result = await orchestrator.main([...f.args, '--finalize'], { env: f.env }); assert.equal(result.ok, false); assert.equal(result.error.code, 'CONFIGURATION_NOT_VERIFIED'); assert.equal(f.calls().length, 0);
});
test('finalize checks the original prepared inventory and does not repair tampered installed code', async t => {
  const f = fixture(t), prepared = await orchestrator.main([...f.args, '--prepare'], { env: f.env }); assert.equal(prepared.ok, true); assert.equal(externalTypedSet(f, prepared.configActivation).status, 0);
  const skill = path.join(f.workspace, 'skills/freeup-content-gon-lab/SKILL.md'); fs.appendFileSync(skill, '\nchanged after prepare');
  const result = await orchestrator.main([...f.args, '--finalize'], { env: f.env }); assert.equal(result.ok, false); assert.equal(result.error.code, 'INSTALL_NOT_VERIFIED'); assert.ok(fs.readFileSync(skill, 'utf8').endsWith('changed after prepare')); assert.equal(f.calls().length, 1);
});
test('prepare/finalize preserve an unrestricted allowlist and need no typed write', async t => {
  const f = fixture(t, config => { delete config.agents.defaults.skills; }), before = fs.readFileSync(f.configPath, 'utf8');
  const prepared = await orchestrator.main([...f.args, '--prepare'], { env: f.env }); assert.equal(prepared.ok, true); assert.equal(prepared.configActivation.needed, false); assert.equal(prepared.configActivation.nextList, null); assert.equal(prepared.configActivation.setMessage, null);
  const result = await orchestrator.main([...f.args, '--finalize'], { env: f.env }); assert.equal(result.ok, true, JSON.stringify(result)); assert.equal(result.configured, true); assert.equal(result.activation.changed, false); assert.equal(fs.readFileSync(f.configPath, 'utf8'), before); assert.equal(f.calls().length, 0);
});
test('single command installs in registered current workspace and mutates only that agent allowlist', async t => {
  const f = fixture(t), before = f.config();
  const result = await orchestrator.main(f.args, { env: f.env });
  assert.equal(result.ok, true, JSON.stringify(result)); assert.equal(result.installed, true); assert.equal(result.configured, true); assert.equal(result.chatVerified, false); assert.equal(result.onboardingRequired, true);
  assert.equal(result.agentId, 'customer-agent'); assert.equal(result.workspace, fs.realpathSync(f.workspace)); assert.ok(fs.existsSync(result.menu.mediaPath)); assert.equal(result.menu.displayedInChat, false); assert.equal(result.template.verified, true); assert.ok(fs.existsSync(result.template.xlsxPath));
  const after = f.config(); assert.deepEqual(after.agents.entries['customer-agent'].skills, ['old-one', 'old-two', 'contentlab']);
  assert.deepEqual(after.agents.defaults, before.agents.defaults); assert.deepEqual(after.agents.entries.main, before.agents.entries.main); assert.deepEqual(after.agents.entries['content-gon-test'], before.agents.entries['content-gon-test']);
  for (const key of ['tools', 'channels', 'credentials', 'policy']) assert.deepEqual(after[key], before[key]);
  assert.deepEqual(f.calls().map(call => call.slice(0, 3)), [['config', 'get', 'agents.entries["customer-agent"].skills'], ['config', 'set', 'agents.entries["customer-agent"].skills']]);
  assert.ok(f.calls()[1].includes('--expect-current-absent')); assert.ok(!JSON.stringify(result).includes('NEVER_PRINT_CONFIG_SECRET'));
  assert.ok(!fs.existsSync(path.join(f.other, 'skills'))); assert.ok(!fs.existsSync(path.join(f.lab, 'skills')));
  assert.ok(result.next.includes('assess')); assert.ok(result.next.includes('cùng chat'));
});
test('repeat is idempotent: no second native config mutation, inventory still verified', async t => {
  const f = fixture(t); assert.equal((await orchestrator.main(f.args, { env: f.env })).ok, true);
  const before = fs.readFileSync(f.configPath, 'utf8'), result = await orchestrator.main(f.args, { env: f.env });
  assert.equal(result.ok, true); assert.equal(result.installation.changed, false); assert.equal(result.activation.changed, false); assert.equal(fs.readFileSync(f.configPath, 'utf8'), before);
  assert.equal(f.calls().filter(call => call[1] === 'set').length, 1); assert.equal(result.chatVerified, false);
});
test('explicit runtime workspace chooses exact roster entry even when cwd and default lab differ', async t => {
  const f = fixture(t); const env = { ...f.env, OPENCLAW_WORKSPACE_DIR: '' };
  const result = await orchestrator.main([...f.args, '--workspace', f.workspace, '--check'], { env });
  assert.equal(result.ok, true); assert.equal(result.agentId, 'customer-agent'); assert.equal(result.dryRun, true); assert.equal(result.installed, false);
  assert.equal(fs.existsSync(path.join(f.workspace, 'freeup-content-gon-lab-data')), false); assert.equal(f.calls().length, 0);
});
test('trusted agent env resolves its registered workspace without using defaults or cwd', async t => {
  const f = fixture(t); const result = await orchestrator.main([...f.args, '--check'], { env: { ...f.env, OPENCLAW_WORKSPACE_DIR: '', OPENCLAW_AGENT_ID: 'customer-agent' } });
  assert.equal(result.ok, true); assert.equal(result.workspace, fs.realpathSync(f.workspace));
});
test('missing current context does not guess main, sole lab name or cwd', async t => {
  const f = fixture(t); const result = await orchestrator.main([...f.args, '--check'], { env: { ...f.env, OPENCLAW_WORKSPACE_DIR: '', OPENCLAW_AGENT_ID: '' } });
  assert.equal(result.ok, false); assert.equal(result.error.code, 'CURRENT_AGENT_REQUIRED'); assert.equal(f.calls().length, 0);
});
test('wrong IDs, wrong registered workspaces and conflicting current env stop before file installation', async t => {
  const f = fixture(t);
  const cases = [
    { extra: ['--agent', 'not-registered'], env: f.env, code: 'AGENT_NOT_REGISTERED' },
    { extra: ['--agent', 'main'], env: f.env, code: 'AGENT_WORKSPACE_NOT_UNIQUE' },
    { extra: ['--workspace', f.lab], env: f.env, code: 'HOST_CONTEXT_CONFLICT' },
    { extra: ['--agent', 'main'], env: { ...f.env, OPENCLAW_AGENT_ID: 'customer-agent' }, code: 'HOST_CONTEXT_CONFLICT' }
  ];
  for (const entry of cases) { const result = await orchestrator.main([...f.args, ...entry.extra], { env: entry.env }); assert.equal(result.ok, false); assert.equal(result.error.code, entry.code); }
  assert.equal(fs.existsSync(path.join(f.workspace, 'skills')), false); assert.equal(f.calls().length, 0);
});
test('two registered agents sharing a workspace are rejected even with an explicit ID', async t => {
  const f = fixture(t, config => { config.agents.entries.main.workspace = config.agents.entries['customer-agent'].workspace; });
  const result = await orchestrator.main([...f.args, '--agent', 'customer-agent'], { env: f.env });
  assert.equal(result.error.code, 'SHARED_AGENT_WORKSPACE'); assert.equal(f.calls().length, 0);
});
test('config, state root, node and entrypoint cannot be mixed across parallel 9B installations', async t => {
  const f = fixture(t), otherRoot = path.join(f.root, '9B song song'); fs.mkdirSync(path.join(otherRoot, 'openclaw-state'), { recursive: true });
  const otherConfig = write(otherRoot, 'openclaw-state/openclaw.json', JSON.stringify(f.config()));
  const otherNode = write(otherRoot, 'vendor/node/node.exe', 'not executed'), otherEntry = write(otherRoot, 'vendor/node_modules/openclaw/openclaw.mjs', '// not executed');
  for (const [extra, env] of [
    [['--config', otherConfig], f.env],
    [['--node', otherNode], { ...f.env, NINEBIZ_NODE: '' }],
    [['--openclaw-entrypoint', otherEntry], f.env],
    [[], { ...f.env, OPENCLAW_STATE_DIR: path.dirname(otherConfig) }],
    [[], { ...f.env, NINEBIZ_INSTALL_ROOT: otherRoot }]
  ]) { const result = await orchestrator.main([...f.args, ...extra], { env }); assert.equal(result.ok, false); assert.equal(result.error.code, 'HOST_CONTEXT_CONFLICT'); }
  assert.equal(f.calls().length, 0); assert.equal(fs.existsSync(path.join(f.workspace, 'skills')), false);
});
test('APPDATA metadata resolves a single host, but multiple hosts are never guessed', async t => {
  const f = fixture(t), appdata = path.join(f.root, 'AppData'); write(appdata, '9BizClaw-v3/install-root.json', JSON.stringify({ path: f.hostRoot }));
  const env = { ...f.env, NINEBIZ_CLI_ROOT: '', NINEBIZ_NODE: '', OPENCLAW_CONFIG_PATH: '', OPENCLAW_STATE_DIR: '', APPDATA: appdata };
  const result = await orchestrator.main([...f.args, '--node', fixtureNode, '--check'], { env }); assert.equal(result.ok, true);
  const otherRoot = path.join(f.root, 'another9B'); write(otherRoot, 'openclaw-state/openclaw.json', JSON.stringify(f.config())); write(appdata, '9bizclaw-v2/install-root.json', JSON.stringify({ path: otherRoot }));
  const ambiguous = await orchestrator.main([...f.args, '--node', fixtureNode, '--check'], { env }); assert.equal(ambiguous.error.code, 'CONFIG_NOT_UNIQUE');
});
test('native set denial stops exactly once, preserves config bytes and leaks no CLI/config secret', async t => {
  const f = fixture(t, config => { config.testing = { denySet: true }; }), before = fs.readFileSync(f.configPath, 'utf8');
  const result = await orchestrator.main(f.args, { env: f.env });
  assert.equal(result.ok, false); assert.equal(result.installed, true); assert.equal(result.configured, false); assert.equal(result.chatVerified, false); assert.equal(result.onboardingRequired, true); assert.equal(result.stage, 'native-activation');
  assert.equal(fs.readFileSync(f.configPath, 'utf8'), before); assert.equal(f.calls().filter(call => call[1] === 'set').length, 1);
  assert.equal(f.calls().filter(call => call[0] !== 'config').length, 0); assert.ok(!JSON.stringify(result).includes('NEVER_PRINT_CONFIG_SECRET'));
  const saved = fs.readFileSync(result.receiptPath, 'utf8'); assert.ok(!saved.includes('NEVER_PRINT_CONFIG_SECRET')); assert.equal(fs.existsSync(path.join(f.workspace, 'freeup-content-gon-lab-data/help')), false);
});
test('native read denial triggers no mutation or alternate activation route', async t => {
  const f = fixture(t, config => { config.testing = { denyGet: true }; }); const before = fs.readFileSync(f.configPath, 'utf8');
  const result = await orchestrator.main(f.args, { env: f.env }); assert.equal(result.ok, false); assert.equal(result.installed, true); assert.equal(result.configured, false);
  assert.equal(f.calls().length, 1); assert.equal(f.calls()[0][1], 'get'); assert.equal(fs.readFileSync(f.configPath, 'utf8'), before); assert.ok(!JSON.stringify(result).includes('NEVER_PRINT_CONFIG_SECRET'));
});
test('native read denial with exit 1 is not mistaken for a valid unset allowlist', async t => {
  const f = fixture(t, config => { config.testing = { denyGet: true, denyGetExit1: true }; }); const before = fs.readFileSync(f.configPath, 'utf8');
  const result = await orchestrator.main(f.args, { env: f.env });
  assert.equal(result.ok, false); assert.equal(result.installed, true); assert.equal(result.configured, false); assert.equal(result.chatVerified, false);
  assert.equal(f.calls().length, 1); assert.equal(f.calls()[0][1], 'get'); assert.equal(f.calls().filter(call => call[1] === 'set').length, 0);
  assert.equal(fs.readFileSync(f.configPath, 'utf8'), before); assert.ok(!JSON.stringify(result).includes('NEVER_PRINT_CONFIG_SECRET'));
});
test('other-setting native changes are rejected, reported and never raw-rolled-back', async t => {
  const f = fixture(t, config => { config.testing = { changeOthers: true }; });
  const result = await orchestrator.main(f.args, { env: f.env }); assert.equal(result.ok, false); assert.equal(result.configured, false); assert.equal(result.error.code, 'OTHER_CONFIG_CHANGED');
  assert.equal(f.config().tools.preset, 'NATIVE_CHANGED_OTHER_SETTING'); assert.equal(f.calls().filter(call => call[1] === 'set').length, 1);
});
test('unrestricted allowlist stays unrestricted instead of narrowing global defaults', async t => {
  const f = fixture(t, config => { delete config.agents.defaults.skills; }); const result = await orchestrator.main(f.args, { env: f.env });
  assert.equal(result.ok, true); assert.equal(result.activation.changed, false); assert.equal(Object.hasOwn(f.config().agents.entries['customer-agent'], 'skills'), false); assert.equal(f.calls().filter(call => call[1] === 'set').length, 0);
});
test('incomplete source fails before writes or native activation', async t => {
  const f = fixture(t); fs.unlinkSync(path.join(f.source, 'package/skills/freeup-content-gon-lab/scripts/production.cjs'));
  const result = await orchestrator.main(f.args, { env: f.env }); assert.equal(result.ok, false); assert.equal(result.error.code, 'SOURCE_INCOMPLETE'); assert.equal(fs.existsSync(path.join(f.workspace, 'freeup-content-gon-lab-data')), false); assert.equal(f.calls().length, 0);
});
test('independent inventory verification blocks activation after an installer payload is changed', async t => {
  const f = fixture(t); const run = async (...args) => { const result = await orchestrator.launch(...args); if (path.basename(args[1]) === 'install.cjs') write(f.workspace, 'skills/freeup-content-gon-lab/SKILL.md', 'tampered after install'); return result; };
  const result = await orchestrator.main(f.args, { env: f.env, launch: run }); assert.equal(result.ok, false); assert.equal(result.error.code, 'INSTALL_NOT_VERIFIED'); assert.equal(result.configured, false); assert.equal(f.calls().length, 0);
});
test('existing orchestration lock prevents parallel file install and native writes', async t => {
  const f = fixture(t); write(f.workspace, 'freeup-content-gon-lab-data/install/.install-9b.lock', 'another operation');
  const result = await orchestrator.main(f.args, { env: f.env }); assert.equal(result.ok, false); assert.equal(result.error.code, 'INSTALL_BUSY'); assert.equal(f.calls().length, 0); assert.equal(fs.existsSync(path.join(f.workspace, 'skills')), false);
});
test('CLI help and discovery failure output do not contain secrets or raw config', t => {
  const f = fixture(t);
  const help = spawnSync(fixtureNode, [path.join(repository, 'install-9b.cjs'), '--help'], { encoding: 'utf8', env: f.env }); assert.equal(help.status, 0); assert.ok(help.stdout.includes('--workspace'));
  const result = spawnSync(fixtureNode, [path.join(repository, 'install-9b.cjs'), ...f.args, '--agent', 'wrong-id'], { encoding: 'utf8', env: f.env }); assert.equal(result.status, 1); const report = JSON.parse(result.stdout); assert.equal(report.configured, false); assert.equal(result.stderr, ''); assert.ok(!result.stdout.includes('NEVER_PRINT_CONFIG_SECRET'));
});
