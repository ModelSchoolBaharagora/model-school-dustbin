import * as THREE from 'three';
import { createCowSkinTexture } from './materials';

export interface IndianCowModel {
  rootGroup: THREE.Group;
  colliderMesh: THREE.Mesh;
  legs: THREE.Group[];
  headGroup: THREE.Group;
  tailMesh: THREE.Mesh;
  startWalkingOff: (dir: THREE.Vector3) => void;
  isWalkingOff: boolean;
  isOffRoad: boolean;
  resetWalkingOff: () => void;
  updateAnimation: (delta: number) => void;
  position: THREE.Vector3;
}

export function buildIndianCow(renderer: THREE.WebGLRenderer): IndianCowModel {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'IndianCowObstacle';

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  const cowSkinTex = createCowSkinTexture();
  cowSkinTex.anisotropy = maxAnisotropy;

  const bodyMat = new THREE.MeshStandardMaterial({
    map: cowSkinTex,
    roughness: 0.8,
    metalness: 0.05,
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.6 });
  const hornMat = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.4 });
  const bellMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });

  // 1. Torso
  const bodyGeo = new THREE.BoxGeometry(1.2, 1.4, 2.4);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.45;
  body.castShadow = true;
  rootGroup.add(body);

  // Zebu Hump (Indian cow)
  const humpGeo = new THREE.ConeGeometry(0.55, 0.65, 12);
  const hump = new THREE.Mesh(humpGeo, bodyMat);
  hump.rotation.x = -Math.PI / 8;
  hump.position.set(0, 2.3, 0.7);
  hump.castShadow = true;
  rootGroup.add(hump);

  // 2. Head & Neck
  const neckGeo = new THREE.CylinderGeometry(0.35, 0.5, 0.8, 10);
  const neck = new THREE.Mesh(neckGeo, bodyMat);
  neck.position.set(0, 1.9, 1.35);
  neck.rotation.x = Math.PI / 4;
  neck.castShadow = true;
  rootGroup.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.1, 1.7);

  const headGeo = new THREE.BoxGeometry(0.6, 0.7, 0.9);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.castShadow = true;
  headGroup.add(head);

  // Muzzle
  const muzzleGeo = new THREE.BoxGeometry(0.48, 0.38, 0.5);
  const muzzleMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.9 });
  const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
  muzzle.position.set(0, -0.15, 0.55);
  headGroup.add(muzzle);

  // Horns
  [-0.32, 0.32].forEach((hx) => {
    const hornGeo = new THREE.ConeGeometry(0.08, 0.55, 8);
    const horn = new THREE.Mesh(hornGeo, hornMat);
    horn.rotation.z = hx > 0 ? -Math.PI / 6 : Math.PI / 6;
    horn.rotation.x = -Math.PI / 8;
    horn.position.set(hx, 0.45, -0.1);
    headGroup.add(horn);
  });

  // Ears
  [-0.38, 0.38].forEach((ex) => {
    const earGeo = new THREE.ConeGeometry(0.12, 0.4, 6);
    const ear = new THREE.Mesh(earGeo, bodyMat);
    ear.rotation.z = ex > 0 ? -Math.PI / 3 : Math.PI / 3;
    ear.position.set(ex, 0.18, -0.1);
    headGroup.add(ear);
  });

  // Bell
  const bellGeo = new THREE.ConeGeometry(0.08, 0.14, 8);
  const bell = new THREE.Mesh(bellGeo, bellMat);
  bell.position.set(0, -0.38, 0.1);
  headGroup.add(bell);

  rootGroup.add(headGroup);

  // 3. Legs
  const legs: THREE.Group[] = [];
  const legPositions = [
    { x: -0.42, z: 0.8 },
    { x: 0.42, z: 0.8 },
    { x: -0.42, z: -0.8 },
    { x: 0.42, z: -0.8 },
  ];

  legPositions.forEach((lp) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(lp.x, 1.0, lp.z);

    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.95, 8);
    const leg = new THREE.Mesh(legGeo, bodyMat);
    leg.position.y = -0.45;
    leg.castShadow = true;
    legPivot.add(leg);

    const hoofGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.15, 8);
    const hoof = new THREE.Mesh(hoofGeo, darkMat);
    hoof.position.y = -0.9;
    legPivot.add(hoof);

    rootGroup.add(legPivot);
    legs.push(legPivot);
  });

  // 4. Tail
  const tailGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.85, 6);
  const tailMesh = new THREE.Mesh(tailGeo, darkMat);
  tailMesh.position.set(0, 1.25, -1.25);
  tailMesh.rotation.x = -Math.PI / 10;
  rootGroup.add(tailMesh);

  // 5. Invisible Collider
  const colliderGeo = new THREE.BoxGeometry(2.0, 2.5, 3.2);
  const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
  const colliderMesh = new THREE.Mesh(colliderGeo, colliderMat);
  colliderMesh.position.set(0, 1.3, 0);
  rootGroup.add(colliderMesh);

  let animTimer = 0;
  let isWalkingOff = false;
  let walkOffProgress = 0;
  let walkOffDir = new THREE.Vector3(1, 0, 0);
  let startWalkPos = new THREE.Vector3();

  const startWalkingOff = (dir: THREE.Vector3) => {
    if (isWalkingOff) return;
    isWalkingOff = true;
    walkOffProgress = 0;
    walkOffDir.copy(dir).normalize();
    startWalkPos.copy(rootGroup.position);
    rootGroup.lookAt(startWalkPos.clone().add(walkOffDir));
  };

  const updateAnimation = (delta: number) => {
    animTimer += delta;

    if (isWalkingOff) {
      walkOffProgress += delta * 0.45; // Walks away over ~2.2 seconds
      rootGroup.position.copy(startWalkPos).addScaledVector(walkOffDir, walkOffProgress * 7.5);

      // Quadruped walk gait
      const walkGait = animTimer * 10;
      legs[0].rotation.x = Math.sin(walkGait) * 0.4;
      legs[1].rotation.x = -Math.sin(walkGait) * 0.4;
      legs[2].rotation.x = -Math.sin(walkGait) * 0.4;
      legs[3].rotation.x = Math.sin(walkGait) * 0.4;

      headGroup.rotation.y = Math.sin(animTimer * 4) * 0.2;
      tailMesh.rotation.z = Math.sin(animTimer * 6) * 0.3;
    } else {
      headGroup.rotation.y = Math.sin(animTimer * 1.5) * 0.15;
      headGroup.rotation.x = Math.sin(animTimer * 2.2) * 0.08;
      tailMesh.rotation.z = Math.sin(animTimer * 3.5) * 0.2;
      legs[0].rotation.x = Math.sin(animTimer * 0.8) * 0.05;
      legs[1].rotation.x = -Math.sin(animTimer * 0.8) * 0.05;
    }
  };

  return {
    rootGroup,
    colliderMesh,
    legs,
    headGroup,
    tailMesh,
    startWalkingOff,
    get isWalkingOff() {
      return isWalkingOff;
    },
    get isOffRoad() {
      return walkOffProgress >= 1.0;
    },
    resetWalkingOff() {
      isWalkingOff = false;
      walkOffProgress = 0;
    },
    updateAnimation,
    get position() {
      return rootGroup.position;
    },
  };
}

