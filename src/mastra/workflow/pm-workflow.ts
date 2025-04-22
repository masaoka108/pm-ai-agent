import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import { playwrightMcpNotionTaskAgent, notionMcpTaskAgent, taskSummaryAgent } from "../agents";

export const pmWorkflow = new Workflow({
  name: "pm-workflow",
  triggerSchema: z.object({
    prompt: z.string(),
  }),
});
 
// Step 設定
export const playwrightNotionStep = new Step({
  id: "notionTaskStep",
  execute: async ({ context }) => {
    try {
      console.log('notionTaskStep開始', context);
      
      if (!context?.triggerData?.prompt) {
        console.error('Context:', context);
        throw new Error("prompt not found in trigger data");
      }
      
      console.log('プロンプト:', context.triggerData.prompt);

      const notionUrl = "https://www.notion.so/1237da6921d380ae8651d957cb25d147?v=1237da6921d380f9a2da000c6d4dbeab&pvs=4";

      const result = await playwrightMcpNotionTaskAgent.generate(
        `以下の手順を厳密に実行し、最終的に JSON.stringify された文字列を返してください。空の場合は "NO_TASK_FOUND"。

1. browser_navigate("${notionUrl}")
2. browser_waitForSelector('[data-testid="collection-row"]')
3. browser_evaluate('(() => {\n        const rows = Array.from(document.querySelectorAll("[data-testid=\\"collection-row\\"]"));\n        const tasks = rows.map(row => ({\n          title: row.querySelector(".notion-selectable div[role=\\"button\\"]")?.innerText ?? "Untitled",\n          status: row.querySelector("[data-property-id*=\\"status\\"]")?.innerText ?? "Unknown",\n          assignee: row.querySelector("[data-property-id*=\\"person\\"]")?.innerText ?? "Unassigned",\n          due_date: row.querySelector("[data-property-id*=\\"date\\"]")?.innerText ?? "未設定",\n          blockId: row.getAttribute("data-block-id"),\n          subtasks: [],\n        }));\n        return JSON.stringify({ tasks });\n      })()')
4. 上記の JSON をパースし tasks 配列をループ:
   4.1 browser_click('[data-block-id="{{task.blockId}}"]')
   4.2 browser_waitForSelector('[role="dialog"] [data-testid="page-content"]')
   4.3 browser_evaluate('(() => {\n           const sub = Array.from(document.querySelectorAll("[role=\\"dialog\\"] input[type=\\"checkbox\\"]")).map(cb => ({\n             title: cb.closest("[data-testid=\\"checkbox\\"]")?.innerText ?? "Untitled",\n           }));\n           return JSON.stringify(sub);\n         })()')
       → 取得した配列を tasks[i].subtasks に代入
   4.4 browser_click('button[aria-label="Close"]')
5. ループ完了後、{ tasks } を JSON.stringify して return。
        `,
      );

      // 空文字対策
      const textOut = result.text && result.text.trim() !== '' ? result.text : 'NO_TASK_FOUND';

      console.log("notionTask result:", textOut);
      // デバッグ: 実際に呼び出されたツール呼び出しを表示
      console.log("playwright toolCalls:", (result as any).toolCalls || []);
      
      return {
        notionTask: textOut,
      };
    } catch (error) {
      console.error('notionTaskStep エラー:', error);
      throw error;
    }
  },
});

export const taskSummaryStep = new Step({
  id: "taskSummaryStep",
  execute: async ({ context }) => {
    try {
      console.log('taskSummaryStep開始', context);
      
      const notionTask = context?.getStepResult<{ notionTask: string }>("notionTaskStep")?.notionTask;
      
      if (!notionTask) {
        console.error('Context:', context);
        console.error('notionTaskStepの結果がありません');
        throw new Error("No notionTask");
      }
      
      console.log('notionTask:', notionTask);
      // console.log('編集するテキスト長さ:', copy.length);
      
      const result = await taskSummaryAgent.generate(
        `
        以下のタスクに優先順位を付加してください。

        # notionのタスク情報
        ${notionTask}
        `,
      );
      
      console.log("taskSummary result:", result.text);
      
      return {
        taskSummary: result.text,
      };
    } catch (error) {
      console.error('taskSummaryStep エラー:', error);
      throw error;
    }
  },
});


// Run steps sequentially using Playwright step.
pmWorkflow.step(playwrightNotionStep).then(taskSummaryStep).commit();
 
// 別途UIから実行するのでここはコメントアウト
// const { runId, start } = myWorkflow.createRun();
 
// const res = await start({
//   triggerData: { topic: "React JavaScript frameworks" },
// });
// console.log("Results: ", res.results);

// 以下のコードはすべてコメントアウト
// // workflow-with-sequential-steps
// async function main() {
  
//   const stepOne = new Step({
//     id: 'stepOne',
//     inputSchema: z.object({
//       inputValue: z.number(),
//     }),
//     outputSchema: z.object({
//       doubledValue: z.number(),
//     }),
//     execute: async ({ context }) => {
//       const inputValue = context?.getStepResult<{ inputValue: number }>('trigger')?.inputValue;
//       if (!inputValue) throw new Error('No input value provided');
//       const doubledValue = inputValue * 2;
//       return { doubledValue };
//     },
//   });

//   const stepTwo = new Step({
//     id: 'stepTwo',
//     inputSchema: z.object({
//       valueToIncrement: z.number(),
//     }),
//     outputSchema: z.object({
//       incrementedValue: z.number(),
//     }),
//     execute: async ({ context }) => {
//       const valueToIncrement = context?.getStepResult<{ doubledValue: number }>('stepOne')?.doubledValue;
//       if (!valueToIncrement) throw new Error('No value to increment provided');
//       const incrementedValue = valueToIncrement + 1;
//       return { incrementedValue };
//     },
//   });

//   // Build the workflow
//   const myWorkflow = new Workflow({
//     name: 'my-workflow',
//     triggerSchema: z.object({
//       inputValue: z.number(),
//     }),
//   });

//   // sequential steps
//   myWorkflow.step(stepOne).then(stepTwo);

//   myWorkflow.commit();

//   const { runId, start } = myWorkflow.createRun();

//   console.log('Run', runId);

//   const res = await start({ triggerData: { inputValue: 90 } });

//   console.log(res.results);
// }

// main();



// 最もシンプルなWorkflow
// const myWorkflow = new Workflow({
//   name: "my-workflow",
//   triggerSchema: z.object({
//     input: z.number(),
//   }),
// });
//
// const stepOne = new Step({
//   id: "stepOne",
//   inputSchema: z.object({
//     value: z.number(),
//   }),
//   outputSchema: z.object({
//     doubledValue: z.number(),
//   }),
//   execute: async ({ context }) => {
//     const doubledValue = context?.triggerData?.input * 2;
//     return { doubledValue };
//   },
// });
 
// myWorkflow.step(stepOne).commit();
 
// const { runId, start } = myWorkflow.createRun();
 
// const res = await start({
//   triggerData: { input: 20 },
// });
 
// console.log(res.results);



