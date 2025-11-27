import React, { useState, useEffect } from 'react';
import { X, Loader2, Info, BookOpen, CheckCircle, Beaker, HelpCircle } from 'lucide-react';
import { ConcernExplanation } from '../types';
import { getConcernExplanation } from '../services/geminiService';

interface ConcernDetailModalProps {
  concern: string;
  contextSummary: string;
  onClose: () => void;
}

export const ConcernDetailModal: React.FC<ConcernDetailModalProps> = ({ concern, contextSummary, onClose }) => {
  const [data, setData] = useState<ConcernExplanation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getConcernExplanation(concern, contextSummary);
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [concern, contextSummary]);

  return (
    <div className="fixed inset-0 z-[70] flex items-start md:items-center justify-center p-4 pt-20 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative max-h-[80vh] md:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
               <Info size={24} />
             </div>
             <div>
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Understanding</span>
                <h2 className="text-xl font-bold text-slate-800 leading-tight">{concern}</h2>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
               <Loader2 size={32} className="animate-spin text-indigo-500" />
               <p className="text-sm font-medium">Consulting knowledge base...</p>
             </div>
          ) : data ? (
            <>
              {/* Definition */}
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-slate-800 font-semibold">
                    <BookOpen size={18} className="text-indigo-500" />
                    <h3>What is it?</h3>
                 </div>
                 <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                   {data.what_is_it}
                 </p>
              </div>

              {/* Causes */}
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-slate-800 font-semibold">
                    <HelpCircle size={18} className="text-indigo-500" />
                    <h3>Why is it happening?</h3>
                 </div>
                 <p className="text-slate-600 text-sm leading-relaxed">
                   {data.why_it_occurs}
                 </p>
              </div>

              {/* Ingredients */}
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-slate-800 font-semibold">
                    <Beaker size={18} className="text-indigo-500" />
                    <h3>Helpful Ingredients</h3>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {data.ingredients_to_look_for.map((ing, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full border border-indigo-100">
                        {ing}
                      </span>
                    ))}
                 </div>
              </div>

              {/* Tips */}
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-slate-800 font-semibold">
                    <CheckCircle size={18} className="text-indigo-500" />
                    <h3>Management Tips</h3>
                 </div>
                 <ul className="space-y-2">
                    {data.management_tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                 </ul>
              </div>
            </>
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
