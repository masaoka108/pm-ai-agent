import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import { copywriterStep, editorStep } from "../agents";


export const myWorkflow = new Workflow({
  name: "my-workflow",
  triggerSchema: z.object({
    topic: z.string(),
  }),
});
 
// Run steps sequentially.
myWorkflow.step(copywriterStep).then(editorStep).commit();
 
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



