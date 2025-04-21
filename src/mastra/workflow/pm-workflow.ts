import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import { notionTaskAgent, taskSummaryAgent } from "../agents";

export const pmWorkflow = new Workflow({
  name: "pm-workflow",
  triggerSchema: z.object({
    prompt: z.string(),
  }),
});
 
// Step 設定
export const notionTaskStep = new Step({
  id: "notionTaskStep",
  execute: async ({ context }) => {
    try {
      console.log('notionTaskStep開始', context);
      
      if (!context?.triggerData?.prompt) {
        console.error('Context:', context);
        throw new Error("prompt not found in trigger data");
      }
      
      console.log('プロンプト:', context.triggerData.prompt);
      
      const result = await notionTaskAgent.generate(
        `
          以下のnotion URLにアクセスして、タスクを抽出してください。
          https://www.notion.so/1237da6921d380ae8651d957cb25d147?v=1237da6921d380f9a2da000c6d4dbeab&pvs=4
          
          また、タスク抽出に際して以下の指示も参照してください。
          ${context.triggerData.prompt}
        `,
      );
      
      console.log("notionTask result:", result.text);
      
      return {
        notionTask: result.text,
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


// Run steps sequentially.
pmWorkflow.step(notionTaskStep).then(taskSummaryStep).commit();
 
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



