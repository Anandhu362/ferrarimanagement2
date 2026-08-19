import React from 'react';
import { History, Trash2 } from 'lucide-react';

export default function DraftRestoredBanner({ isRestored, onDiscard }) {
    if (!isRestored) return null;

    return (
        <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-xl mb-4 text-xs text-amber-300">
            <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <span>Restored unsaved draft from your previous session.</span>
            </div>
            <button
                type="button"
                onClick={onDiscard}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-200 transition bg-amber-500/20 px-2.5 py-1 rounded-lg"
            >
                <Trash2 className="w-3 h-3" />
                <span>Discard Draft</span>
            </button>
        </div>
    );
}
