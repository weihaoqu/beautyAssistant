import React, { useEffect, useState } from 'react';
import { X, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Minus, Image as ImageIcon } from 'lucide-react';
import { StoredScan, Language, AnalysisResult } from '../types';
import { getHistory } from '../services/storageService';
import { getTranslation } from '../utils/translations';

interface ProgressTrackerProps {
  onClose: () => void;
  language: Language;
}

// Helper to calculate a "Skin Health Score" (0-100)
// This is a heuristic based on number of concerns and severity
const calculateScore = (result: AnalysisResult): number => {
  let score = 100;
  
  // Deduct for general concerns count
  score -= (result.skin_analysis.concerns.length * 5);
  
  // Deduct for specific zone severity
  if (result.face_map) {
    result.face_map.forEach(zone => {
      if (zone.severity === 'High') score -= 8;
      if (zone.severity === 'Medium') score -= 4;
      if (zone.severity === 'Low') score -= 2;
    });
  }
  
  // Clamp score
  return Math.max(0, Math.min(100, Math.round(score)));
};

interface ChartPoint {
  date: string;
  timestamp: number;
  score: number;
  id: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ onClose, language }) => {
  const [history, setHistory] = useState<StoredScan[]>([]);
  const [loading, setLoading] = useState(true);
  const t = getTranslation(language);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getHistory();
        // Sort specifically for the chart: Oldest to Newest
        setHistory(data.sort((a, b) => a.timestamp - b.timestamp));
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const chartData: ChartPoint[] = history.map(scan => ({
    date: new Date(scan.timestamp).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' }),
    timestamp: scan.timestamp,
    score: calculateScore(scan.result),
    id: scan.id
  }));

  const renderChart = () => {
    if (chartData.length < 2) return null;

    const height = 150;
    const width = 100; // Percent
    const padding = 20;

    const minScore = Math.min(...chartData.map(d => d.score)) - 5;
    const maxScore = Math.max(...chartData.map(d => d.score)) + 5;
    const scoreRange = maxScore - minScore || 1; // Prevent div by zero

    // SVG logic
    const getX = (index: number) => (index / (chartData.length - 1)) * (100 - padding * 2) + padding; // percent
    const getY = (score: number) => height - ((score - minScore) / scoreRange) * (height - padding * 2) - padding;

    const points = chartData.map((d, i) => `${getX(i)}% ${getY(d.score)}`).join(',');
    
    // Gradient fill area
    const fillPath = `
      ${getX(0)}% ${height},
      ${points.replace(/,/g, ',').replace(/ /g, ' ')},
      ${getX(chartData.length - 1)}% ${height}
    `;

    return (
      <div className="w-full h-[180px] relative mt-4">
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0"/>
            </linearGradient>
          </defs>
          
          {/* Grid Lines */}
          <line x1="0" y1={padding} x2="100%" y2={padding} stroke="#e2e8f0" strokeDasharray="4 4" />
          <line x1="0" y1={height/2} x2="100%" y2={height/2} stroke="#e2e8f0" strokeDasharray="4 4" />
          <line x1="0" y1={height - padding} x2="100%" y2={height - padding} stroke="#e2e8f0" strokeDasharray="4 4" />

          {/* Area Fill */}
          <polygon points={fillPath.replace(/%/g, '%').replace(/\n/g, '')} fill="url(#scoreGradient)" />

          {/* Line */}
          <polyline 
            points={points.replace(/%/g, '%')} 
            fill="none" 
            stroke="#f43f5e" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Data Points */}
          {chartData.map((d, i) => (
            <g key={i}>
              <circle cx={`${getX(i)}%`} cy={getY(d.score)} r="4" fill="white" stroke="#f43f5e" strokeWidth="2" />
              <text 
                x={`${getX(i)}%`} 
                y={getY(d.score) - 12} 
                textAnchor="middle" 
                fontSize="10" 
                fill="#64748b" 
                fontWeight="bold"
              >
                {d.score}
              </text>
              <text 
                x={`${getX(i)}%`} 
                y={height + 20} 
                textAnchor="middle" 
                fontSize="10" 
                fill="#94a3b8"
              >
                {d.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const getInsights = () => {
    if (history.length < 2) return null;
    const first = history[0];
    const last = history[history.length - 1];
    
    // Compare concerns
    const firstConcerns = first.result.skin_analysis.concerns;
    const lastConcerns = last.result.skin_analysis.concerns;
    
    // Find resolved concerns
    const resolved = firstConcerns.filter(c => !lastConcerns.includes(c));
    const newConcerns = lastConcerns.filter(c => !firstConcerns.includes(c));
    
    // Score Delta
    const scoreDiff = calculateScore(last.result) - calculateScore(first.result);

    return (
      <div className="space-y-3">
        {/* Score Trend Badge */}
        <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
                scoreDiff > 0 ? 'bg-emerald-100 text-emerald-700' : scoreDiff < 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
            }`}>
                {scoreDiff > 0 ? <ArrowUpRight size={14} /> : scoreDiff < 0 ? <ArrowDownRight size={14} /> : <Minus size={14} />}
                {scoreDiff > 0 ? t.progress.improved : scoreDiff < 0 ? t.progress.worsened : t.progress.steady}
            </span>
            <span className="text-xs text-slate-500">
                {scoreDiff > 0 ? `+${scoreDiff} points` : `${scoreDiff} points`}
            </span>
        </div>

        {resolved.length > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Resolved Concerns</p>
                <div className="flex flex-wrap gap-1">
                    {resolved.map(c => (
                        <span key={c} className="text-xs bg-white text-emerald-600 px-2 py-0.5 rounded shadow-sm border border-emerald-100 decoration-emerald-500">{c}</span>
                    ))}
                </div>
            </div>
        )}

        {newConcerns.length > 0 && (
             <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                <p className="text-xs font-bold text-orange-700 uppercase mb-1">New Concerns</p>
                <div className="flex flex-wrap gap-1">
                    {newConcerns.map(c => (
                        <span key={c} className="text-xs bg-white text-orange-600 px-2 py-0.5 rounded shadow-sm border border-orange-100">{c}</span>
                    ))}
                </div>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-white">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <TrendingUp className="text-rose-500" size={20} />
            {t.progress.title}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-black/5 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
          {loading ? (
             <div className="flex justify-center py-10">
               <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
             </div>
          ) : history.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
               <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm text-slate-200">
                  <TrendingUp size={40} />
               </div>
               <h4 className="text-lg font-bold text-slate-800 mb-2">{t.progress.notEnoughData}</h4>
               <p className="text-slate-500 max-w-xs mx-auto mb-6 leading-relaxed">
                 {t.progress.notEnoughDesc}
               </p>
               <button 
                 onClick={onClose}
                 className="px-6 py-2 bg-rose-500 text-white rounded-full font-medium shadow-lg shadow-rose-200 hover:bg-rose-600 transition-colors"
               >
                 {t.progress.scanMore}
               </button>
            </div>
          ) : (
            <div className="space-y-6">
                
                {/* Score Chart Card */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-700">{t.progress.healthScore}</h4>
                        <div className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{t.progress.scoreExplanation}</div>
                    </div>
                    {renderChart()}
                </div>

                {/* Before / After Comparison */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h4 className="font-bold text-slate-700 mb-4">{t.progress.before} vs {t.progress.now}</h4>
                    <div className="flex gap-4">
                        <div className="flex-1 relative group">
                            <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md z-10">{t.progress.firstScan}</span>
                            <div className="aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                                <img src={history[0].image} alt="Before" className="w-full h-full object-cover" />
                            </div>
                            <div className="mt-2 text-center">
                                <p className="text-xs text-slate-400 font-medium">{new Date(history[0].timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        {/* Divider Line */}
                        <div className="w-[1px] bg-slate-100 self-stretch my-2"></div>

                        <div className="flex-1 relative group">
                            <span className="absolute top-2 left-2 bg-rose-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md z-10">{t.progress.latestScan}</span>
                            <div className="aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden border border-rose-200 shadow-sm">
                                <img src={history[history.length-1].image} alt="After" className="w-full h-full object-cover" />
                            </div>
                             <div className="mt-2 text-center">
                                <p className="text-xs text-slate-400 font-medium">{new Date(history[history.length-1].timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                 {/* Insights */}
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h4 className="font-bold text-slate-700 mb-4">{t.progress.insights}</h4>
                    {getInsights()}
                </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
