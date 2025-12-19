
import React, { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, Fingerprint, CheckCircle2, Beaker, Droplet } from 'lucide-react';
import { ConcernExplanation, Language, ModelType } from '../types';
import { getConcernExplanation } from '../services/geminiService';
import { getTranslation } from '../utils/translations';

interface ConcernDetailModalProps {
  concern: string;
  contextSummary: string;
  onClose: () => void;
  language: Language;
  model: ModelType;
}

export const ConcernDetailModal: React.FC<ConcernDetailModalProps> = ({ concern, contextSummary, onClose, language, model }) => {
  const [data, setData] = useState<ConcernExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const t = getTranslation(language);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getConcernExplanation(concern, contextSummary, language, model);
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [concern, contextSummary, language, model]);

  return (
    <div className="fixed inset-0 z-[70] flex items-start md:items-center justify-center p-4 pt-20 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col relative max-h-[85vh] md:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between bg-white border-b border-slate-100 z-10 sticky top-0">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
               <Sparkles size={16} />
             </div>
             <h2 className="text-lg font-bold text-slate-800 tracking-tight">{concern}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
               <div className="relative">
                 <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full"></div>
                 <Loader2 size={40} className="animate-spin text-indigo-500 relative z-10" />
               </div>
               <p className="text-sm font-medium animate-pulse">{t.modal.infographicLoading}</p>
             </div>
          ) : data ? (
            <div className="space-y-4 animate-fade-in-up">
              
              {/* Row 1: The Diagnosis (Visual Hero) */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 -m-8 opacity-10 transform rotate-12 group-hover:rotate-45 transition-transform duration-700">
                  <Sparkles size={160} />
                </div>
                <div className="relative z-10">
                   <div className="inline-block px-2 py-1 bg-white/20 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-widest mb-3">
                     {t.modal.whatIsIt}
                   </div>
                   <p className="text-xl md:text-2xl font-medium leading-tight text-indigo-50">"{data.what_is_it}"</p>
                </div>
              </div>

              {/* Row 2: The Cause */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl shrink-0">
                   <Fingerprint size={28} strokeWidth={1.5} />
                </div>
                <div>
                   <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{t.modal.rootCause}</h3>
                   <p className="text-slate-700 font-medium leading-relaxed">{data.why_it_occurs}</p>
                </div>
              </div>

              {/* Row 3: Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 
                 {/* Action Plan */}
                 <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4 text-teal-600 border-b border-slate-50 pb-2">
                       <CheckCircle2 size={18} />
                       <h3 className="font-bold text-sm uppercase tracking-wide">{t.modal.dailyFixes}</h3>
                    </div>
                    <div className="space-y-3 flex-grow">
                       {data.management_tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-3 group">
                             <div className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 group-hover:bg-teal-100 transition-colors">
                                {i + 1}
                             </div>
                             <span className="text-slate-600 text-sm font-medium leading-tight">{tip}</span>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Ingredients */}
                 <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4 text-rose-500 border-b border-slate-50 pb-2">
                       <Beaker size={18} />
                       <h3 className="font-bold text-sm uppercase tracking-wide">{t.modal.powerIngredients}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 content-start">
                       {data.ingredients_to_look_for.map((ing, i) => (
                          <div key={i} className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:bg-rose-100 transition-colors cursor-default">
                             <Droplet size={16} className="text-rose-400 mb-1.5" strokeWidth={2.5} />
                             <span className="text-xs font-bold text-slate-700 leading-tight">{ing}</span>
                          </div>
                       ))}
                    </div>
                 </div>

              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p>Could not load details. Please try again.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
