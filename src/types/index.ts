export type RoverState =
  | 'IDLE'
  | 'PATROLLING'
  | 'OBSTACLE_HALT'
  | 'COLLECTING_WAIT'
  | 'RESUMING';

export type CameraViewMode = 'CHASE' | 'ORBIT' | 'TOP_DOWN' | 'HOOD' | 'CINEMATIC';

export type TimeOfDay = 'DAY' | 'SUNSET' | 'NIGHT';

export interface CollectionStation {
  id: number;
  name: string;
  distanceMeter: number;
  curveT: number;
  position: { x: number; y: number; z: number };
  binLevel: number;
  totalCollectedKg: number;
  address: string;
}

export interface SensorReadouts {
  irFrontLeftMm: number;
  irFrontRightMm: number;
  irSideCurbsideMm: number;
  sonarDistanceMeter: number;
  lidarTargetCount: number;
  loadCellKg: number;
  opticalFillPercent: number;
  whiteLineTrackingLocked: boolean;
}

export interface RoverTelemetry {
  state: RoverState;
  speedKmh: number;
  distanceTraveledMeter: number;
  distanceToNextStop: number;
  currentStationIndex: number;
  waitTimerRemainingSec: number;
  waitDurationSec: number;
  fillLevelPercent: number;
  batteryPercent: number;
  solarInputWatts: number;
  lidOpenAngle: number;
  compactorActive: boolean;
  totalWasteKg: number;
  totalStopsCompleted: number;
  co2SavedKg: number;
  obstacleDetected: boolean;
  obstacleType: string;
  obstacleDistanceMeter: number;
  lidarRpm: number;
  isHovered: boolean;
  sensors: SensorReadouts;
}

export interface SimulationSettings {
  speedMultiplier: number;
  soundEnabled: boolean;
  timeOfDay: TimeOfDay;
  cameraMode: CameraViewMode;
  autoPatrol: boolean;
  trafficEnabled: boolean;
  animalObstacleActive: boolean;
}
