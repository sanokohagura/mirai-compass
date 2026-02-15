
import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAi = message.sender === 'ai';

  return (
    <div className={`flex w-full mb-4 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div className="flex max-w-[85%] md:max-w-[70%]">
        {isAi && (
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white text-[10px] mr-2 mt-1 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2a10 10 0 1010 10A10.011 10.011 0 0012 2zm0 18a8 8 0 118-8 8.01 8.01 0 01-8 8z"/>
              <path d="M14.5 9.5l-4 1.5 1.5 4 4-1.5-1.5-4z"/>
            </svg>
          </div>
        )}
        <div 
          className={`p-3 text-sm md:text-base shadow-sm ${
            isAi 
              ? 'chat-bubble-ai text-gray-800 border border-gray-100' 
              : 'chat-bubble-user text-gray-900'
          } whitespace-pre-wrap leading-relaxed`}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
