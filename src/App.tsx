import { useState } from 'react';
import { MastraClient } from '@mastra/client-js';
import { Mastra } from '@mastra/core';

// Mastraのインスタンスを作成
const mastra = new Mastra({});

// クライアントインスタンスを作成
const client = new MastraClient({
  baseUrl: 'http://localhost:4000',
});

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // ユーザーメッセージを追加
    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // エージェントからの応答を取得
      const agent = client.getAgent('coaching-agent');
      const response = await agent.generate({
        messages: [...messages, userMessage],
      });

      // アシスタントの応答を追加
      if (typeof response === 'string') {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      } else if (response.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
      } else {
        throw new Error('応答の形式が不正です');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'エラーが発生しました。もう一度お試しください。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-4 mb-4 h-[500px] overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
              } max-w-[80%] ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}
            >
              {message.content}
            </div>
          ))}
          {isLoading && (
            <div className="bg-gray-100 p-4 rounded-lg max-w-[80%]">
              <div className="animate-pulse">応答を生成中...</div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            送信
          </button>
        </form>
      </div>
    </div>
  );
}

export default App; 