import { registerApiRoute } from "@mastra/core/server";
import { pmWorkflow } from "./workflow/pm-workflow";

// カスタムAPIルートを定義
export const customApiRoutes = [

  registerApiRoute("/capi/pm-workflow", {
    method: "POST",
    handler: async (c) => {
      // Mastraインスタンスへのアクセス
      const mastra = c.get("mastra");
          
      // // you can use the mastra instance to get agents, workflows, etc.
      // const agents = await mastra.getAgent("pmAgent");

      // // リクエストボディからパラメータpを取得
      // const body = await c.req.json();
      // const p = body.p;
      // if (!p) {
      //   return c.json({ error: "pパラメータが必要です" }, 400);
      // }
      // const response = await agents.generate(p);

      // console.log(response);




      const body = await c.req.json();
      const p = body.p;
      if (!p) {
        return c.json({ error: "pパラメータが必要です" }, 400);
      }

      const { runId, start } = pmWorkflow.createRun();
      
      const res = await start({
        triggerData: { prompt: p },
      });

      console.log("Workflow Results: ", res.results);

      return c.json({ message: res.results.taskSummary });
    },
  }),
  
  // // ユーザー情報を返すAPI
  // registerApiRoute("/custom/user", {
  //   method: "GET",
  //   handler: async (c) => {
  //     // クエリパラメータを取得
  //     const id = c.req.query("id");
      
  //     return c.json({
  //       id: id || "guest",
  //       name: id ? `ユーザー${id}` : "ゲスト",
  //       role: "一般ユーザー"
  //     });
  //   },
  // }),

  // // データを受け取るAPI
  // registerApiRoute("/custom/data", {
  //   method: "POST",
  //   handler: async (c) => {
  //     // リクエストボディを取得
  //     const body = await c.req.json();
      
  //     // 受け取ったデータを処理して返す
  //     return c.json({
  //       status: "success",
  //       receivedData: body,
  //       processedAt: new Date().toISOString()
  //     });
  //   },
  // }),
]; 