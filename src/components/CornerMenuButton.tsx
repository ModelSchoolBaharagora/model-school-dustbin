import React, { useState } from 'react';
import {
  CameraViewMode,
  RoverTelemetry,
  SimulationSettings,
  TimeOfDay,
} from '../types';
import {
  SlidersHorizontal,
  X,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Cpu,
  Camera,
  Sun,
  Volume2,
  VolumeX,
  ShieldAlert,
  Compass,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface CornerMenuProps {
  telemetry: RoverTelemetry;
  settings: SimulationSettings;
  onTogglePatrol: () => void;
  onSkipWait: () => void;
  onResetRoute: () => void;
  onClearObstacle: () => void;
  onRespawnObstacle: () => void;
  onSetSpeedMultiplier: (mult: number) => void;
  onSetCameraMode: (mode: CameraViewMode) => void;
  onSetTimeOfDay: (time: TimeOfDay) => void;
  onToggleSound: () => void;
}

export const CornerMenuButton: React.FC<CornerMenuProps> = ({
  telemetry,
  settings,
  onTogglePatrol,
  onSkipWait,
  onResetRoute,
  onClearObstacle,
  onRespawnObstacle,
  onSetSpeedMultiplier,
  onSetCameraMode,
  onSetTimeOfDay,
  onToggleSound,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'mission' | 'sensors' | 'camera' | 'india'>('mission');

  const isPatrolling = telemetry.state === 'PATROLLING';
  const isWaiting = telemetry.state === 'COLLECTING_WAIT';
  const isObstacle = telemetry.state === 'OBSTACLE_HALT' || telemetry.obstacleDetected;

  // 200m leg calculation
  const legProgress = Math.min(200, Math.max(0, 200 - telemetry.distanceToNextStop));
  const legPercent = Math.round((legProgress / 200) * 100);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Expanded Corner Dashboard Panel */}
      {isOpen && (
        <div className="mb-3 w-[92vw] max-w-[480px] bg-slate-900/98 text-slate-100 border border-slate-700/80 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🇮🇳</span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Smart Dustbin Controls
                </h3>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  Made in India • 200m Intervals
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl mb-3 border border-slate-800">
            <button
              onClick={() => setActiveTab('mission')}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                activeTab === 'mission' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              200m Patrol
            </button>
            <button
              onClick={() => setActiveTab('sensors')}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                activeTab === 'sensors' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              IR & Sensors
            </button>
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                activeTab === 'camera' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Camera & Env
            </button>
            <button
              onClick={() => setActiveTab('india')}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                activeTab === 'india' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Made in India
            </button>
          </div>

          {/* Tab 1: 200m Patrol & Mission Controls */}
          {activeTab === 'mission' && (
            <div className="flex flex-col gap-3 text-xs">
              {/* Primary Patrol Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onTogglePatrol}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold cursor-pointer shadow-md transition-all ${
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
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                  title="Reset to Green Hub"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* 200m Leg Progress */}
              <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    <span>200m Stop Leg</span>
                  </span>
                  <span className="text-teal-300 font-mono font-bold">{legProgress}m / 200m</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-700/60">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${legPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>Speed: <strong className="text-white">{telemetry.speedKmh} km/h</strong></span>
                  <span>Next Stop: <strong className="text-teal-300">{telemetry.distanceToNextStop}m</strong></span>
                </div>
              </div>

              {/* 1-Minute Wait Timer / Skip */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isWaiting
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                }`}
              >
                <div>
                  <span className="font-bold block text-xs">
                    {isWaiting ? `Compaction: ${telemetry.waitTimerRemainingSec}s` : '1-Min Wait every 200m'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isWaiting ? 'Crowd depositing waste into bin' : 'Auto halts at 200m hubs'}
                  </span>
                </div>

                {isWaiting && (
                  <button
                    onClick={onSkipWait}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-sm"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>Skip 1m</span>
                  </button>
                )}
              </div>

              {/* Speed Multipliers */}
              <div className="flex items-center justify-between bg-slate-800/70 px-3 py-2 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 font-medium text-[11px]">Simulation Speed:</span>
                <div className="flex items-center gap-1.5">
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
          )}

          {/* Tab 2: IR Sensors & Animal Obstacle Detection */}
          {activeTab === 'sensors' && (
            <div className="flex flex-col gap-3 text-xs">
              {/* Obstacle Status Card */}
              <div
                className={`p-3 rounded-xl border ${
                  isObstacle
                    ? 'bg-red-950/60 border-red-500/70 text-red-200'
                    : 'bg-slate-800/70 border-slate-700/60 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold flex items-center gap-1.5 text-xs">
                    {isObstacle ? (
                      <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>{isObstacle ? 'Obstacle Detected: Indian Cow (Gay/Bail)' : 'Path Clear (0 Obstacles)'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  {isObstacle
                    ? `IR & Sonar detected animal at ${telemetry.obstacleDistanceMeter}m. Auto-halt engaged!`
                    : 'IR and ultrasonic sensors scanning road and white shoulder line.'}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onClearObstacle}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                  >
                    Clear Cow From Path
                  </button>
                  <button
                    onClick={onRespawnObstacle}
                    className="flex-1 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[11px] cursor-pointer"
                  >
                    Respawn Cow
                  </button>
                </div>
              </div>

              {/* Sensor Diagnostic Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">IR Proximity Array</span>
                  <span className="text-emerald-400 font-bold font-mono text-xs">
                    FL: {telemetry.sensors.irFrontLeftMm}mm • FR: {telemetry.sensors.irFrontRightMm}mm
                  </span>
                  <span className="text-slate-400 block text-[10px] mt-0.5">4x Infrared Transceivers</span>
                </div>

                <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">White Line Tracking</span>
                  <span className="text-teal-300 font-bold font-mono text-xs">
                    {telemetry.sensors.whiteLineTrackingLocked ? 'LOCKED ON EDGE LINE' : 'SEARCHING'}
                  </span>
                  <span className="text-slate-400 block text-[10px] mt-0.5">Side IR Ground Sensor</span>
                </div>

                <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ultrasonic Sonar</span>
                  <span className="text-cyan-400 font-bold font-mono text-xs">
                    Range: {telemetry.sensors.sonarDistanceMeter} m
                  </span>
                  <span className="text-slate-400 block text-[10px] mt-0.5">HC-SR04 Dual Eyes</span>
                </div>

                <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">360° LiDAR Dome</span>
                  <span className="text-teal-400 font-bold font-mono text-xs">{telemetry.lidarRpm} RPM</span>
                  <span className="text-slate-400 block text-[10px] mt-0.5">Laser Cone: Active</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Camera & Environment */}
          {activeTab === 'camera' && (
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1.5 font-medium">Camera Perspective:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'CHASE', label: 'Third-Person Chase' },
                    { id: 'ORBIT', label: 'Free Orbit' },
                    { id: 'HOOD', label: 'Front Hood POV' },
                    { id: 'TOP_DOWN', label: 'Satellite Map' },
                    { id: 'CINEMATIC', label: 'Drone Orbit' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onSetCameraMode(c.id as CameraViewMode)}
                      className={`p-2 rounded-lg font-medium cursor-pointer transition-colors ${
                        settings.cameraMode === c.id
                          ? 'bg-teal-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1.5 font-medium">Lighting Atmosphere:</span>
                <div className="flex items-center gap-1.5">
                  {(['DAY', 'SUNSET', 'NIGHT'] as TimeOfDay[]).map((tod) => (
                    <button
                      key={tod}
                      onClick={() => onSetTimeOfDay(tod)}
                      className={`flex-1 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                        settings.timeOfDay === tod
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {tod}
                    </button>
                  ))}

                  <button
                    onClick={onToggleSound}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer ml-1"
                    title="Audio Mute Toggle"
                  >
                    {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Made in India */}
          {activeTab === 'india' && (
            <div className="flex flex-col gap-2.5 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 flex items-center gap-3">
                <span className="text-3xl">🇮🇳</span>
                <div>
                  <h4 className="font-bold text-white text-sm">Made in India Project</h4>
                  <p className="text-[11px] text-teal-400 font-mono">Swachh Bharat Autonomous Robotics</p>
                </div>
              </div>

              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60 text-[11px] space-y-1">
                <p><strong>• White Line Navigation:</strong> Follows the road white shoulder line without obstructing traffic.</p>
                <p><strong>• 200m Intervals:</strong> Stops every 200 meters at collection hubs for 1 minute.</p>
                <p><strong>• Obstacle Avoidance:</strong> Automatically halts for cows (gay/bail), vehicles, or pedestrians using IR & Sonar.</p>
                <p><strong>• Green Hub Depot:</strong> Dispatches and recharges with 100% rooftop solar energy.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Menu Button in Corner */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 px-4 py-3 rounded-full font-bold text-xs shadow-2xl cursor-pointer transition-all duration-300 ${
          isOpen
            ? 'bg-slate-800 text-white border border-slate-600'
            : isObstacle
            ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/30'
        }`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span>{isOpen ? 'Close Controls' : '🇮🇳 Controls & Menu'}</span>
        {isObstacle && (
          <span className="px-1.5 py-0.5 rounded-full bg-white text-red-600 font-extrabold text-[10px]">
            ALERT
          </span>
        )}
      </button>
    </div>
  );
};
