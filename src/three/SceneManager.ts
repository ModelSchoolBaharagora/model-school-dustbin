import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  CameraViewMode,
  CollectionStation,
  RoverTelemetry,
  SimulationSettings,
  TimeOfDay,
} from '../types';
import { sounds } from '../audio/soundEffects';
import { build3DCity, CityBuildResult } from './cityBuilder';
import { buildSmartDustbinModel, SmartDustbinModel } from './dustbinModel';
import { buildIndianCow, buildTrafficVehicles, IndianCowModel, TrafficLightColor, TrafficVehicle } from './animalsAndTraffic';

export class SceneManager {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();

  // City, Rover & Traffic
  private cityData!: CityBuildResult;
  private rover!: SmartDustbinModel;
  private cowObstacle!: IndianCowModel;
  private trafficVehicles: TrafficVehicle[] = [];

  // White Line Tracking: Road width is 8.5. The white line is at +3.0 units from center!
  private readonly WHITE_LINE_OFFSET = 3.0;

  // Lighting
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private ambientLight!: THREE.AmbientLight;

  // Raycasting & Interaction
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private pointer: THREE.Vector2 = new THREE.Vector2(-999, -999);
  private isHovered: boolean = false;
  private wasHovered: boolean = false;

  // 200m Interval & Simulation State
  private readonly STOP_INTERVAL_METER = 200;
  private curveT: number = 0.0;
  private currentDistanceMeter: number = 0.0;
  private currentStopIndex: number = 0;
  private state: 'IDLE' | 'PATROLLING' | 'OBSTACLE_HALT' | 'COLLECTING_WAIT' | 'RESUMING' = 'PATROLLING';
  private waitRemainingSec: number = 60.0;
  private readonly WAIT_DURATION_SEC: number = 60.0;
  private totalWasteKg: number = 0;
  private stopsCompleted: number = 0;
  private fillPercent: number = 18;
  private batteryPercent: number = 98;

  // Traffic Light & Zebra Crossing
  private currentTrafficLightColor: TrafficLightColor = 'GREEN';
  private isWaitingAtTrafficLight: boolean = false;

  // Obstacle state & auto-evasion
  private obstacleActive: boolean = true;
  private obstacleDetected: boolean = false;
  private obstacleDistance: number = 999;
  private cowCurveT: number = 0.31;
  private hornCooldownTimer: number = 0;

  // Zero-GC reusable math vectors
  private _up: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private _roadPt: THREE.Vector3 = new THREE.Vector3();
  private _tangent: THREE.Vector3 = new THREE.Vector3();
  private _normal: THREE.Vector3 = new THREE.Vector3();
  private _whiteLinePos: THREE.Vector3 = new THREE.Vector3();
  private _lookTarget: THREE.Vector3 = new THREE.Vector3();
  private _cameraPosTarget: THREE.Vector3 = new THREE.Vector3();
  private _cameraLookTarget: THREE.Vector3 = new THREE.Vector3();

  // Settings
  private settings: SimulationSettings = {
    speedMultiplier: 1,
    soundEnabled: true,
    timeOfDay: 'DAY',
    cameraMode: 'CHASE',
    autoPatrol: true,
    trafficEnabled: true,
    animalObstacleActive: true,
  };

  private onTelemetryUpdate?: (telemetry: RoverTelemetry) => void;
  private onStationArrival?: (station: CollectionStation) => void;

  constructor(
    container: HTMLDivElement,
    onTelemetryUpdate?: (telemetry: RoverTelemetry) => void,
    onStationArrival?: (station: CollectionStation) => void
  ) {
    this.container = container;
    this.onTelemetryUpdate = onTelemetryUpdate;
    this.onStationArrival = onStationArrival;

    this.initWebGL();
    this.initScene();
    this.initEventListeners();
    this.startLoop();
  }

