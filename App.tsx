import React, { useState, useEffect } from 'react';
import { ViewState, UserProfile, Soulmate } from './types';
import { ChatInterface } from './components/ChatInterface';
import { DivinationPanel } from './components/DivinationPanel';
import { Onboarding } from './components/Onboarding';
import { SettingsModal } from './components/SettingsModal';
import { MessageCircle, Compass, Settings } from 'lucide-react';

const App: React.FC = () => {
  console.log('[App] Component initialized');
  
  const [view, setView] = useState<ViewState>(ViewState.COMPANION);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [soulmate, setSoulmate] = useState<Soulmate | null>(null);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [siliconFlowKey, setSiliconFlowKey] = useState('');

  // Load Settings from LocalStorage on mount, fallback to env variable
  useEffect(() => {
    console.log('[App] useEffect: Loading settings from localStorage');
    
    // 加载 API Key
    const savedKey = localStorage.getItem('AMISA_SF_KEY');
    if (savedKey) {
      console.log('[App] Found saved SiliconFlow key in localStorage');
      setSiliconFlowKey(savedKey);
    } else {
      // Try to load from environment variable
      const envKey = import.meta.env.VITE_SILICONFLOW_API_KEY;
      console.log('[App] Checking environment variable for SiliconFlow key:', envKey ? 'Found' : 'Not found');
      if (envKey) {
        setSiliconFlowKey(envKey);
        // Also save to localStorage for persistence
        localStorage.setItem('AMISA_SF_KEY', envKey);
        console.log('[App] Saved environment key to localStorage');
      } else {
        console.warn('[App] No SiliconFlow API key found in localStorage or environment variables');
      }
    }

    // 加载用户数据
    const savedUser = localStorage.getItem('AMISA_USER');
    const savedSoulmate = localStorage.getItem('AMISA_SOULMATE');
    
    if (savedUser && savedSoulmate) {
      try {
        const userData = JSON.parse(savedUser) as UserProfile;
        const soulmateData = JSON.parse(savedSoulmate) as Soulmate;
        console.log('[App] Found saved user and soulmate data');
        setUser(userData);
        setSoulmate(soulmateData);
      } catch (error) {
        console.error('[App] Failed to parse saved user data:', error);
        localStorage.removeItem('AMISA_USER');
        localStorage.removeItem('AMISA_SOULMATE');
      }
    }
  }, []);

  const handleSaveSettings = (key: string) => {
    setSiliconFlowKey(key);
    localStorage.setItem('AMISA_SF_KEY', key);
  };

  const handleOnboardingComplete = (newUser: UserProfile, newSoulmate: Soulmate) => {
    console.log('[App] Onboarding complete:', { userName: newUser.name, soulmateName: newSoulmate.name });
    
    // 保存到 localStorage
    localStorage.setItem('AMISA_USER', JSON.stringify(newUser));
    localStorage.setItem('AMISA_SOULMATE', JSON.stringify(newSoulmate));
    console.log('[App] Saved user and soulmate data to localStorage');
    
    setUser(newUser);
    setSoulmate(newSoulmate);
  };

  // If we don't have a user or soulmate yet, show Onboarding
  useEffect(() => {
    console.log('[App] State update:', { 
      hasUser: !!user, 
      hasSoulmate: !!soulmate, 
      view, 
      hasSiliconFlowKey: !!siliconFlowKey 
    });
  }, [user, soulmate, view, siliconFlowKey]);

  if (!user || !soulmate) {
    console.log('[App] Rendering Onboarding component (user or soulmate missing)');
    return <Onboarding onComplete={handleOnboardingComplete} siliconFlowKey={siliconFlowKey} />;
  }

  console.log('[App] Rendering main app interface');

  return (
    <div className="flex justify-center min-h-screen bg-slate-950 text-slate-200 selection:bg-violet-500/30">
      <div className="w-full max-w-lg h-[100dvh] flex flex-col bg-slate-900 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <header className="flex-none p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 backdrop-blur z-20">
          <div className="w-8"></div> {/* Spacer for balance */}
          <h1 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-amber-200 mystic-font uppercase">
            Amisa
          </h1>
          <button 
            onClick={() => setShowSettings(true)}
            className="text-slate-500 hover:text-violet-300 transition-colors"
          >
            <Settings size={20} />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative">
            <div className={`absolute inset-0 transition-opacity duration-300 ${view === ViewState.COMPANION ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                <ChatInterface user={user} soulmate={soulmate} siliconFlowKey={siliconFlowKey} />
            </div>
             <div className={`absolute inset-0 transition-opacity duration-300 ${view === ViewState.DIVINATION ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'} ${view === ViewState.DIVINATION ? 'pointer-events-auto' : ''}`}>
                <DivinationPanel user={user} siliconFlowKey={siliconFlowKey} />
            </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="flex-none bg-slate-900 border-t border-slate-800 px-6 py-2 pb-6 z-20">
          <div className="flex justify-around items-center">
            <button
              onClick={() => setView(ViewState.COMPANION)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                view === ViewState.COMPANION ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <MessageCircle size={24} strokeWidth={view === ViewState.COMPANION ? 2.5 : 2} />
              <span className="text-xs font-medium">{soulmate.name}</span>
            </button>
            
            <div className="w-px h-8 bg-slate-800 mx-2"></div>

            <button
              onClick={() => setView(ViewState.DIVINATION)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                view === ViewState.DIVINATION ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Compass size={24} strokeWidth={view === ViewState.DIVINATION ? 2.5 : 2} />
              <span className="text-xs font-medium">Oracle</span>
            </button>
          </div>
        </nav>

        {/* Modals */}
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)}
          currentKey={siliconFlowKey}
          onSave={handleSaveSettings}
        />

      </div>
    </div>
  );
};

export default App;