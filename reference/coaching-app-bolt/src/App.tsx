import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, MessageSquare, History } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { HistoryView } from './components/HistoryView';
import { useStore } from './store/useStore';

// サンプルデータ
const sampleEntries = [
  {
    id: '1',
    userId: 'test-user',
    date: '2024-03-20',
    morningAnswers: {
      eveningGoal: '新規プロジェクトの要件定義を完了させる',
      context: 'チームの期待を超える提案をする',
      behaviors: '積極的なコミュニケーションと詳細な文書化',
    },
    eveningAnswers: {
      focus: 'プロジェクトの要件定義',
      behaviorDifferences: 'チームメンバーと密接に連携し、細かな要件まで確認した',
      results: '予定通り要件定義書を完成させ、チームから高評価を得た',
      successes: '全ステークホルダーの要望を適切に文書化できた',
      challenges: '一部の要件で関係者間で認識の違いがあった',
      improvements: 'より早い段階で認識合わせのミーティングを設定する',
      reasoning: '過去のプロジェクトでも早期の認識合わせが成功につながっている',
    },
    messages: [
      {
        id: 'm1',
        content: 'おはようございます！今日の目標を設定していきましょう。',
        role: 'assistant',
        timestamp: '2024-03-20T08:00:00Z',
      },
      {
        id: 'm2',
        content: '新規プロジェクトの要件定義を完了させたいと思います。',
        role: 'user',
        timestamp: '2024-03-20T08:01:00Z',
      },
    ],
    createdAt: '2024-03-20T08:00:00Z',
    updatedAt: '2024-03-20T20:00:00Z',
  },
  {
    id: '2',
    userId: 'test-user',
    date: '2024-03-19',
    morningAnswers: {
      eveningGoal: 'チーム全体のモチベーションを高める施策を考案する',
      context: '全員が主体的に参加できる環境作り',
      behaviors: '1on1の実施と、チーム会議での積極的な意見収集',
    },
    eveningAnswers: {
      focus: 'チームビルディング',
      behaviorDifferences: '全メンバーと個別に時間を取って話し合った',
      results: '新しいチーム活動の提案をまとめることができた',
      successes: 'メンバーから多くの建設的な意見を得られた',
      challenges: '時間管理が難しかった',
      improvements: 'ミーティングの時間配分を事前に決めておく',
      reasoning: '構造化された時間管理が以前から課題だった',
    },
    messages: [
      {
        id: 'm3',
        content: 'チームのモチベーション向上について、具体的にどんなアプローチを考えていますか？',
        role: 'assistant',
        timestamp: '2024-03-19T09:00:00Z',
      },
      {
        id: 'm4',
        content: '定期的な1on1とチーム会議での意見交換を中心に考えています。',
        role: 'user',
        timestamp: '2024-03-19T09:01:00Z',
      },
    ],
    createdAt: '2024-03-19T09:00:00Z',
    updatedAt: '2024-03-19T21:00:00Z',
  },
];

function App() {
  const [showHistory, setShowHistory] = useState(false);
  const { currentEntry, entries, setCurrentEntry, addMessage, addEntry } = useStore();

  useEffect(() => {
    sampleEntries.forEach(entry => addEntry(entry));

    if (!currentEntry) {
      setCurrentEntry({
        id: crypto.randomUUID(),
        userId: 'test-user',
        date: format(new Date(), 'yyyy-MM-dd'),
        morningAnswers: null,
        eveningAnswers: null,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, []);

  const handleSendMessage = (content: string) => {
    addMessage({ content, role: 'user' });
    setTimeout(() => {
      addMessage({
        content: '申し訳ありません。現在AIアシスタントは実装中です。',
        role: 'assistant',
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen">
      <header className="glass-effect">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                MASTRAコーチング
              </h1>
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
          <HistoryView entries={entries} />
        ) : (
          <div className="gradient-border glass-effect min-h-[600px] flex flex-col">
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {currentEntry?.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
            <ChatInput onSend={handleSendMessage} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;