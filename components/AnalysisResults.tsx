import React, { useState } from 'react';
import { AnalysisResult, ProductRecommendation, FaceZone, Language } from '../types';
import { Sparkles, Droplet, Sun, AlertCircle, CheckCircle2, ShoppingBag, ChevronRight, Heart, Leaf, Moon, Utensils, Smile, Activity, ScanLine, Target, Search, Info, Share2, Eye, MapPin, ScanFace, Meh, Frown, Dumbbell } from 'lucide-react';
import { ProductDetailModal } from './ProductDetailModal';
import { ConcernDetailModal } from './ConcernDetailModal';
import { ShareModal } from './ShareModal';
import { getTranslation } from '../utils/translations';

interface AnalysisResultsProps {
  result: AnalysisResult;
  userImage: string | null;
  onReset: () => void;
  language: Language;
  onOpenProductScanner: () => void;
}

interface ProductCardProps {
  product: ProductRecommendation;
  onClick: () => void;
  t: any;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, t }) => (
  <div 
    onClick={onClick}
    className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-lg hover:border-rose-200 hover:-translate-y-1 transition-all cursor-pointer group relative"
  >
    <div className="flex items-start justify-between mb-3">
      <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
        {product.category}
      </span>
      <ChevronRight className="text-slate-300 group-hover:text-rose-500 transition-colors" size={18} />
    </div>
    <h4 className="text-lg font-semibold text-slate-800 mb-1">{product.product_type}</h4>
    <p className="text-sm text-slate-500 mb-4 flex-grow">{product.suggestion}</p>
    
    <div className="space-y-3">
      <div>
        <span className="text-xs font-semibold text-slate-400 block mb-1">{t.results.keyIngredients}</span>
        <div className="flex flex-wrap gap-1">
          {product.key_ingredients.map((ing, idx) => (
            <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {ing}
            </span>
          ))}
        </div>
      </div>
      <div className="pt-3 border-t border-slate-50 flex items-center text-xs text-slate-500">
        <Sun className="w-3 h-3 mr-1.5" />
        {product.usage_frequency}
      </div>
    </div>
    
    <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-rose-100 pointer-events-none transition-colors"></div>
  </div>
);

const getZoneIcon = (zoneName: string) => {
  const z = zoneName.toLowerCase();
  if (z.includes('eye')) return <Eye size={18} className="text-indigo-500" />;
  if (z.includes('nose')) return <MapPin size={18} className="text-rose-500" />;
  if (z.includes('cheek')) return <Smile size={18} className="text-orange-500" />;
  if (z.includes('forehead')) return <ScanFace size={18} className="text-blue-500" />;
  if (z.includes('chin')) return <Meh size={18} className="text-teal-500" />;
  return <Target size={18} className="text-slate-500" />;
};

