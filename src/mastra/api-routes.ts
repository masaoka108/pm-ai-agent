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
      // taskSummaryStep の結果を抽出
      const taskSummary: string | undefined = (res?.results as any)?.taskSummaryStep?.output?.taskSummary;

      console.log("taskSummary: ", taskSummary);

      let message: string | undefined = taskSummary;

      // notionTaskStep の結果がある場合は fallback 用に確保
      const notionTask: string | undefined = (res?.results as any)?.notionTaskStep?.output?.notionTask;

      // 最低でもどちらかは返せるようにする
      if (!message && notionTask) {
        message = notionTask;
      }

      // さらに fallback でも取得できなければワークフロー実行時のエラー内容を文字列化
      if (!message) {
        message = 'ワークフローの出力が取得できませんでした。';
      }

      // バッククォート3つで囲まれたコードブロックを除去
      const sanitized = message.replace(/```/g, "").trim();

      // CORS ヘッダを追加
      c.header('Access-Control-Allow-Origin', '*');
      c.header('Access-Control-Allow-Headers', 'Content-Type');

      // 必ず 200 OK で返し、フロント側で内容を表示可能にする
      return c.json({ message: sanitized });
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