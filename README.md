# coaching-ai-agent

## バックエンド（Mastra）の起動方法
- .env.development の作成
npm install
pnpm run dev
- なぜか mastra dev ではカスタムAPIが起動しない


## フロントPJの起動方法
- .envを作成
cd ui
pnpm install
pnpm dev

## Workflowの実行の仕方
pnpx tsx src/mastra/workflow/index.ts

## Workflowの実行の仕方(コマンドラインからAPIで実行)
- runIdは /api/workflows/{workflowId}/createRun から取得

- 以下は通るは通った。が、WorkflowからのResponseでOutputが得られない
curl -X POST \
  'http://localhost:4111/api/workflows/myWorkflow/start?runId=78b198de-cf4f-4d81-912a-aed53bf76302' \
  -H 'Content-Type: application/json' \
  -H 'accept: */*' \
  -d '{"topic": "AIについて"}'

