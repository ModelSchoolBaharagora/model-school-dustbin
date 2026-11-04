import * as THREE from 'three';
import { CollectionStation } from '../types';
import {
  createAsphaltTexture,
  createGrassTexture,
  createGreenHubSignTexture,
  createSidewalkTexture,
  createStationSignTexture,
} from './materials';
import { buildCitizenCrowd, CitizenQueueGroup } from './humanModel';
import { buildSmartTrafficLight, TrafficLightModel } from './animalsAndTraffic';

export interface CityBuildResult {
  sceneGroup: THREE.Group;
  roadCurve: THREE.CatmullRomCurve3;
  roadLengthMeters: number;
  stations: CollectionStation[];
  stationMeshes: THREE.Group[];
  stationCrowds: CitizenQueueGroup[];
  streetLights: THREE.PointLight[];
  greenHubBuilding: THREE.Group;
  greenHubDoor: THREE.Mesh;
  trafficLight: TrafficLightModel;
}

export function build3DCity(renderer: THREE.WebGLRenderer): CityBuildResult {
  const cityGroup = new THREE.Group();
  cityGroup.name = 'SmartCityEnvironment';

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  // 1. Terrain Ground
  const groundSize = 450;
  const grassTex = createGrassTexture();
  grassTex.repeat.set(55, 55);
  grassTex.anisotropy = maxAnisotropy;

  const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 32, 32);
  const groundMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.9,
    metalness: 0.05,
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  cityGroup.add(groundMesh);

  // 2. Road Loop Configured for 200m Smart Intervals
  // Virtual Road Length: 1,000 meters. 5 stations @ 200m each: 0m, 200m, 400m, 600m, 800m
  const ROAD_VIRTUAL_METERS = 1000;
  const ROAD_WIDTH = 8.5;
  const SIDEWALK_WIDTH = 2.4;

  const controlPoints = [
    new THREE.Vector3(0, 0, -85),      // 0m - GREEN HUB Depot HQ
    new THREE.Vector3(65, 0, -75),
    new THREE.Vector3(90, 0, -25),     // 200m - Station 1
    new THREE.Vector3(85, 0, 50),
    new THREE.Vector3(45, 0, 85),      // 400m - Station 2
    new THREE.Vector3(-40, 0, 85),     // 600m - Station 3
    new THREE.Vector3(-85, 0, 50),
    new THREE.Vector3(-90, 0, -25),    // 800m - Station 4
    new THREE.Vector3(-65, 0, -75),
  ];

  const roadCurve = new THREE.CatmullRomCurve3(controlPoints, true, 'catmullrom', 0.25);

  // Build Road Mesh with Asymmetric Lane Texture & Crisp White Edge Line
  const segments = 260;
  const points = roadCurve.getSpacedPoints(segments);
  const roadVertices: number[] = [];
  const roadUvs: number[] = [];
  const roadIndices: number[] = [];

  const sidewalkLeftVertices: number[] = [];
  const sidewalkRightVertices: number[] = [];
  const sidewalkIndices: number[] = [];

  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pt = points[i % segments];
    const tangent = roadCurve.getTangentAt(t % 1.0).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    // Road ribbon vertices
    const leftRoad = new THREE.Vector3().copy(pt).addScaledVector(normal, -ROAD_WIDTH / 2);
    const rightRoad = new THREE.Vector3().copy(pt).addScaledVector(normal, ROAD_WIDTH / 2);
    leftRoad.y = 0.06;
    rightRoad.y = 0.06;

    roadVertices.push(leftRoad.x, leftRoad.y, leftRoad.z);
    roadVertices.push(rightRoad.x, rightRoad.y, rightRoad.z);

    const uvV = t * 40;
    roadUvs.push(0, uvV, 1, uvV);

    // Sidewalk vertices
    const farLeft = new THREE.Vector3().copy(pt).addScaledVector(normal, -ROAD_WIDTH / 2 - SIDEWALK_WIDTH);
    const farRight = new THREE.Vector3().copy(pt).addScaledVector(normal, ROAD_WIDTH / 2 + SIDEWALK_WIDTH);
    farLeft.y = 0.16;
    farRight.y = 0.16;

    sidewalkLeftVertices.push(farLeft.x, farLeft.y, farLeft.z);
    sidewalkLeftVertices.push(leftRoad.x, 0.16, leftRoad.z);

    sidewalkRightVertices.push(rightRoad.x, 0.16, rightRoad.z);
    sidewalkRightVertices.push(farRight.x, farRight.y, farRight.z);

    if (i < segments) {
      const base = i * 2;
      roadIndices.push(base, base + 1, base + 2);
      roadIndices.push(base + 1, base + 3, base + 2);

      sidewalkIndices.push(base, base + 1, base + 2);
      sidewalkIndices.push(base + 1, base + 3, base + 2);
    }
  }

  // Road mesh
  const asphaltTex = createAsphaltTexture();
  asphaltTex.repeat.set(1, 40);
  asphaltTex.anisotropy = maxAnisotropy;

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeo.setIndex(roadIndices);
  roadGeo.computeVertexNormals();

  const roadMat = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughness: 0.85,
    metalness: 0.1,
  });
  roadMat.polygonOffset = true;
  roadMat.polygonOffsetFactor = -1;
  roadMat.polygonOffsetUnits = -1;

  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  cityGroup.add(roadMesh);

  // Sidewalk meshes
  const sidewalkTex = createSidewalkTexture();
  sidewalkTex.repeat.set(1, 40);
  sidewalkTex.anisotropy = maxAnisotropy;

  const sidewalkMat = new THREE.MeshStandardMaterial({
    map: sidewalkTex,
    roughness: 0.8,
    metalness: 0.05,
  });

  const buildSidewalk = (verts: number[]) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    geo.setIndex(sidewalkIndices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, sidewalkMat);
    mesh.receiveShadow = true;
    return mesh;
  };

  cityGroup.add(buildSidewalk(sidewalkLeftVertices));
  cityGroup.add(buildSidewalk(sidewalkRightVertices));

  // 3. GREEN HUB Command Center (0m Origin Point)
  const greenHubBuilding = new THREE.Group();
  greenHubBuilding.name = 'GREEN_HUB_HQ';

  const hubTangent = roadCurve.getTangentAt(0.0).normalize();
  const hubNormal = new THREE.Vector3().crossVectors(hubTangent, up).normalize();
  const hubCenter = roadCurve.getPointAt(0.0).clone().addScaledVector(hubNormal, ROAD_WIDTH / 2 + 16);

  greenHubBuilding.position.copy(hubCenter);
  greenHubBuilding.lookAt(hubCenter.clone().sub(hubNormal));

  // Main Structure
  const mainHubGeo = new THREE.BoxGeometry(26, 12, 18);
  const mainHubMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.7,
    roughness: 0.25,
  });
  const mainHub = new THREE.Mesh(mainHubGeo, mainHubMat);
  mainHub.position.y = 6;
  mainHub.castShadow = true;
  greenHubBuilding.add(mainHub);

  // Glass Atrium
  const glassGeo = new THREE.BoxGeometry(24, 7, 0.4);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.55,
    roughness: 0.1,
    metalness: 0.8,
  });
  const glassAtrium = new THREE.Mesh(glassGeo, glassMat);
  glassAtrium.position.set(0, 7.5, 9.1);
  greenHubBuilding.add(glassAtrium);

  // Large Signboard: GREEN HUB 🇮🇳 MADE IN INDIA
  const signTex = createGreenHubSignTexture();
  signTex.anisotropy = maxAnisotropy;
  const hubSignGeo = new THREE.PlaneGeometry(12, 6);
  const hubSignMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
  const hubSign = new THREE.Mesh(hubSignGeo, hubSignMat);
  hubSign.position.set(0, 15.5, 9.1);
  greenHubBuilding.add(hubSign);

  // Depot Door (Roll-up garage where dustbin emerges!)
  const doorGeo = new THREE.BoxGeometry(5.0, 3.8, 0.3);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x059669, metalness: 0.9, roughness: 0.2 });
  const greenHubDoor = new THREE.Mesh(doorGeo, doorMat);
  greenHubDoor.position.set(0, 1.9, 9.1);
  greenHubDoor.castShadow = true;
  greenHubBuilding.add(greenHubDoor);

  // Telecom Tower & Beacon
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.2, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 })
  );
  antenna.position.set(10, 16, -6);
  greenHubBuilding.add(antenna);

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 2.5 })
  );
  beacon.position.set(10, 20.2, -6);
  greenHubBuilding.add(beacon);

  cityGroup.add(greenHubBuilding);

  // 4. Smart Collection Stations Every 200 METERS
  // Stops at: 0m (Green Hub), 200m, 400m, 600m, 800m
  const stations: CollectionStation[] = [];
  const stationMeshes: THREE.Group[] = [];
  const stationCrowds: CitizenQueueGroup[] = [];

  const stationTValues = [0.0, 0.2, 0.4, 0.6, 0.8];
  const stationNames = [
    'GREEN HUB Central Depot',
    'Oak Ridge Residential Hub',
    'Solaris Eco Boulevard Hub',
    'Mahatma Gandhi Marg Hub',
    'Maple Avenue District Hub',
  ];
  const stationAddresses = [
    '01 Green Hub Way (Depot HQ)',
    '245 Oak Ridge Lane',
    '400 Solaris Expressway',
    '600 M.G. Road Crossing',
    '800 Maple Avenue Sector 4',
  ];

  stationTValues.forEach((tVal, idx) => {
    const distMeter = idx * 200;
    const pt = roadCurve.getPointAt(tVal);
    const tangent = roadCurve.getTangentAt(tVal).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    // Situated right on the curbside white-line side
    const stationPos = new THREE.Vector3().copy(pt).addScaledVector(normal, ROAD_WIDTH / 2 + 3.4);

    const stationGroup = new THREE.Group();
    stationGroup.position.copy(stationPos);
    stationGroup.lookAt(stationPos.clone().add(normal));

    // Base Platform
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.28, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
    );
    platform.position.y = 0.14;
    platform.receiveShadow = true;
    stationGroup.add(platform);

    // Kiosk Pillars & Solar Canopy
    [-2.2, 2.2].forEach((cx) => {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 2.8),
        new THREE.MeshStandardMaterial({ color: 0x0f766e, metalness: 0.8, roughness: 0.2 })
      );
      col.position.set(cx, 1.4, -1.2);
      col.castShadow = true;
      stationGroup.add(col);
    });

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.14, 3.4),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.15 })
    );
    roof.position.set(0, 2.8, 0);
    roof.castShadow = true;
    stationGroup.add(roof);

    // Signboard
    const signTex = createStationSignTexture(idx + 1, distMeter);
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.2),
      new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
    );
    signMesh.position.set(0, 2.0, -1.3);
    stationGroup.add(signMesh);

    // Curbside Waste Bins
    const binColors = [0x10b981, 0x0284c7, 0x64748b];
    [-1.2, 0, 1.2].forEach((bx, bIdx) => {
      const bin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.3, 0.95, 16),
        new THREE.MeshStandardMaterial({ color: binColors[bIdx], roughness: 0.4 })
      );
      bin.position.set(bx, 0.5 + 0.28, 0.5);
      bin.castShadow = true;
      stationGroup.add(bin);
    });

    cityGroup.add(stationGroup);
    stationMeshes.push(stationGroup);

    // 3D Animated Citizen Crowd (3 citizens per station dumping trash directly inside the dustbin hopper)
    const crowd = buildCitizenCrowd();
    const crowdRotMat = new THREE.Matrix4().makeBasis(tangent, up, normal);
    crowd.group.quaternion.setFromRotationMatrix(crowdRotMat);
    crowd.group.position.copy(pt).addScaledVector(normal, 4.8);
    crowd.group.position.y = 0.08;
    cityGroup.add(crowd.group);
    stationCrowds.push(crowd);

    stations.push({
      id: idx + 1,
      name: stationNames[idx],
      distanceMeter: distMeter,
      curveT: tVal,
      position: { x: stationPos.x, y: 0, z: stationPos.z },
      binLevel: 65 + (idx % 3) * 12,
      totalCollectedKg: 30 + idx * 25,
      address: stationAddresses[idx],
    });
  });

  // 5. Neighborhood Houses & Curbside Details
  const houseCount = 24;
  const houseColors = [0xf1f5f9, 0xe2e8f0, 0xd97706, 0x0f766e];
  const roofColors = [0x991b1b, 0x1e293b, 0x064e3b, 0x0f172a];

  for (let i = 0; i < houseCount; i++) {
    const t = (i + 0.3) / houseCount;
    if (Math.abs(t) < 0.08 || stationTValues.some((st) => Math.abs((t - st + 1) % 1) < 0.05)) {
      continue;
    }

    const pt = roadCurve.getPointAt(t);
    const tangent = roadCurve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    const side = i % 2 === 0 ? 1 : -1;
    const dist = ROAD_WIDTH / 2 + SIDEWALK_WIDTH + 8.5;
    const housePos = new THREE.Vector3().copy(pt).addScaledVector(normal, side * dist);

    const houseGroup = new THREE.Group();
    houseGroup.position.copy(housePos);
    houseGroup.lookAt(pt);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 4.0, 6.0),
      new THREE.MeshStandardMaterial({ color: houseColors[i % 4], roughness: 0.8 })
    );
    body.position.y = 2.0;
    body.castShadow = true;
    houseGroup.add(body);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(5.2, 2.5, 4),
      new THREE.MeshStandardMaterial({ color: roofColors[i % 4], roughness: 0.6 })
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 5.25;
    roof.castShadow = true;
    houseGroup.add(roof);

    cityGroup.add(houseGroup);
  }

  // 6. Street Lamps
  const streetLights: THREE.PointLight[] = [];
  for (let i = 0; i < 12; i++) {
    const t = i / 12;
    const pt = roadCurve.getPointAt(t);
    const tangent = roadCurve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    const lampPos = new THREE.Vector3().copy(pt).addScaledVector(normal, ROAD_WIDTH / 2 + 1.2);
    const pLight = new THREE.PointLight(0xfef08a, 0.9, 20, 1.2);
    pLight.position.set(lampPos.x, 4.4, lampPos.z);
    cityGroup.add(pLight);
    streetLights.push(pLight);
  }

  // 7. Zebra Pedestrian Crossing & Smart Traffic Light Gantry (at t = 0.52)
  const zebraT = 0.52;
  const zebraPt = roadCurve.getPointAt(zebraT);
  const zebraTangent = roadCurve.getTangentAt(zebraT).normalize();
  const zebraNormal = new THREE.Vector3().crossVectors(zebraTangent, up).normalize();

  // Zebra Crossing White Stripes spanning across road
  const stripeGeo = new THREE.PlaneGeometry(0.6, 3.4);
  const stripeMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const zebraGroup = new THREE.Group();
  zebraGroup.position.copy(zebraPt);
  zebraGroup.lookAt(zebraPt.clone().add(zebraTangent));

  // 8 White stripes across roadway
  for (let s = -3.5; s <= 3.5; s += 0.95) {
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(s, 0.08, 0);
    zebraGroup.add(stripe);
  }

  // Solid White Vehicle Stop Line (2.8m before crossing)
  const stopLineGeo = new THREE.PlaneGeometry(ROAD_WIDTH, 0.4);
  const stopLine = new THREE.Mesh(stopLineGeo, stripeMat);
  stopLine.rotation.x = -Math.PI / 2;
  stopLine.position.set(0, 0.08, -2.8);
  zebraGroup.add(stopLine);

  cityGroup.add(zebraGroup);

  // Smart Traffic Light Gantry placed at roadside
  const trafficLightPos = new THREE.Vector3()
    .copy(zebraPt)
    .addScaledVector(zebraNormal, ROAD_WIDTH / 2 + 1.4)
    .addScaledVector(zebraTangent, -2.5);

  const stopLinePos = new THREE.Vector3()
    .copy(zebraPt)
    .addScaledVector(zebraNormal, 3.0) // On white line
    .addScaledVector(zebraTangent, -3.2);

  const trafficLight = buildSmartTrafficLight(zebraT, stopLinePos);
  trafficLight.rootGroup.position.copy(trafficLightPos);
  trafficLight.rootGroup.lookAt(trafficLightPos.clone().sub(zebraNormal));
  cityGroup.add(trafficLight.rootGroup);

  return {
    sceneGroup: cityGroup,
    roadCurve,
    roadLengthMeters: ROAD_VIRTUAL_METERS,
    stations,
    stationMeshes,
    stationCrowds,
    streetLights,
    greenHubBuilding,
    greenHubDoor,
    trafficLight,
  };
}
