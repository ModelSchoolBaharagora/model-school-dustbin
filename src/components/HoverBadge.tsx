import React from 'react';
import { Sparkles, MousePointerClick } from 'lucide-react';

interface HoverBadgeProps {
  isHovered: boolean;
  state: string;
}

export const HoverBadge: React.FC<HoverBadgeProps> = ({ isHovered, state }) => {
  if (!isHovered) return null;

  // Positioned on the SIDE of the screen (top-left) to keep the 3D center 100% clear
  return (
    <div className="absolute top-20 left-4 z-20 pointer-events-none transition-all duration-200">
      <div className="bg-cyan-950/95 text-cyan-200 px-3.5 py-2 rounded-xl border border-cyan-400/60 shadow-2xl flex items-center gap-2 text-xs font-semibold">
        <Sparkles className="w-4 h-4 text-cyan-300" />
        <span>Target: Smart Rover #01</span>
        <span className="text-cyan-400">•</span>
        <span className="flex items-center gap-1 text-white">
          <MousePointerClick className="w-3.5 h-3.5 text-cyan-300" />
          Click to {state === 'IDLE' ? 'Launch' : 'Toggle'}
        </span>
      </div>
    </div>
  );
};
