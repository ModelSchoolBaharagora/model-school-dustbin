import React from 'react';
import { CollectionStation } from '../types';
import { CheckCircle2, FastForward, Clock, MapPin } from 'lucide-react';

interface StationArrivalBannerProps {
  station: CollectionStation | null;
  remainingSec: number;
  onSkipWait: () => void;
}

export const StationArrivalBanner: React.FC<StationArrivalBannerProps> = ({
  station,
  remainingSec,
  onSkipWait,
}) => {
  if (!station || remainingSec <= 0) return null;

  return (
    <div className="absolute top-20 left-4 z-20 pointer-events-auto max-w-[440px]">
      <div className="bg-slate-900/95 text-slate-100 px-4 py-2.5 rounded-2xl border border-amber-500/50 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
          <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {station.name} ({station.distanceMeter}m Stop)
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 font-mono">
              1-MIN WAIT
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Citizen tossing waste bag into hopper • Internal compactor active • Resumes in{' '}
            <strong className="text-amber-300 font-mono text-sm">{remainingSec}s</strong>
          </p>
        </div>

        <button
          onClick={onSkipWait}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors shadow-md ml-2"
        >
          <FastForward className="w-4 h-4" />
          <span>Skip 1m</span>
        </button>
      </div>
    </div>
  );
};
