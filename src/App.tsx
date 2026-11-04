import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from './three/SceneManager';
import { HeaderBar } from './components/HeaderBar';
import { CornerMenuButton } from './components/CornerMenuButton';
import { StationArrivalBanner } from './components/StationArrivalBanner';
import { HoverBadge } from './components/HoverBadge';
import {
  CameraViewMode,
  CollectionStation,
  RoverTelemetry,
  SimulationSettings,
  TimeOfDay,
} from './types';

const defaultTelemetry: RoverTelemetry = {
  state: 'PATROLLING',
  speedKmh: 30,
  distanceTraveledMeter: 0,
  distanceToNextStop: 200,
  currentStationIndex: 0,
  waitTimerRemainingSec: 60,
  waitDurationSec: 60,
  fillLevelPercent: 18,
  batteryPercent: 98,
  solarInputWatts: 140,
  lidOpenAngle: 0,
  compactorActive: false,
  totalWasteKg: 0,
  totalStopsCompleted: 0,
  co2SavedKg: 0,
  obstacleDetected: false,
  obstacleType: 'Indian Cow (Gay/Bail)',
  obstacleDistanceMeter: 14.8,
  lidarRpm: 280,
  isHovered: false,
  sensors: {
    irFrontLeftMm: 4500,
    irFrontRightMm: 4800,
    irSideCurbsideMm: 120,
    sonarDistanceMeter: 14.8,
    lidarTargetCount: 0,
    loadCellKg: 0,
    opticalFillPercent: 18,
    whiteLineTrackingLocked: true,
  },
};

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  const [telemetry, setTelemetry] = useState<RoverTelemetry>(defaultTelemetry);
  const [currentStation, setCurrentStation] = useState<CollectionStation | null>(null);
  const [settings, setSettings] = useState<SimulationSettings>({
    speedMultiplier: 1,
    soundEnabled: true,
    timeOfDay: 'DAY',
    cameraMode: 'CHASE',
    autoPatrol: true,
    trafficEnabled: true,
    animalObstacleActive: true,
  });

  const handleTelemetryUpdate = useCallback((newTelemetry: RoverTelemetry) => {
    setTelemetry(newTelemetry);
  }, []);

  const handleStationArrival = useCallback((station: CollectionStation) => {
    setCurrentStation(station);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    const manager = new SceneManager(
      mountRef.current,
      handleTelemetryUpdate,
      handleStationArrival
    );
    sceneManagerRef.current = manager;

    // Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        manager.togglePatrol();
      } else if (e.code === 'KeyS') {
        manager.skipWait();
      } else if (e.code === 'KeyR') {
        manager.resetRoute();
      } else if (e.code === 'KeyO') {
        manager.clearObstacle();
      } else if (e.code === 'KeyC') {
        setSettings((prev) => {
          const modes: CameraViewMode[] = ['CHASE', 'ORBIT', 'HOOD', 'TOP_DOWN', 'CINEMATIC'];
          const nextIdx = (modes.indexOf(prev.cameraMode) + 1) % modes.length;
          const nextMode = modes[nextIdx];
          manager.setCameraMode(nextMode);
          return { ...prev, cameraMode: nextMode };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, [handleTelemetryUpdate, handleStationArrival]);

  // Actions
  const handleTogglePatrol = () => {
    sceneManagerRef.current?.togglePatrol();
  };

  const handleSkipWait = () => {
    sceneManagerRef.current?.skipWait();
    setCurrentStation(null);
  };

  const handleResetRoute = () => {
    sceneManagerRef.current?.resetRoute();
    setCurrentStation(null);
  };

  const handleClearObstacle = () => {
    sceneManagerRef.current?.clearObstacle();
  };

  const handleRespawnObstacle = () => {
    sceneManagerRef.current?.respawnObstacle();
  };

  const handleSetSpeedMultiplier = (mult: number) => {
    setSettings((prev) => ({ ...prev, speedMultiplier: mult }));
    sceneManagerRef.current?.setSpeedMultiplier(mult);
  };

  const handleSetCameraMode = (mode: CameraViewMode) => {
    setSettings((prev) => ({ ...prev, cameraMode: mode }));
    sceneManagerRef.current?.setCameraMode(mode);
  };

  const handleSetTimeOfDay = (time: TimeOfDay) => {
    setSettings((prev) => ({ ...prev, timeOfDay: time }));
    sceneManagerRef.current?.setTimeOfDay(time);
  };

  const handleToggleSound = () => {
    const nextSound = !settings.soundEnabled;
    setSettings((prev) => ({ ...prev, soundEnabled: nextSound }));
    sceneManagerRef.current?.setSoundEnabled(nextSound);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Header Bar */}
      <HeaderBar
        telemetry={telemetry}
        soundEnabled={settings.soundEnabled}
        onToggleSound={handleToggleSound}
        timeOfDay={settings.timeOfDay}
        onChangeTime={handleSetTimeOfDay}
        onQuickTogglePatrol={handleTogglePatrol}
        onClearObstacle={handleClearObstacle}
      />

      {/* Hover State Banner */}
      <HoverBadge isHovered={telemetry.isHovered} state={telemetry.state} />

      {/* 200m Station 1-Minute Wait Banner with Crowd Animation */}
      {telemetry.state === 'COLLECTING_WAIT' && (
        <StationArrivalBanner
          station={currentStation}
          remainingSec={telemetry.waitTimerRemainingSec}
          onSkipWait={handleSkipWait}
        />
      )}

      {/* Corner Single Button Controls Menu (Clean & Unobstructed 3D View) */}
      <CornerMenuButton
        telemetry={telemetry}
        settings={settings}
        onTogglePatrol={handleTogglePatrol}
        onSkipWait={handleSkipWait}
        onResetRoute={handleResetRoute}
        onClearObstacle={handleClearObstacle}
        onRespawnObstacle={handleRespawnObstacle}
        onSetSpeedMultiplier={handleSetSpeedMultiplier}
        onSetCameraMode={handleSetCameraMode}
        onSetTimeOfDay={handleSetTimeOfDay}
        onToggleSound={handleToggleSound}
      />

      {/* Keyboard Shortcuts Hint */}
      <div className="absolute bottom-4 left-4 hidden lg:flex items-center gap-2 text-[10px] text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 pointer-events-none z-10">
        <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">SPACE</kbd> Patrol</span>
        <span className="text-slate-600">•</span>
        <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">O</kbd> Clear Cow</span>
        <span className="text-slate-600">•</span>
        <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">S</kbd> Skip 1m</span>
        <span className="text-slate-600">•</span>
        <span><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">C</kbd> Camera</span>
      </div>
    </div>
  );
}
