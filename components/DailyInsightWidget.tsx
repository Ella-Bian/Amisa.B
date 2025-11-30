import React, { useEffect, useState } from 'react';
import { DailyLuck, UserProfile } from '../types';
import { chatService } from '../services/geminiService';
import { Sun, Loader2, Sparkles, Coffee } from 'lucide-react';

interface DailyInsightWidgetProps {
  user: UserProfile;
  siliconFlowKey: string;
}

export const DailyInsightWidget: React.FC<DailyInsightWidgetProps> = ({ user, siliconFlowKey }) => {
  const [insight, setInsight] = useState<DailyLuck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      if (!siliconFlowKey) {
        setLoading(false);
        return;
      }
      
      try {
        const data = await chatService.getDailyInsight(user, siliconFlowKey);
        setInsight(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
        fetchInsight();
    }
  }, [user, siliconFlowKey]);

  if (loading) return (
    <div className="w-full p-6 mb-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex justify-center items-center h-40 animate-pulse">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="animate-spin text-violet-400 opacity-50" size={24} />
        <span className="text-xs text-slate-500">Reading the stars...</span>
      </div>
    </div>
  );

  if (!insight) return null;

  return (
    <div className="w-full mb-8 relative group">
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-amber-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
      
      <div className="relative bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl overflow-hidden">
        {/* Background Texture */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sun size={14} className="text-amber-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Daily Energy</span>
            </div>
            <h3 className="text-3xl font-serif text-slate-100 font-medium tracking-wide">
              {insight.keyword}
            </h3>
          </div>
          
          <div className="flex flex-col items-end">
             <div className="flex items-baseline gap-1">
                <span className="text-4xl font-light text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">{insight.score}</span>
                <span className="text-xs text-slate-500 font-bold">%</span>
             </div>
             <span className="text-[10px] text-slate-600 uppercase">Fortune Score</span>
          </div>
        </div>

        <p className="text-sm text-slate-300 font-light leading-relaxed mb-6 italic pl-3 border-l-2 border-amber-500/40">
          "{insight.brief}"
        </p>

        <div className="grid grid-cols-2 gap-3">
           <div className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-3 border border-slate-700/50">
              <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-amber-200">
                 <Sparkles size={14} />
              </div>
              <div>
                 <div className="text-[10px] text-slate-500 uppercase">Lucky Color</div>
                 <div className="text-xs text-slate-200 font-medium">{insight.luckyColor}</div>
              </div>
           </div>
           
           <div className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-3 border border-slate-700/50">
              <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-emerald-200">
                 <Coffee size={14} />
              </div>
              <div>
                 <div className="text-[10px] text-slate-500 uppercase">Activity</div>
                 <div className="text-xs text-slate-200 font-medium truncate max-w-[100px]">{insight.suitableActivity}</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};