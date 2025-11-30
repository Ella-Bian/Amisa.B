import React, { useState, useRef, useEffect } from 'react';
import { Message, UserProfile, Soulmate } from '../types';
import { ChatMessage } from './ChatMessage';
import { DailyInsightWidget } from './DailyInsightWidget';
import { chatService } from '../services/geminiService';
import { siliconFlowService } from '../services/siliconFlowService';
import { Send, Sparkles, Mic, Loader2, StopCircle } from 'lucide-react';

interface ChatInterfaceProps {
  user: UserProfile;
  soulmate: Soulmate;
  siliconFlowKey: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, soulmate, siliconFlowKey }) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Set initial message only once based on Soulmate's greeting
    if (!hasInitialized.current) {
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: soulmate.greeting || `Hello ${user.name}, I am ${soulmate.name}. I am here for you.`,
        senderName: soulmate.name,
        timestamp: new Date()
      }]);
      hasInitialized.current = true;
    }
  }, [soulmate, user.name]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    // Prepare history for API
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    // Create placeholder for model response
    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: modelMsgId,
      role: 'model',
      text: '', // Start empty
      senderName: soulmate.name,
      timestamp: new Date()
    }]);

    try {
      if (!siliconFlowKey) {
        throw new Error("SiliconFlow API Token is missing. Please configure it in Settings.");
      }
      
      // Pass soulmate and user context to service
      const stream = chatService.sendMessageStream(history, userMsg.text, soulmate, user, siliconFlowKey);
      
      let fullText = '';
      for await (const chunk of stream) {
        if (chunk) {
          fullText += chunk;
          setMessages(prev => prev.map(m => 
            m.id === modelMsgId ? { ...m, text: fullText } : m
          ));
        }
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error && error.message.includes("Token") 
        ? "Please configure your SiliconFlow API Token in Settings."
        : "The energetic connection is faint right now... please try again.";
      setMessages(prev => prev.map(m => 
        m.id === modelMsgId ? { ...m, text: errorMessage } : m
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice Recording Functions
  const startRecording = async () => {
    if (!siliconFlowKey) {
      alert("Please configure the SiliconFlow API Token in Settings to use Voice Input.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscription(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const text = await siliconFlowService.transcribeAudio(audioBlob, siliconFlowKey);
      if (text) {
        // Append to current input
        setInput(prev => (prev ? prev + ' ' + text : text));
      }
    } catch (error) {
      console.error("Transcription error", error);
      alert("Voice transcription failed. Check your API token.");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative bg-slate-950">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Soulmate Avatar Section */}
          {soulmate.imageUrl && (
            <div className="flex justify-center mb-6 animate-fade-in">
              <div className="relative group">
                <img 
                  src={soulmate.imageUrl} 
                  alt={soulmate.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-violet-500/50 shadow-lg shadow-violet-900/50 transition-transform group-hover:scale-105"
                  onError={(e) => {
                    console.error('[ChatInterface] Failed to load soulmate image');
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-slate-800/90 backdrop-blur-sm rounded-full border border-violet-500/50 shadow-lg">
                  <span className="text-xs text-violet-300 font-medium">{soulmate.name}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Daily Insight can utilize user info if we wanted to expand it later */}
          <DailyInsightWidget user={user} siliconFlowKey={siliconFlowKey} />
          {messages.map(m => (
            <ChatMessage 
              key={m.id} 
              message={m} 
              soulmateImageUrl={m.role === 'model' ? soulmate.imageUrl : undefined} 
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 p-4">
        <div className="max-w-2xl mx-auto relative flex items-center gap-2">
          
          {/* Voice Input Button */}
          <button
             onClick={isRecording ? stopRecording : startRecording}
             disabled={isStreaming || isTranscribing}
             className={`
               p-3 rounded-full transition-all flex items-center justify-center
               ${isRecording 
                  ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500/50' 
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 hover:bg-slate-700'}
               disabled:opacity-50 disabled:cursor-not-allowed
             `}
          >
            {isTranscribing ? (
              <Loader2 size={20} className="animate-spin text-violet-400" />
            ) : isRecording ? (
              <StopCircle size={20} />
            ) : (
              <Mic size={20} />
            )}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Listening..." : isTranscribing ? "Transcribing..." : `Talk to ${soulmate.name}...`}
            disabled={isStreaming || isRecording || isTranscribing}
            className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-500 border border-slate-700 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 transition-all"
          />
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || isRecording || isTranscribing}
            className="bg-violet-600 hover:bg-violet-700 text-white p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-violet-900/50"
          >
            {isStreaming ? <Sparkles className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};