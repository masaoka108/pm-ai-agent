export const browserVersion: string;
export function createBrowserServers(options?: {
  resolvePackage?: () => string;
  readPackage?: (path: string) => {
    name: string;
    version: string;
    bin?: Record<string, string>;
  };
  execPath?: string;
}): Record<string, { command: string; args: string[]; env: Record<string, string> }>;