// 3D Smart Traffic Light System with Zebra Crossing Detection
export type TrafficLightColor = 'GREEN' | 'YELLOW' | 'RED';

export interface TrafficLightModel {
  rootGroup: THREE.Group;
  redMesh: THREE.Mesh;
  yellowMesh: THREE.Mesh;
  greenMesh: THREE.Mesh;
  currentColor: TrafficLightColor;
  curveT: number;
  stopLinePos: THREE.Vector3;
  update: (delta: number) => TrafficLightColor;
}

export function buildSmartTrafficLight(curveT: number, stopLinePos: THREE.Vector3): TrafficLightModel {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'SmartTrafficLightGantry';

  const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.2 });
  const housingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });

  // Post & Overhang Arm
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 6.2, 10), poleMat);
  post.position.y = 3.1;
  post.castShadow = true;
  rootGroup.add(post);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 3.2), poleMat);
  arm.position.set(0, 6.0, 1.5);
  rootGroup.add(arm);

  // Traffic Light Housing Box
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.4), housingMat);
  box.position.set(0, 5.8, 2.8);
  box.castShadow = true;
  rootGroup.add(box);

  // Red, Yellow, Green Lenses
  const lensGeo = new THREE.SphereGeometry(0.16, 12, 12);
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.2,
  });
  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.2,
  });
  const greenMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 2.5,
  });

  const redMesh = new THREE.Mesh(lensGeo, redMat);
  redMesh.position.set(0, 6.35, 2.95);
  rootGroup.add(redMesh);

  const yellowMesh = new THREE.Mesh(lensGeo, yellowMat);
  yellowMesh.position.set(0, 5.8, 2.95);
  rootGroup.add(yellowMesh);

  const greenMesh = new THREE.Mesh(lensGeo, greenMat);
  greenMesh.position.set(0, 5.25, 2.95);
  rootGroup.add(greenMesh);

  // Visor hoods over lenses
  [-0.55, 0, 0.55].forEach((dy) => {
    const hood = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.15, 8, 1, true, 0, Math.PI),
      housingMat
    );
    hood.rotation.x = Math.PI / 2;
    hood.position.set(0, 5.8 + dy + 0.1, 3.02);
    rootGroup.add(hood);
  });

  let cycleTime = 0;
  let currentColor: TrafficLightColor = 'GREEN';

  // Cycle: Green (20s) -> Yellow (4s) -> Red (14s)
  const update = (delta: number): TrafficLightColor => {
    cycleTime += delta;
    const loopTime = cycleTime % 38;

    if (loopTime < 20) {
      currentColor = 'GREEN';
      redMat.emissiveIntensity = 0.2;
      yellowMat.emissiveIntensity = 0.2;
      greenMat.emissiveIntensity = 2.8;
    } else if (loopTime < 24) {
      currentColor = 'YELLOW';
      redMat.emissiveIntensity = 0.2;
      yellowMat.emissiveIntensity = 2.8;
      greenMat.emissiveIntensity = 0.2;
    } else {
      currentColor = 'RED';
      redMat.emissiveIntensity = 3.0;
      yellowMat.emissiveIntensity = 0.2;
      greenMat.emissiveIntensity = 0.2;
    }

    return currentColor;
  };

  return {
    rootGroup,
    redMesh,
    yellowMesh,
    greenMesh,
    get currentColor() {
      return currentColor;
    },
    curveT,
    stopLinePos,
    update,
  };
}

