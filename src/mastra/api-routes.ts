import { registerApiRoute } from "@mastra/core/server";

// カスタムAPIルートを定義
export const customApiRoutes = [
  registerApiRoute("/custom/hello", {
    method: "GET",
    handler: async (c) => {
      // Mastraインスタンスへのアクセス
      const mastra = c.get("mastra");
          
      // you can use the mastra instance to get agents, workflows, etc.
      const agents = await mastra.getAgent("pmAgent");

      const response = await agents.generate("https://qiita.com/tomada/items/b992245a4162ddeb1f6e のタイトルを教えて");

      console.log(response);
      return c.json({ message: response.text });
    },
  }),
  
  // ユーザー情報を返すAPI
  registerApiRoute("/custom/user", {
    method: "GET",
    handler: async (c) => {
      // クエリパラメータを取得
      const id = c.req.query("id");
      
      return c.json({
        id: id || "guest",
        name: id ? `ユーザー${id}` : "ゲスト",
        role: "一般ユーザー"
      });
    },
  }),

  // データを受け取るAPI
  registerApiRoute("/custom/data", {
    method: "POST",
    handler: async (c) => {
      // リクエストボディを取得
      const body = await c.req.json();
      
      // 受け取ったデータを処理して返す
      return c.json({
        status: "success",
        receivedData: body,
        processedAt: new Date().toISOString()
      });
    },
  }),
]; 