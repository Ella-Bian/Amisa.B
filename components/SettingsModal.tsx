import React, { useState, useEffect } from 'react';
import { X, Save, Key } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  currentKey: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentKey }) => {
  const [key, setKey] = useState(currentKey);

  useEffect(() => {
    setKey(currentKey);
  }, [currentKey, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900">
          <h2 className="text-lg font-serif text-slate-200">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
              <Key size={14} /> SiliconFlow API Token
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              Required for chat and voice input features. Used to call DeepSeek-V3 for conversations and TeleSpeechASR for voice transcription via SiliconFlow.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              onSave(key);
              onClose();
            }}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Save size={16} /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};