// Multi-Vehicle City Traffic Fleet
export interface TrafficVehicle {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  curveT: number;
  speedKmh: number;
  laneOffset: number;
  update: (delta: number, roadCurve: THREE.CatmullRomCurve3, roadLength: number) => void;
}

function createVehicleInstance(
  group: THREE.Group,
  wheels: THREE.Mesh[],
  initialCurveT: number,
  speedKmh: number,
  laneOffset: number,
  wheelRadius: number = 0.34,
  direction: 1 | -1 = 1
): TrafficVehicle {
  let curveT = initialCurveT;
  return {
    group,
    wheels,
    get curveT() {
      return curveT;
    },
    set curveT(val: number) {
      curveT = val;
    },
    speedKmh,
    laneOffset,
    update: (delta, roadCurve, roadLength) => {
      const speedMps = (speedKmh * 1000) / 3600;
      curveT = ((curveT + direction * ((speedMps * delta) / roadLength)) % 1.0 + 1.0) % 1.0;
      const pt = roadCurve.getPointAt(curveT);
      const tangent = roadCurve.getTangentAt(curveT).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      group.position.copy(pt).addScaledVector(normal, laneOffset);
      const lookDir = direction === 1 ? tangent : tangent.clone().negate();
      group.lookAt(group.position.clone().add(lookDir));
      const roll = (speedMps / wheelRadius) * delta * direction;
      wheels.forEach((w) => (w.rotation.x += roll));
    },
  };
}

