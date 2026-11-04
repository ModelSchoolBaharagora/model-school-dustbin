import * as THREE from 'three';
import {
  createCautionStripeTexture,
  createDustbinRibTexture,
  createMadeInIndiaDecal,
  createSolarCellTexture,
  createTireTreadTexture,
} from './materials';

export interface SmartDustbinModel {
  rootGroup: THREE.Group;
  colliderMesh: THREE.Mesh;
  wheels: THREE.Mesh[];
  frontSteerPivots: THREE.Group[];
  lidHingeGroup: THREE.Group;
  hydraulicPistons: { cylinder: THREE.Mesh; rod: THREE.Mesh }[];
  compactorPlate: THREE.Mesh;
  lidarHead: THREE.Group;
  lidarLaserCone: THREE.Mesh;
  headlights: THREE.SpotLight[];
  statusLightbar: THREE.Mesh;
  statusMaterial: THREE.MeshStandardMaterial;
  irSensors: THREE.Mesh[]; // Glowing IR sensor LEDs
  hazardStrobes: THREE.Mesh[]; // Amber flashers when obstacle detected
  underglowLight: THREE.PointLight;
  hoverRing: THREE.Mesh;
  hologramBillboard: THREE.Sprite;
  fillLevelMesh: THREE.Mesh;
  triggerTrashImpact: () => void;
  updateAnimations: (
    delta: number,
    speedKmh: number,
    lidOpenTarget: number,
    compactorActive: boolean,
    isHovered: boolean,
    obstacleDetected: boolean,
    stateText: string,
    stateColor: number,
    fillPercent: number,
    steerAngle: number
  ) => void;
}

