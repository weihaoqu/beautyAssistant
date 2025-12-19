
import React from 'react';
import { X, Terminal, MessageSquare, History } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';

interface PromptModalProps {
  onClose: () => void;
  language: Language;
}

const PROMPTS = [
  {
    step: 1,
    title: "Initial Concept",
    text: "Build an app that I can upload my photo and analyze my face health condition, recommends beauty suggestion like cream."
  },
  {
    step: 2,
    title: "Brand Strategy",
    text: "Add brand recommendations (La Mer, Lancôme, Estée Lauder, etc.) categorized by budget tiers (Luxury, Premium, Mid-range, Budget)."
  },
  {
    step: 3,
    title: "Brand Matcher",
    text: "Add a specific button to give recommendation based on brand, based on the brand the user choose, recommend the product of this product that suitable for them."
  },
  {
    step: 4,
    title: "Model Selection",
    text: "Allow user to choose between gemini-2.5 flash and gemini-3.0 flash preview."
  },
  {
    step: 5,
    title: "Detailed Specialized Analysis",
    text: "Add a specific card for the 'Eye Area' analysis within the Visual Breakdown section. Include its condition and severity, similar to other face zones."
  }
];

export const PromptModal: React.FC<PromptModalProps> = ({ onClose, language }) => {
  const t = getTranslation(language);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-white/10">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#252526]">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
               <Terminal size={20} />
             </div>
             <h2 className="text-white font-mono font-bold">{t.promptTitle}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white rounded-full hover:bg-white/5 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 font-mono">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-6">
            <p className="text-rose-400 text-xs mb-1 uppercase font-bold tracking-widest">System Role</p>
            <p className="text-white/80 text-sm leading-relaxed">
              World-class senior frontend engineer and AI specialist. Role: university-level Formal Methods course TA for logic explanations.
            </p>
          </div>

          {PROMPTS.map((p, idx) => (
            <div key={idx} className="relative pl-8 border-l border-white/10 animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="absolute left-[-5px] top-0 w-[9px] h-[9px] bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
              
              <div className="mb-2 flex items-center gap-2">
                <span className="text-rose-500 text-xs font-bold">REQ_00{p.step}</span>
                <span className="text-white/40 text-[10px]">—</span>
                <h3 className="text-white/90 text-sm font-bold">{p.title}</h3>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                <div className="flex gap-3">
                  <MessageSquare size={16} className="text-rose-400 shrink-0 mt-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <p className="text-white/60 text-sm leading-relaxed group-hover:text-white/80 transition-colors">
                    "{p.text}"
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white/30 text-[10px] uppercase tracking-widest">
              <History size={12} /> Instructions End
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#252526] border-t border-white/10 flex justify-end">
           <button 
             onClick={onClose}
             className="px-6 py-2 bg-rose-500 text-white rounded-lg font-bold text-sm hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
           >
             Close Console
           </button>
        </div>

      </div>
    </div>
  );
};
