
import React from 'react';
import { ImageUploader } from './ImageUploader';
import { User, Swords, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Language, ModelType } from '../types';
import { getTranslation } from '../utils/translations';

interface VersusArenaProps {
  p1Image: string | null;
  p2Image: string | null;
  onP1Selected: (base64: string) => void;
  onP2Selected: (base64: string) => void;
  onStartBattle: () => void;
  isP1Loading: boolean;
  isP2Loading: boolean;
  isBattleLoading: boolean;
  language: Language;
}

export const VersusArena: React.FC<VersusArenaProps> = ({
  p1Image, p2Image, onP1Selected, onP2Selected, onStartBattle,
  isP1Loading, isP2Loading, isBattleLoading, language
}) => {
  const t = getTranslation(language);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 animate-fade-in-up">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic flex items-center justify-center gap-3">
          <span className="text-rose-500">Glow</span> 
          <span className="bg-slate-800 text-white px-3 py-1 rounded-sm rotate-[-2deg]">Battle</span>
        </h2>
        <p className="text-slate-500 mt-3 font-medium">{t.battle.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative items-center">
        {/* VS Badge */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 bg-slate-800 text-white font-black text-2xl items-center justify-center rounded-full border-4 border-white shadow-2xl animate-pulse">
           {t.battle.versus}
        </div>

        {/* Player 1 Slot */}
        <div className={`p-6 rounded-3xl border-2 transition-all ${p1Image ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${p1Image ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <User size={24} />
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800 uppercase italic tracking-wider">{t.player1}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p1Image ? t.battle.ready : t.battle.waiting}</p>
            </div>
          </div>
          
          <ImageUploader 
            onImageSelected={onP1Selected} 
            isLoading={isP1Loading} 
            language={language}
            onError={() => {}} 
          />
        </div>

        {/* Player 2 Slot */}
        <div className={`p-6 rounded-3xl border-2 transition-all ${p2Image ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${p2Image ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <User size={24} />
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800 uppercase italic tracking-wider">{t.player2}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p2Image ? t.battle.ready : t.battle.waiting}</p>
            </div>
          </div>
          
          <ImageUploader 
            onImageSelected={onP2Selected} 
            isLoading={isP2Loading} 
            language={language}
            onError={() => {}} 
          />
        </div>
      </div>

      <div className="mt-12 flex justify-center pb-10">
        <button
          onClick={onStartBattle}
          disabled={!p1Image || !p2Image || isBattleLoading}
          className={`
            relative group overflow-hidden px-10 py-5 rounded-2xl font-black text-xl uppercase italic tracking-tighter transition-all shadow-2xl
            ${(!p1Image || !p2Image) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-900 active:scale-95'}
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-center gap-3">
             {isBattleLoading ? (
               <Loader2 className="animate-spin" size={24} />
             ) : (
               <Swords size={24} className="group-hover:rotate-12 transition-transform" />
             )}
             {isBattleLoading ? t.battle.generatingReport : t.battle.startBattle}
          </div>
        </button>
      </div>
    </div>
  );
};
