import { mastra } from "./index";

// ワークフロー取得
const myWorkflow = mastra.getWorkflow("myWorkflow");
const { runId, start } = myWorkflow.createRun();

// 実行開始
await start({ triggerData: { inputValue: 45 } });