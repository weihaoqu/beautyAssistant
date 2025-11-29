import React, { useState } from 'react';
import { X, ScanLine, CheckCircle2, AlertTriangle, AlertCircle, ShoppingCart, Clock, Beaker, Share2 } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { ProductShareModal } from './ProductShareModal';
import { analyzeProductSuitability } from '../services/geminiService';
import { ProductSuitability, Language } from '../types';
import { getTranslation } from '../utils/translations';

interface ProductScannerModalProps {
  userProfileSummary: string;
  onClose: () => void;
  language: Language;
}

export const ProductScannerModal: React.FC<ProductScannerModalProps> = ({ 
  userProfileSummary, 
  onClose, 
  language 
}) => {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'result'>('upload');
  const [productImage, setProductImage] = useState<string | null>(null);
  const [result, setResult] = useState<ProductSuitability | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const t = getTranslation(language);

  const handleImageSelected = async (base64: string) => {
    setProductImage(base64);
    setStep('analyzing');
    setError(null);

    try {
      const analysis = await analyzeProductSuitability(base64, userProfileSummary, language);
      setResult(analysis);
      setStep('result');
    } catch (err: any) {
      setError(err.message || t.errors.generic);
      setStep('upload');
    }
  };

  const getVerdictStyle = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes('excellent') || v.includes('good')) {
      return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 size={32} /> };
    }
    if (v.includes('caution') || v.includes('avoid') || v.includes('not')) {
      return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <AlertCircle size={32} /> };
    }
    return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: <AlertTriangle size={32} /> };
  };

  const handleReset = () => {
    setProductImage(null);
    setResult(null);
    setStep('upload');
  };

  return (
    <>
      {isShareModalOpen && result && productImage && (
        <ProductShareModal 
          result={result}
          productImage={productImage}
          onClose={() => setIsShareModalOpen(false)}
          language={language}
        />
      )}
      
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-white">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                 <ScanLine size={18} />
               </div>
               <h2 className="text-lg font-bold text-slate-800">{t.productCheck.title}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {step === 'upload' || step === 'analyzing' ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                 <ImageUploader 
                   onImageSelected={handleImageSelected} 
                   isLoading={step === 'analyzing'} 
                   language={language}
                   onError={(msg) => setError(msg)}
                   cameraFacingMode="environment"
                   customTexts={{
                     title: t.productCheck.uploadTitle,
                     desc: t.productCheck.uploadDesc,
                     button: t.productCheck.takePhoto,
                     loading: t.productCheck.analyzing
                   }}
                 />
              </div>
            ) : result && productImage ? (
              <div className="space-y-4 animate-fade-in-up">
                 
                 {/* Product Identity */}
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-start">
                    <div className="w-20 h-20 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                      <img src={productImage} alt="Product" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{result.brand}</span>
                      <h3 className="text-xl font-bold text-slate-800 leading-tight mb-1">{result.product_name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                             {t.productCheck.score}: {result.suitability_score}/100
                          </span>
                      </div>
                    </div>
                 </div>

                 {/* Verdict Card */}
                 <div className={`p-5 rounded-2xl border flex items-start gap-4 shadow-sm ${getVerdictStyle(result.verdict).bg} ${getVerdictStyle(result.verdict).border}`}>
                    <div className={getVerdictStyle(result.verdict).color}>
                       {getVerdictStyle(result.verdict).icon}
                    </div>
                    <div>
                       <h4 className={`font-bold text-lg mb-1 ${getVerdictStyle(result.verdict).color}`}>
                          {result.verdict}
                       </h4>
                       <p className="text-slate-700 leading-relaxed text-sm">
                          {result.reasoning}
                       </p>
                    </div>
                 </div>

                 {/* Buy Quantity & Usage Recommendation */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-2 mb-2 text-indigo-600">
                            <ShoppingCart size={18} />
                            <h4 className="font-bold text-sm uppercase">{t.productCheck.buyAdvice}</h4>
                        </div>
                        <p className="text-sm text-slate-700 font-medium">
                            {result.quantity_to_buy}
                        </p>
                    </div>
                    <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                        <div className="flex items-center gap-2 mb-2 text-teal-600">
                            <Clock size={18} />
                            <h4 className="font-bold text-sm uppercase">{t.productCheck.howToUse}</h4>
                        </div>
                        <p className="text-sm text-slate-700 font-medium">
                            {result.usage_instructions}
                        </p>
                    </div>
                 </div>

                 {/* Ingredient Analysis */}
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-3 text-slate-400">
                       <Beaker size={18} />
                       <h4 className="font-bold text-sm uppercase tracking-wide">{t.productCheck.ingredients}</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {result.ingredients_analysis}
                    </p>
                 </div>

                 <div className="flex gap-3">
                   <button 
                     onClick={handleReset}
                     className="flex-1 py-3 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                   >
                     {t.productCheck.scanAnother}
                   </button>
                   <button 
                     onClick={() => setIsShareModalOpen(true)}
                     className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                   >
                     <Share2 size={18} />
                     {t.productCheck.shareResult}
                   </button>
                 </div>

              </div>
            ) : null}

          </div>

        </div>
      </div>
    </>
  );
};