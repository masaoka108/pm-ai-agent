import React from 'react';
import { format } from 'date-fns';
import { Bot, User } from 'lucide-react';
import { Message } from '../types';

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
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isAssistant ? 'ai-gradient-bg' : 'bg-gray-700'
        }`}
      >
        {isAssistant ? (
          <Bot className="w-5 h-5 text-white" />
        ) : (
          <User className="w-5 h-5 text-white" />
        )}
      </div>
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