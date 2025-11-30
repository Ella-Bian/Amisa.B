import React, { useState } from 'react';
import { chatService } from '../services/geminiService';
import { QimenResult, UserProfile } from '../types';
import { Compass, Sparkles, ArrowRight, RefreshCw, X, AlertCircle, Moon, MapPin } from 'lucide-react';

interface DivinationPanelProps {
  user: UserProfile;
  siliconFlowKey: string;
}

export const DivinationPanel: React.FC<DivinationPanelProps> = ({ user, siliconFlowKey }) => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<QimenResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDivination = async () => {
    if (!question.trim()) return;
    
    if (!siliconFlowKey) {
      alert("Please configure your SiliconFlow API Token in Settings to use the Oracle.");
      return;
    }
    
    setLoading(true);
    setResult(null);

    try {
      const data = await chatService.performDivination(question, user, siliconFlowKey);
      setResult(data);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error && error.message.includes("Token")
        ? "Please configure your SiliconFlow API Token in Settings."
        : "The connection to the oracle was interrupted. Please try again.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setQuestion('');
  };

  // Result View
  if (result) {
    return (
      <div className="h-full flex flex-col items-center justify-start p-6 overflow-y-auto animate-fade-in pb-24 bg-slate-950">
         <div className="max-w-md w-full space-y-6">
            <div className="flex justify-between items-center mb-2">
                <h2 className="mystic-font text-xl text-amber-200/80 uppercase tracking-widest flex items-center gap-2">
                   <Compass size={20} /> The Reading
                </h2>
                <button onClick={reset} className="text-slate-500 hover:text-slate-300 p-2 transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-amber-500/20 rounded-2xl p-1 shadow-2xl relative overflow-hidden">
                <div className="bg-slate-900/90 rounded-xl p-6 relative z-10 h-full">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                    {/* Summary */}
                    <div className="text-center mb-8">
                        <p className="text-lg font-serif text-slate-100 italic leading-relaxed">"{result.summary}"</p>
                    </div>

                    {/* Qimen Chart Simplified */}
                    <div className="grid grid-cols-3 gap-2 mb-8">
                        <div className="flex flex-col items-center p-3 bg-slate-950/50 rounded-lg border border-slate-800/60">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Door (Action)</span>
                            <span className="font-bold text-violet-300 text-sm text-center">{result.elements.door}</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-slate-950/50 rounded-lg border border-slate-800/60">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Star (Timing)</span>
                            <span className="font-bold text-violet-300 text-sm text-center">{result.elements.star}</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-slate-950/50 rounded-lg border border-slate-800/60">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Deity (Help)</span>
                            <span className="font-bold text-violet-300 text-sm text-center">{result.elements.god}</span>
                        </div>
                    </div>

                    {/* Main Advice */}
                    <div className="space-y-4">
                         <div className="bg-violet-900/10 p-4 rounded-xl border border-violet-500/20">
                             <h4 className="flex items-center gap-2 text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">
                                <Sparkles size={12} /> Strategic Advice
                            </h4>
                            <p className="text-slate-300 text-sm leading-relaxed">{result.advice}</p>
                         </div>

                         {/* Details */}
                         <div className="flex items-center justify-between gap-2">
                             <div className="flex-1 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 flex items-center gap-2 justify-center">
                                <MapPin size={12} className="text-emerald-400" />
                                <div className="text-xs text-slate-400">
                                   Dir: <span className="text-slate-200 font-medium">{result.auspiciousDirection}</span>
                                </div>
                             </div>
                             {result.luckyColor && (
                                 <div className="flex-1 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 flex items-center gap-2 justify-center">
                                    <Moon size={12} className="text-amber-400" />
                                    <div className="text-xs text-slate-400">
                                       Color: <span className="text-slate-200 font-medium">{result.luckyColor}</span>
                                    </div>
                                 </div>
                             )}
                         </div>
                    </div>
                </div>
            </div>

            <button 
                onClick={reset}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition-all shadow-lg hover:shadow-slate-900/50 flex items-center justify-center gap-2 group"
            >
                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" /> Ask Another Question
            </button>
         </div>
      </div>
    );
  }

  // Input View
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 animate-fade-in pb-24 bg-slate-950">
      <div className="max-w-md w-full space-y-8">
        
        <div className="text-center space-y-3">
            <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center border border-slate-700 shadow-2xl">
                    <Compass size={48} className="text-violet-400/90" strokeWidth={1.2} />
                </div>
            </div>
            <h2 className="mystic-font text-3xl text-slate-100 tracking-wide">Consult the Oracle</h2>
            <p className="text-slate-400 text-sm font-light max-w-xs mx-auto leading-relaxed">
                Pose a specific question about your career path, relationships, or decisions.
            </p>
        </div>

        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl opacity-20 group-hover:opacity-60 transition duration-500 blur"></div>
            <div className="relative bg-slate-900 rounded-xl p-1">
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="E.g., Should I push for the promotion now?&#10;E.g., How can I improve my relationship communication?"
                    className="w-full h-32 bg-slate-900 border-none rounded-lg p-4 text-slate-200 placeholder-slate-600 focus:ring-0 resize-none leading-relaxed"
                />
            </div>
        </div>
        
        <button
            onClick={handleDivination}
            disabled={!question.trim() || loading}
            className={`
                w-full py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-2 transition-all duration-300
                ${loading 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-violet-600 hover:bg-violet-500 text-white shadow-xl shadow-violet-900/30 hover:scale-[1.02]'}
            `}
        >
            {loading ? (
                <>
                    <RefreshCw className="animate-spin" size={20} /> Reading the Chart...
                </>
            ) : (
                <>
                    Cast the Chart <ArrowRight size={20} />
                </>
            )}
        </button>

        <div className="flex items-start gap-3 text-xs text-slate-500 bg-slate-900/50 p-4 rounded-lg border border-slate-800/60">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-slate-400" />
            <p className="leading-relaxed">
                Amisa analyzes the Qi energy of your birth data against the current moment.
            </p>
        </div>
      </div>
    </div>
  );
};