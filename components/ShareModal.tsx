import React, { useRef, useState } from 'react';
import { X, Share2, Download, Sparkles, ScanFace, Droplet, CheckCircle2, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { AnalysisResult, Language } from '../types';
import { getTranslation } from '../utils/translations';

interface ShareModalProps {
  result: AnalysisResult;
  userImage: string | null;
  onClose: () => void;
  language: Language;
}

export const ShareModal: React.FC<ShareModalProps> = ({ result, userImage, onClose, language }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const t = getTranslation(language);

  // Helper to generate the image blob using a cloned element to ensure full height capture
  const generateBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    
    let clone: HTMLElement | null = null;

    try {
      const originalElement = cardRef.current;
      // Clone the node to render it off-screen at full height
      clone = originalElement.cloneNode(true) as HTMLElement;
      
      // Reset any constraints on the clone
      clone.style.position = 'absolute';
      clone.style.top = '-10000px';
      clone.style.left = '0';
      // Ensure width is preserved exactly as seen
      clone.style.width = `${originalElement.offsetWidth}px`;
      // Allow height to auto-expand to fit all content
      clone.style.height = 'auto';
      clone.style.maxHeight = 'none';
      clone.style.overflow = 'visible';
      clone.style.transform = 'none';
      
      document.body.appendChild(clone);
      
      // Capture the clone
      const canvas = await html2canvas(clone, {
        scale: 2, // Retina quality
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
        // Explicitly set height to scrollHeight to ensure everything is captured
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
      if (!blob) throw new Error("Failed to generate image blob");
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `GlowAI-Analysis-${Date.now()}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateBlob();
      if (!blob) throw new Error("Failed to generate image blob");
      
      const file = new File([blob], 'glow-analysis.png', { type: 'image/png' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My GlowAI Analysis',
          text: 'Check out my personalized skincare analysis from GlowAI!',
          files: [file],
        });
      } else {
        // Fallback to download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `GlowAI-Analysis-${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Share failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
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

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
          
          {/* The Long Infographic Card */}
          <div 
            ref={cardRef} 
            className="w-[375px] bg-white text-slate-800 relative shadow-xl shrink-0 flex flex-col"
          >
            {/* Top Decoration */}
            <div className="h-2 bg-gradient-to-r from-rose-400 via-teal-400 to-indigo-400"></div>

            <div className="p-6 pb-8 space-y-6">
                {/* 1. Header Logo */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white shadow-sm">
                            <Sparkles size={18} fill="white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 leading-none tracking-tight text-lg">GlowAI</h2>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Analysis Report</p>
                        </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">{new Date().toLocaleDateString()}</span>
                </div>

                {/* 2. User Profile + Stats */}
                <div className="flex items-start gap-4">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-rose-300 to-teal-300 shadow-sm shrink-0">
                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-slate-100">
                            {userImage ? (
                                <img src={userImage} alt="Me" className="w-full h-full object-cover" />
                            ) : (
                                <ScanFace className="w-full h-full p-6 text-slate-300" />
                            )}
                        </div>
                    </div>
                    <div className="flex-1 space-y-2 pt-1">
                        <div className="bg-rose-50 rounded-lg p-2.5 border border-rose-100">
                            <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">{t.results.skinType}</p>
                            <p className="font-bold text-slate-800 text-lg leading-tight">{result.skin_analysis.skin_type}</p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-2.5 border border-indigo-100">
                            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">{t.results.hairHealth}</p>
                            <p className="font-bold text-slate-800 text-sm leading-tight">{result.hair_analysis.condition}</p>
                        </div>
                    </div>
                </div>

                {/* 3. Full Summary */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                     <div className="absolute top-0 left-4 -translate-y-1/2 bg-white px-2 py-0.5 border border-slate-100 rounded shadow-sm text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        Summary
                     </div>
                     <p className="text-sm text-slate-700 leading-relaxed italic">
                        "{result.skin_analysis.summary}"
                     </p>
                </div>

                {/* 4. Concerns List (Full) */}
                <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <AlertCircle size={14} /> {t.share.topConcerns}
                     </p>
                     <div className="flex flex-wrap gap-2">
                        {result.skin_analysis.concerns.map((c, i) => (
                            <span key={i} className="px-3 py-1.5 bg-white border border-rose-100 text-rose-600 rounded-lg text-sm font-semibold shadow-sm">
                                {c}
                            </span>
                        ))}
                     </div>
                </div>

                 {/* 5. Routine / Recommendations (Full) */}
                <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Droplet size={14} /> {t.share.recommended}
                     </p>
                     <div className="space-y-3">
                        {result.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0 mt-0.5">
                                    {i+1}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 leading-tight">{rec.product_type}</p>
                                    <p className="text-xs text-slate-500 mb-1">{rec.category}</p>
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                         {rec.key_ingredients.slice(0, 2).map((ing, idx) => (
                                             <span key={idx} className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">
                                                 {ing}
                                             </span>
                                         ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
                        <ScanFace size={12} />
                        Powered by GlowAI
                    </p>
                </div>

            </div>
            
            {/* Bottom Decoration */}
            <div className="h-1.5 bg-slate-100"></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-slate-100 bg-white space-y-3 shrink-0">
           <button 
             onClick={handleShare}
             disabled={isGenerating}
             className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-70"
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
             className="w-full py-3 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
           >
             <Download size={18} /> {t.share.download}
           </button>
        </div>

      </div>
    </div>
  );
};