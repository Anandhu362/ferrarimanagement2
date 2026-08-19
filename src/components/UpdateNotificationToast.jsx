import React, { useState } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';

export default function UpdateNotificationToast({ versionData, onUpdate }) {
    const [dismissed, setDismissed] = useState(false);

    if (!versionData || dismissed) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800/90 shadow-2xl rounded-2xl p-4 w-80 text-slate-100 flex flex-col gap-3 relative overflow-hidden">
                {/* Subtle Fintech Top Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

                {/* Header Badge & Close Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-400">
                        <Sparkles className="w-3 h-3" />
                        <span>System Update v{versionData.latestVersion}</span>
                    </div>
                    <button 
                        onClick={() => setDismissed(true)} 
                        className="text-slate-400 hover:text-slate-200 transition p-0.5 rounded-lg hover:bg-slate-800"
                        title="Dismiss Toast"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Content */}
                <div>
                    <h5 className="text-xs font-semibold text-slate-100">New Software Build Ready</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {versionData.releaseNotes || 'Includes operational stability and performance enhancements.'}
                    </p>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active entry draft protected & saved locally</span>
                </div>

                {/* Fintech CTA Button */}
                <button
                    onClick={onUpdate}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold py-2 px-3 rounded-xl transition duration-200 shadow-md shadow-emerald-500/10 active:scale-[0.98]"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Apply Update & Reload</span>
                </button>
            </div>
        </div>
    );
}
