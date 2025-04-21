- **> 「今日のPM業務をスタートして」**
- **> Slack確認、notion確認(議事録、スケジュール)、G drive(受領、作成Doc)を確認する。**
- **> やるべきタスクを洗い出す。notionに追加(足りなければ手動で追加)**
- **> それぞれのタスクについてAIエージェントが自律的にこなしていく。
プランニング->実行をループしてタスク終了まで遂行する。->メール送信などにんげんの確認が必要なもの、相談が必要なものはHuman in the loopで確認して進行->完了したらSlackで連絡する。**

[] 必要なWorkflowは何か？
  → 情報収集(notion/slack)  notionTaskAgent,notionScheduleAgent, slackAgent
  → タスク洗い出し 
  (ここでHITL)
  → プランニング 
  (ここでHITL)
  → 実行 
  → レポーティング

    Multi Agent Workflowで実現する（WorkflowはMastra側が完全じゃないのでMastra Devを使うのはやめてオリジナルのサーバーを構築する）
    https://mastra.ai/examples/agents/multi-agent-workflow
      -> オリジナルサーバー next.jsで立てたがPlaywright MCPがうまく動かなかった
      ▪️この方法でMastra serverにオリジナルEndpointを追加してWorkflowを実現する
        https://mastra.ai/ja/docs/deployment/server
          - pnpm run dev で起動すると mastra serverもCustom APIも動く

[] 設定（Slack、Notion （Gmail、G Drive））を入力する画面
  -  Notion
    - ログイン情報
    - 議事録DBのURL
    - スケジュールDBのURL
  - Slack
    - ログイン情報
    - チャンネル名


[] プロンプトの精査
[] 必要なツールは何か？
  - notionのスケジュール確認Tool
  - Gmail確認Tool
  - G Driveの確認
    - ToolでやらないでPlayweight MCPでできるか？

[x] 必要なMCP接続は何か？
  [x] Playweight MCP
  → SlackはMCPだとPrivate channelにアクセスできなかった気がする



  → メール確認（Gmail） 
    → タスクを抽出してnotionに登録
  → スケジュール確認（Notion）  
    → やるべきタスク確認
  → タスクが出揃ったところで着手
    → タスクの実行
      → プランニング
      → 実行
        → 人の確認が必要な場合は確認して進める。HITL。
[] 最初のプロンプトはどうするか？




Mastraでブログ記事執筆のWorkflowを開発した。これがWorkflowです。
@

UIからTopicを設定して「Workflow Test」ボタンをクリックしたらチャット画面にWorkflowが作成したブログ記事が表示されるようにしたい。UIのファイルはこちら @


WorkflowのIDは"myWorkflow"です。

以下のWatch Workflowを使って実装して。workflowはstartメソッドで実行して。
https://mastra.ai/reference/client-js/workflows#watch-workflow

ーーーーーーーーーーーーーー

現状、Mastraのサーバーを mastra dev で起動してバックエンドを構築して @ui フォルダでフロントを構築していました。
これを以下に変更してください。

- @reference/multi-agent-workflow を参照して フロントエンドもバックエンドもNext.js に置き換えてください。
- 置き換えた後に不要なファイルは全て削除してください