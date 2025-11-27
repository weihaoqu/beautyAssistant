import React, { useEffect, useState } from 'react';
import { X, Clock, Calendar, Trash2, ChevronRight, ScanFace } from 'lucide-react';
import { StoredScan } from '../types';
import { getHistory, deleteScan } from '../services/storageService';

interface HistoryModalProps {
  onClose: () => void;
  onLoadScan: (scan: StoredScan) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ onClose, onLoadScan }) => {
  const [history, setHistory] = useState<StoredScan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this scan?")) {
      await deleteScan(id);
      loadHistory();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(new Date(timestamp));
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-white">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <Clock className="text-rose-500" size={20} />
            History
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-black/5 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <Clock size={32} />
              </div>
              <p className="font-medium">No previous scans found</p>
              <p className="text-sm mt-1">Your analysis history will appear here.</p>
            </div>
          ) : (
            history.map((scan) => (
              <div 
                key={scan.id}
                onClick={() => onLoadScan(scan)}
                className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-rose-200 transition-all group"
              >
                <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100">
                  <img src={scan.image} alt="Scan" className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <Calendar size={12} />
                    {formatDate(scan.timestamp)}
                  </div>
                  <h4 className="font-semibold text-slate-800 truncate">
                    {scan.result.skin_analysis.skin_type} Skin
                  </h4>
                  <p className="text-xs text-slate-500 truncate">
                    {scan.result.skin_analysis.concerns.slice(0, 2).join(', ')}...
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handleDelete(e, scan.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete Scan"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-rose-400 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
