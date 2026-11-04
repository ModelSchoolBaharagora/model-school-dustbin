import React, { useState } from 'react';
import {
  CameraViewMode,
  RoverTelemetry,
  SimulationSettings,
  TimeOfDay,
} from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Compass,
  Cpu,
  Camera,
  BookOpen,
  ChevronDown,
  ChevronUp,
  BatteryCharging,
  Gauge,
  Sparkles,
  MapPin,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface CollapsibleDockProps {
  telemetry: RoverTelemetry;
  settings: SimulationSettings;
  onTogglePatrol: () => void;
  onSkipWait: () => void;
  onResetRoute: () => void;
  onSetSpeedMultiplier: (mult: number) => void;
  onSetCameraMode: (mode: CameraViewMode) => void;
  onSetTimeOfDay: (time: TimeOfDay) => void;
  onToggleSound: () => void;
}

export const CollapsibleDock: React.FC<CollapsibleDockProps> = ({
  telemetry,
  settings,
  onTogglePatrol,
  onSkipWait,
  onResetRoute,
  onSetSpeedMultiplier,
  onSetCameraMode,
  onSetTimeOfDay,
  onToggleSound,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'mission' | 'sensors' | 'camera' | 'about'>('mission');

  const isPatrolling = telemetry.state === 'PATROLLING';
  const isWaiting = telemetry.state === 'COLLECTING_WAIT';

  // 500m leg calculation
  const legProgress = Math.min(500, Math.max(0, 500 - telemetry.distanceToNextStop));
  const legPercent = Math.round((legProgress / 500) * 100);

  // 1-min wait calculation (60 seconds)
  const waitPercent = telemetry.waitDurationSec > 0
    ? Math.round(((telemetry.waitDurationSec - telemetry.waitTimerRemainingSec) / telemetry.waitDurationSec) * 100)
    : 0;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 w-[94vw] max-w-[920px] ${
        isCollapsed ? 'translate-y-[calc(100%-40px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Tab Button pinned to top edge */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-t-xl bg-slate-900 border-t border-x border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-lg"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-teal-400" />
              <span>Show Smart Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Hide Controls (Cinema View)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Glassmorphic Dock Container */}
      <div className="bg-slate-900/95 text-slate-200 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-3 sm:p-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('mission')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'mission'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>500m Patrol & Wait Cycle</span>
            </button>

            <button
              onClick={() => setActiveTab('sensors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'sensors'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>IoT Telemetry</span>
            </button>

            <button
              onClick={() => setActiveTab('camera')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'camera'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Views & Environment</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'about'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Project Concept</span>
            </button>
          </div>

          {/* Quick Hover Guide Hint */}
          <div className="hidden md:flex items-center gap-1 text-[11px] text-teal-400/90 font-medium bg-teal-950/60 px-2.5 py-1 rounded-md border border-teal-500/20">
            <Sparkles className="w-3 h-3 text-teal-300" />
            <span>Hover dustbin in 3D to start</span>
          </div>
        </div>

        {/* Tab 1: Mission & 500m Patrol / 1-Min Wait Controls */}
        {activeTab === 'mission' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Primary Controls */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={onTogglePatrol}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs cursor-pointer shadow-md transition-all ${
                    isPatrolling
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isPatrolling ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause Patrol</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>{telemetry.state === 'IDLE' ? 'Start Patrol (Hover or Click)' : 'Resume Patrol'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onResetRoute}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                  title="Reset to 0m Start Point"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Simulation Speed Multiplier */}
              <div className="flex items-center justify-between bg-slate-800/70 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
                <span className="text-slate-400 font-medium">Sim Speed:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 5, 10].map((mult) => (
                    <button
                      key={mult}
                      onClick={() => onSetSpeedMultiplier(mult)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        settings.speedMultiplier === mult
                          ? 'bg-teal-500 text-slate-950 font-black'
                          : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 500m Leg Progress Bar */}
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>500m Stop Interval</span>
                </span>
                <span className="text-teal-300 font-mono font-bold">
                  {legProgress}m / 500m
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${legPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                <span>Speed: <strong className="text-slate-200">{telemetry.speedKmh} km/h</strong></span>
                <span>Next Stop: <strong className="text-teal-300">{telemetry.distanceToNextStop}m</strong></span>
              </div>
            </div>

            {/* 1-Minute Wait Timer & Compactor Status */}
            <div
              className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
                isWaiting
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>1-Min Waste Collection Stop</span>
                </span>
                {isWaiting ? (
                  <button
                    onClick={onSkipWait}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-bold text-amber-300 cursor-pointer"
                  >
                    <FastForward className="w-3 h-3" />
                    <span>Skip 1m</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Triggers @ 500m</span>
                )}
              </div>

              {/* 1-Minute Wait Progress */}
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-700/60 my-1">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${isWaiting ? waitPercent : 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] mt-1">
                <span>
                  {isWaiting ? (
                    <strong className="text-amber-400 font-mono">
                      Compacting: {telemetry.waitTimerRemainingSec}s remaining
                    </strong>
                  ) : (
                    <span className="text-slate-400">Rover pauses 60s at every 500m hub</span>
                  )}
                </span>
                <span className="text-slate-400">
                  Stops: <strong className="text-slate-200">{telemetry.totalStopsCompleted}</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: IoT Telemetry & Sensor Array */}
        {activeTab === 'sensors' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Bin Fill Level */}
            <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 flex flex-col gap-1.5">
              <span className="text-slate-400 text-[11px] uppercase font-semibold">Hopper Capacity</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-emerald-400">{telemetry.fillLevelPercent}%</span>
                <span className="text-[11px] text-slate-400">Full</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${telemetry.fillLevelPercent}%` }} />
              </div>
              <span className="text-[10px] text-slate-400">Collected: {telemetry.totalWasteKg} kg waste</span>
            </div>

            {/* Battery & Solar */}
            <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 flex flex-col gap-1.5">
              <span className="text-slate-400 text-[11px] uppercase font-semibold flex items-center gap-1">
                <BatteryCharging className="w-3.5 h-3.5 text-teal-400" />
                <span>Li-Ion & Solar</span>
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-teal-300">{telemetry.batteryPercent}%</span>
                <span className="text-[11px] text-teal-400">+{telemetry.solarInputWatts}W Solar</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400" style={{ width: `${telemetry.batteryPercent}%` }} />
              </div>
              <span className="text-[10px] text-slate-400">CO₂ Avoided: {telemetry.co2SavedKg} kg</span>
            </div>

            {/* LiDAR Radar Dome */}
            <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 flex flex-col gap-1.5">
              <span className="text-slate-400 text-[11px] uppercase font-semibold">360° LiDAR Dome</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-cyan-400">{telemetry.lidarRpm}</span>
                <span className="text-[11px] text-slate-400">RPM</span>
              </div>
              <span className="text-[11px] text-slate-300 font-medium">Laser Cone: Active</span>
              <span className="text-[10px] text-slate-400">
                {telemetry.isHovered ? '⚡ Hover Acceleration 1.6x' : 'Nominal Scan Rate'}
              </span>
            </div>

            {/* Ultrasonic Obstacle Radar */}
            <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 flex flex-col gap-1.5">
              <span className="text-slate-400 text-[11px] uppercase font-semibold">Ultrasonic Eyes</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-emerald-400">{telemetry.obstacleDistanceMeter}m</span>
                <span className="text-[11px] text-slate-400">Range</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold">Path Clear (0 Obstacles)</span>
              <span className="text-[10px] text-slate-400">Lid Servo: {telemetry.lidOpenAngle > 0.5 ? 'OPEN' : 'LOCKED'}</span>
            </div>
          </div>
        )}

        {/* Tab 3: Camera Perspectives & Lighting */}
        {activeTab === 'camera' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            {/* Camera Viewpoints */}
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <span className="text-slate-400 font-medium">Camera Perspective:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'CHASE', label: 'Third-Person Chase' },
                  { id: 'ORBIT', label: 'Free Orbit' },
                  { id: 'HOOD', label: 'Front Hood POV' },
                  { id: 'TOP_DOWN', label: 'Satellite Map' },
                  { id: 'CINEMATIC', label: 'Drone Orbit' },
                ].map((cam) => (
                  <button
                    key={cam.id}
                    onClick={() => onSetCameraMode(cam.id as CameraViewMode)}
                    className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                      settings.cameraMode === cam.id
                        ? 'bg-teal-600 text-white font-semibold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time of Day Presets */}
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <span className="text-slate-400 font-medium">Lighting Atmosphere:</span>
              <div className="flex items-center gap-1.5">
                {(['DAY', 'SUNSET', 'NIGHT'] as TimeOfDay[]).map((tod) => (
                  <button
                    key={tod}
                    onClick={() => onSetTimeOfDay(tod)}
                    className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                      settings.timeOfDay === tod
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {tod}
                  </button>
                ))}

                <button
                  onClick={onToggleSound}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer ml-2"
                >
                  {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-teal-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{settings.soundEnabled ? 'Audio On' : 'Muted'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: About Smart Dustbin Project */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs leading-relaxed text-slate-300">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                <span className="text-emerald-400">01.</span> Green Hub & Curbside Lane
              </h4>
              <p className="text-slate-400 text-[11px]">
                Departs from the <strong>GREEN HUB</strong> central depot through automated bay doors, traveling along the dedicated curbside utility lane on the road edge to keep main traffic clear.
              </p>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                <span className="text-amber-400">02.</span> 500m Stops & Citizen Trash Throw
              </h4>
              <p className="text-slate-400 text-[11px]">
                Every 500m, the rover halts for 1 minute (60s). Motorized hydraulic lid opens, and a 3D animated human citizen approaches to toss waste into the hopper before compaction cycles.
              </p>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                <span className="text-cyan-400">03.</span> Fixed Tyres & PBR Visuals
              </h4>
              <p className="text-slate-400 text-[11px]">
                Upgraded wheels roll smoothly forward along the axle with all-terrain treads, disc calipers, underglow neon, and interactive hover activation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
