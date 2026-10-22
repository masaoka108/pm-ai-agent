import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

const require = createRequire(import.meta.url);
export const browserVersion = '0.0.83';

// Resolve installed, lockfile-controlled code. Never download code at startup.
export function createBrowserServers({
  resolvePackage = () => require.resolve('@playwright/mcp/package.json'),
  readPackage = path => JSON.parse(readFileSync(path, 'utf8')),
  execPath = process.execPath,
} = {}) {
  const packagePath = resolvePackage();
  const pkg = readPackage(packagePath);
  if (pkg.name !== '@playwright/mcp' || pkg.version !== browserVersion) {
    throw new Error('Installed browser server does not match the reviewed version');
  }
  const bin = pkg.bin?.['playwright-mcp'];
  if (typeof bin !== 'string' || !bin || isAbsolute(bin)) {
    throw new Error('Invalid browser server entry point');
  }
  const root = dirname(packagePath);
  const cli = resolve(root, bin);
  const child = relative(root, cli);
  if (!child || child.startsWith('..') || isAbsolute(child)) {
    throw new Error('Browser server entry point must remain inside the package');
  }
  return {
    playwright: {
      command: execPath,
      args: [cli, '--isolated', '--headless'],
      // Do not pass application/provider credentials or arbitrary Node options.
      // Mastra 0.3.9 adds the MCP SDK's default OS environment separately.
      env: { PATH: dirname(execPath), NODE_OPTIONS: '', NODE_PATH: '' },
    },
  };
}