const FaceZoneCard: React.FC<{ zone: FaceZone; onClick: () => void }> = ({ zone, onClick }) => {
  const getSeverityColor = (s: string) => {
    switch (s) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Low': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:border-slate-300 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:border-rose-100 transition-colors">
           {getZoneIcon(zone.zone)}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-0.5 flex items-center gap-1">
            {zone.zone}
            <Info size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
          </span>
          <span className="font-medium text-slate-800">{zone.condition}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${getSeverityColor(zone.severity)}`}>
          {zone.severity}
        </span>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-rose-400 transition-colors" />
      </div>
    </div>
  );
};

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, userImage, onReset, language, onOpenProductScanner }) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductRecommendation | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const t = getTranslation(language);

  const contextSummary = `
    Skin Type: ${result.skin_analysis.skin_type}, 
    Tone: ${result.skin_analysis.skin_tone}, 
    Concerns: ${result.skin_analysis.concerns.join(', ')}. 
    Hair: ${result.hair_analysis.hair_type}, ${result.hair_analysis.condition}.
  `;

  const getLifestyleStyle = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('diet') || c.includes('nutrition') || c.includes('food') || c.includes('eat')) {
      return { icon: <Utensils size={18} />, color: 'text-orange-600', bg: 'bg-orange-100' };
    }
    if (c.includes('sleep') || c.includes('rest') || c.includes('night')) {
      return { icon: <Moon size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-100' };
    }
    if (c.includes('hydrat') || c.includes('water') || c.includes('fluid')) {
      return { icon: <Droplet size={18} />, color: 'text-cyan-600', bg: 'bg-cyan-100' };
    }
    if (c.includes('stress') || c.includes('mind') || c.includes('relax') || c.includes('breath') || c.includes('calm')) {
      return { icon: <Smile size={18} />, color: 'text-purple-600', bg: 'bg-purple-100' };
    }
    if (c.includes('exercise') || c.includes('activ') || c.includes('workout') || c.includes('sport') || c.includes('move')) {
      return { icon: <Dumbbell size={18} />, color: 'text-rose-600', bg: 'bg-rose-100' };
    }
    if (c.includes('sun') || c.includes('spf') || c.includes('protect')) {
        return { icon: <Sun size={18} />, color: 'text-amber-600', bg: 'bg-amber-100' };
    }
    return { icon: <Leaf size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-100' };
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-up">
      {/* Product Detail Modal (Populated from Routine) */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          contextSummary={contextSummary}
          onClose={() => setSelectedProduct(null)} 
          language={language}
        />
      )}

      {/* Product Search Modal (Empty for Custom Search) */}
      {isSearchModalOpen && (
        <ProductDetailModal 
          contextSummary={contextSummary}
          onClose={() => setIsSearchModalOpen(false)} 
          language={language}
        />
      )}

      {/* Detailed Concern Modal */}
      {selectedConcern && (
        <ConcernDetailModal 
          concern={selectedConcern}
          contextSummary={contextSummary}
          onClose={() => setSelectedConcern(null)}
          language={language}
        />
      )}
      
      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal 
          result={result}
          userImage={userImage}
          onClose={() => setIsShareModalOpen(false)}
          language={language}
        />
      )}

      {/* Visual Analysis Section */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 lg:col-span-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 h-full">
            <div className="relative rounded-xl overflow-hidden aspect-[3/4] md:aspect-auto md:h-full bg-slate-100 group">
              {userImage && (
                <img 
                  src={userImage} 
                  alt="Analyzed Face" 
                  className="w-full h-full object-cover" 
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                 <p className="text-white font-medium text-sm flex items-center gap-2">
                   <ScanLine size={16} /> Image Analyzed
                 </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-6">
           {/* Detailed Face Map */}
           <div className="glass-panel p-6 rounded-2xl shadow-sm border border-white/50 flex-grow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                  <Target size={24} />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">{t.results.visualBreakdown}</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.face_map && result.face_map.length > 0 ? (
                  result.face_map.map((zone, idx) => (
                    <FaceZoneCard 
                      key={idx} 
                      zone={zone} 
                      onClick={() => setSelectedConcern(`${zone.condition} (${zone.zone})`)}
                    />
                  ))
                ) : (
                  <p className="text-slate-500 italic col-span-2">Detailed zone analysis not available.</p>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-4 text-center">{t.results.tapArea}</p>
           </div>

           {/* Quick Stats Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                onClick={() => setSelectedConcern(`${result.skin_analysis.skin_type} Skin Type`)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-rose-400 cursor-pointer hover:shadow-md transition-all group relative"
              >
                <div className="absolute top-5 right-5 text-slate-300 group-hover:text-rose-400 transition-colors">
                  <ChevronRight size={20} />
                </div>
                <div className="flex items-center gap-2 mb-2 text-rose-600">
                  <Sparkles size={18} />
                  <span className="font-bold text-sm uppercase">{t.results.skinType}</span>
                </div>
                <p className="text-lg font-semibold text-slate-800">{result.skin_analysis.skin_type}</p>
                <p className="text-sm text-slate-500 mt-1">{result.skin_analysis.skin_tone}</p>
              </div>
              
              <div 
                onClick={() => setSelectedConcern(`${result.hair_analysis.condition} Hair`)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-indigo-400 cursor-pointer hover:shadow-md transition-all group relative"
              >
                <div className="absolute top-5 right-5 text-slate-300 group-hover:text-indigo-400 transition-colors">
                  <ChevronRight size={20} />
                </div>
                <div className="flex items-center gap-2 mb-2 text-indigo-600">
                  <Droplet size={18} />
                  <span className="font-bold text-sm uppercase">{t.results.hairHealth}</span>
                </div>
                <p className="text-lg font-semibold text-slate-800">{result.hair_analysis.condition}</p>
                <p className="text-sm text-slate-500 mt-1">{result.hair_analysis.hair_type}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Skin Detailed Profile */}
        <div className="glass-panel p-6 rounded-2xl border-t-4 border-rose-400 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-slate-800">{t.results.detailedObservations}</h3>
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors"
            >
              <Share2 size={16} />
              {t.share.button}
            </button>
          </div>
          <div className="space-y-4">
             <div>
                <p className="text-sm text-slate-500 mb-3 font-medium">{t.results.concernsIdentified}</p>
                {/* Refactored Concerns Display: Interactive Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {result.skin_analysis.concerns.map((c, i) => (
                    <button 
                      key={i} 
                      onClick={() => setSelectedConcern(c)}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-rose-100 shadow-sm hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5 transition-all group text-left"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                          <AlertCircle size={16} />
                        </div>
                        <span className="font-semibold text-slate-700 text-sm truncate group-hover:text-rose-600 transition-colors">{c}</span>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-rose-400 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2 text-right">{t.results.tapConcern}</p>
             </div>
             
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wide">{t.results.analysisSummary}</p>
                <p className="text-slate-700 leading-relaxed italic">
                  "{result.skin_analysis.summary}"
                </p>
             </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm bg-gradient-to-b from-white to-teal-50/30">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-4 shadow-sm">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">{t.results.analysisComplete}</h3>
          <p className="text-sm text-slate-500 mb-6 px-4">
            {t.results.completeDesc}
          </p>
          <button 
            onClick={onReset}
            className="text-sm font-semibold text-rose-500 hover:text-rose-600 py-2 px-4 rounded-full bg-rose-50 hover:bg-rose-100 transition-all"
          >
            {t.results.startNew}
          </button>
        </div>
      </div>

      {/* Healthy Life Suggestions */}
      {result.lifestyle_suggestions && result.lifestyle_suggestions.length > 0 && (
        <div className="mb-10 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-teal-100 rounded-lg text-teal-700">
               <Heart size={24} />
             </div>
             <h3 className="text-xl font-semibold text-slate-800">{t.results.healthyLife}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {result.lifestyle_suggestions.map((item, idx) => {
                const style = getLifestyleStyle(item.category);
                return (
                <div key={idx} className="bg-white/70 p-4 rounded-xl border border-teal-50/50 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
                   <div className="flex items-center gap-2 mb-1">
                      <div className={`p-2 rounded-full shadow-sm ${style.bg} ${style.color}`}>
                        {style.icon}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{item.category}</span>
                   </div>
                   <h4 className="font-semibold text-slate-800 leading-tight">{item.title}</h4>
                   <p className="text-sm text-slate-600 leading-relaxed">{item.details}</p>
                </div>
                );
             })}
          </div>
        </div>
      )}

      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <ShoppingBag className="text-slate-400" />
            <h2 className="text-2xl font-bold text-slate-800">{t.results.personalizedRoutine}</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onOpenProductScanner}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-all shadow-sm"
            >
              <ScanLine size={16} />
              {t.results.checkProduct}
            </button>
            <button 
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              <Search size={16} />
              {t.results.findProduct}
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-6 -mt-4 sm:-mt-2 sm:ml-9">
          {t.results.routineDesc}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {result.recommendations.map((rec, index) => (
            <ProductCard 
              key={index} 
              product={rec} 
              onClick={() => setSelectedProduct(rec)}
              t={t}
            />
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-yellow-800">
          <strong>{t.results.disclaimer}</strong>
        </div>
      </div>
    </div>
  );
};