export function buildTrafficVehicles(_renderer: THREE.WebGLRenderer): TrafficVehicle[] {
  const vehicles: TrafficVehicle[] = [];

  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.22, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });

  // 1. Blue Electric Sedan (28 km/h)
  const sedanGroup = new THREE.Group();
  const sedanBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, 0.72, 3.9),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.15 })
  );
  sedanBody.position.y = 0.58;
  sedanBody.castShadow = true;
  sedanGroup.add(sedanBody);

  const sedanCabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.65, 2.2),
    new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.1, transmission: 0.6 })
  );
  sedanCabin.position.set(0, 1.15, -0.2);
  sedanGroup.add(sedanCabin);

  const sedanWheels: THREE.Mesh[] = [];
  [-0.92, 0.92].forEach((wx) => {
    [-1.2, 1.2].forEach((wz) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(wx, 0.34, wz);
      sedanGroup.add(w);
      sedanWheels.push(w);
    });
  });
  vehicles.push(createVehicleInstance(sedanGroup, sedanWheels, 0.12, 28, -1.6, 0.34));

  // 2. Indian Auto-Rickshaw (Bajaj RE style, 24 km/h)
  const autoGroup = new THREE.Group();
  const autoLower = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.6, 2.6),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.3 })
  );
  autoLower.position.y = 0.55;
  autoGroup.add(autoLower);

  const autoUpper = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 0.85, 2.2),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 })
  );
  autoUpper.position.set(0, 1.25, -0.1);
  autoGroup.add(autoUpper);

  const autoRoof = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 0.12, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
  );
  autoRoof.position.set(0, 1.72, -0.1);
  autoGroup.add(autoRoof);

  const autoWheels: THREE.Mesh[] = [];
  const autoWheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.18, 14);
  autoWheelGeo.rotateZ(Math.PI / 2);
  const frontW = new THREE.Mesh(autoWheelGeo, wheelMat);
  frontW.position.set(0, 0.28, 1.0);
  autoGroup.add(frontW);
  autoWheels.push(frontW);

  [-0.68, 0.68].forEach((rx) => {
    const rearW = new THREE.Mesh(autoWheelGeo, wheelMat);
    rearW.position.set(rx, 0.28, -0.8);
    autoGroup.add(rearW);
    autoWheels.push(rearW);
  });
  vehicles.push(createVehicleInstance(autoGroup, autoWheels, 0.42, 24, -1.1, 0.28));

  // 3. Red Compact City SUV (32 km/h)
  const suvGroup = new THREE.Group();
  const suvBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.85, 3.8),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.85, roughness: 0.2 })
  );
  suvBody.position.y = 0.65;
  suvBody.castShadow = true;
  suvGroup.add(suvBody);

  const suvCabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.72, 2.4),
    new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.1, transmission: 0.55 })
  );
  suvCabin.position.set(0, 1.35, -0.1);
  suvGroup.add(suvCabin);

  const suvWheels: THREE.Mesh[] = [];
  [-0.95, 0.95].forEach((wx) => {
    [-1.2, 1.2].forEach((wz) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(wx, 0.35, wz);
      suvGroup.add(w);
      suvWheels.push(w);
    });
  });
  vehicles.push(createVehicleInstance(suvGroup, suvWheels, 0.72, 32, -1.8, 0.35));

  // 4. Indian Commuter Motorbike (Hero Splendor / Pulsar style with rider)
  const bikeGroup = new THREE.Group();
  const bikeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.2 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.95, roughness: 0.2 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 1.0, roughness: 0.1 });

  // Bike chassis & engine
  const bikeFrame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 1.4), frameMat);
  bikeFrame.position.y = 0.5;
  bikeGroup.add(bikeFrame);

  // Fuel tank
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.65, 8), bikeMat);
  tank.rotation.x = Math.PI / 2;
  tank.position.set(0, 0.78, 0.1);
  bikeGroup.add(tank);

  // Exhaust pipe
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), chromeMat);
  exhaust.rotation.x = Math.PI / 2;
  exhaust.position.set(0.2, 0.32, -0.2);
  bikeGroup.add(exhaust);

  // Handlebars
  const handlebars = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.04), chromeMat);
  handlebars.position.set(0, 0.98, 0.45);
  bikeGroup.add(handlebars);

  // Headlight
  const headlight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 2.0 })
  );
  headlight.rotation.x = Math.PI / 2;
  headlight.position.set(0, 0.88, 0.65);
  bikeGroup.add(headlight);

  // Bike Rider (Figure with helmet)
  const riderTorso = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.55, 0.24),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
  );
  riderTorso.position.set(0, 1.12, -0.1);
  riderTorso.rotation.x = 0.2;
  bikeGroup.add(riderTorso);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.2 })
  );
  helmet.position.set(0, 1.5, -0.05);
  bikeGroup.add(helmet);

  const bikeWheels: THREE.Mesh[] = [];
  const bikeWheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.09, 16);
  bikeWheelGeo.rotateZ(Math.PI / 2);

  const frontBikeW = new THREE.Mesh(bikeWheelGeo, wheelMat);
  frontBikeW.position.set(0, 0.32, 0.75);
  bikeGroup.add(frontBikeW);
  bikeWheels.push(frontBikeW);

  const rearBikeW = new THREE.Mesh(bikeWheelGeo, wheelMat);
  rearBikeW.position.set(0, 0.32, -0.65);
  bikeGroup.add(rearBikeW);
  bikeWheels.push(rearBikeW);

  vehicles.push(createVehicleInstance(bikeGroup, bikeWheels, 0.04, 34, 1.1, 0.32));

  // 5. Urban Scooter (Honda Activa style, 26 km/h)
  const scooterGroup = new THREE.Group();
  const scooterMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.2 });

  const scooterBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 1.3), scooterMat);
  scooterBody.position.y = 0.42;
  scooterGroup.add(scooterBody);

  const scooterFloor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.5), frameMat);
  scooterFloor.position.set(0, 0.32, 0.2);
  scooterGroup.add(scooterFloor);

  const scooterFrontCowl = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.55, 0.2), scooterMat);
  scooterFrontCowl.position.set(0, 0.72, 0.55);
  scooterGroup.add(scooterFrontCowl);

  // Scooter Rider
  const scooterRider = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.52, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.7 })
  );
  scooterRider.position.set(0, 1.05, -0.1);
  scooterGroup.add(scooterRider);

  const scooterHelmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 })
  );
  scooterHelmet.position.set(0, 1.42, -0.1);
  scooterGroup.add(scooterHelmet);

  const scooterWheels: THREE.Mesh[] = [];
  const scWheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.09, 14);
  scWheelGeo.rotateZ(Math.PI / 2);

  const scFrontW = new THREE.Mesh(scWheelGeo, wheelMat);
  scFrontW.position.set(0, 0.24, 0.6);
  scooterGroup.add(scFrontW);
  scooterWheels.push(scFrontW);

  const scRearW = new THREE.Mesh(scWheelGeo, wheelMat);
  scRearW.position.set(0, 0.24, -0.5);
  scooterGroup.add(scRearW);
  scooterWheels.push(scRearW);

  vehicles.push(createVehicleInstance(scooterGroup, scooterWheels, 0.56, 26, -0.5, 0.24));

  // 6. White Eco-Delivery Cargo Van (30 km/h)
  const vanGroup = new THREE.Group();
  const vanMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const vanStripeMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.3 });

  const vanBody = new THREE.Mesh(new THREE.BoxGeometry(1.95, 1.4, 4.4), vanMat);
  vanBody.position.y = 1.05;
  vanBody.castShadow = true;
  vanGroup.add(vanBody);

  // Green Hub Eco Stripe on van sides
  const vanStripe = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.25, 4.2), vanStripeMat);
  vanStripe.position.set(0, 1.05, 0);
  vanGroup.add(vanStripe);

  const vanWheels: THREE.Mesh[] = [];
  [-0.98, 0.98].forEach((wx) => {
    [-1.4, 1.4].forEach((wz) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(wx, 0.35, wz);
      vanGroup.add(w);
      vanWheels.push(w);
    });
  });
  vehicles.push(createVehicleInstance(vanGroup, vanWheels, 0.85, 30, -2.2, 0.35));

  // 7. Mumbai / Delhi Black-and-Yellow "Kaali-Peeli" Taxi (31 km/h)
  const taxiGroup = new THREE.Group();
  const taxiBlackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9, roughness: 0.2 });
  const taxiYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });

  const taxiLower = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.68, 3.8), taxiBlackMat);
  taxiLower.position.y = 0.55;
  taxiGroup.add(taxiLower);

  const taxiUpper = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.65, 2.1), taxiYellowMat);
  taxiUpper.position.set(0, 1.12, -0.2);
  taxiGroup.add(taxiUpper);

  // Taxi roof sign
  const taxiSign = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.12, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 1.8 })
  );
  taxiSign.position.set(0, 1.5, -0.2);
  taxiGroup.add(taxiSign);

  const taxiWheels: THREE.Mesh[] = [];
  [-0.9, 0.9].forEach((wx) => {
    [-1.15, 1.15].forEach((wz) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(wx, 0.34, wz);
      taxiGroup.add(w);
      taxiWheels.push(w);
    });
  });
  vehicles.push(createVehicleInstance(taxiGroup, taxiWheels, 0.28, 31, -1.4, 0.34));

  // 8. Green Hub City Transit Mini-Bus (25 km/h)
  const busGroup = new THREE.Group();
  const busMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.7, roughness: 0.25 });
  const busRoofMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const busGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.1, transmission: 0.65 });

  const busLower = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 5.6), busMat);
  busLower.position.y = 0.75;
  busLower.castShadow = true;
  busGroup.add(busLower);

  const busUpper = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.9, 5.5), busGlassMat);
  busUpper.position.set(0, 1.65, 0);
  busGroup.add(busUpper);

  const busRoof = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.15, 5.65), busRoofMat);
  busRoof.position.set(0, 2.15, 0);
  busGroup.add(busRoof);

  const busWheels: THREE.Mesh[] = [];
  const busWheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.28, 16);
  busWheelGeo.rotateZ(Math.PI / 2);
  [-1.08, 1.08].forEach((wx) => {
    [-1.8, 1.8].forEach((wz) => {
      const w = new THREE.Mesh(busWheelGeo, wheelMat);
      w.position.set(wx, 0.4, wz);
      busGroup.add(w);
      busWheels.push(w);
    });
  });
  vehicles.push(createVehicleInstance(busGroup, busWheels, 0.65, 25, -2.6, 0.4));

  return vehicles;
}
