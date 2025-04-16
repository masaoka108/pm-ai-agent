import { openai } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Agent } from '@mastra/core/agent';
// import { weatherTool, saveCoachingDataTool } from '../tools';
import { Memory } from "@mastra/memory";
import { MCPConfiguration } from "@mastra/mcp";

import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";

// Google Gemini AIプロバイダーの作成
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

const mcp = new MCPConfiguration({
  servers: {
    playwright: {
      command: 'npx',
      args: [
        '@playwright/mcp@latest',
      ],
    },
    // "supabase": {
    //   "command": "npx",
    //   "args": [
    //     "-y",
    //     "@supabase/mcp-server-supabase@latest",
    //     "--access-token",
    //     "sbp_b62e7bfeff48e4227ab3fd1d45c93e3cbcb256dc"
    //   ]
    // },

    // // stdio example
    // sequential: {
    //   name: "sequential-thinking",
    //   server: {
    //     command: "npx",
    //     args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    //   },
    // },
    // // SSE example
    // weather: {
    //   url: new URL("http://localhost:8080/sse"),
    //   requestInit: {
    //     headers: {
    //       Authorization: "Bearer your-token",
    //     },
    //   },
    // },
  },
});

// export const weatherAgent = new Agent({
//   name: 'Weather Agent',
//   instructions: `
//       You are a helpful weather assistant that provides accurate weather information.

//       Your primary function is to help users get weather details for specific locations. When responding:
//       - Always ask for a location if none is provided
//       - If the location name isn’t in English, please translate it
//       - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
//       - Include relevant details like humidity, wind conditions, and precipitation
//       - Keep responses concise but informative

//       Use the weatherTool to fetch current weather data.
// `,
//   // model: openai('gpt-4o'),
//   model: google("gemini-2.0-flash-001"),
//   tools: { weatherTool },
// });

const memory = new Memory({
  embedder: openai.embedding("text-embedding-3-small"),
  options: {
    lastMessages: 5, // Keep 5 most recent messages
  },
});
      
// Get the current toolsets configured for this user
const toolsets = await mcp.getToolsets();


// export const coachingAgent = new Agent({
//   memory,
//   name: 'Coaching Agent',
//   instructions: `
//       あなたはプロの経営者向けコーチです。
//       ①と②を交互に問いかけてコーチングを行ってください。
//       質問をする時は一問ずつ質問してください。
//       質問するごとにコーチングデータをDBに保存してください。
//       ただし保存したことはユーザーに伝える必要はありません。
//       もしユーザーがどちらかをスキップしたいと言ったら従ってください。

//       ①目標設定の質問
//         1. 「今晩ベッドに向かう前にどんな成果が出ていれば最高の価値があるか？」  
//         2. 「そのためにあなたが創るコンテキストは何か？」  
//         3. 「そのコンテキストを体現する言動は何か？」（言葉や行動の違い）

//       ②設定した目標に対しての振り返り
//         1. 「今日1日の私のフォーカスは何だったか？」  
//         2. 「そのために創った行動の違いは何か？」  
//         3. 「結果はどうなったか？」  
//         4. 「上手くいったことは何か？」  
//         5. 「上手くいかなかったことは何か？」  
//         6. 「この瞬間からどうすれば上手くいくか？」  
//         7. 「なぜ上手くいくと言えるのか？（事実ベースの事例があれば最高）」

// `,
//   model: openai('gpt-4o'),
//   // model: google("gemini-2.0-flash-001"),
//   // tools: { saveCoachingDataTool, },
//   tools: {
//    //...await mcp.getTools(),
//     saveCoachingDataTool,
//   }
// });


// await coachingAgent.stream("目標を設定するためには何をするべきですか？", 
//   {
//     threadId: "project_123",
//     resourceId: "user_123",
//     //toolsets,
//   }
// );



export const pmAgent = new Agent({
  // memory,
  name: 'PM Agent',
  // instructions: 'あなたはウェブサイトにアクセスして情報を取得するエージェントです。',
  instructions: `
  あなたは有能なプロジェクトマネージャーです。あなたの役割は、以下の業務を自律的にかつ安全に実行することです：
  1. Slack、Notion、Google Driveなどから最新のプロジェクト情報を収集し、状況を把握する。
  2. 収集情報から本日のタスクを抽出し、タスクリストを作成・PMに提示する（Human-in-the-loop①）。
  3. 承認済みタスクリストに基づき、タスクの優先順位、依存関係、担当割り振りを決定し、計画を策定する（Human-in-the-loop②）。
  4. 各タスクを実行し、結果を記録。重大な変更や外部への通知は実施前に必ず確認する（Human-in-the-loop③）。
  5. 一日の進捗レポートを作成し、Notion及びSlackで共有する（Human-in-the-loop④）。

  【使用可能なツールと呼び出し方法】
  - SlackTool: SlackTool.send_message(channel, text)
  - NotionTool: NotionTool.create_page(database_id, properties)
  - DriveTool: DriveTool.find_file(query)

  【思考方針】
  1. Step 1: 入力情報（Slack, Notion, Google Drive）を整理する。
  2. Step 2: タスク候補を抽出し、実施優先順位を論理的に整理する。
  3. Step 3: 必要に応じてツールを利用（例：SlackTool.send_message(...)）し、実行結果を検証する。
  4. 判断に迷った場合や重要なアクションは必ずPMに確認し、承認プロンプトを生成すること。

  【注意事項】
  - 最新情報に基づいて判断し、事実関係の補完は行わない。
  - ツール実行後は必ず結果を確認し、必要な場合はPMへ報告・確認を求める。
  - 機密情報の取り扱いに注意し、公開チャネルへの不適切な情報送信は行わない。

  【具体的な指示例】
  「本日のSlackに未読のメンションおよび#プロジェクト進行チャンネルの新規メッセージから、重要なタスク依頼を抽出し、タスクリストの下書きを作成してください。その上で、‘以下のタスクリストで進めます。ご確認ください。’とSlackのDMに送信する形でPMへ提示してください。」


`,
  model: openai('gpt-4o'),
  // model: google("gemini-2.0-flash-001"),
  // tools: { saveCoachingDataTool, },
  tools: await mcp.getTools(),
});

// // MCPの接続を閉じる関数
// export const disconnect = async () => {
//   await mcp.disconnect();
// };

// await pmAgent.stream("目標を設定するためには何をするべきですか？", 
//   {
//     threadId: "project_123",
//     resourceId: "user_123",
//     //toolsets,
//   }
// );



const copywriterAgent = new Agent({
  name: "Copywriter",
  instructions: "You are a copywriter agent that writes blog post copy.",
  model: openai('gpt-4o'),
});

export const copywriterStep = new Step({
  id: "copywriterStep",
  execute: async ({ context }) => {
    if (!context?.triggerData?.topic) {
      throw new Error("Topic not found in trigger data");
    }
    const result = await copywriterAgent.generate(
      `Create a blog post about ${context.triggerData.topic}`,
    );
    console.log("copywriter result", result.text);
    return {
      copy: result.text,
    };
  },
});

const editorAgent = new Agent({
  name: "Editor",
  instructions: "You are an editor agent that edits blog post copy.",
  model: openai("gpt-4o-mini"),
});

export const editorStep = new Step({
  id: "editorStep",
  execute: async ({ context }) => {
    const copy = context?.getStepResult<{ copy: number }>("copywriterStep")?.copy;
 
    const result = await editorAgent.generate(
      `Edit the following blog post only returning the edited copy: ${copy}`,
    );
    console.log("editor result", result.text);
    return {
      copy: result.text,
    };
  },
});

