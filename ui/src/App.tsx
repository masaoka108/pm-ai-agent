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
      // // coachingAgentとの対話を開始
      // const agent = mastra.getAgent('coachingAgent');
      // pmAgentとの対話を開始
      const agent = mastra.getAgent('pmAgent');
      const response = await agent.generate({
        messages: [{
          role: 'user',
          content: content
        }],
        threadId: currentEntry.id,
        resourceId: currentEntry.userId,
      });

      const assistantMessage: Message = {
        id: uuidv4(),
        content: response.text,
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
        )}
      </main>
    </div>
  );
}

export default App;