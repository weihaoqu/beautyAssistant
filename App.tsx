import React, { useState, useEffect } from 'react';
import { Sparkles, ScanFace, Download, History as HistoryIcon } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { AnalysisResults } from './components/AnalysisResults';
import { InstallPwaModal } from './components/InstallPwaModal';
import { HistoryModal } from './components/HistoryModal';
import { analyzeImage } from './services/geminiService';
import { saveScan } from './services/storageService';
import { AnalysisResult, StoredScan } from './types';

const App: React.FC = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  // History State
  const [showHistory, setShowHistory] = useState(false);

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
      const analysisData = await analyzeImage(base64);
      setResult(analysisData);
      
      // Auto-save to history
      saveScan(base64, analysisData).catch(err => console.error("Failed to save history:", err));
      
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

  return (
    <div className="min-h-screen pb-12">
      {showInstallModal && <InstallPwaModal onClose={() => setShowInstallModal(false)} isIOS={isIOS} />}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} onLoadScan={handleLoadScan} />}
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-500 cursor-pointer" onClick={handleReset}>
            <ScanFace size={28} />
            <span className="font-bold text-xl tracking-tight text-slate-800">Glow<span className="text-rose-500">AI</span></span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            {!isStandalone && (
              <button 
                onClick={handleInstallClick}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <Download size={16} />
                Install App
              </button>
            )}
            
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
              title="History"
            >
              <HistoryIcon size={20} />
              <span className="hidden sm:inline text-sm font-medium">History</span>
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
                New Analysis
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
                Discover your perfect <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-teal-500">care routine</span>
              </h1>
              <p className="text-lg text-slate-500 mb-8">
                Upload a photo to get an instant analysis of your skin and hair health, along with personalized product recommendations.
              </p>
            </div>
            
            <ImageUploader 
              onImageSelected={handleImageSelected} 
              isLoading={isLoading} 
            />

            {/* Prominent Install Button for Main Page */}
            {!isStandalone && (
              <div className="mt-8 animate-fade-in-up">
                <button 
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-medium hover:bg-slate-50 hover:border-rose-200 hover:text-rose-600 transition-all shadow-sm group"
                >
                  <Download size={18} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
                  Install App for Better Experience
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
                <h4 className="font-bold text-slate-800 mb-2">Analyze</h4>
                <p className="text-sm">Advanced computer vision identifies skin type and concerns.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Recommend</h4>
                <p className="text-sm">Get tailored suggestions for serums, creams, and haircare.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Improve</h4>
                <p className="text-sm">Track your glow up journey with consistent insights.</p>
              </div>
            </div>
          </div>
        ) : (
          <AnalysisResults result={result} userImage={userImage} onReset={handleReset} />
        )}
      </main>
    </div>
  );
};

export default App;
