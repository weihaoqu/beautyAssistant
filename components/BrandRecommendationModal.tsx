
import React, { useState } from 'react';
import { X, Trophy, Award, Medal, Loader2, ExternalLink, ShoppingBag, Info, Search, Sparkles, Clock, Beaker, CheckCircle2 } from 'lucide-react';
import { SpecificProduct, Language, ModelType } from '../types';
import { getBrandRecommendations } from '../services/geminiService';
import { getTranslation } from '../utils/translations';

interface BrandRecommendationModalProps {
  contextSummary: string;
  onClose: () => void;
  language: Language;
  model: ModelType;
}

const BRANDS = [
  'Lancôme', 'La Mer', 'Estée Lauder', 'Kiehl\'s', 'Clinique', 
  'Origins', 'La Prairie', 'The Ordinary', 'SK-II', 'Helena Rubinstein',
  'Shiseido', 'Aveda', 'CeraVe', 'La Roche-Posay'
];

// Reusing a similar card design to ProductDetailModal for consistency
const BrandProductCard: React.FC<{ item: SpecificProduct; index: number; t: any }> = ({ item, index, t }) => {
  const [imgError, setImgError] = useState(false);
  const [showReason, setShowReason] = useState(false);

  const getTierIcon = (tier: string) => {
    const normalizedTier = tier.toLowerCase();
    switch (normalizedTier) {
      case 'gold': return <div className="p-2.5 bg-yellow-100 rounded-full border border-yellow-200 text-yellow-600"><Trophy size={20} /></div>;
      case 'silver': return <div className="p-2.5 bg-slate-100 rounded-full border border-slate-200 text-slate-500"><Award size={20} /></div>;
      case 'bronze': return <div className="p-2.5 bg-orange-100 rounded-full border border-orange-200 text-orange-700"><Medal size={20} /></div>;
      default: return <Award className="text-slate-400" size={20} />;
    }
  };

  const getTierColor = (tier: string) => {
    const normalizedTier = tier.toLowerCase();
    switch (normalizedTier) {
      case 'gold': return 'border-yellow-200 bg-gradient-to-br from-yellow-50/50 to-white';
      case 'silver': return 'border-slate-200 bg-gradient-to-br from-slate-50/50 to-white';
      case 'bronze': return 'border-orange-200 bg-gradient-to-br from-orange-50/50 to-white';
      default: return 'border-slate-100';
    }
  };

  return (
    <div className={`border rounded-xl p-5 ${getTierColor(item.tier)} transition-all duration-300 hover:shadow-xl hover:border-rose-300 animate-scale-in`} style={{ animationDelay: `${index * 150}ms` }}>
      <div className="flex gap-4 items-start mb-4">
        {getTierIcon(item.tier)}
        <div className="flex-grow">
          <div className="flex justify-between items-start">
             <div>
               <span className="text-xs font-bold uppercase opacity-70 mb-1 block">{item.tier === 'Gold' ? 'Top Pick' : item.tier === 'Silver' ? 'Recommended' : 'Good Value'}</span>
               <h3 className="text-lg font-bold text-slate-800 leading-tight flex items-center gap-2">
                 {item.product_name}
                 <div className="relative inline-flex items-center">
                    <button
                      type="button"
                      onMouseEnter={() => setShowReason(true)}
                      onMouseLeave={() => setShowReason(false)}
                      onClick={(e) => { e.stopPropagation(); setShowReason(!showReason); }}
                      className="text-slate-400 hover:text-rose-500 transition-colors focus:outline-none"
                    >
                      <Info size={16} />
                    </button>
                    {showReason && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-20 pointer-events-none">
                        <p>{item.reason}</p>
                      </div>
                    )}
                 </div>
               </h3>
             </div>
             <span className="inline-block bg-white/60 px-2 py-1 rounded text-sm font-semibold text-slate-700 border border-black/5 whitespace-nowrap">
                {item.price_estimate}
             </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
         <div className="w-20 h-20 bg-white rounded-lg border border-slate-100 shadow-sm flex-shrink-0 overflow-hidden flex items-center justify-center relative">
            {item.image_url && !imgError ? (
              <img src={item.image_url} alt={item.product_name} className="w-full h-full object-contain p-2" onError={() => setImgError(true)} />
            ) : (
              <ShoppingBag size={24} className="opacity-30" />
            )}
         </div>
         <div className="flex-grow">
            <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-3">
              "{item.reason}"
            </p>
         </div>
      </div>

      <div className="bg-white/60 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 border border-black/5">
         <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">
              <Beaker size={14} /> {t.results.keyIngredients}
            </div>
            <div className="flex flex-wrap gap-1">
              {item.key_ingredients.slice(0,3).map((ing, i) => (
                 <span key={i} className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">{ing}</span>
              ))}
            </div>
         </div>
         <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">
              <Clock size={14} /> {t.modal.usage}
            </div>
            <p className="text-xs text-slate-700 font-medium">{item.usage_frequency}</p>
         </div>
      </div>

      <div className="mt-4 flex justify-end">
         {item.product_link && (
            <a href={item.product_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-900 transition-all shadow-md hover:shadow-lg transform active:scale-95">
              {t.modal.findOnline} <ExternalLink size={16} />
            </a>
          )}
      </div>
    </div>
  );
};