  private initWebGL() {
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    this.container.appendChild(this.renderer.domElement);
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.005);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      0.5,
      1000
    );
    this.camera.position.set(0, 16, 26);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 260;

    // PMREM
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.6);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfffaed, 1.85);
    this.dirLight.position.set(65, 95, 45);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    // Build City & Dustbin
    this.cityData = build3DCity(this.renderer);
    this.scene.add(this.cityData.sceneGroup);

    this.rover = buildSmartDustbinModel(this.renderer);
    this.scene.add(this.rover.rootGroup);

    // Build Indian Cow Obstacle (Gay / Bail)
    this.cowObstacle = buildIndianCow(this.renderer);
    this.positionCowObstacle(this.cowCurveT);
    this.scene.add(this.cowObstacle.rootGroup);

    // Build City Traffic
    this.trafficVehicles = buildTrafficVehicles(this.renderer);
    this.trafficVehicles.forEach((v) => this.scene.add(v.group));

    // Place rover on side white line at Green Hub
    this.updateRoverWhiteLinePosition(0.0);
    this.applyTimeOfDay('DAY');

    // Auto-start patrol immediately from Green Hub on load without click or touch
    this.state = 'PATROLLING';
    this.cityData.greenHubDoor.position.y = 5.2; // Open Green Hub bay door
    sounds.updateMotorSound(30.0, true);

    // Initial camera placement on opposite side (road/traffic side looking across dustbin towards sidewalk)
    const startTangent = this.cityData.roadCurve.getTangentAt(0.0).normalize();
    const startNormal = new THREE.Vector3().crossVectors(startTangent, this._up).normalize();
    const startRoverPos = this.rover.rootGroup.position;
    this.camera.position
      .copy(startRoverPos)
      .addScaledVector(startTangent, -5.5)
      .addScaledVector(startNormal, -4.8)
      .add(new THREE.Vector3(0, 2.6, 0));
    this.controls.target.copy(startRoverPos).add(new THREE.Vector3(0, 1.2, 0));
    this.controls.update();
  }

  private positionCowObstacle(t: number) {
    const pt = this.cityData.roadCurve.getPointAt(t);
    const tangent = this.cityData.roadCurve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, this._up).normalize();

    const cowPos = pt.clone().addScaledVector(normal, this.WHITE_LINE_OFFSET - 0.2);
    this.cowObstacle.rootGroup.position.copy(cowPos);
    this.cowObstacle.rootGroup.lookAt(cowPos.clone().addScaledVector(normal, -1.0));
    this.cowObstacle.resetWalkingOff();
  }

  private initEventListeners() {
    window.addEventListener('resize', this.onResize);
    this.container.addEventListener('pointermove', this.onPointerMove);
    this.container.addEventListener('click', this.onClick);
  }

  private onResize = () => {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onPointerMove = (e: MouseEvent) => {
    const rect = this.container.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  };

  private onClick = () => {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (this.obstacleActive) {
      const cowHits = this.raycaster.intersectObject(this.cowObstacle.colliderMesh, true);
      if (cowHits.length > 0) {
        this.clearObstacle();
        return;
      }
    }

    const roverHits = this.raycaster.intersectObject(this.rover.colliderMesh, true);
    if (roverHits.length > 0) {
      this.togglePatrol();
    }
  };

  public togglePatrol() {
    if (this.state === 'IDLE' || this.state === 'OBSTACLE_HALT') {
      this.state = 'PATROLLING';
      this.cityData.greenHubDoor.position.y = 5.2;
      sounds.playResumeHorn();
    } else if (this.state === 'PATROLLING') {
      this.state = 'IDLE';
    } else if (this.state === 'COLLECTING_WAIT') {
      this.skipWait();
    }
  }

  public clearObstacle() {
    const tangent = this.cityData.roadCurve.getTangentAt(this.cowCurveT).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, this._up).normalize();
    // Make cow walk off the road towards the grass
    this.cowObstacle.startWalkingOff(normal);
    sounds.playObstacleHorn();
  }

  public respawnObstacle() {
    this.obstacleActive = true;
    this.cowCurveT = (this.curveT + 0.18) % 1.0;
    this.positionCowObstacle(this.cowCurveT);
  }

  public skipWait() {
    if (this.state === 'COLLECTING_WAIT') {
      this.waitRemainingSec = 0;
    }
  }

  public resetRoute() {
    this.curveT = 0.0;
    this.currentDistanceMeter = 0.0;
    this.currentStopIndex = 0;
    this.state = 'IDLE';
    this.waitRemainingSec = this.WAIT_DURATION_SEC;
    this.fillPercent = 18;
    this.cityData.greenHubDoor.position.y = 1.9;
    this.updateRoverWhiteLinePosition(0.0);
    this.respawnObstacle();
  }

  public setSpeedMultiplier(mult: number) {
    this.settings.speedMultiplier = mult;
  }

  public setSoundEnabled(enabled: boolean) {
    this.settings.soundEnabled = enabled;
    sounds.setMuted(!enabled);
  }

  public setCameraMode(mode: CameraViewMode) {
    this.settings.cameraMode = mode;
  }

  public setTimeOfDay(time: TimeOfDay) {
    this.settings.timeOfDay = time;
    this.applyTimeOfDay(time);
  }

  private applyTimeOfDay(time: TimeOfDay) {
    if (time === 'DAY') {
      this.scene.background = new THREE.Color(0x87ceeb);
      this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.005);
      this.dirLight.color.setHex(0xfffaed);
      this.dirLight.intensity = 1.85;
      this.hemiLight.color.setHex(0xffffff);
      this.hemiLight.groundColor.setHex(0x334155);
      this.ambientLight.intensity = 0.45;
      this.rover.headlights.forEach((h) => (h.intensity = 0.5));
      this.cityData.streetLights.forEach((l) => (l.intensity = 0.1));
    } else if (time === 'SUNSET') {
      this.scene.background = new THREE.Color(0xfdba74);
      this.scene.fog = new THREE.FogExp2(0xfdba74, 0.007);
      this.dirLight.color.setHex(0xf97316);
      this.dirLight.intensity = 2.2;
      this.hemiLight.color.setHex(0xfb923c);
      this.ambientLight.intensity = 0.35;
      this.rover.headlights.forEach((h) => (h.intensity = 2.0));
      this.cityData.streetLights.forEach((l) => (l.intensity = 0.7));
    } else {
      // NIGHT
      this.scene.background = new THREE.Color(0x050b14);
      this.scene.fog = new THREE.FogExp2(0x050b14, 0.012);
      this.dirLight.color.setHex(0x38bdf8);
      this.dirLight.intensity = 0.25;
      this.hemiLight.color.setHex(0x1e293b);
      this.ambientLight.intensity = 0.18;
      this.rover.headlights.forEach((h) => (h.intensity = 3.8));
      this.cityData.streetLights.forEach((l) => (l.intensity = 1.8));
    }
  }

  private updateRoverWhiteLinePosition(t: number) {
    const wrappedT = ((t % 1.0) + 1.0) % 1.0;
    this.cityData.roadCurve.getPointAt(wrappedT, this._roadPt);
    this.cityData.roadCurve.getTangentAt(wrappedT, this._tangent).normalize();
    this._normal.crossVectors(this._tangent, this._up).normalize();

    this._whiteLinePos.copy(this._roadPt).addScaledVector(this._normal, this.WHITE_LINE_OFFSET);

    this.rover.rootGroup.position.copy(this._whiteLinePos);
    this._lookTarget.copy(this._whiteLinePos).add(this._tangent);
    this.rover.rootGroup.lookAt(this._lookTarget);
  }

  private startLoop() {
    const tick = () => {
      const rawDelta = Math.min(this.clock.getDelta(), 0.1);
      const effectiveDelta = rawDelta * this.settings.speedMultiplier;

      this.updateSimulation(effectiveDelta);
      this.updateCamera(rawDelta);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 70);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updateSimulation(delta: number) {
    // 1. Raycast hover detection
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObject(this.rover.colliderMesh, true);
    this.isHovered = intersects.length > 0;

    if (this.isHovered && !this.wasHovered) {
      sounds.playHoverChime();
      if (this.state === 'IDLE') {
        this.state = 'PATROLLING';
        this.cityData.greenHubDoor.position.y = 5.2;
        sounds.playResumeHorn();
      }
    }
    this.wasHovered = this.isHovered;

    // 2. Animate Traffic & Cow
    this.trafficVehicles.forEach((v) =>
      v.update(delta, this.cityData.roadCurve, this.cityData.roadLengthMeters)
    );
    this.cowObstacle.updateAnimation(delta);

    // 3. Update Traffic Light Cycle
    this.currentTrafficLightColor = this.cityData.trafficLight.update(delta);

    // 4. Zebra Crossing & Traffic Light Proximity Check
    const distToZebra = Math.abs(this.curveT - this.cityData.trafficLight.curveT);
    const isAtZebraStopLine = distToZebra < 0.022 && this.curveT < this.cityData.trafficLight.curveT;

    if (isAtZebraStopLine) {
      if (this.currentTrafficLightColor === 'RED' || this.currentTrafficLightColor === 'YELLOW') {
        this.isWaitingAtTrafficLight = true;
      } else {
        if (this.isWaitingAtTrafficLight) {
          sounds.playResumeHorn();
          this.isWaitingAtTrafficLight = false;
        }
      }
    } else {
      this.isWaitingAtTrafficLight = false;
    }

    // 5. Obstacle Detection & Automatic Horn + Evasion
    this.hornCooldownTimer -= delta;
    if (this.obstacleActive && !this.cowObstacle.isOffRoad) {
      this.obstacleDistance = this.rover.rootGroup.position.distanceTo(
        this.cowObstacle.rootGroup.position
      );

      if (this.obstacleDistance < 6.8) {
        this.obstacleDetected = true;

        // Auto-honk horn if not already walking off!
        if (!this.cowObstacle.isWalkingOff && this.hornCooldownTimer <= 0) {
          sounds.playObstacleHorn();
          this.hornCooldownTimer = 2.0;

          // Cow automatically reacts to the horn and walks off the road onto the grass!
          const tangent = this.cityData.roadCurve.getTangentAt(this.cowCurveT).normalize();
          const normal = new THREE.Vector3().crossVectors(tangent, this._up).normalize();
          this.cowObstacle.startWalkingOff(normal);
        }

        if (this.state === 'PATROLLING') {
          this.state = 'OBSTACLE_HALT';
        }
      } else {
        this.obstacleDetected = false;
        if (this.state === 'OBSTACLE_HALT') {
          this.state = 'PATROLLING';
        }
      }
    } else if (this.cowObstacle.isOffRoad) {
      // Cow has completely cleared the road! Auto-resume!
      if (this.state === 'OBSTACLE_HALT') {
        sounds.playResumeHorn();
        this.state = 'PATROLLING';
      }
      this.obstacleDetected = false;
      this.obstacleDistance = 999;
    }

    // 6. State Machine (200m interval and 1-min wait)
    let speedKmh = 0;
    let lidOpenTarget = 0;
    let compactorActive = false;
    let stateText = 'IDLE • GREEN HUB DEPOT';
    let stateColor = 0x06b6d4;

    const ROAD_LENGTH = this.cityData.roadLengthMeters;
    const STOPS_COUNT = 5;

    if (this.state === 'OBSTACLE_HALT') {
      speedKmh = 0;
      lidOpenTarget = 0;
      compactorActive = false;
      stateText = '⚠️ HONKING HORN: COW CLEARING ROAD';
      stateColor = 0xef4444;
    } else if (this.isWaitingAtTrafficLight) {
      speedKmh = 0;
      lidOpenTarget = 0;
      compactorActive = false;
      stateText = '🚦 TRAFFIC SIGNAL RED • STOPPED AT ZEBRA';
      stateColor = 0xef4444;
    } else if (this.state === 'PATROLLING') {
      speedKmh = 30.0;
      stateText = 'PATROL • WHITE LINE (200M INTERVAL)';
      stateColor = 0x10b981;

      const speedMps = (speedKmh * 1000) / 3600;
      const distTraveledThisFrame = speedMps * delta;
      this.currentDistanceMeter += distTraveledThisFrame;

      this.curveT = (this.currentDistanceMeter / ROAD_LENGTH) % 1.0;
      this.updateRoverWhiteLinePosition(this.curveT);

      // Check distance to next 200m stop
      const nextStopDistance = (this.currentStopIndex + 1) * this.STOP_INTERVAL_METER;
      if (this.currentDistanceMeter >= nextStopDistance) {
        this.state = 'COLLECTING_WAIT';
        this.waitRemainingSec = this.WAIT_DURATION_SEC;
        this.currentStopIndex = (this.currentStopIndex + 1) % STOPS_COUNT;

        sounds.playStationArrivalChime();
        sounds.playServoSound(true);

        // Trigger Queue Citizen Crowd to toss trash one by one!
        const crowd = this.cityData.stationCrowds[this.currentStopIndex];
        if (crowd) {
          crowd.startSequentialToss(this.rover.rootGroup.position);
        }

        if (this.onStationArrival) {
          const st = this.cityData.stations[this.currentStopIndex];
          this.onStationArrival(st);
        }
      }
    } else if (this.state === 'COLLECTING_WAIT') {
      speedKmh = 0;
      lidOpenTarget = 1.0;
      compactorActive = true;
      stateText = `QUEUE TRASH TOSS • WAIT ${Math.ceil(this.waitRemainingSec)}s`;
      stateColor = 0xf59e0b;

      // Update citizens stepping up one by one in sequence and passing exact dustbin position
      const crowd = this.cityData.stationCrowds[this.currentStopIndex];
      if (crowd) {
        crowd.updateQueue(delta, this.rover.rootGroup.position);
        if (crowd.hasAnyTossed) {
          this.rover.triggerTrashImpact();
        }
      }

      this.waitRemainingSec -= delta;
      if (Math.random() < 0.05 * delta) {
        sounds.playCompactorSound();
      }

      if (this.waitRemainingSec <= 0) {
        this.state = 'RESUMING';
        this.waitRemainingSec = 0;
        this.stopsCompleted += 1;
        this.totalWasteKg += 42.0;
        this.fillPercent = Math.min(95, this.fillPercent + 14);
        sounds.playServoSound(false);
      }
    } else if (this.state === 'RESUMING') {
      speedKmh = 4.0;
      lidOpenTarget = 0.0;
      compactorActive = false;
      stateText = '1-MIN STOP COMPLETED • RESUMING';
      stateColor = 0x38bdf8;
      sounds.playResumeHorn();
      this.state = 'PATROLLING';
    } else {
      speedKmh = 0;
      lidOpenTarget = 0.0;
      compactorActive = false;
      stateText = 'HOVER / CLICK TO START PATROL';
      stateColor = 0x06b6d4;
    }

    sounds.updateMotorSound(speedKmh, this.state === 'PATROLLING');

    const nextT = (this.curveT + 0.01) % 1.0;
    const curTangent = this.cityData.roadCurve.getTangentAt(this.curveT);
    const nextTangent = this.cityData.roadCurve.getTangentAt(nextT);
    const steerAngle = (nextTangent.x * curTangent.z - nextTangent.z * curTangent.x) * 4.0;

    this.rover.updateAnimations(
      delta,
      speedKmh,
      lidOpenTarget,
      compactorActive,
      this.isHovered,
      this.obstacleDetected || this.isWaitingAtTrafficLight,
      stateText,
      stateColor,
      this.fillPercent,
      steerAngle
    );

    if (this.state === 'PATROLLING') {
      this.batteryPercent = Math.max(12, this.batteryPercent - delta * 0.012);
    }
    const solarWatts = this.settings.timeOfDay === 'DAY' ? 140 : this.settings.timeOfDay === 'SUNSET' ? 45 : 0;

    if (this.onTelemetryUpdate) {
      const nextStationDist = (this.currentStopIndex + 1) * this.STOP_INTERVAL_METER - this.currentDistanceMeter;
      this.onTelemetryUpdate({
        state: this.state,
        speedKmh: Math.round(speedKmh * 10) / 10,
        distanceTraveledMeter: Math.round(this.currentDistanceMeter),
        distanceToNextStop: Math.max(0, Math.round(nextStationDist)),
        currentStationIndex: this.currentStopIndex,
        waitTimerRemainingSec: Math.max(0, Math.ceil(this.waitRemainingSec)),
        waitDurationSec: this.WAIT_DURATION_SEC,
        fillLevelPercent: this.fillPercent,
        batteryPercent: Math.round(this.batteryPercent),
        solarInputWatts: solarWatts,
        lidOpenAngle: lidOpenTarget,
        compactorActive,
        totalWasteKg: Math.round(this.totalWasteKg),
        totalStopsCompleted: this.stopsCompleted,
        co2SavedKg: Math.round(this.totalWasteKg * 0.85 * 10) / 10,
        obstacleDetected: this.obstacleDetected || this.isWaitingAtTrafficLight,
        obstacleType: this.isWaitingAtTrafficLight ? 'Zebra Traffic Light RED' : 'Indian Cow (Gay/Bail)',
        obstacleDistanceMeter: this.isWaitingAtTrafficLight ? 2.5 : Math.round(this.obstacleDistance * 10) / 10,
        lidarRpm: this.isHovered ? 450 : 280,
        isHovered: this.isHovered,
        sensors: {
          irFrontLeftMm: this.obstacleDetected ? Math.round(this.obstacleDistance * 1000) : 4500,
          irFrontRightMm: this.obstacleDetected ? Math.round(this.obstacleDistance * 1000) : 4800,
          irSideCurbsideMm: 120,
          sonarDistanceMeter: this.isWaitingAtTrafficLight ? 2.5 : Math.round(this.obstacleDistance * 10) / 10,
          lidarTargetCount: this.obstacleDetected ? 3 : 0,
          loadCellKg: Math.round(this.totalWasteKg),
          opticalFillPercent: this.fillPercent,
          whiteLineTrackingLocked: true,
        },
      });
    }
  }

  /**
   * Length-side Camera View Angle:
   * Sets the camera at a length-side profile (three-quarters side angle)
   * so the user can inspect the full side length of the dustbin, the white line, the opening lid, and the crowd!
   */
  private updateCamera(delta: number) {
    const roverPos = this.rover.rootGroup.position;
    const wrappedT = ((this.curveT % 1.0) + 1.0) % 1.0;
    const tangent = this.cityData.roadCurve.getTangentAt(wrappedT).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, this._up).normalize();

    if (this.settings.cameraMode === 'CHASE') {
      // Opposite-Side Length Profile Camera:
      // Offset backwards by -5.5 along tangent, and on OPPOSITE side (-normal by -4.8, road/traffic side)
      // View looks across the dustbin rover directly towards the opening lid, sidewalk queue, and station!
      this._cameraPosTarget
        .copy(roverPos)
        .addScaledVector(tangent, -5.5)
        .addScaledVector(normal, -4.8)
        .add(new THREE.Vector3(0, 2.6, 0));

      this._cameraLookTarget.copy(roverPos).add(new THREE.Vector3(0, 1.2, 0));

      this.camera.position.lerp(this._cameraPosTarget, THREE.MathUtils.damp(0, 1, 6, delta));
      this.controls.target.lerp(this._cameraLookTarget, THREE.MathUtils.damp(0, 1, 8, delta));
      this.controls.update();
    } else if (this.settings.cameraMode === 'HOOD') {
      this._cameraPosTarget
        .copy(roverPos)
        .addScaledVector(tangent, 1.3)
        .add(new THREE.Vector3(0, 1.8, 0));

      this._cameraLookTarget.copy(roverPos).addScaledVector(tangent, 16);

      this.camera.position.lerp(this._cameraPosTarget, THREE.MathUtils.damp(0, 1, 10, delta));
      this.controls.target.copy(this._cameraLookTarget);
      this.controls.update();
    } else if (this.settings.cameraMode === 'TOP_DOWN') {
      this._cameraPosTarget.set(roverPos.x, 85, roverPos.z);
      this.camera.position.lerp(this._cameraPosTarget, THREE.MathUtils.damp(0, 1, 4, delta));
      this.controls.target.lerp(roverPos, THREE.MathUtils.damp(0, 1, 6, delta));
      this.controls.update();
    } else if (this.settings.cameraMode === 'CINEMATIC') {
      const angle = this.clock.getElapsedTime() * 0.4;
      const radius = 10.5;
      this._cameraPosTarget.set(
        roverPos.x + Math.cos(angle) * radius,
        roverPos.y + 4.5,
        roverPos.z + Math.sin(angle) * radius
      );
      this.camera.position.lerp(this._cameraPosTarget, THREE.MathUtils.damp(0, 1, 4, delta));
      this.controls.target.lerp(roverPos, THREE.MathUtils.damp(0, 1, 6, delta));
      this.controls.update();
    } else {
      if (this.controls.enabled) {
        this.controls.update();
      }
    }
  }

  public dispose() {
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onResize);
    this.container.removeEventListener('pointermove', this.onPointerMove);
    this.container.removeEventListener('click', this.onClick);
    this.controls.dispose();
    this.renderer.dispose();
  }
}
