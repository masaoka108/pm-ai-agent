# Runtime and browser tooling update

Use Node 24.22.1 (the October 2026 security baseline), or a subsequently reviewed
security release in this supported series. Version files describe the requested
runtime, not evidence of the deployed process version.

Install with `npm ci --ignore-scripts`. Both the npm and pnpm lockfiles are
maintained; the pnpm lock is imported from the npm dependency graph. Do not run
unreviewed lifecycle scripts or download code when starting the application.

The browser server is an exact local dependency. Startup resolves its installed
package identity/version and entry point, then uses the application's Node
executable directly. Missing or unexpected packages fail closed. It runs headless
with an isolated profile; the application does not supply provider credentials in
its child configuration. The MCP SDK still inherits its default OS variables,
including HOME. An isolated browser profile does not isolate the host filesystem
or network. The upstream package includes a pinned prerelease Playwright engine;
do not override that engine independently without compatibility testing.

Inactive integration examples and unused memory/toolset initialization are
removed. Workflow context, generated text and provider errors are no longer
explicitly logged by the changed handlers. This does not establish that framework,
provider, proxy or historical logs are free of sensitive data.

## Local verification

`npm test` exercises the server configuration with dummy metadata: installed
version/identity checks, executable path containment, isolated profile arguments
and exclusion of application credentials. Tests do not start a browser, an MCP
server, or a model connection. Targeted TypeScript checking covers the changed
agent and API modules. The full-project typecheck still reports errors in the
separate UI and workflow examples. No end-to-end model/browser build is claimed.

## Deployment gates and rollback

No production deployment is authorized by this change. Before deploying:

1. Complete the maintainer's historical-material and credential review through a
   private channel. Removing examples does not invalidate historical credentials.
2. Complete the remaining framework/dependency migration and full-project checks.
3. Validate authentication for every exposed framework route, user separation,
   bounded resource use and logging using dummy accounts on owned staging.
4. Run model/browser workers with a separate OS identity and filesystem, no host
   credentials, and enforced outbound destinations. Retrieved pages are untrusted;
   instructions alone cannot stop data disclosure or unauthorized browser actions.
   Sending, deleting and privilege changes need a separate execution boundary.
5. Install a reviewed browser image/binary separately, verify runtime and browser
   versions, then test the actual agent and browser flow with dummy data. Browser
   binaries and real provider calls were not installed/executed for this review.
6. Confirm deployment branch filters, a known-good artifact and restore procedure.

If validation fails, keep this branch undeployed and return staging to its known
good artifact. Preserve dependency locks and diagnostic evidence. Do not restore
removed examples or automatically revert credential changes. No database schema
or production state was changed here.
