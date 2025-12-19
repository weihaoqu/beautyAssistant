
import React, { useState, useEffect } from 'react';
import { X, Trophy, Award, Medal, Loader2, DollarSign, ExternalLink, Sparkles, Clock, Beaker, Image as ImageIcon, ShoppingBag, Search, Info, ChevronRight } from 'lucide-react';
import { ProductRecommendation, SpecificProduct, Language, ModelType } from '../types';
import { getSpecificProductRecommendations } from '../services/geminiService';
import { getTranslation } from '../utils/translations';

interface ProductDetailModalProps {
  product?: ProductRecommendation;
  contextSummary: string;
  onClose: () => void;
  language: Language;
  model: ModelType;
}

const getTierIcon = (tier: string) => {
  const normalizedTier = tier.toLowerCase();
  switch (normalizedTier) {
    case 'gold': 
      return (
        <div className="p-2.5 bg-yellow-100 rounded-full border border-yellow-200 shadow-sm flex-shrink-0">
          <Trophy className="text-yellow-600" size={24} />
        </div>
      );
    case 'silver': 
      return (
        <div className="p-2.5 bg-slate-100 rounded-full border border-slate-200 shadow-sm flex-shrink-0">
          <Award className="text-slate-500" size={24} />
        </div>
      );
    case 'bronze': 
      return (
        <div className="p-2.5 bg-orange-100 rounded-full border border-orange-200 shadow-sm flex-shrink-0">
          <Medal className="text-orange-700" size={24} />
        </div>
      );
    default: 
      return (
        <div className="p-2.5 bg-slate-50 rounded-full border border-slate-200 shadow-sm flex-shrink-0">
          <Award className="text-slate-400" size={24} />
        </div>
      );
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

const SpecificProductCard: React.FC<{ item: SpecificProduct; index: number; t: any }> = ({ item, index, t }) => {
  const [imgError, setImgError] = useState(false);
  const [showReason, setShowReason] = useState(false);

  // Reset error state if the product image url changes (e.g. re-fetching)
  useEffect(() => {
    setImgError(false);
  }, [item.image_url]);

  return (
    <div className={`border rounded-xl p-5 ${getTierColor(item.tier)} transition-all duration-300 hover:shadow-xl hover:border-rose-300 hover:-translate-y-1 animate-scale-in`} style={{ animationDelay: `${index * 150}ms` }}>
      
      {/* Card Header Row */}
      <div className="flex gap-4 items-start mb-4">
        {getTierIcon(item.tier)}
        <div className="flex-grow">
          <div className="flex justify-between items-start">
             <div>
               <span className="text-xs font-bold uppercase opacity-70 mb-1 block">{item.tier} Pick</span>
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
                        <div className="font-semibold mb-1 opacity-70 uppercase tracking-wider text-[10px]">Why we picked this</div>
                        <p>{item.reason}</p>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-800"></div>
                      </div>
                    )}
                 </div>
               </h3>
               <p className="text-sm font-medium text-slate-600">{item.brand}</p>
             </div>
             <div className="text-right flex flex-col items-end gap-1">
                <span className="inline-block bg-white/60 px-2 py-1 rounded text-sm font-semibold text-slate-700 border border-black/5 whitespace-nowrap">
                  {item.price_estimate}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* Image/Reason Split */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
         <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-lg border border-slate-100 shadow-sm flex-shrink-0 overflow-hidden flex items-center justify-center relative group-hover:border-slate-300 transition-colors">
            {item.image_url && !imgError ? (
              <img 
                src={item.image_url} 
                alt={item.product_name} 
                className="w-full h-full object-contain p-2 hover:scale-110 transition-transform duration-500" 
                onError={() => setImgError(true)} 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300 gap-1">
                <ShoppingBag size={24} strokeWidth={1.5} className="opacity-60" />
                <span className="text-[10px] font-medium uppercase tracking-wide opacity-50">Product</span>
              </div>
            )}
         </div>
         <div className="flex-grow">
            <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-3">
              "{item.reason}"
            </p>
         </div>
      </div>

      {/* Details Row */}
      <div className="bg-white/60 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 border border-black/5">
         <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">
              <Beaker size={14} /> {t.results.keyIngredients}
            </div>
            <div className="flex flex-wrap gap-1">
              {item.key_ingredients && item.key_ingredients.length > 0 ? (
                 item.key_ingredients.map((ing, i) => (
                   <span key={i} className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                     {ing}
                   </span>
                 ))
              ) : (
                <span className="text-xs text-slate-500">Not specified</span>
              )}
            </div>
         </div>
         <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">
              <Clock size={14} /> {t.modal.usage}
            </div>
            <p className="text-xs text-slate-700 font-medium">
              {item.usage_frequency || "Follow package instructions"}
            </p>
         </div>
      </div>

      {/* Link Row */}
      <div className="mt-4 flex justify-end">
         {item.product_link && (
            <a 
              href={item.product_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-900 transition-all shadow-md hover:shadow-lg transform active:scale-95"
            >
              {t.modal.findOnline} <ExternalLink size={16} />
            </a>
          )}
      </div>
      
    </div>
  );
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, contextSummary, onClose, language, model }) => {
  const [view, setView] = useState<'budget' | 'results'>(product ? 'budget' : 'results');
  const [budget, setBudget] = useState('50');
  const [products, setProducts] = useState<SpecificProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const t = getTranslation(language);

  const fetchProducts = async (budgetOverride?: string) => {
    // Determine the term to search: either from the passed product prop or the manual search query
    const term = product ? `${product.category} - ${product.product_type}` : searchQuery;
    const budgetVal = budgetOverride || budget;

    if (!term.trim()) return;

    setLoading(true);
    try {
      const recs = await getSpecificProductRecommendations(
        term,
        contextSummary,
        `${budgetVal} USD`,
        language,
        model
      );
      setProducts(recs);
      setHasFetched(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleBudgetSelect = (selectedBudget: string) => {
    setBudget(selectedBudget);
    setView('results');
    fetchProducts(selectedBudget);
  };

  const handleCustomBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (budget) {
      setView('results');
      fetchProducts(budget);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start md:items-center justify-center p-4 pt-20 md:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-white">
          <div>
             <span className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-1 block">
               {product ? t.modal.topPicks : t.modal.productFinder}
             </span>
             <h2 className="text-2xl font-bold text-slate-800">
               {product ? product.product_type : t.modal.findProductTitle}
             </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Controls - Only visible in Results view */}
        {view === 'results' && (
          <div className="p-6 pb-2 border-b border-slate-50 animate-fade-in">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-end gap-4">
              {/* Search Input - Only shown if no product prop is passed */}
              {!product && (
                <div className="flex-grow w-full">
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">{t.modal.findProductTitle}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                      placeholder={t.modal.searchPlaceholder}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              <div className={`${!product ? 'w-full sm:w-32' : 'flex-grow'}`}>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">{t.modal.budget}</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="number" 
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                    placeholder="e.g. 50"
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={loading || (!product && !searchQuery.trim())}
                className={`bg-slate-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-[42px] ${!product ? 'w-full sm:w-auto' : ''}`}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : (product ? t.modal.updatePicks : t.modal.search)}
              </button>
            </form>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {view === 'budget' && product ? (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in py-4">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                 <DollarSign size={32} />
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-8 text-center">{t.modal.selectBudget}</h3>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mb-8">
                 <button onClick={() => handleBudgetSelect('20')} className="p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all font-semibold text-slate-600 flex items-center justify-center gap-2 group">
                   <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors">
                     $
                   </div>
                   {t.modal.budgetLow}
                 </button>
                 <button onClick={() => handleBudgetSelect('50')} className="p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all font-semibold text-slate-600 flex items-center justify-center gap-2 group">
                   <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors">
                     $$
                   </div>
                   {t.modal.budgetMid}
                 </button>
                 <button onClick={() => handleBudgetSelect('100')} className="p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all font-semibold text-slate-600 flex items-center justify-center gap-2 group">
                   <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors">
                     $$$
                   </div>
                   {t.modal.budgetHigh}
                 </button>
                 <button onClick={() => handleBudgetSelect('150')} className="p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all font-semibold text-slate-600 flex items-center justify-center gap-2 group">
                   <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors">
                     <Sparkles size={16} />
                   </div>
                   {t.modal.budgetLux}
                 </button>
               </div>

               <div className="w-full max-w-xs relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400 font-medium">Or</span>
                  </div>
               </div>

               <form onSubmit={handleCustomBudget} className="mt-6 flex gap-2 w-full max-w-xs">
                 <div className="relative flex-grow">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="number" 
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder="Custom amount"
                    />
                 </div>
                 <button 
                   type="submit"
                   className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors"
                 >
                   {t.modal.continue}
                 </button>
               </form>
            </div>
          ) : loading && !hasFetched ? (
             <div className="flex flex-col items-center justify-center py-12 text-slate-400 animate-fade-in">
               <Loader2 size={40} className="animate-spin mb-4 text-rose-500" />
               <p>{t.modal.finding}</p>
             </div>
          ) : (
            <div className="animate-fade-in">
              {products.length > 0 ? (
                <div className="space-y-6">
                  {products.map((item, idx) => (
                    <SpecificProductCard key={idx} item={item} index={idx} t={t} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                   {!hasFetched ? (
                     <>
                        <div className="bg-slate-50 p-4 rounded-full mb-3">
                           <Search size={32} className="text-slate-300" />
                        </div>
                        <p>{t.modal.enterProduct}</p>
                     </>
                   ) : (
                     <p>{t.modal.noProducts}</p>
                   )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
          {t.modal.priceDisclaimer}
        </div>
      </div>
    </div>
  );
};
