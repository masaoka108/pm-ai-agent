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
//       - If the location name isn't in English, please translate it
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
//         1. "今晩ベッドに向かう前にどんな成果が出ていれば最高の価値があるか？"  
//         2. "そのためにあなたが創るコンテキストは何か？"  
//         3. "そのコンテキストを体現する言動は何か？"（言葉や行動の違い）

//       ②設定した目標に対しての振り返り
//         1. "今日1日の私のフォーカスは何だったか？"  
//         2. "そのために創った行動の違いは何か？"  
//         3. "結果はどうなったか？"  
//         4. "上手くいったことは何か？"  
//         5. "上手くいかなかったことは何か？"  
//         6. "この瞬間からどうすれば上手くいくか？"  
//         7. "なぜ上手くいくと言えるのか？（事実ベースの事例があれば最高）"

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
  ウェブサイトにアクセスして情報を取得することもできるエージェントです。

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
  "本日のSlackに未読のメンションおよび#プロジェクト進行チャンネルの新規メッセージから、重要なタスク依頼を抽出し、タスクリストの下書きを作成してください。その上で、'以下のタスクリストで進めます。ご確認ください。'とSlackのDMに送信する形でPMへ提示してください。"


`,
  model: openai('gpt-4o'),
  // model: google("gemini-2.0-flash-001"),
  // tools: { saveCoachingDataTool, },
  tools: await mcp.getTools(),
});

export const notionTaskAgent = new Agent({
  // memory,
  name: 'notion task Agent',
  instructions: `
  あなたは有能なプロジェクトマネージャーです。提供されたNotionのURLにブラウザ経由でアクセスし（Playwright MPCを通じて）、その内容を精査してください。あなたの目的は、進捗確認が必要なすべての「タスク」を特定し、プロジェクト管理の観点から明確かつ構造的に抽出することです。

  以下の観点を意識して分析してください：
  - タスクのタイトル・内容
  - 担当者（Assignされたメンバー）
  - ステータス（未着手／進行中／完了 など）
  - 締切や期日が設定されているか
  - サブタスクも全て確認してください

  また、曖昧な記述や不明瞭な点がある場合は「要確認」としてマークしてください。

  # Steps

  1. Notionページをブラウザ経由で読み取り、セクションやデータベースを認識。
  2. タスクと考えられる要素をリストアップ。
  3. 各タスクについて、プロジェクトマネージャーとして確認すべきポイントを抽出。
  4. タスクの優先度や依存関係が読み取れる場合は、それも明示。
  5. 「未整理」「不明確」な情報はフラグを立てる。
  6. ステータスが「完了」「Done」「Closed」「Pending」などのタスクは無視してください。出力に決して含まないでください。

  # Output Format

  以下のようなJSON形式で出力してください：

  {
    "tasks": [
      {
        "title": "[タスク名]",
        "status": "[例: 未着手 / 進行中 / 完了 / 要確認]",
        "assignee": "[担当者名または未設定]",
        "due_date": "[期日 or 未設定]",
        "dependencies": ["[依存タスクA]", "[依存タスクB]"],
        "notes": "[補足情報や不明点]"
      },
      ...
    ]
  }

  # Notes

  - Playwright MPCによるNotionページへのブラウザアクセスを前提としています。
  - すべてのデータベースブロック、チェックリスト、ToDoリストなどが抽出対象です。
  - 「進捗確認が必要」なタスクに絞って抽出してください。
  - 曖昧な内容はそのままにせず、要確認として明記してください。

`,
  model: openai('gpt-4o'),
  tools: await mcp.getTools(),
});

export const taskSummaryAgent = new Agent({
  // memory,
  name: 'task summary Agent',
  instructions: `

  あなたはプロジェクト全体のタスクを一元的に管理・把握することを目的とした、優秀なAIアシスタントです。複数の情報ソース（例：Notion、Slack、Google Docs など）から抽出されたタスク情報を受け取り、それらを統合・整理して、プロジェクトマネージャーが確認・管理しやすい形でまとめてください。

  各タスクについて、発生元・担当者・ステータス・期日・依存関係などの重要な情報を明示し、重複や矛盾がある場合は指摘してください。

  # Steps

  1. 入力された複数ソース（例：Notionページ、Slackメッセージなど）から抽出されたタスク情報を受け取る。
  2. 情報を正規化（共通フォーマットに変換）し、以下の観点で整理：
    - タスク名
    - 情報ソース（Notion/Slackなど）
    - 担当者
    - ステータス
    - 期日
    - 依存関係
    - 備考・不明点
  3. 同一または類似タスクの統合・重複排除。
  4. 矛盾点や不明瞭な情報は「要確認」として明記。
  5. 優先度やブロッカー情報があればそれも追記。

  # Notes
  - タスクの発生元は必ず記録してください（後から詳細確認が可能なように）。
  - Slackなどで曖昧に指示されたタスク（例：「これやっといて」など）も、可能な限り文脈を推測して明文化してください。
  - 各タスクの詳細が欠けている場合はその旨を\`notes\`に明記し、「要確認」扱いとしてください。
  - 複数の情報ソースにまたがるタスクは、統合時に最も詳細な情報を採用してください。


`,
  model: openai('gpt-4o'),
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
    try {
      console.log('copywriterStep開始', context);
      
      if (!context?.triggerData?.topic) {
        console.error('Context:', context);
        throw new Error("Topic not found in trigger data");
      }
      
      console.log('トピック:', context.triggerData.topic);
      
      const result = await copywriterAgent.generate(
        `Create a blog post about ${context.triggerData.topic}`,
      );
      
      console.log("copywriter result:", result.text);
      
      return {
        copy: result.text,
      };
    } catch (error) {
      console.error('copywriterStep エラー:', error);
      throw error;
    }
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
    try {
      console.log('editorStep開始', context);
      
      const copy = context?.getStepResult<{ copy: string }>("copywriterStep")?.copy;
      
      if (!copy) {
        console.error('Context:', context);
        console.error('copywriterStepの結果がありません');
        throw new Error("No copy to edit");
      }
      
      console.log('編集するテキスト長さ:', copy.length);
      
      const result = await editorAgent.generate(
        `Edit the following blog post only returning the edited copy: ${copy}`,
      );
      
      console.log("editor result:", result.text);
      
      return {
        copy: result.text,
      };
    } catch (error) {
      console.error('editorStep エラー:', error);
      throw error;
    }
  },
});

