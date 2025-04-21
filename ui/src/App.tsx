import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, MessageSquare, History } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { HistoryView } from './components/HistoryView';
import { CoachSelection } from './components/CoachSelection';
import { useStore } from './store/useStore';
import { Message, DailyEntry } from './types';
import { v4 as uuidv4 } from 'uuid';
import { MastraClient } from '@mastra/client-js';

// Mastraクライアントの初期化
const mastra = new MastraClient({
  baseUrl: 'http://localhost:4111', // あなたのMastraサーバーのURLに変更してください
});

// Workflowの取得
const myWorkflow = mastra.getWorkflow('myWorkflow');

// サンプルデータを型付きで定義
const sampleEntries: DailyEntry[] = [
  {
    id: uuidv4(),
    userId: 'user123',
    date: new Date().toISOString(),
    morningAnswers: null,
    eveningAnswers: null,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function App() {
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { currentEntry, entries, setCurrentEntry, addEntry, updateEntry } = useStore();
  const [hasShownInitialMessage, setHasShownInitialMessage] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
  const [workflowTopic, setWorkflowTopic] = useState('');
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);

  useEffect(() => {
    if (entries.length === 0) {
      sampleEntries.forEach(entry => addEntry(entry));
    }
    if (!currentEntry && entries.length > 0) {
      setCurrentEntry(entries[0]);
    }
  }, [currentEntry, entries.length, addEntry, setCurrentEntry]);

  // 初期メッセージの表示を別のuseEffectで管理
  useEffect(() => {
    if (currentEntry && !hasShownInitialMessage && currentEntry.messages.length === 0) {
      const initialMessage: Message = {
        id: uuidv4(),
        content: '「XXXX」PJのPM業務をサポートします。まずは何をしましょうか？',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };

      const updatedEntry = {
        ...currentEntry,
        messages: [initialMessage],
      };
      updateEntry(updatedEntry);
      setHasShownInitialMessage(true);
    }
  }, [currentEntry]); // currentEntryのみを依存配列に含める

  const handleSendMessage = async (content: string) => {
    if (!currentEntry) return;

    const userMessage: Message = {
      id: uuidv4(),
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    const updatedEntry = {
      ...currentEntry,
      messages: [...currentEntry.messages, userMessage],
    };
    updateEntry(updatedEntry);

    setIsLoading(true);
    
    try {
      // pm‑workflow を呼び出して結果を取得
      const workflowRes = await fetch('http://localhost:4111/capi/pm-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p: content }),
      });

      if (!workflowRes.ok) {
        throw new Error(`Workflow API Error: ${workflowRes.statusText}`);
      }

      const workflowData: { message?: string } = await workflowRes.json();
      const assistantMessage: Message = {
        id: uuidv4(),
        content: workflowData.message ?? 'Workflow の結果を取得できませんでした。',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };

      const entryWithAssistantResponse = {
        ...updatedEntry,
        messages: [...updatedEntry.messages, assistantMessage],
      };
      updateEntry(entryWithAssistantResponse);
    } catch (error) {
      console.error('Error communicating with pmAgent:', error);
      // エラーメッセージを表示
      const errorMessage: Message = {
        id: uuidv4(),
        content: 'すみません、エラーが発生しました。もう一度お試しください。',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      const entryWithError = {
        ...updatedEntry,
        messages: [...updatedEntry.messages, errorMessage],
      };
      updateEntry(entryWithError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkflowTest = async () => {
    if (!currentEntry || !workflowTopic || workflowTopic.trim() === '') {
      // トピックが入力されていない場合はエラーメッセージを表示
      const errorMessage: Message = {
        id: uuidv4(),
        content: 'トピックを入力してください。',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      
      if (currentEntry) {
        const updatedEntry = {
          ...currentEntry,
          messages: [...currentEntry.messages, errorMessage],
        };
        updateEntry(updatedEntry);
      }
      return;
    }

    setIsWorkflowRunning(true);
    
    // ユーザーメッセージの追加
    const userMessage: Message = {
      id: uuidv4(),
      content: `トピック「${workflowTopic}」のブログ記事を作成します。`,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    // 処理中メッセージの追加
    const processingMessage: Message = {
      id: uuidv4(),
      content: 'ブログ記事を作成中です...',
      role: 'assistant',
      timestamp: new Date().toISOString(),
    };

    const updatedEntry: DailyEntry = {
      ...currentEntry,
      id: currentEntry.id,
      userId: currentEntry.userId,
      date: currentEntry.date,
      messages: [...currentEntry.messages, userMessage, processingMessage],
      createdAt: currentEntry.createdAt,
      updatedAt: currentEntry.updatedAt,
      morningAnswers: currentEntry.morningAnswers,
      eveningAnswers: currentEntry.eveningAnswers,
    };
    updateEntry(updatedEntry);

    try {
      // Workflowの実行準備
      const runInfo = await myWorkflow.createRun();
      const runId = runInfo.runId;
      console.log('Workflow Run ID:', runId);
      
      // 結果を取得するための変数
      let workflowResult: any = null;
      let isCompleted = false;
      
      // Workflowを監視する関数
      const watchWorkflow = () => {
        return new Promise<void>((resolve) => {
          // タイムアウト用のタイマー
          const timeout = setTimeout(() => {
            console.log('Workflow監視タイムアウト');
            resolve();
          }, 60000); // 60秒間待機
          
          // Workflowを監視
          myWorkflow.watch({ runId }, (record) => {
            console.log('Workflow状態:', record);
            
            if (isCompleted) return;
            
            // Workflowが完了したかチェック
            if (record && record.results) {
              console.log('Workflow結果を検出:', record.results);
              
              if (Object.keys(record.results).length > 0) {
                isCompleted = true;
                workflowResult = record.results;
                clearTimeout(timeout);
                resolve();
              }
            }
          });
        });
      };
      
      // Workflowを実行する関数
      const executeWorkflow = () => {
        return myWorkflow.start({
          runId,
          triggerData: {
            topic: workflowTopic,
          },
        });
      };
      
      // 監視とワークフロー実行を同時に開始
      await Promise.all([
        watchWorkflow(),
        executeWorkflow()
      ]);
      
      // 結果を処理して表示
      let content = '';
      
      if (workflowResult) {
        try {
          console.log('処理するWorkflow結果:', workflowResult);
          
          // エディターの結果があれば優先的に使用
          if (workflowResult.editorStep && 'copy' in workflowResult.editorStep) {
            content = String(workflowResult.editorStep.copy);
          } 
          // なければコピーライターの結果を使用
          else if (workflowResult.copywriterStep && 'copy' in workflowResult.copywriterStep) {
            content = String(workflowResult.copywriterStep.copy);
          }
          // どちらも取得できない場合は結果オブジェクトそのものを使用
          else {
            content = JSON.stringify(workflowResult, null, 2);
          }
        } catch (error) {
          console.error('結果のパース中にエラー:', error);
          content = 'Workflowの結果を処理できませんでした。';
        }
      } else {
        content = 'Workflowは実行されましたが、結果が取得できませんでした。コンソールを確認してください。';
      }
      
      // 処理中メッセージを更新
      const resultMessage: Message = {
        id: uuidv4(),
        content,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      
      const entryWithResult: DailyEntry = {
        ...updatedEntry,
        // 処理中メッセージを結果で置き換える
        messages: updatedEntry.messages.filter(msg => msg.id !== processingMessage.id).concat(resultMessage),
      };
      updateEntry(entryWithResult);
      
    } catch (error) {
      console.error('Workflow error:', error);
      // エラーメッセージを表示
      const errorMessage: Message = {
        id: uuidv4(),
        content: 'Workflowの実行中にエラーが発生しました。',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      
      const entryWithError: DailyEntry = {
        ...updatedEntry,
        // 処理中メッセージをエラーメッセージで置き換える
        messages: updatedEntry.messages.filter(msg => msg.id !== processingMessage.id).concat(errorMessage),
      };
      updateEntry(entryWithError);
    } finally {
      setIsWorkflowRunning(false);
    }
  };

  const handleSelectCoach = (coachId: string) => {
    setSelectedCoach(coachId);
  };

  // コーチが選択されていない場合はコーチ選択画面を表示
  if (!selectedCoach) {
    return (
      <div className="min-h-screen">
        <header className="glass-effect">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                  PM AI Agent
                </h1>
              </div>
              <div className="flex items-center space-x-4 text-blue-300">
                <Calendar className="w-6 h-6" />
                <span>{format(new Date(), 'yyyy年MM月dd日')}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="py-8">
          <CoachSelection onSelectCoach={handleSelectCoach} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="glass-effect">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                  PM AI Agent
                </h1>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  showHistory
                    ? 'ai-gradient-bg text-white'
                    : 'glass-effect text-blue-400 hover:text-purple-400'
                }`}
              >
                {showHistory ? (
                  <MessageSquare className="w-5 h-5" />
                ) : (
                  <History className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="flex items-center space-x-4 text-blue-300">
              <Calendar className="w-6 h-6" />
              <span>{format(new Date(), 'yyyy年MM月dd日')}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {showHistory ? (
          <HistoryView />
        ) : (
          <>
            <div className="mb-6 p-4 glass-effect rounded-lg">
              <h2 className="text-xl font-semibold text-blue-300 mb-3">ブログ記事生成 Workflow</h2>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={workflowTopic}
                  onChange={(e) => setWorkflowTopic(e.target.value)}
                  placeholder="トピックを入力..."
                  className="flex-1 rounded-lg bg-slate-800 text-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-600"
                />
                <button
                  onClick={handleWorkflowTest}
                  disabled={isWorkflowRunning}
                  className="px-4 py-3 ai-gradient-bg text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isWorkflowRunning ? '処理中...' : 'Workflow実行'}
                </button>
              </div>
            </div>
            <div className="relative p-[1px] rounded-lg bg-gradient-to-r from-blue-400 to-purple-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-30 blur-xl"></div>
              <div className="relative glass-effect min-h-[600px] flex flex-col rounded-lg overflow-hidden">
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {currentEntry?.messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isLoading && (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                    </div>
                  )}
                </div>
                <div className="relative z-10">
                  <ChatInput onSend={handleSendMessage} initialMessage={false} />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;