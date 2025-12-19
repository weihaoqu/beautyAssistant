

import React, { useRef, useState } from 'react';
// Added ScanFace to the imports from lucide-react to fix compilation error
import { X, Share2, Download, Trophy, Swords, Sparkles, User, Zap, Star, ScanFace } from 'lucide-react';
import html2canvas from 'html2canvas';
import { VersusReport, AnalysisResult, Language } from '../types';
import { getTranslation } from '../utils/translations';

interface VersusShareModalProps {
  report: VersusReport;
  p1Image: string | null;
  p2Image: string | null;
  p1Result: AnalysisResult;
  p2Result: AnalysisResult;
  onClose: () => void;
  language: Language;
}

export const VersusShareModal: React.FC<VersusShareModalProps> = ({ 
  report, p1Image, p2Image, p1Result, p2Result, onClose, language 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const t = getTranslation(language);

  const generateBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    
    let clone: HTMLElement | null = null;
    try {
      const originalElement = cardRef.current;
      clone = originalElement.cloneNode(true) as HTMLElement;
      
      clone.style.position = 'absolute';
      clone.style.top = '-10000px';
      clone.style.left = '0';
      clone.style.width = `400px`; // Fixed width for mobile-friendly share
      clone.style.height = 'auto';
      clone.style.maxHeight = 'none';
      clone.style.overflow = 'visible';
      clone.style.transform = 'none';
      
      document.body.appendChild(clone);
      
      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: '#111827', // Matching the dark theme
        useCORS: true,
        logging: false,
        windowWidth: 400,
        height: clone.scrollHeight
      });
      
      return new Promise<Blob | null>(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/png');
      });
    } catch (err) {
      console.error("Image generation failed", err);
      return null;
    } finally {
      if (clone && document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateBlob();
      if (!blob) throw new Error("Blob generation failed");
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `GlowBattle-Result-${Date.now()}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateBlob();
      if (!blob) throw new Error("Blob generation failed");
      const file = new File([blob], 'glow-battle.png', { type: 'image/png' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Glow Battle Results',
          text: `Who won? Check out the Glow Battle results!`,
          files: [file],
        });
      } else {
        handleDownload();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Share2 className="text-rose-500" size={20} />
            {t.share.modalTitle}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
          
          {/* Competition Card (The part that gets screenshotted) */}
          <div 
            ref={cardRef} 
            className="w-[375px] bg-slate-900 text-white relative shadow-2xl shrink-0 flex flex-col rounded-xl overflow-hidden font-sans"
          >
            {/* Header / VS Branding */}
            <div className="bg-gradient-to-r from-rose-600 to-indigo-600 p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 flex items-center justify-center">
                    <Swords size={200} strokeWidth={1} />
                </div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                        <Sparkles size={12} /> Glow Battle
                    </div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-1">Match Results</h2>
                    <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Powered by GlowAI</p>
                </div>
            </div>

            <div className="p-6 space-y-6">
                
                {/* Winner Announcement */}
                <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-5">
                    <Trophy className="text-yellow-400 mx-auto mb-2" size={32} />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t.battle.winner}</p>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                        {report.overall_glow_winner === 'Draw' ? t.battle.draw : `${report.overall_glow_winner} ${t.battle.victory}`}
                    </h3>
                </div>

                {/* Side-by-Side Players */}
                <div className="flex gap-4 items-center">
                    <div className="flex-1 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-rose-500/50 shadow-lg shadow-rose-500/10 mb-2">
                            <img src={p1Image || ''} className="w-full h-full object-cover" alt="P1" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-rose-400">Player 1</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-black italic text-xs border border-white/10">VS</div>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/10 mb-2">
                            <img src={p2Image || ''} className="w-full h-full object-cover" alt="P2" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-indigo-400">Player 2</span>
                    </div>
                </div>

                {/* Category Scoreboard */}
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-4">Round Breakdown</p>
                    {report.categories.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <Zap size={14} className="text-yellow-400" />
                                <span className="text-xs font-bold text-slate-300">{cat.category_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {cat.winner === 'Player 1' ? (
                                    <span className="text-[10px] font-black text-rose-400 uppercase">P1 Win</span>
                                ) : cat.winner === 'Player 2' ? (
                                    <span className="text-[10px] font-black text-indigo-400 uppercase">P2 Win</span>
                                ) : (
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Draw</span>
                                )}
                                <Star size={10} className={cat.winner !== 'Draw' ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Final Quote */}
                <div className="pt-6 border-t border-white/5 text-center">
                    <p className="text-xs text-slate-400 italic leading-relaxed">
                        "{report.final_verdict}"
                    </p>
                </div>

                {/* QR / Website Placeholder */}
                <div className="pt-4 flex items-center justify-center gap-4 opacity-50">
                    <ScanFace size={24} />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Scan for your Glow Analysis</span>
                </div>

            </div>
            
            {/* Bottom Trim */}
            <div className="h-2 bg-gradient-to-r from-rose-600 via-indigo-600 to-rose-600"></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-slate-100 bg-white space-y-3 shrink-0">
           <button 
             onClick={handleShare}
             disabled={isGenerating}
             className="w-full py-3 bg-slate-800 text-white font-black uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-70"
           >
             {isGenerating ? <span className="animate-pulse">{t.share.generating}</span> : (
               <>
                 <Share2 size={18} /> {t.share.share}
               </>
             )}
           </button>
           <button 
             onClick={handleDownload}
             disabled={isGenerating}
             className="w-full py-3 bg-white text-slate-700 font-black uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
           >
             <Download size={18} /> {t.share.download}
           </button>
        </div>

      </div>
    </div>
  );
};