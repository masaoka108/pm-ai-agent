- **> 「今日のPM業務をスタートして」**
- **> Slack確認、notion確認(議事録、スケジュール)、G drive(受領、作成Doc)を確認する。**
- **> やるべきタスクを洗い出す。notionに追加(足りなければ手動で追加)**
- **> それぞれのタスクについてAIエージェントが自律的にこなしていく。
プランニング->実行をループしてタスク終了まで遂行する。->メール送信などにんげんの確認が必要なもの、相談が必要なものはHuman in the loopで確認して進行->完了したらSlackで連絡する。**

[] 設定（Slack、Notion （Gmail、G Drive））を入力する画面
  -  Notion
    - ログイン情報
    - 議事録DBのURL
    - スケジュールDBのURL
  - Slack
    - ログイン情報
    - チャンネル名

[] 必要なWorkflowは何か？
  → 情報収集(notion/slack) 
  → タスク洗い出し 
  (ここでHITL)
  → プランニング 
  (ここでHITL)
  → 実行 
  → レポーティング


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