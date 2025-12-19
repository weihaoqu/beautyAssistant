

import React, { useState, useEffect } from 'react';
import { Sparkles, ScanFace, Download, History as HistoryIcon, Globe, TrendingUp, ScanLine, Cpu, Terminal, Swords, User, AlertCircle } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { AnalysisResults } from './components/AnalysisResults';
import { VersusArena } from './components/VersusArena';
import { VersusResults } from './components/VersusResults';
import { InstallPwaModal } from './components/InstallPwaModal';
import { HistoryModal } from './components/HistoryModal';
import { ProgressTracker } from './components/ProgressTracker';
import { LanguageSelector } from './components/LanguageSelector';
import { ProductScannerModal } from './components/ProductScannerModal';
import { PromptModal } from './components/PromptModal';
import { analyzeImage, generateVersusReport } from './services/geminiService';
import { saveScan, getHistory } from './services/storageService';
import { AnalysisResult, StoredScan, Language, ModelType, AppMode, VersusReport } from './types';
import { getTranslation } from './utils/translations';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('glowai_lang');
    return (saved === 'en' || saved === 'zh') ? saved : 'en';
  });

  // Updated state initialization to handle valid ModelType identifiers
  const [model, setModel] = useState<ModelType>(() => {
    const saved = localStorage.getItem('glowai_model');
    return (saved === 'gemini-flash-latest' || saved === 'gemini-3-flash-preview') ? (saved as ModelType) : 'gemini-3-flash-preview';
  });

  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(() => !!localStorage.getItem('glowai_lang'));
  const [mode, setMode] = useState<AppMode>('solo');

  // Solo State
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Versus State
  const [p1Image, setP1Image] = useState<string | null>(null);
  const [p2Image, setP2Image] = useState<string | null>(null);
  const [p1Result, setP1Result] = useState<AnalysisResult | null>(null);
  const [p2Result, setP2Result] = useState<AnalysisResult | null>(null);
  const [versusReport, setVersusReport] = useState<VersusReport | null>(null);
  const [isP1Loading, setIsP1Loading] = useState(false);
  const [isP2Loading, setIsP2Loading] = useState(false);
  const [isBattleLoading, setIsBattleLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Modals & Features State
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [isProductScannerOpen, setIsProductScannerOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [latestProfile, setLatestProfile] = useState<string>("");

  const t = getTranslation(language);

  useEffect(() => {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setIsIOS(ios);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);
    getHistory().then(scans => {
      if (scans.length > 0) {
        const latest = scans[0].result;
        setLatestProfile(`Skin Type: ${latest.skin_analysis.skin_type}, Concerns: ${latest.skin_analysis.concerns.join(', ')}.`);
      }
    });
  }, []);

  const handleImageSelected = async (base64: string) => {
    setIsLoading(true);
    setError(null);
    setUserImage(base64);
    try {
      const data = await analyzeImage(base64, language, model);
      setResult(data);
      saveScan(base64, data);
      setLatestProfile(`Skin Type: ${data.skin_analysis.skin_type}, Concerns: ${data.skin_analysis.concerns.join(', ')}.`);
    } catch (err: any) {
      setError(err.message || "Failed to analyze.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleP1Selected = async (base64: string) => {
    setIsP1Loading(true);
    setP1Image(base64);
    try {
      const data = await analyzeImage(base64, language, model);
      setP1Result(data);
    } catch (err) {
      setError("P1 analysis failed.");
    } finally {
      setIsP1Loading(false);
    }
  };

  const handleP2Selected = async (base64: string) => {
    setIsP2Loading(true);
    setP2Image(base64);
    try {
      const data = await analyzeImage(base64, language, model);
      setP2Result(data);
    } catch (err) {
      setError("P2 analysis failed.");
    } finally {
      setIsP2Loading(false);
    }
  };

  const handleStartBattle = async () => {
    if (!p1Result || !p2Result) return;
    setIsBattleLoading(true);
    try {
      const report = await generateVersusReport(p1Result, p2Result, language, model);
      setVersusReport(report);
    } catch (err) {
      setError("Battle comparison failed.");
    } finally {
      setIsBattleLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setUserImage(null);
    setP1Image(null);
    setP2Image(null);
    setP1Result(null);
    setP2Result(null);
    setVersusReport(null);
    setError(null);
  };

  const toggleMode = () => {
    handleReset();
    setMode(prev => prev === 'solo' ? 'versus' : 'solo');
  };

  if (!hasSelectedLanguage) {
    return <LanguageSelector onSelect={(l) => { setLanguage(l); setHasSelectedLanguage(true); localStorage.setItem('glowai_lang', l); }} />;
  }

  return (
    <div className="min-h-screen pb-12 animate-fade-in relative bg-white selection:bg-rose-200">
      {/* Modals Integrated */}
      {showInstallModal && <InstallPwaModal onClose={() => setShowInstallModal(false)} isIOS={isIOS} language={language} />}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} onLoadScan={(s) => { setResult(s.result); setUserImage(s.image); setShowHistory(false); setMode('solo'); }} language={language} />}
      {showProgress && <ProgressTracker onClose={() => setShowProgress(false)} language={language} />}
      {showPromptModal && <PromptModal onClose={() => setShowPromptModal(false)} language={language} />}
      {isProductScannerOpen && <ProductScannerModal userProfileSummary={result ? `Skin: ${result.skin_analysis.skin_type}` : latestProfile} onClose={() => setIsProductScannerOpen(false)} language={language} model={model} />}

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-500 cursor-pointer group" onClick={handleReset}>
            <div className="p-1.5 bg-rose-50 rounded-lg group-hover:bg-rose-500 group-hover:text-white transition-all">
               <ScanFace size={24} />
            </div>
            <span className="font-black text-xl tracking-tighter text-slate-800 uppercase italic">Glow<span className="text-rose-500">AI</span></span>
          </div>
          
          <div className="flex items-center gap-1 md:gap-3">
            {/* Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center mr-2 shadow-inner">
               <button 
                 onClick={() => mode !== 'solo' && toggleMode()}
                 className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${mode === 'solo' ? 'bg-white shadow-sm text-rose-500' : 'text-slate-500 hover:text-slate-800'}`}
               >
                 <User size={14} /> {t.soloMode}
               </button>
               <button 
                 onClick={() => mode !== 'versus' && toggleMode()}
                 className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${mode === 'versus' ? 'bg-white shadow-sm text-indigo-500' : 'text-slate-500 hover:text-slate-800'}`}
               >
                 <Swords size={14} /> {t.versusMode}
               </button>
            </div>

            <button onClick={() => setShowPromptModal(true)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title={t.viewPrompt}><Terminal size={20} /></button>
            {/* Updated model toggle to switch between flash-latest and 3-flash-preview */}
            <button onClick={() => setModel(m => m === 'gemini-flash-latest' ? 'gemini-3-flash-preview' : 'gemini-flash-latest')} className="p-2 text-slate-400 hover:text-rose-500 transition-colors hidden sm:flex items-center gap-1"><Cpu size={18} /><span className="text-[10px] font-mono font-bold uppercase tracking-widest">{model === 'gemini-flash-latest' ? 'FLASH' : '3.0'}</span></button>
            <button onClick={() => setShowProgress(true)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><TrendingUp size={20} /></button>
            <button onClick={() => setShowHistory(true)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><HistoryIcon size={20} /></button>
          </div>
        </div>
      </header>

      <main className="pt-12">
        {mode === 'solo' ? (
          !result ? (
            <div className="flex flex-col items-center px-4">
              <div className="text-center mb-10 max-w-2xl animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full font-bold text-xs uppercase tracking-widest mb-6 border border-rose-100">
                  <Sparkles size={14} /> AI Beauty Intelligence
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-slate-800 mb-6 leading-[0.9] tracking-tighter uppercase italic">
                  {t.heroTitle1} <br/>
                  <span className="text-rose-500">{t.heroTitle2}</span>
                </h1>
                <p className="text-lg text-slate-400 font-medium">{t.heroSubtitle}</p>
              </div>
              <ImageUploader onImageSelected={handleImageSelected} isLoading={isLoading} language={language} onError={setError} />
              {error && <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm font-bold flex items-center gap-2"><AlertCircle size={18} />{error}</div>}
            </div>
          ) : (
            <AnalysisResults result={result} userImage={userImage} onReset={handleReset} language={language} model={model} onOpenProductScanner={() => setIsProductScannerOpen(true)} />
          )
        ) : (
          !versusReport ? (
            <VersusArena 
               p1Image={p1Image} p2Image={p2Image} onP1Selected={handleP1Selected} onP2Selected={handleP2Selected} onStartBattle={handleStartBattle}
               isP1Loading={isP1Loading} isP2Loading={isP2Loading} isBattleLoading={isBattleLoading} language={language} 
            />
          ) : (
            p1Result && p2Result && <VersusResults report={versusReport} p1Image={p1Image} p2Image={p2Image} p1Result={p1Result} p2Result={p2Result} onReset={handleReset} language={language} />
          )
        )}
      </main>

      <button
        onClick={() => setIsProductScannerOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-slate-800 text-white p-4 rounded-full shadow-2xl hover:bg-slate-900 transition-all hover:scale-110 active:scale-95 flex items-center justify-center gap-2 group border border-slate-700"
      >
        <ScanLine size={24} className="group-hover:text-rose-400 transition-colors" />
        <span className="font-black text-xs uppercase tracking-widest pr-1 hidden sm:inline">{t.productCheck.title}</span>
      </button>
    </div>
  );
};

export default App;