export const BrandRecommendationModal: React.FC<BrandRecommendationModalProps> = ({ contextSummary, onClose, language, model }) => {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [customBrand, setCustomBrand] = useState('');
  const [products, setProducts] = useState<SpecificProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const t = getTranslation(language);

  const handleBrandSelect = async (brand: string) => {
    setSelectedBrand(brand);
    setLoading(true);
    try {
      const recs = await getBrandRecommendations(brand, contextSummary, language, model);
      setProducts(recs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customBrand.trim()) {
      handleBrandSelect(customBrand);
    }
  };

  const handleReset = () => {
    setSelectedBrand(null);
    setProducts([]);
    setCustomBrand('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-white">
          <div>
             <span className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-1 block">
               {t.brandPicks.title}
             </span>
             <h2 className="text-2xl font-bold text-slate-800">
               {selectedBrand ? selectedBrand : t.brandPicks.selectBrand}
             </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedBrand ? (
            <div className="animate-fade-in">
              <p className="text-slate-500 mb-6 text-center max-w-sm mx-auto">
                {t.brandPicks.desc}
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {BRANDS.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => handleBrandSelect(brand)}
                    className="p-3 border border-slate-200 rounded-xl hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700 transition-all font-medium text-slate-600 text-sm shadow-sm"
                  >
                    {brand}
                  </button>
                ))}
              </div>

              <div className="relative border-t border-slate-100 pt-6">
                 <form onSubmit={handleCustomSubmit} className="flex gap-2">
                    <div className="relative flex-grow">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input 
                         type="text" 
                         value={customBrand}
                         onChange={(e) => setCustomBrand(e.target.value)}
                         className="w-full pl-9 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                         placeholder={t.brandPicks.customPlaceholder}
                       />
                    </div>
                    <button 
                      type="submit"
                      disabled={!customBrand.trim()}
                      className="px-5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors disabled:opacity-50"
                    >
                      {t.brandPicks.start}
                    </button>
                 </form>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
               {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-fade-in">
                    <div className="relative mb-6">
                       <div className="absolute inset-0 bg-rose-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                       <Loader2 size={48} className="animate-spin text-rose-500 relative z-10" />
                    </div>
                    <p className="text-lg font-medium text-slate-600">{t.brandPicks.analyzing} {selectedBrand}...</p>
                  </div>
               ) : (
                  <div className="space-y-6 animate-fade-in">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                           <Sparkles size={16} />
                           <span className="text-sm font-bold uppercase tracking-wide">{t.brandPicks.bestForYou}</span>
                        </div>
                        <button onClick={handleReset} className="text-sm text-slate-400 hover:text-slate-600 underline">
                           Change Brand
                        </button>
                     </div>
                     
                     <div className="space-y-6">
                       {products.map((item, idx) => (
                         <BrandProductCard key={idx} item={item} index={idx} t={t} />
                       ))}
                     </div>
                  </div>
               )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
