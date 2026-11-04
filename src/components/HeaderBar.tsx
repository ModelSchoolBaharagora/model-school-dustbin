import React from 'react';
import { RoverTelemetry, TimeOfDay } from '../types';
import { Trash2, Sun, Navigation, Clock, Volume2, VolumeX, AlertTriangle, ShieldCheck } from 'lucide-react';

interface HeaderBarProps {
  telemetry: RoverTelemetry;
  soundEnabled: boolean;
  onToggleSound: () => void;
  timeOfDay: TimeOfDay;
  onChangeTime: (time: TimeOfDay) => void;
  onQuickTogglePatrol: () => void;
  onClearObstacle: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  telemetry,
  soundEnabled,
  onToggleSound,
  timeOfDay,
  onChangeTime,
  onQuickTogglePatrol,
  onClearObstacle,
}) => {
  const isWaiting = telemetry.state === 'COLLECTING_WAIT';
  const isPatrolling = telemetry.state === 'PATROLLING';
  const isObstacle = telemetry.state === 'OBSTACLE_HALT' || telemetry.obstacleDetected;

  return (
    <header className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none z-20">
      {/* Title & Brand */}
      <div className="bg-slate-900/95 text-slate-100 px-4 py-2.5 rounded-xl border border-slate-700/80 shadow-xl pointer-events-auto flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-lg">
          🇮🇳
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-wide text-white uppercase">
              Smart Autonomous Dustbin
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
              Made in India
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span className="text-teal-300 font-medium">Road White Line</span>
            <span className="text-slate-600">•</span>
            <span>200m Intervals</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-medium">Auto Animal Stop (Gay/Bail)</span>
          </p>
        </div>
      </div>

      {/* Center Status / Obstacle Alert */}
      {isObstacle ? (
        <div className="bg-red-950/95 text-red-200 px-4 py-2 rounded-xl border border-red-500/70 shadow-2xl pointer-events-auto flex items-center gap-3 text-xs animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <span className="font-bold text-white block">
              OBSTACLE DETECTED: Indian Cow (Gay/Bail) at {telemetry.obstacleDistanceMeter}m
            </span>
            <span className="text-[11px] text-red-300">
              IR & Sonar triggered auto-halt on white line
            </span>
          </div>
          <button
            onClick={onClearObstacle}
            className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-sm ml-2"
          >
            Clear Path
          </button>
        </div>
      ) : (
        /* Live 200m Progress & State */
        <div className="bg-slate-900/95 text-slate-100 px-4 py-2 rounded-xl border border-slate-700/80 shadow-xl pointer-events-auto flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isWaiting
                  ? 'bg-amber-400 ring-2 ring-amber-400/20'
                  : isPatrolling
                  ? 'bg-emerald-400 ring-2 ring-emerald-400/20'
                  : 'bg-cyan-400 ring-2 ring-cyan-400/20'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">State</span>
              <span className="font-semibold text-white">
                {isWaiting
                  ? `STOP WAIT: ${telemetry.waitTimerRemainingSec}s`
                  : isPatrolling
                  ? 'PATROLLING'
                  : 'HOVER TO START'}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-700" />

          {/* 200m Progress */}
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-teal-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                Leg (200m)
              </span>
              <span className="font-semibold text-teal-300 font-mono">
                {200 - telemetry.distanceToNextStop}m / 200m
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-700 hidden sm:block" />

          {/* White line sensor status */}
          <div className="hidden sm:flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">IR Tracking</span>
              <span className="font-semibold text-emerald-300 font-mono">White Line Locked</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Environment Toggles */}
      <div className="bg-slate-900/95 text-slate-200 px-3 py-2 rounded-xl border border-slate-700/80 shadow-xl pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => {
            const nextTime: TimeOfDay =
              timeOfDay === 'DAY' ? 'SUNSET' : timeOfDay === 'SUNSET' ? 'NIGHT' : 'DAY';
            onChangeTime(nextTime);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium cursor-pointer border border-slate-700 text-slate-200"
          title="Toggle Lighting Atmosphere"
        >
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">{timeOfDay}</span>
        </button>

        <button
          onClick={onToggleSound}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
          title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>
      </div>
    </header>
  );
};
