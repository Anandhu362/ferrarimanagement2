import React, { useState } from 'react';
import { Sparkles, RefreshCw, X, ShieldCheck } from 'lucide-react';

export default function UpdateNotificationToast({ versionData, onUpdate }) {
    const [dismissed, setDismissed] = useState(false);

    if (!versionData || dismissed) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 font-sans">
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.14)] rounded-[1.75rem] p-5 w-84 text-slate-900 flex flex-col gap-3.5 relative overflow-hidden">
                
                {/* Subtle Fintech Top Accent Gradient Line */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

                {/* Header Badge & Close Button */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-700">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Update Available v{versionData.latestVersion}</span>
                    </div>
                    <button 
                        onClick={() => setDismissed(true)} 
                        className="text-slate-400 hover:text-slate-700 bg-slate-100/60 hover:bg-slate-100 transition p-1.5 rounded-full"
                        title="Dismiss Toast"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Main Content */}
                <div>
                    <h5 className="text-sm font-bold text-slate-900 tracking-tight">New Build Ready</h5>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed font-medium">
                        {versionData.releaseNotes || 'Includes operational stability and performance enhancements.'}
                    </p>
                </div>

                {/* Safe Storage Indicator */}
                <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 border border-emerald-100 p-2.5 rounded-xl">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Active form draft saved locally
                    </span>
                </div>

                {/* Fintech CTA Button */}
                <button
                    onClick={onUpdate}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 px-4 rounded-xl transition duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Apply Update & Reload</span>
                </button>
            </div>
        </div>
    );
}
