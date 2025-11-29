import React, { useRef, useState } from 'react';
import { X, Share2, Download, Sparkles, ScanLine, ShoppingCart, Clock, Beaker, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { ProductSuitability, Language } from '../types';
import { getTranslation } from '../utils/translations';

interface ProductShareModalProps {
  result: ProductSuitability;
  productImage: string;
  onClose: () => void;
  language: Language;
}

export const ProductShareModal: React.FC<ProductShareModalProps> = ({ result, productImage, onClose, language }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const t = getTranslation(language);

  // Helper to get verdict color and icon (similar to parent but for share card)
  const getVerdictStyle = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes('excellent') || v.includes('good')) {
      return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 size={24} /> };
    }
    if (v.includes('caution') || v.includes('avoid') || v.includes('not')) {
      return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <AlertCircle size={24} /> };
    }
    return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: <AlertTriangle size={24} /> };
  };

  const style = getVerdictStyle(result.verdict);

  const generateBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    
    let clone: HTMLElement | null = null;

    try {
      const originalElement = cardRef.current;
      clone = originalElement.cloneNode(true) as HTMLElement;
      
      clone.style.position = 'absolute';
      clone.style.top = '-10000px';
      clone.style.left = '0';
      clone.style.width = `${originalElement.offsetWidth}px`;
      clone.style.height = 'auto';
      clone.style.maxHeight = 'none';
      clone.style.overflow = 'visible';
      clone.style.transform = 'none';
      
      document.body.appendChild(clone);
      
      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
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
      link.download = `GlowAI-Product-Analysis-${Date.now()}.png`;
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
      
      const file = new File([blob], 'glow-product-analysis.png', { type: 'image/png' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'GlowAI Product Check',
          text: `Check out this product analysis for ${result.product_name}!`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `GlowAI-Product-Analysis-${Date.now()}.png`;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
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
          
          {/* The Share Card */}
          <div 
            ref={cardRef} 
            className="w-[375px] bg-white text-slate-800 relative shadow-xl shrink-0 flex flex-col rounded-xl overflow-hidden"
          >
            {/* Top Branding */}
            <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-rose-400" size={20} />
                    <span className="font-bold tracking-wide">GlowAI</span>
                </div>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-medium uppercase tracking-wider">
                  {t.share.productReport}
                </span>
            </div>

            <div className="p-5 space-y-5">
                
                {/* Product Identity & Image */}
                <div className="flex gap-4 items-start">
                   <div className="w-20 h-20 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 shadow-sm p-1">
                      <img src={productImage} alt="Product" className="w-full h-full object-contain" />
                   </div>
                   <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{result.brand}</p>
                      <h2 className="font-bold text-slate-800 leading-tight text-lg">{result.product_name}</h2>
                   </div>
                </div>

                {/* Verdict */}
                <div className={`p-4 rounded-xl border ${style.bg} ${style.border} flex flex-col gap-2`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={style.color}>{style.icon}</div>
                            <span className={`font-bold ${style.color} text-lg`}>{result.verdict}</span>
                        </div>
                        <div className="bg-white/80 px-2 py-1 rounded text-xs font-bold text-slate-600 border border-black/5 shadow-sm">
                            {result.suitability_score}/100
                        </div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed border-t border-black/5 pt-2 mt-1">
                        {result.reasoning}
                    </p>
                </div>

                {/* Grid: Buy & Use */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-1.5 mb-1.5 text-indigo-600">
                            <ShoppingCart size={14} />
                            <span className="font-bold text-[10px] uppercase">{t.productCheck.buyAdvice}</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-snug">
                            {result.quantity_to_buy}
                        </p>
                    </div>
                    <div className="bg-teal-50 p-3 rounded-xl border border-teal-100">
                        <div className="flex items-center gap-1.5 mb-1.5 text-teal-600">
                            <Clock size={14} />
                            <span className="font-bold text-[10px] uppercase">{t.productCheck.howToUse}</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-snug">
                            {result.usage_instructions}
                        </p>
                    </div>
                </div>

                {/* Ingredients */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                        <Beaker size={14} />
                        <span className="font-bold text-[10px] uppercase tracking-wide">{t.productCheck.ingredients}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        {result.ingredients_analysis}
                    </p>
                </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
                <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
                    <ScanLine size={12} />
                    Analyzed by GlowAI
                </p>
            </div>
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