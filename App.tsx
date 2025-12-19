
import React, { useState, useEffect } from 'react';
import { Sparkles, ScanFace, Download, History as HistoryIcon, Globe, TrendingUp, ScanLine, Cpu, Terminal } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { AnalysisResults } from './components/AnalysisResults';
import { InstallPwaModal } from './components/InstallPwaModal';
import { HistoryModal } from './components/HistoryModal';
import { ProgressTracker } from './components/ProgressTracker';
import { LanguageSelector } from './components/LanguageSelector';
import { ProductScannerModal } from './components/ProductScannerModal';
import { PromptModal } from './components/PromptModal';
import { analyzeImage } from './services/geminiService';
import { saveScan, getHistory } from './services/storageService';
import { AnalysisResult, StoredScan, Language, ModelType } from './types';
import { getTranslation } from './utils/translations';

const App: React.FC = () => {
  // Initialize language from localStorage or default to 'en'
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('glowai_lang');
    return (saved === 'en' || saved === 'zh') ? saved : 'en';
  });

  // Initialize model from localStorage or default
  const [model, setModel] = useState<ModelType>(() => {
    const saved = localStorage.getItem('glowai_model');
    return (saved === 'gemini-2.5-flash' || saved === 'gemini-3-flash-preview') ? saved : 'gemini-2.5-flash';
  });

  // Determine if the user has explicitly selected a language before
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(() => {
    return !!localStorage.getItem('glowai_lang');
  });

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  // Modals & Features State
  const [showHistory, setShowHistory] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [isProductScannerOpen, setIsProductScannerOpen] = useState(false);

  // Context for Scanner
  const [latestProfile, setLatestProfile] = useState<string>("");

  const t = getTranslation(language);

  useEffect(() => {
    // Check if running on iOS
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    // Capture install prompt for Android/Chrome
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Fetch latest history on mount for context
  useEffect(() => {
    getHistory().then(scans => {
      if (scans.length > 0) {
        const latest = scans[0].result;
        const summary = `Skin Type: ${latest.skin_analysis.skin_type}, Concerns: ${latest.skin_analysis.concerns.join(', ')}.`;
        setLatestProfile(summary);
      }
    });
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    } else {
      // Fallback for iOS or manual install instructions
      setShowInstallModal(true);
    }
  };

  const handleImageSelected = async (base64: string) => {
    setIsLoading(true);
    setError(null);
    setUserImage(base64);
    try {
      const analysisData = await analyzeImage(base64, language, model);
      setResult(analysisData);
      
      // Auto-save to history
      saveScan(base64, analysisData).then(() => {
        // Update local context immediately after new scan
        setLatestProfile(`Skin Type: ${analysisData.skin_analysis.skin_type}, Concerns: ${analysisData.skin_analysis.concerns.join(', ')}.`);
      }).catch(err => console.error("Failed to save history:", err));
      
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setUserImage(null);
    setError(null);
  };

  const handleLoadScan = (scan: StoredScan) => {
    setResult(scan.result);
    setUserImage(scan.image);
    setError(null);
    setShowHistory(false);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    localStorage.setItem('glowai_lang', newLang);
  };

  const toggleModel = () => {
    const newModel = model === 'gemini-2.5-flash' ? 'gemini-3-flash-preview' : 'gemini-2.5-flash';
    setModel(newModel);
    localStorage.setItem('glowai_model', newModel);
  };

  const handleInitialLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setHasSelectedLanguage(true);
    localStorage.setItem('glowai_lang', lang);
  };

  if (!hasSelectedLanguage) {
    return <LanguageSelector onSelect={handleInitialLanguageSelect} />;
  }

  // Determine current context for scanner
  const currentContext = result 
    ? `Skin Type: ${result.skin_analysis.skin_type}, Concerns: ${result.skin_analysis.concerns.join(', ')}.`
    : (latestProfile || "General Skin Analysis - No specific user profile loaded.");

  return (
    <div className="min-h-screen pb-12 animate-fade-in relative">
      {showInstallModal && <InstallPwaModal onClose={() => setShowInstallModal(false)} isIOS={isIOS} language={language} />}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} onLoadScan={handleLoadScan} language={language} />}
      {showProgress && <ProgressTracker onClose={() => setShowProgress(false)} language={language} />}
      {showPromptModal && <PromptModal onClose={() => setShowPromptModal(false)} language={language} />}
      {isProductScannerOpen && (
        <ProductScannerModal 
          userProfileSummary={currentContext}
          onClose={() => setIsProductScannerOpen(false)}
          language={language}
          model={model}
        />
      )}
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-500 cursor-pointer" onClick={handleReset}>
            <ScanFace size={28} />
            <span className="font-bold text-xl tracking-tight text-slate-800">{t.appTitle}<span className="text-rose-500">AI</span></span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
             {/* New View Prompt Button */}
             <button
              onClick={() => setShowPromptModal(true)}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
              title={t.viewPrompt}
            >
              <Terminal size={20} />
              <span className="hidden lg:inline text-xs font-mono font-bold uppercase tracking-widest">{t.viewPrompt}</span>
            </button>

             <button
              onClick={toggleModel}
              className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
              title="Switch Model"
            >
              <Cpu size={20} />
              <span className="hidden md:inline text-xs font-mono font-medium">{model === 'gemini-2.5-flash' ? 'v2.5' : 'v3.0'}</span>
            </button>

             <button
              onClick={toggleLanguage}
              className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
              title="Switch Language"
            >
              <Globe size={20} />
              <span className="text-sm font-medium uppercase">{language}</span>
            </button>

            <button
              onClick={() => setShowProgress(true)}
              className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
              title={t.progress.title}
            >
               <TrendingUp size={20} />
               <span className="hidden sm:inline text-sm font-medium">{t.progress.title}</span>
            </button>

            {!isStandalone && (
              <button 
                onClick={handleInstallClick}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <Download size={16} />
                {t.install}
              </button>
            )}
            
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
              title={t.history.title}
            >
              <HistoryIcon size={20} />
              <span className="hidden sm:inline text-sm font-medium">{t.history.title}</span>
            </button>

            {/* Mobile Icon Button for Install */}
            {!isStandalone && (
              <button 
                onClick={handleInstallClick}
                className="sm:hidden p-2 text-slate-600 hover:text-rose-500 transition-colors"
                aria-label="Install App"
              >
                <Download size={20} />
              </button>
            )}

            {result && (
              <button 
                onClick={handleReset}
                className="text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors ml-1"
              >
                {t.newAnalysis}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pt-12">
        {!result ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
            <div className="text-center mb-10 max-w-2xl">
              <div className="inline-flex items-center justify-center p-2 bg-rose-50 text-rose-600 rounded-full mb-4 px-4 text-sm font-semibold border border-rose-100">
                <Sparkles size={16} className="mr-2" />
                AI-Powered Beauty Consultant
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 leading-tight">
                {t.heroTitle1} <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-teal-500">{t.heroTitle2}</span>
              </h1>
              <p className="text-lg text-slate-500 mb-8">
                {t.heroSubtitle}
              </p>
            </div>
            
            <ImageUploader 
              onImageSelected={handleImageSelected} 
              isLoading={isLoading} 
              language={language}
              onError={setError}
            />

            {/* Prominent Install Button for Main Page */}
            {!isStandalone && (
              <div className="mt-8 animate-fade-in-up">
                <button 
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-medium hover:bg-slate-50 hover:border-rose-200 hover:text-rose-600 transition-all shadow-sm group"
                >
                  <Download size={18} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
                  {t.install}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg max-w-md text-center">
                {error}
              </div>
            )}
            
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center opacity-60">
              <div>
                <h4 className="font-bold text-slate-800 mb-2">{t.steps.analyze.title}</h4>
                <p className="text-sm">{t.steps.analyze.desc}</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-2">{t.steps.recommend.title}</h4>
                <p className="text-sm">{t.steps.recommend.desc}</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-2">{t.steps.improve.title}</h4>
                <p className="text-sm">{t.steps.improve.desc}</p>
              </div>
            </div>
          </div>
        ) : (
          <AnalysisResults 
             result={result} 
             userImage={userImage} 
             onReset={handleReset} 
             language={language} 
             model={model}
             onOpenProductScanner={() => setIsProductScannerOpen(true)}
          />
        )}
      </main>

      {/* Floating Action Button for Product Scanner (Visible Everywhere) */}
      <button
        onClick={() => setIsProductScannerOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-slate-800 text-white p-4 rounded-full shadow-2xl hover:bg-slate-900 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group border border-slate-700/50"
        title={t.results.checkProduct}
      >
        <ScanLine size={24} className="group-hover:text-rose-400 transition-colors" />
        <span className="font-bold text-sm pr-1 hidden sm:inline">{t.productCheck.title}</span>
      </button>

    </div>
  );
};

export default App;
