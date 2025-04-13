import { openai } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Agent } from '@mastra/core/agent';
import { weatherTool, saveCoachingDataTool } from '../tools';
import { Memory } from "@mastra/memory";
import { MCPConfiguration } from "@mastra/mcp";

// Google Gemini AIプロバイダーの作成
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

const mcp = new MCPConfiguration({
  servers: {
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

export const weatherAgent = new Agent({
  name: 'Weather Agent',
  instructions: `
      You are a helpful weather assistant that provides accurate weather information.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn’t in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative

      Use the weatherTool to fetch current weather data.
`,
  // model: openai('gpt-4o'),
  model: google("gemini-2.0-flash-001"),
  tools: { weatherTool },
});


      // 現在時刻が11:00までの場合は以下のことを順に聞いてください
      //   ・今晩ベッドに向かう前にどんな成果が出ていれば最高の価値があるか？
      //   ・そのためにあなたが創るコンテキストは何か？
      //   ・そのコンテキストを体現する言動は何か？（言葉や行動の違いのこと）

      // 現在時刻が11:00以降の場合は

const memory = new Memory({
  embedder: openai.embedding("text-embedding-3-small"),
  options: {
    lastMessages: 5, // Keep 5 most recent messages
  },
});
      
// Get the current toolsets configured for this user
const toolsets = await mcp.getToolsets();


export const coachingAgent = new Agent({
  memory,
  name: 'Coaching Agent',
  instructions: `
      あなたはプロの経営者向けコーチです。
      ①と②を交互に問いかけてコーチングを行ってください。
      質問をする時は一問ずつ質問してください。
      質問するごとにコーチングデータをDBに保存してください。
      ただし保存したことはユーザーに伝える必要はありません。
      もしユーザーがどちらかをスキップしたいと言ったら従ってください。

      ①目標設定の質問
        1. 「今晩ベッドに向かう前にどんな成果が出ていれば最高の価値があるか？」  
        2. 「そのためにあなたが創るコンテキストは何か？」  
        3. 「そのコンテキストを体現する言動は何か？」（言葉や行動の違い）

      ②設定した目標に対しての振り返り
        1. 「今日1日の私のフォーカスは何だったか？」  
        2. 「そのために創った行動の違いは何か？」  
        3. 「結果はどうなったか？」  
        4. 「上手くいったことは何か？」  
        5. 「上手くいかなかったことは何か？」  
        6. 「この瞬間からどうすれば上手くいくか？」  
        7. 「なぜ上手くいくと言えるのか？（事実ベースの事例があれば最高）」

`,
  model: openai('gpt-4o'),
  // model: google("gemini-2.0-flash-001"),
  // tools: { saveCoachingDataTool, },
  tools: {
   //...await mcp.getTools(),
    saveCoachingDataTool,
  }
});


await coachingAgent.stream("When will the project be completed?", 
  {
    threadId: "project_123",
    resourceId: "user_123",
    //toolsets,
  }
);