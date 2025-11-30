import React from 'react';
import { Message } from '../types';
import { User, Sparkles } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  soulmateImageUrl?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, soulmateImageUrl }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-col items-start'} gap-2`}>
        
        {/* Sender Name for AI */}
        {!isUser && message.senderName && (
           <span className="text-[10px] text-violet-300 uppercase tracking-wider ml-11 font-medium">
             {message.senderName}
           </span>
        )}

        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
          {/* Avatar */}
          {!isUser && soulmateImageUrl ? (
            <img 
              src={soulmateImageUrl} 
              alt={message.senderName || 'AI'}
              className="flex-shrink-0 w-8 h-8 rounded-full object-cover shadow-lg border border-violet-500/50"
              onError={(e) => {
                // 如果图像加载失败，隐藏图像元素，React 会显示默认图标
                console.error('[ChatMessage] Failed to load soulmate image, using default icon');
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className={`
              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg
              ${isUser ? 'bg-indigo-600' : 'bg-gradient-to-br from-violet-600 to-amber-600'}
            `}>
              {isUser ? <User size={16} className="text-white" /> : <Sparkles size={16} className="text-white" />}
            </div>
          )}

          {/* Bubble */}
          <div className={`
            p-3 rounded-2xl text-sm md:text-base leading-relaxed shadow-md
            ${isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'}
          `}>
            {message.text}
          </div>
        </div>
      </div>
    </div>
  );
};