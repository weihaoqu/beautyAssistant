
import React, { useState } from 'react';
import { VersusReport, AnalysisResult, Language } from '../types';
import { Trophy, Swords, CheckCircle2, AlertCircle, RefreshCcw, Star, Zap, Activity, Share2 } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { VersusShareModal } from './VersusShareModal';

interface VersusResultsProps {
  report: VersusReport;
  p1Image: string | null;
  p2Image: string | null;
  p1Result: AnalysisResult;
  p2Result: AnalysisResult;
  onReset: () => void;
  language: Language;
}

export const VersusResults: React.FC<VersusResultsProps> = ({
  report, p1Image, p2Image, p1Result, p2Result, onReset, language
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const t = getTranslation(language);

  const getWinnerBadge = (winner: string) => {
    if (winner === 'Player 1') return <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black uppercase rounded-sm">P1 Win</span>;
    if (winner === 'Player 2') return <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-black uppercase rounded-sm">P2 Win</span>;
    return <span className="px-2 py-0.5 bg-slate-200 text-slate-500 text-[10px] font-black uppercase rounded-sm">Draw</span>;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 animate-fade-in pb-20">
      {isShareModalOpen && (
        <VersusShareModal 
          report={report}
          p1Image={p1Image}
          p2Image={p2Image}
          p1Result={p1Result}
          p2Result={p2Result}
          onClose={() => setIsShareModalOpen(false)}
          language={language}
        />
      )}

      {/* Header Victory Section */}
      <div className="bg-slate-900 rounded-3xl p-10 text-white mb-10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 -m-10 opacity-10 rotate-12">
          <Trophy size={200} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              {t.battle.matchReport}
            </div>
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-500 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
            >
              <Share2 size={14} />
              {t.share.button}
            </button>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">
            {report.overall_glow_winner === 'Draw' ? t.battle.draw : `${report.overall_glow_winner} ${t.battle.victory}`}
          </h2>
          
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            "{report.final_verdict}"
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Sidebar: P1 & P2 Snapshots */}
        <div className="space-y-6">
           <div className="bg-white p-5 rounded-2xl border-2 border-rose-100 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-black">1</div>
               <h4 className="font-black text-slate-800 uppercase italic tracking-wider">{t.player1}</h4>
             </div>
             <div className="aspect-square rounded-xl overflow-hidden mb-4 border border-slate-100">
               <img src={p1Image || ''} className="w-full h-full object-cover" alt="P1" />
             </div>
             <div className="space-y-2">
               <p className="text-xs font-bold text-slate-400 uppercase">{t.results.skinType}: <span className="text-slate-700">{p1Result.skin_analysis.skin_type}</span></p>
               <div className="flex flex-wrap gap-1">
                 {p1Result.skin_analysis.concerns.slice(0, 3).map(c => <span key={c} className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-bold">{c}</span>)}
               </div>
             </div>
           </div>

           <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-black">2</div>
               <h4 className="font-black text-slate-800 uppercase italic tracking-wider">{t.player2}</h4>
             </div>
             <div className="aspect-square rounded-xl overflow-hidden mb-4 border border-slate-100">
               <img src={p2Image || ''} className="w-full h-full object-cover" alt="P2" />
             </div>
             <div className="space-y-2">
               <p className="text-xs font-bold text-slate-400 uppercase">{t.results.skinType}: <span className="text-slate-700">{p2Result.skin_analysis.skin_type}</span></p>
               <div className="flex flex-wrap gap-1">
                 {p2Result.skin_analysis.concerns.slice(0, 3).map(c => <span key={c} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{c}</span>)}
               </div>
             </div>
           </div>
        </div>

        {/* Category Face-offs */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800 uppercase italic flex items-center gap-2">
                    <Swords size={20} className="text-rose-500" />
                    {t.battle.summary}
                </h3>
                <button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  title={t.battle.share}
                >
                  <Share2 size={20} />
                </button>
             </div>
             <div className="space-y-4">
               {report.categories.map((cat, idx) => (
                 <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-rose-200 transition-colors">
                   <div className="flex justify-between items-start mb-3">
                     <div>
                       <h5 className="font-bold text-slate-800">{cat.category_name}</h5>
                       {getWinnerBadge(cat.winner)}
                     </div>
                     <Zap size={18} className="text-yellow-500" />
                   </div>
                   <p className="text-xs text-slate-600 leading-relaxed mb-4">
                     {cat.reason}
                   </p>
                   <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                     <div className="border-r border-slate-200 pr-2">
                       <p className="text-[10px] font-black uppercase text-rose-400 mb-1">P1 Status</p>
                       <p className="text-xs text-slate-700 font-medium">{cat.p1_status}</p>
                     </div>
                     <div className="pl-2">
                       <p className="text-[10px] font-black uppercase text-indigo-400 mb-1">P2 Status</p>
                       <p className="text-xs text-slate-700 font-medium">{cat.p2_status}</p>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </div>

           <div className="bg-gradient-to-r from-rose-50 to-indigo-50 p-6 rounded-3xl border border-white shadow-inner flex flex-col items-center text-center">
              <Activity className="text-slate-400 mb-3" />
              <h4 className="font-black text-slate-800 uppercase italic text-lg mb-2">{t.battle.finalVerdict}</h4>
              <p className="text-sm text-slate-600 leading-relaxed italic mb-6">
                "{report.battle_summary}"
              </p>
              <div className="flex gap-3">
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                >
                    <RefreshCcw size={18} />
                    {t.battle.rematch}
                </button>
                <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center gap-2 bg-rose-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-rose-600 transition-all shadow-lg active:scale-95"
                >
                    <Share2 size={18} />
                    {t.share.button}
                </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
