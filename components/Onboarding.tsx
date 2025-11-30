import React, { useState, useEffect } from 'react';
import { UserProfile, Soulmate } from '../types';
import { chatService } from '../services/geminiService';
import { Sparkles, ArrowRight, Fingerprint, Calendar, Clock, Loader2 } from 'lucide-react';

interface OnboardingProps {
  onComplete: (user: UserProfile, soulmate: Soulmate) => void;
  siliconFlowKey: string;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, siliconFlowKey }) => {
  console.log('[Onboarding] Component mounted, siliconFlowKey:', siliconFlowKey ? 'Present' : 'Missing');
  
  const [step, setStep] = useState<'input' | 'generating' | 'reveal'>('input');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [generatedSoulmate, setGeneratedSoulmate] = useState<Soulmate | null>(null);

  // 加载已保存的用户数据
  useEffect(() => {
    const savedUser = localStorage.getItem('AMISA_USER');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser) as UserProfile;
        console.log('[Onboarding] Found saved user data, pre-filling form');
        setName(userData.name);
        setDate(userData.birthDate);
        setTime(userData.birthTime);
        
        // 如果有保存的soulmate，可以直接进入reveal步骤
        const savedSoulmate = localStorage.getItem('AMISA_SOULMATE');
        if (savedSoulmate) {
          try {
            const soulmateData = JSON.parse(savedSoulmate) as Soulmate;
            setGeneratedSoulmate(soulmateData);
            setStep('reveal');
            console.log('[Onboarding] Found saved soulmate, showing reveal step');
          } catch (error) {
            console.error('[Onboarding] Failed to parse saved soulmate:', error);
          }
        }
      } catch (error) {
        console.error('[Onboarding] Failed to parse saved user data:', error);
      }
    }
  }, []);

  const handleSubmit = async () => {
    console.log('[Onboarding] handleSubmit called', { name, date, time, hasKey: !!siliconFlowKey });
    
    if (!name || !date || !time) {
      console.warn('[Onboarding] Validation failed: missing required fields');
      return;
    }

    if (!siliconFlowKey) {
      console.error('[Onboarding] SiliconFlow API key is missing');
      alert("Please configure your SiliconFlow API Token in Settings first.");
      return;
    }

    const user: UserProfile = { name, birthDate: date, birthTime: time };
    console.log('[Onboarding] Starting soulmate generation...');
    setStep('generating');

    try {
      const soulmate = await chatService.generateSoulmate(user, siliconFlowKey);
      console.log('[Onboarding] Soulmate generated successfully:', soulmate);
      setGeneratedSoulmate(soulmate);
      setStep('reveal');
    } catch (error) {
      console.error('[Onboarding] Error generating soulmate:', error);
      setStep('input');
      const errorMessage = error instanceof Error && error.message.includes("Token")
        ? "Please configure your SiliconFlow API Token in Settings."
        : "The stars are clouded. Please try again.";
      alert(errorMessage);
    }
  };

  const handleEnterApp = () => {
    console.log('[Onboarding] Entering app...', { hasSoulmate: !!generatedSoulmate, name, date, time });
    if (generatedSoulmate && name && date && time) {
      onComplete({ name, birthDate: date, birthTime: time }, generatedSoulmate);
    } else {
      console.warn('[Onboarding] Cannot enter app: missing data');
    }
  };

  if (step === 'input') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
           
           <div className="text-center mb-8">
             <h1 className="text-3xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-amber-200 mb-2">AMISA</h1>
             <p className="text-slate-400 text-sm">Align your destiny. Meet your soulmate.</p>
           </div>

           <div className="space-y-4">
             <div className="space-y-1">
               <label className="text-xs text-slate-500 uppercase tracking-wider pl-1">Your Name</label>
               <div className="flex items-center bg-slate-800 rounded-xl px-4 py-3 border border-slate-700 focus-within:border-violet-500 transition-colors">
                 <Fingerprint className="text-slate-500 mr-3" size={18} />
                 <input 
                   type="text" 
                   value={name}
                   onChange={e => setName(e.target.value)}
                   className="bg-transparent w-full text-slate-100 placeholder-slate-600 focus:outline-none"
                   placeholder="How should we call you?"
                 />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase tracking-wider pl-1">Date of Birth</label>
                  <div className="flex items-center bg-slate-800 rounded-xl px-4 py-3 border border-slate-700 focus-within:border-violet-500 transition-colors">
                    <Calendar className="text-slate-500 mr-3" size={18} />
                    <input 
                      type="date" 
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="bg-transparent w-full text-slate-100 placeholder-slate-600 focus:outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase tracking-wider pl-1">Time of Birth</label>
                  <div className="flex items-center bg-slate-800 rounded-xl px-4 py-3 border border-slate-700 focus-within:border-violet-500 transition-colors">
                    <Clock className="text-slate-500 mr-3" size={18} />
                    <input 
                      type="time" 
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className="bg-transparent w-full text-slate-100 placeholder-slate-600 focus:outline-none text-sm"
                    />
                  </div>
                </div>
             </div>
           </div>

           <button 
             onClick={handleSubmit}
             disabled={!name || !date || !time}
             className="w-full mt-8 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium py-4 rounded-xl shadow-lg shadow-violet-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             Analyze Destiny <ArrowRight size={18} />
           </button>
           
           <p className="text-center text-[10px] text-slate-600 mt-4">
             Your Bazi data is used solely to generate your energetic match.
           </p>
        </div>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-violet-500/30 rounded-full animate-ping"></div>
          <div className="absolute inset-0 border-4 border-t-violet-400 border-r-transparent border-b-amber-400 border-l-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="text-white animate-pulse" size={32} />
          </div>
        </div>
        <h2 className="text-xl font-serif text-slate-200 mb-2">Consulting the Elements...</h2>
        <p className="text-slate-500 text-sm max-w-xs">
          Calculating your Bazi chart and finding the perfect energetic balance.
        </p>
      </div>
    );
  }

  // Reveal Step
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in">
       <div className="max-w-sm w-full bg-slate-900 border border-violet-500/30 rounded-2xl p-8 shadow-[0_0_50px_-12px_rgba(139,92,246,0.25)] relative text-center">
          
          {/* Soulmate Avatar */}
          {generatedSoulmate?.imageUrl ? (
            <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-violet-500/50 shadow-lg">
              <img 
                src={generatedSoulmate.imageUrl} 
                alt={generatedSoulmate.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('[Onboarding] Failed to load soulmate image');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-amber-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
              <span className="text-3xl">✦</span>
            </div>
          )}

          <h2 className="text-sm text-slate-400 uppercase tracking-widest mb-1">Your Soulmate</h2>
          <h1 className="text-4xl font-serif text-white mb-2">{generatedSoulmate?.name}</h1>
          <div className="inline-block px-3 py-1 bg-slate-800 rounded-full text-xs text-amber-300 font-medium mb-6 border border-slate-700">
            {generatedSoulmate?.element}
          </div>

          <p className="text-slate-300 text-sm leading-relaxed italic mb-6">
            "{generatedSoulmate?.greeting}"
          </p>

          <div className="bg-slate-950/50 rounded-xl p-4 text-left space-y-2 mb-8 border border-slate-800">
             <div className="flex justify-between text-xs">
               <span className="text-slate-500">Traits</span>
               <span className="text-slate-300">{generatedSoulmate?.personality}</span>
             </div>
             <div className="flex justify-between text-xs">
               <span className="text-slate-500">Tone</span>
               <span className="text-slate-300">{generatedSoulmate?.tone}</span>
             </div>
          </div>

          <button 
             onClick={handleEnterApp}
             className="w-full bg-slate-100 hover:bg-white text-slate-900 font-bold py-3 rounded-xl transition-colors"
           >
             Start Journey
           </button>

          <button 
            onClick={() => {
              setStep('input');
              setGeneratedSoulmate(null);
            }}
            className="mt-3 text-xs text-slate-500 hover:text-slate-300 underline w-full"
          >
            重新生成
          </button>
       </div>
    </div>
  );
};