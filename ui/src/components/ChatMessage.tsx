import React from 'react';
import { format } from 'date-fns';
import { User } from 'lucide-react';
import { Message } from '../types';

// AIコーチのアバター画像を使用するためのコンポーネント
const CoachAvatar = () => (
  <div className="avatar-coach flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-blue-400 shadow-lg shadow-blue-500/20">
    <img 
      src="/images/coaching_ai_avator.png" 
      alt="AI Coach" 
      className="w-full h-full object-cover object-top"
    />
  </div>
);

interface Props {
  message: Message;
}

export const ChatMessage: React.FC<Props> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`flex items-start gap-4 ${
        isAssistant ? 'flex-row' : 'flex-row-reverse'
      }`}
    >
      {isAssistant ? (
        <CoachAvatar />
      ) : (
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-700">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={`flex-1 max-w-[80%] rounded-lg p-4 ${
          isAssistant
            ? 'chat-gradient-assistant text-blue-100'
            : 'chat-gradient-user text-gray-100'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className="text-xs opacity-60 mt-2">
          {format(new Date(message.timestamp), 'HH:mm')}
        </p>
      </div>
    </div>
  );
}