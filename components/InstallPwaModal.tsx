import React from 'react';
import { X, Share, PlusSquare, Smartphone, MoreVertical, Menu } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';

interface InstallPwaModalProps {
  onClose: () => void;
  isIOS: boolean;
  language: Language;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ onClose, isIOS, language }) => {
  const t = getTranslation(language);

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-white">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Smartphone className="text-rose-500" size={20} />
            {t.installModal.title}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-black/5">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-600 text-center">
            {t.installModal.desc}
          </p>

          {isIOS ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Share size={20} />
                </div>
                <div className="text-sm text-slate-700">
                  {t.installModal.iosShare}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <PlusSquare size={20} />
                </div>
                <div className="text-sm text-slate-700">
                  {t.installModal.iosAdd}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <MoreVertical size={20} />
                </div>
                <div className="text-sm text-slate-700">
                  {t.installModal.androidMenu}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <PlusSquare size={20} />
                </div>
                <div className="text-sm text-slate-700">
                  {t.installModal.androidAdd}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 transition-colors"
          >
            {t.installModal.gotIt}
          </button>
        </div>
      </div>
    </div>
  );
};