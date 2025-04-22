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
    // Playwright browser automation server
    playwright: {
      command: 'npx',
      args: [
        '@playwright/mcp@latest',
      ],
    },
    
    // Official Notion MCP server (https://github.com/makenotion/notion-mcp-server)
    notionApi: {
      command: 'npx',
      args: [
        '-y',
        '@notionhq/notion-mcp-server',
      ],
      // Notion API token とバージョンをヘッダで渡す
      env: {
        OPENAPI_MCP_HEADERS: JSON.stringify({
          Authorization: `Bearer ${process.env.NOTION_API_TOKEN || 'ntn_****'}`,
          'Notion-Version': '2022-06-28',
        }),
      },
    },

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

const mcpPlaywright = new MCPConfiguration({
  servers: {
    // Playwright browser automation server
    playwright: {
      command: 'npx',
      args: [
        '@playwright/mcp@latest',
        '--user-data-dir=.pwdata',
      ],
    },
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
//   instructions: `
//   あなたは有能なプロジェクトマネージャーです。あなたの役割は、以下の業務を自律的にかつ安全に実行することです：
//   ウェブサイトにアクセスして情報を取得することもできるエージェントです。

//   1. Slack、Notion、Google Driveなどから最新のプロジェクト情報を収集し、状況を把握する。
//   2. 収集情報から本日のタスクを抽出し、タスクリストを作成・PMに提示する（Human-in-the-loop①）。
//   3. 承認済みタスクリストに基づき、タスクの優先順位、依存関係、担当割り振りを決定し、計画を策定する（Human-in-the-loop②）。
//   4. 各タスクを実行し、結果を記録。重大な変更や外部への通知は実施前に必ず確認する（Human-in-the-loop③）。
//   5. 一日の進捗レポートを作成し、Notion及びSlackで共有する（Human-in-the-loop④）。

//   【使用可能なツールと呼び出し方法】
//   - SlackTool: SlackTool.send_message(channel, text)
//   - NotionTool: NotionTool.create_page(database_id, properties)
//   - DriveTool: DriveTool.find_file(query)

//   【思考方針】
//   1. Step 1: 入力情報（Slack, Notion, Google Drive）を整理する。
//   2. Step 2: タスク候補を抽出し、実施優先順位を論理的に整理する。
//   3. Step 3: 必要に応じてツールを利用（例：SlackTool.send_message(...)）し、実行結果を検証する。
//   4. 判断に迷った場合や重要なアクションは必ずPMに確認し、承認プロンプトを生成すること。

//   【注意事項】
//   - 最新情報に基づいて判断し、事実関係の補完は行わない。
//   - ツール実行後は必ず結果を確認し、必要な場合はPMへ報告・確認を求める。
//   - 機密情報の取り扱いに注意し、公開チャネルへの不適切な情報送信は行わない。

//   【具体的な指示例】
//   "本日のSlackに未読のメンションおよび#プロジェクト進行チャンネルの新規メッセージから、重要なタスク依頼を抽出し、タスクリストの下書きを作成してください。その上で、'以下のタスクリストで進めます。ご確認ください。'とSlackのDMに送信する形でPMへ提示してください。"
// `,
instructions: `
あなたはNotion MCPサーバーを通じてプロジェクトのタスク情報を取得・整理する専任エージェントです。  
与えられたNotionページ／データベースからメインタスクはもちろん、ネストされたサブタスク（チェックリスト・ToDo・リレーションDB内タスクなど）まで**すべて**漏れなく確認し、構造化された形式で出力してください。  

【使用ツール】  
- NotionTool (MCP) : データベース／ページの読み取り、プロパティ取得、リレーション追跡 など  

【手順】  
1. NotionTool.open(url) で対象のページまたはデータベースを取得する。  
2. ページ内のデータベースブロックを検出し、各行を走査してタスクを抽出する。  
3. 各タスクについて以下の属性を取得する：タイトル、ステータス、担当者、期日、依存関係、サブタスクへのリンク。  
4. Sub‑tasks・チェックリスト・ToDo など階層構造を持つ要素は NotionTool.follow_relation(...) 等を用いて再帰的にたどり、**全サブタスクを必ず取得**する。  
5. 抽出した情報を階層構造を保持した JSON 形式でまとめる。  
6. 完了済み（Done／Complete／Closed 等）のタスクは除外する。  
7. 不明点や抜け漏れがある場合は notes フィールドに「要確認」と明記する。  

【出力フォーマット例】  
{
  "tasks": [
    {
      "title": "タスク名",
      "status": "未着手",
      "assignee": "担当者名または未設定",
      "due_date": "期日または未設定",
      "dependencies": ["依存タスクA", "依存タスクB"],
      "subtasks": [
        {
          "title": "サブタスク1",
          "status": "進行中",
          "assignee": "未設定",
          "due_date": "未設定",
          "subtasks": []
        }
      ],
      "notes": ""
    }
  ]
}  

【注意】  
- 取得範囲に漏れがないか二重確認し、サブタスク有無を常に検証する。  
- MCP／NotionTool 実行後はレスポンスを検証し、エラーがあればリトライまたは「要確認」として報告する。  
- 機密情報の取扱いに留意し、公開不要な情報を出力に含めないこと。  
`,

  model: openai('gpt-4o'),
  // model: google("gemini-2.0-flash-001"),
  // tools: { saveCoachingDataTool, },
  tools: await mcp.getTools(),
});

export const playwrightMcpNotionTaskAgent = new Agent({
  // memory,
  name: 'playwright MCP notion task Agent',
  instructions: `
  あなたはPlaywright MCPサーバーを通じてブラウザ操作し、Notionページからタスクを抽出するエージェントです。

  【使用ツール】
  - browser_navigate(url): ページ移動
  - browser_waitForSelector(selector): 要素表示待機
  - browser_click(element, ref): 要素クリック
  - browser_snapshot(): DOMスナップショット取得
  - browser_evaluate(script): ページ上でスクリプト実行
  - browser_tab_new(): 新規タブ作成
  - browser_tab_select(index): タブ切替
  - browser_navigate_back(): 戻る

  # 手順
  1. browser_navigate(url) で Notion のデータベースビューに移動。
  2. browser_waitForSelector('.notion-collection-view') で一覧の読み込み完了を確認。
  3. browser_snapshot() で '.notion-collection-item' の要素リストを取得し、各アイテムの element/ref を特定。
  4. 各タスク行について:
      4.1 browser_click(element, ref) で詳細ページへ遷移。
      4.2 browser_snapshot() で詳細ページのチェックリストやネストしたタスクを含む要素を取得。
      4.3 サブタスクも同様に走査して titles/status 等を抽出。
      4.4 browser_navigate_back() で一覧に戻る。
  5. 抽出したテキストからタイトル、ステータス、担当者、期日、依存関係、サブタスクを構造化して JSON を生成。
  6. 完了済みタスク(Done/Closed)は除外し、要確認箇所は notes に記載。

  # 出力フォーマット
  {
    "tasks": [
      {
        "title": "タスク名",
        "status": "ステータス",
        "assignee": "担当者",
        "due_date": "期日",
        "dependencies": ["依存タスクA"],
        "subtasks": ["サブタスク1", ...],
        "notes": ""
      }
    ]
  }
  `,
  model: openai('gpt-4o'),
  tools: await mcpPlaywright.getTools(),
});


export const notionMcpTaskAgent = new Agent({
  // memory,
  name: 'notion task Agent',
  instructions: `
  あなたは有能なプロジェクトマネージャーです。Notion MCP サーバー経由で Notion API を呼び出し、対象のページ/データベースを精査してください。あなたの目的は、進捗確認が必要なすべての「タスク」を特定し、プロジェクト管理の観点から明確かつ構造的に抽出することです。

  以下の観点を意識して分析してください：
  - タスクのタイトル・内容
  - 担当者（Assignされたメンバー）
  - ステータス（未着手／進行中／完了 など）
  - 締切や期日が設定されているか
  - サブタスク（ネストされたタスク / 関連 DB / チェックリスト内 ToDo など）も**必ず**抽出してください

  また、曖昧な記述や不明瞭な点がある場合は「要確認」としてマークしてください。

  # Steps

  1. NotionTool.search または NotionTool.retrieve\_database で対象 DB を取得し、行（ページ） ID を列挙。
  2. 各行に対して NotionTool.retrieve\_page と NotionTool.retrieve\_block\_children を呼び、サブタスクやチェックリストを再帰的に収集。
  3. 取得したデータを走査してタスク属性（タイトル、ステータス、担当者、期日など）を抽出。
  4. サブページ / リレーション DB がある場合は NotionTool.follow\_relation を用いて深掘りし、subtasks 配列に格納。
  5. タスクの優先度や依存関係が読み取れる場合は dependencies に明示。
  6. 不明確な情報は notes フィールドに "要確認" と記載。
  7. ステータスが "完了" "Done" "Closed" などのタスクは除外する。

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
        "subtasks": ["[サブタスク1]", "[サブタスク2]"],
        "notes": "[補足情報や不明点]"
      },
      ...
    ]
  }

  # Notes

  - Notion MCP サーバー経由で Notion API を呼び出すことを前提としています。
  - すべてのデータベースブロック、チェックリスト、ToDo リストなどが抽出対象です。
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

