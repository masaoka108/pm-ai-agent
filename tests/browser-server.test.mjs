import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowserServers, browserVersion } from '../src/mastra/security/browser-server.mjs';

const packagePath = '/dummy/node_modules/@playwright/mcp/package.json';
const pkg = { name: '@playwright/mcp', version: browserVersion, bin: { 'playwright-mcp': 'cli.js' } };
function servers(override = {}) {
  return createBrowserServers({
    resolvePackage: () => packagePath,
    readPackage: () => ({ ...pkg, ...override }),
    execPath: '/dummy/node/bin/node',
  });
}

test('runs only the locally installed reviewed browser server using this Node', () => {
  assert.deepEqual(servers(), {
    playwright: {
      command: '/dummy/node/bin/node',
      args: ['/dummy/node_modules/@playwright/mcp/cli.js', '--isolated', '--headless'],
      env: { PATH: '/dummy/node/bin', NODE_OPTIONS: '', NODE_PATH: '' },
    },
  });
});

test('does not forward application credentials to the child configuration', () => {
  const keys = ['OPENAI_API_KEY', 'SUPABASE_ACCESS_TOKEN', 'GOOGLE_GENERATIVE_AI_API_KEY', 'NODE_OPTIONS'];
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    for (const key of keys) process.env[key] = 'dummy-do-not-forward';
    const config = servers().playwright;
    for (const key of keys.slice(0, -1)) assert.equal(config.env[key], undefined);
    assert.equal(config.env.NODE_OPTIONS, '');
    assert.ok(!JSON.stringify(config).includes('dummy-do-not-forward'));
  } finally {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});

test('fails closed on an unexpected installed version or package identity', () => {
  assert.throws(() => servers({ version: '99.0.0' }), /reviewed version/);
  assert.throws(() => servers({ name: '@example/other' }), /reviewed version/);
});

test('rejects missing, absolute and escaping executable paths', () => {
  for (const bin of [undefined, {}, { 'playwright-mcp': '' }, { 'playwright-mcp': '/bin/sh' }, { 'playwright-mcp': '../../other/cli.js' }]) {
    assert.throws(() => servers({ bin }), /entry point/);
  }
});

test('fails closed if the installed dependency cannot be resolved', () => {
  assert.throws(() => createBrowserServers({ resolvePackage: () => { throw new Error('missing dependency'); } }), /missing dependency/);
});
