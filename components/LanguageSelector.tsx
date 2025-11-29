import React from 'react';
import { Sparkles } from 'lucide-react';
import { Language } from '../types';

interface LanguageSelectorProps {
  onSelect: (lang: Language) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-rose-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 animate-scale-in text-center">
        
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Sparkles className="text-rose-500" size={40} />
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">
          Glow<span className="text-rose-500">AI</span>
        </h1>
        <p className="text-slate-500 mb-8">Your Personal AI Beauty Consultant</p>

        <div className="space-y-4">
          <button
            onClick={() => onSelect('en')}
            className="w-full group relative flex items-center p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-rose-200 hover:shadow-lg transition-all duration-300 text-left"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-2xl mr-4 group-hover:scale-110 transition-transform shadow-sm">
              🇺🇸
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">English</h3>
              <p className="text-slate-400 text-sm">Continue in English</p>
            </div>
            <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500">
              <Sparkles size={20} />
            </div>
          </button>

          <button
            onClick={() => onSelect('zh')}
            className="w-full group relative flex items-center p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-teal-200 hover:shadow-lg transition-all duration-300 text-left"
          >
            <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center text-2xl mr-4 group-hover:scale-110 transition-transform shadow-sm">
              🇨🇳
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">简体中文</h3>
              <p className="text-slate-400 text-sm">使用中文继续</p>
            </div>
            <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500">
              <Sparkles size={20} />
            </div>
          </button>
        </div>
        
        <div className="mt-8 text-xs text-slate-400">
          Select your preferred language to start
        </div>

      </div>
    </div>
  );
};