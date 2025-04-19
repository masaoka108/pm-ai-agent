import { NextResponse } from 'next/server'
import { Agent } from '@mastra/core/agent'
import { openai } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { MCPConfiguration } from '@mastra/mcp'

// サーバーサイドでのみ実行されるように設定
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Google Gemini AIプロバイダーの作成
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || '',
})

// MCPの設定
const mcp = new MCPConfiguration({
  servers: {
    playwright: {
      command: 'npx',
      args: ['@playwright/mcp@latest'],
      env: {
        DEBUG: '*',
        PWDEBUG: '1',
        NODE_ENV: 'development'
      },
    },
  },
})

// PMエージェントの定義を修正
const pmAgent = new Agent({
  name: 'PM Agent',
  instructions: `
    あなたはウェブサイトにアクセスして情報を取得するエージェントです。
    URLが含まれるユーザーの質問には必ずPlaywrightツールを使用してウェブサイトにアクセスし、
    実際の情報を取得してください。自分の知識だけで回答せず、必ずツールを使用してください。

    Playwrightツールを使用する際の必須手順：
    1. まず browser_navigate ツールを使用してURLにアクセスします
       必ず以下の形式で呼び出してください：
       {
         "toolName": "playwright_browser_navigate",
         "args": {
           "url": "https://example.com"
         }
       }
    2. 次に browser_snapshot ツールを使用してページの内容を取得します
    3. 必要に応じて browser_click などの操作ツールを使用します

    重要な注意点：
    - browser_navigate の引数は必ず { "url": "完全なURL" } の形式で指定すること
    - URLは必ず https:// または http:// から始まる完全な形式で指定すること
    - 空のオブジェクト {} は決して使用しないこと
    - extractedUrl が提供された場合は、必ずそのURLを使用すること
  `,
  model: openai('gpt-4o'),
  tools: await mcp.getTools(),
  logToolCalls: true,
  logErrors: true,  
})

// // コーチングエージェントの定義
// const coachingAgent = new Agent({
//   name: 'Coaching Agent',
//   instructions: `
//   あなたはプロの経営者向けコーチです。
//   ①と②を交互に問いかけてコーチングを行ってください。
//   質問をする時は一問ずつ質問してください。

//   ①目標設定の質問
//     1. "今晩ベッドに向かう前にどんな成果が出ていれば最高の価値があるか？"  
//     2. "そのためにあなたが創るコンテキストは何か？"  
//     3. "そのコンテキストを体現する言動は何か？"（言葉や行動の違い）

//   ②設定した目標に対しての振り返り
//     1. "今日1日の私のフォーカスは何だったか？"  
//     2. "そのために創った行動の違いは何か？"  
//     3. "結果はどうなったか？"  
//     4. "上手くいったことは何か？"  
//     5. "上手くいかなかったことは何か？"  
//     6. "この瞬間からどうすれば上手くいくか？"  
//     7. "なぜ上手くいくと言えるのか？（事実ベースの事例があれば最高）"
//   `,
//   model: openai('gpt-4o'),
//   tools: {},
// })

// URLを抽出する正規表現
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, agentId, threadId, userId } = body

    if (!message) {
      return NextResponse.json(
        { error: 'メッセージは必須です' },
        { status: 400 }
      )
    }

    console.log(`メッセージを受信: ${message}`)
    console.log(`エージェントID: ${agentId}, スレッドID: ${threadId}, ユーザーID: ${userId}`)

    // エージェントの選択
    const selectedAgent = agentId === 'coachingAgent' ? coachingAgent : pmAgent
    
    // メッセージからURLを抽出
    const urls = message.match(URL_REGEX);
    const extractedUrl = urls && urls.length > 0 ? urls[0] : null;
    
    console.log(`抽出されたURL: ${extractedUrl || 'なし'}`);
    
    // ツール情報をデバッグ出力
    console.log('利用可能なツール:', Object.keys(selectedAgent.tools || {}))
    console.log('エージェント設定:', {
      name: selectedAgent.name,
      hasTools: !!selectedAgent.tools,
      toolCount: Object.keys(selectedAgent.tools || {}).length
    })

    // エージェントからの応答を生成
    const result = await selectedAgent.generate(message, {
      threadId,
      resourceId: userId,
      toolChoice: extractedUrl ? 'required' : 'auto',
      instructions: extractedUrl ? `
        以下のURLにアクセスします: ${extractedUrl}

        必ず以下の順序で操作を行ってください：

        1. まず、以下の形式で browser_navigate を呼び出してください：
           {
             "toolName": "playwright_browser_navigate",
             "args": {
               "url": "${extractedUrl}"
             }
           }

        2. 次に browser_snapshot を呼び出してページの内容を取得してください：
           {
             "toolName": "playwright_browser_snapshot"
           }

        3. 最後にページのタイトルを含めて情報を返してください。

        注意：
        - browser_navigate の args は必ず { "url": "${extractedUrl}" } の形式で指定すること
        - 空のオブジェクト {} は使用しないこと
      ` : undefined,
    })

    // 結果にツール使用情報があるかチェック - 詳細なログ出力を追加
    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log('===== ツール使用の詳細 =====')
      console.log(`使用されたツール数: ${result.toolCalls.length}`)
      console.log(`ツール使用情報: ${JSON.stringify(result.toolCalls, null, 2)}`)

      result.toolCalls.forEach((call, index) => {
        console.log(`\n[ツール呼び出し ${index + 1}]`)
        console.log(`ツール名: ${call.toolName}`)
        console.log(`引数: ${JSON.stringify(call.args, null, 2)}`)
        
        // 引数が空オブジェクトかどうかをチェック（browser_navigateのみ）
        if (call.toolName === 'playwright_browser_navigate') {
          if (!call.args.url) {
            console.error('エラー: browser_navigateツールがURL引数なしで呼び出されました！');
          } else {
            console.log(`正常: browser_navigateにURL引数が指定されました: ${call.args.url}`);
          }
        }
        
        // ツール呼び出しの結果（成功または失敗）
        if (call.response && call.response.error) {
          console.log(`エラー: ${call.response.error}`)
        } else if (call.response) {
          console.log(`レスポンス: ${JSON.stringify(call.response, null, 2)}`)
        } else {
          console.log('レスポンス: なし')
        }
      })
      console.log('===========================')
    } else {
      console.log('ツールは使用されませんでした')
    }

    // 生の結果オブジェクトをデバッグ表示
    // console.log('result', result.toolResults)
    console.log('result', result.toolResults[0].result)
    
    console.log('エージェント応答:', result.text)

    return NextResponse.json({
      success: true,
      response: result.text,
      // レスポンスにツール使用情報を追加（開発用）
      debug: {
        usedTools: result.toolCalls || [],
        availableTools: Object.keys(selectedAgent.tools || {}),
        resultKeys: Object.keys(result),
        extractedUrl: extractedUrl
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: '応答の生成中にエラーが発生しました' },
      { status: 500 }
    )
  }
} 