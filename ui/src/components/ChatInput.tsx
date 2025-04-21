import React, { useState, KeyboardEvent, useEffect } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (message: string) => void;
  initialMessage?: boolean;
}

export const ChatInput: React.FC<Props> = ({ onSend, initialMessage = true }) => {
  const [message, setMessage] = useState('');
  const [hasShownInitialMessage, setHasShownInitialMessage] = useState(false);

  useEffect(() => {
    // 初期メッセージを一度だけ送信
    if (initialMessage && !hasShownInitialMessage) {
      setTimeout(() => {
        onSend('こんにちは！');
        setHasShownInitialMessage(true);
      }, 100);
    }
  }, []); // 依存配列を空にして、マウント時のみ実行

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    // まずUI更新のために親コールバックを呼ぶ
    onSend(trimmed);
    setMessage('');

    // ChatInput ではサーバー呼び出しを行わず、親コンポーネントに委譲する
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 p-4 border-t border-gray-600 bg-slate-900">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="メッセージを入力..."
        className="w-full flex-1 resize-none rounded-lg bg-slate-800 text-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-600 placeholder-slate-400"
        rows={1}
        style={{ minHeight: '44px' }}
        autoComplete="off"
        spellCheck="false"
      />
      <button
        onClick={handleSend}
        disabled={!message.trim()}
        className="px-4 py-2 ai-gradient-bg text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}