export function buildSmartDustbinModel(renderer: THREE.WebGLRenderer): SmartDustbinModel {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'SmartAutonomousMunicipalDustbin';

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  // 1. Ground Contact Shadow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(128, 128, 20, 128, 128, 120);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 256, 256);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo = new THREE.PlaneGeometry(3.6, 2.6);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.85,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.04;
  rootGroup.add(shadowMesh);

  // 2. Underglow Point Light
  const underglowLight = new THREE.PointLight(0x10b981, 1.2, 5, 1.5);
  underglowLight.position.set(0, 0.25, 0);
  rootGroup.add(underglowLight);

  // 3. Hover Ring Hologram
  const ringGeo = new THREE.RingGeometry(1.6, 1.9, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const hoverRing = new THREE.Mesh(ringGeo, ringMat);
  hoverRing.rotation.x = -Math.PI / 2;
  hoverRing.position.y = 0.08;
  rootGroup.add(hoverRing);

  // 4. Autonomous Rover Chassis (faces forward on +Z)
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.3,
  });
  const chassisGeo = new THREE.BoxGeometry(1.7, 0.36, 2.6);
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.y = 0.5;
  chassis.castShadow = true;
  rootGroup.add(chassis);

  // 5. Authentic Heavy-Duty Municipal Dustbin Body
  // Ribbed molded thermoplastic hopper (classic municipal dustbin look)
  const ribTex = createDustbinRibTexture();
  ribTex.repeat.set(2, 2);
  ribTex.anisotropy = maxAnisotropy;

  const binBodyMat = new THREE.MeshStandardMaterial({
    color: 0x047857, // Municipal Swachh Bharat Green
    map: ribTex,
    roughness: 0.35,
    metalness: 0.15,
  });
  const binBodyGeo = new THREE.BoxGeometry(1.55, 1.55, 2.15);
  const binBody = new THREE.Mesh(binBodyGeo, binBodyMat);
  binBody.position.set(0, 1.45, 0);
  binBody.castShadow = true;
  binBody.receiveShadow = true;
  rootGroup.add(binBody);

  // Open top hopper mouth collar & interior dark receptacle cavity
  const hopperRimGeo = new THREE.BoxGeometry(1.65, 0.1, 2.25);
  const hopperRimMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.4 });
  const hopperRim = new THREE.Mesh(hopperRimGeo, hopperRimMat);
  hopperRim.position.set(0, 2.22, 0);
  rootGroup.add(hopperRim);

  const hopperInteriorGeo = new THREE.BoxGeometry(1.42, 0.8, 2.0);
  const hopperInteriorMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.9,
    side: THREE.BackSide,
  });
  const hopperInterior = new THREE.Mesh(hopperInteriorGeo, hopperInteriorMat);
  hopperInterior.position.set(0, 1.85, 0);
  rootGroup.add(hopperInterior);

  // Molded Grab Handles on sides and rear (Authentic dustbin feature)
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
  const rearHandle = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.12), handleMat);
  rearHandle.position.set(0, 2.05, -1.1);
  rootGroup.add(rearHandle);

  // 🇮🇳 MADE IN INDIA Decal on both sides
  const madeInIndiaTex = createMadeInIndiaDecal();
  madeInIndiaTex.anisotropy = maxAnisotropy;
  const decalGeo = new THREE.PlaneGeometry(1.2, 0.6);
  const decalMat = new THREE.MeshBasicMaterial({ map: madeInIndiaTex, side: THREE.DoubleSide });

  const decalRight = new THREE.Mesh(decalGeo, decalMat);
  decalRight.position.set(0.79, 1.45, 0);
  decalRight.rotation.y = Math.PI / 2;
  rootGroup.add(decalRight);

  const decalLeft = new THREE.Mesh(decalGeo, decalMat);
  decalLeft.position.set(-0.79, 1.45, 0);
  decalLeft.rotation.y = -Math.PI / 2;
  rootGroup.add(decalLeft);

  // Caution stripe on bottom rim
  const stripeTex = createCautionStripeTexture();
  stripeTex.repeat.set(4, 1);
  const stripeGeo = new THREE.PlaneGeometry(2.1, 0.14);
  const stripeMat = new THREE.MeshBasicMaterial({ map: stripeTex, side: THREE.DoubleSide });
  const stripeRight = new THREE.Mesh(stripeGeo, stripeMat);
  stripeRight.position.set(0.79, 0.78, 0);
  stripeRight.rotation.y = Math.PI / 2;
  rootGroup.add(stripeRight);

  // 6. Fixed Tyres (Axle on X, forward roll on X)
  const wheels: THREE.Mesh[] = [];
  const frontSteerPivots: THREE.Group[] = [];

  const tireTreadTex = createTireTreadTexture();
  tireTreadTex.repeat.set(1, 4);
  tireTreadTex.anisotropy = maxAnisotropy;

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1f242d,
    roughness: 0.85,
    metalness: 0.1,
    bumpMap: tireTreadTex,
    bumpScale: 0.08,
  });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.2 });

  const wheelSpecs = [
    { x: 0.96, y: 0.42, z: 0.92, isFront: true },
    { x: -0.96, y: 0.42, z: 0.92, isFront: true },
    { x: 0.96, y: 0.42, z: -0.92, isFront: false },
    { x: -0.96, y: 0.42, z: -0.92, isFront: false },
  ];

  wheelSpecs.forEach((spec) => {
    const pivot = new THREE.Group();
    pivot.position.set(spec.x, spec.y, spec.z);

    const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.26, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const wheelMesh = new THREE.Mesh(tireGeo, tireMat);
    wheelMesh.castShadow = true;

    const rimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.27, 16);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wheelMesh.add(rim);

    pivot.add(wheelMesh);
    rootGroup.add(pivot);

    wheels.push(wheelMesh);
    if (spec.isFront) {
      frontSteerPivots.push(pivot);
    }
  });

  // 7. Sensor Array: IR (Infrared) Sensors + Sonar Eyes
  const irSensors: THREE.Mesh[] = [];
  const irSensorMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 2.2,
  });

  // 4 Front/Corner IR proximity distance sensors
  const irGeo = new THREE.SphereGeometry(0.05, 8, 8);
  [-0.65, -0.22, 0.22, 0.65].forEach((ix) => {
    const irMesh = new THREE.Mesh(irGeo, irSensorMat);
    irMesh.position.set(ix, 0.62, 1.45);
    rootGroup.add(irMesh);
    irSensors.push(irMesh);
  });

  // Side IR sensor pointing down at the road's white shoulder line (White Line Tracking)
  const irWhiteLineSensor = new THREE.Mesh(irGeo, irSensorMat);
  irWhiteLineSensor.position.set(0.85, 0.35, 0.5);
  rootGroup.add(irWhiteLineSensor);
  irSensors.push(irWhiteLineSensor);

  // Ultrasonic Sonar "Eyes" (Front center)
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.5,
  });
  [-0.15, 0.15].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12), eyeMat);
    eye.rotation.x = Math.PI / 2;
    eye.position.set(ex, 0.82, 1.44);
    rootGroup.add(eye);
  });

  // Amber Hazard Strobe Lights (Flash when animal/cow obstacle is detected!)
  const hazardStrobes: THREE.Mesh[] = [];
  const strobeMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.0,
  });
  [-0.75, 0.75].forEach((hx) => {
    const strobe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 10), strobeMat);
    strobe.position.set(hx, 2.25, 1.0);
    rootGroup.add(strobe);
    hazardStrobes.push(strobe);
  });

  // 8. Motorized Dustbin Lid with Solar Cells (Hinged on road-side, opening wide towards sidewalk/citizens)
  const lidHingeGroup = new THREE.Group();
  lidHingeGroup.position.set(-0.78, 2.22, 0);

  const lidMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b, // Deep municipal lid green
    metalness: 0.8,
    roughness: 0.25,
  });
  const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.14, 2.18), lidMat);
  lidMesh.position.set(0.79, 0.07, 0);
  lidMesh.castShadow = true;
  lidHingeGroup.add(lidMesh);

  // Solar panel on lid
  const solarTex = createSolarCellTexture();
  solarTex.repeat.set(3, 4);
  const solarMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 1.8),
    new THREE.MeshStandardMaterial({ map: solarTex, metalness: 0.95, roughness: 0.1 })
  );
  solarMesh.rotation.x = -Math.PI / 2;
  solarMesh.position.set(0.79, 0.15, 0);
  lidHingeGroup.add(solarMesh);

  rootGroup.add(lidHingeGroup);

  // Hydraulic Pistons
  const hydraulicPistons: { cylinder: THREE.Mesh; rod: THREE.Mesh }[] = [];
  [-0.72, 0.72].forEach((px) => {
    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 })
    );
    cylinder.position.set(px, 1.75, -0.6);
    rootGroup.add(cylinder);

    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 })
    );
    rod.position.set(px, 1.95, -0.6);
    rootGroup.add(rod);

    hydraulicPistons.push({ cylinder, rod });
  });

  // 9. Compactor Ram Plate
  const compactorPlate = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.12, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.25 })
  );
  compactorPlate.position.set(0, 1.85, 0);
  rootGroup.add(compactorPlate);

  // 10. Top 360° LiDAR Dome
  const lidarHead = new THREE.Group();
  lidarHead.position.set(0, 2.45, 0.6);
  const lSpin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.16, 16),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.85, roughness: 0.2 })
  );
  lidarHead.add(lSpin);

  const laserConeGeo = new THREE.ConeGeometry(5.0, 8.0, 16, 1, true, 0, Math.PI / 4);
  const laserConeMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const lidarLaserCone = new THREE.Mesh(laserConeGeo, laserConeMat);
  lidarLaserCone.rotation.x = Math.PI / 2;
  lidarLaserCone.position.set(0, 0, 4.0);
  lidarHead.add(lidarLaserCone);
  rootGroup.add(lidarHead);

  // 11. Headlights (Pointing forward along +Z)
  const headlights: THREE.SpotLight[] = [];
  [-0.6, 0.6].forEach((hx) => {
    const spot = new THREE.SpotLight(0xfef08a, 3.2, 28, Math.PI / 5, 0.35, 1.2);
    spot.position.set(hx, 0.52, 1.45);
    const target = new THREE.Object3D();
    target.position.set(hx, 0.2, 15);
    rootGroup.add(target);
    spot.target = target;
    spot.castShadow = true;
    rootGroup.add(spot);
    headlights.push(spot);
  });

  // Dynamic Status LED Bar
  const statusMaterial = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 2.0,
  });
  const statusLightbar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.06), statusMaterial);
  statusLightbar.position.set(0, 0.65, 1.45);
  rootGroup.add(statusLightbar);

  // Fill Level Indicator Mesh
  const fillLevelMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.15, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.5 })
  );
  fillLevelMesh.position.set(0.79, 1.45, 0.7);
  fillLevelMesh.rotation.y = Math.PI / 2;
  rootGroup.add(fillLevelMesh);

  // 12. Floating Billboard above Rover
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = 512;
  spriteCanvas.height = 160;
  const spriteCtx = spriteCanvas.getContext('2d')!;
  const spriteTex = new THREE.CanvasTexture(spriteCanvas);
  const hologramBillboard = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTex, transparent: true, depthTest: false }));
  hologramBillboard.scale.set(3.2, 1.0, 1.0);
  hologramBillboard.position.set(0, 3.5, 0);
  rootGroup.add(hologramBillboard);

  // Invisible Collider
  const colliderMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 2.5, 3.2),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  colliderMesh.position.set(0, 1.25, 0);
  rootGroup.add(colliderMesh);

  const triggerTrashImpact = () => {
    // Fill gauge pulse
    fillLevelMesh.scale.x = 1.3;
    setTimeout(() => {
      fillLevelMesh.scale.x = 1.0;
    }, 200);
  };

  let strobeTimer = 0;
  const updateAnimations = (
    delta: number,
    speedKmh: number,
    lidOpenTarget: number,
    compactorActive: boolean,
    isHovered: boolean,
    obstacleDetected: boolean,
    stateText: string,
    stateColor: number,
    fillPercent: number,
    steerAngle: number
  ) => {
    // 1. Wheel rotation: forward roll on X
    const speedMps = (speedKmh * 1000) / 3600;
    const rollDelta = (speedMps / 0.42) * delta;
    wheels.forEach((w) => {
      w.rotation.x += rollDelta;
    });

    frontSteerPivots.forEach((p) => {
      p.rotation.y = THREE.MathUtils.damp(p.rotation.y, steerAngle, 7, delta);
    });

    // 2. LiDAR spin
    lidarHead.rotation.y += (isHovered ? 16.0 : 6.0) * delta;

    // 3. Lid opening (hinged on road-side, opening wide towards sidewalk citizens)
    const targetLidAngle = lidOpenTarget * 1.5;
    lidHingeGroup.rotation.z = THREE.MathUtils.damp(lidHingeGroup.rotation.z, targetLidAngle, 5.0, delta);
    hydraulicPistons.forEach((p) => {
      p.rod.position.y = 1.95 + lidOpenTarget * 0.15;
    });

    // 4. Compactor plate
    if (compactorActive) {
      compactorPlate.position.y = 1.85 - Math.sin(Date.now() * 0.005) * 0.5;
    } else {
      compactorPlate.position.y = THREE.MathUtils.damp(compactorPlate.position.y, 1.85, 5, delta);
    }

    // 5. Hazard Strobes if obstacle detected
    if (obstacleDetected) {
      strobeTimer += delta * 12;
      const strobeOn = Math.sin(strobeTimer) > 0;
      strobeMat.emissiveIntensity = strobeOn ? 3.0 : 0.0;
    } else {
      strobeMat.emissiveIntensity = 0.0;
    }

    // 6. Hover Ring
    (hoverRing.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.damp(
      (hoverRing.material as THREE.MeshBasicMaterial).opacity,
      isHovered ? 0.85 : 0.0,
      8,
      delta
    );

    // 7. Status light & underglow
    statusMaterial.color.setHex(stateColor);
    statusMaterial.emissive.setHex(stateColor);
    underglowLight.color.setHex(stateColor);

    // 8. Fill Level Gauge
    const scaleY = Math.max(0.08, fillPercent / 100);
    fillLevelMesh.scale.y = scaleY;

    // 9. Floating Billboard
    spriteCtx.clearRect(0, 0, 512, 160);
    spriteCtx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    spriteCtx.strokeStyle = isHovered ? '#06b6d4' : obstacleDetected ? '#ef4444' : '#10b981';
    spriteCtx.lineWidth = 4;
    spriteCtx.beginPath();
    spriteCtx.roundRect(10, 10, 492, 140, 20);
    spriteCtx.fill();
    spriteCtx.stroke();

    spriteCtx.fillStyle = '#f59e0b';
    spriteCtx.font = 'bold 22px sans-serif';
    spriteCtx.textAlign = 'center';
    spriteCtx.fillText('🇮🇳 MADE IN INDIA • SWACHH ROVER', 256, 44);

    spriteCtx.fillStyle = obstacleDetected ? '#f87171' : isHovered ? '#38bdf8' : '#34d399';
    spriteCtx.font = 'bold 34px monospace';
    spriteCtx.fillText(stateText, 256, 92);

    spriteCtx.fillStyle = '#e2e8f0';
    spriteCtx.font = '18px sans-serif';
    spriteCtx.fillText(
      obstacleDetected
        ? '⚠️ OBSTACLE DETECTED: AUTO HALT ACTIVE'
        : '200M INTERVALS • WHITE LINE TRACKING',
      256,
      130
    );

    spriteTex.needsUpdate = true;
  };

  return {
    rootGroup,
    colliderMesh,
    wheels,
    frontSteerPivots,
    lidHingeGroup,
    hydraulicPistons,
    compactorPlate,
    lidarHead,
    lidarLaserCone,
    headlights,
    statusLightbar,
    statusMaterial,
    irSensors,
    hazardStrobes,
    underglowLight,
    hoverRing,
    hologramBillboard,
    fillLevelMesh,
    triggerTrashImpact,
    updateAnimations,
  };
}
