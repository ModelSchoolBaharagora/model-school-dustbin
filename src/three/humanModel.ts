import * as THREE from 'three';

export interface Citizen {
  rootGroup: THREE.Group;
  trashBagMesh: THREE.Mesh;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  bagColor: number;
  isDone: boolean;
  hasTossed: boolean;
}

export function createQueueCitizen(
  outfitColor: number,
  bagColor: number,
  queueIndex: number
): Citizen {
  const rootGroup = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.6 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: outfitColor, roughness: 0.7 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
  const bagMat = new THREE.MeshStandardMaterial({
    color: bagColor,
    roughness: 0.35,
    metalness: 0.1,
  });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.72, 0.28), shirtMat);
  torso.position.y = 1.25;
  torso.castShadow = true;
  rootGroup.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), skinMat);
  head.position.y = 1.78;
  head.castShadow = true;
  rootGroup.add(head);

  // Hair
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.19, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    hairMat
  );
  hair.position.y = 1.8;
  rootGroup.add(hair);

  // Legs & Feet
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.14, 0.9, 0);
  const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), pantsMat);
  leftLeg.position.y = -0.4;
  leftLegPivot.add(leftLeg);
  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.22), shoeMat);
  leftShoe.position.set(0, -0.82, 0.05);
  leftLegPivot.add(leftShoe);
  rootGroup.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.14, 0.9, 0);
  const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), pantsMat);
  rightLeg.position.y = -0.4;
  rightLegPivot.add(rightLeg);
  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.22), shoeMat);
  rightShoe.position.set(0, -0.82, 0.05);
  rightLegPivot.add(rightShoe);
  rootGroup.add(rightLegPivot);

  // Arms
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.3, 1.5, 0);
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8), shirtMat);
  leftArm.position.y = -0.3;
  leftArmPivot.add(leftArm);
  rootGroup.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.3, 1.5, 0);
  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8), shirtMat);
  rightArm.position.y = -0.3;
  rightArmPivot.add(rightArm);
  rootGroup.add(rightArmPivot);

  // Trash Bag held in hand
  const trashBagMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 1), bagMat);
  trashBagMesh.scale.set(1.0, 1.3, 0.9);
  trashBagMesh.position.set(0, -0.52, 0.22);
  trashBagMesh.castShadow = true;
  rightArmPivot.add(trashBagMesh);

  // Initial standing spot in the sidewalk queue line:
  // Queue starts at curb offset +1.0, staggered along X (+X along sidewalk)
  rootGroup.position.set(queueIndex * 1.3 + 0.4, 0, 1.2);
  // Face towards the road (-Z)
  rootGroup.lookAt(new THREE.Vector3(rootGroup.position.x, 0, -2.0));

  return {
    rootGroup,
    trashBagMesh,
    leftLegPivot,
    rightLegPivot,
    leftArmPivot,
    rightArmPivot,
    bagColor,
    isDone: false,
    hasTossed: false,
  };
}

export interface CitizenQueueGroup {
  group: THREE.Group;
  citizens: Citizen[];
  startSequentialToss: (dustbinWorldPos: THREE.Vector3) => void;
  updateQueue: (delta: number, dustbinWorldPos?: THREE.Vector3) => void;
  hasAnyTossed: boolean;
}

export function buildCitizenCrowd(): CitizenQueueGroup {
  const group = new THREE.Group();

  // 3 citizens waiting in clean line on sidewalk:
  // 1. Blue resident (Cyan garbage bag)
  // 2. Amber resident (Emerald garbage bag)
  // 3. Purple resident (Orange garbage bag)
  const c1 = createQueueCitizen(0x2563eb, 0x06b6d4, 0);
  const c2 = createQueueCitizen(0xd97706, 0x10b981, 1);
  const c3 = createQueueCitizen(0x7c3aed, 0xf59e0b, 2);

  group.add(c1.rootGroup);
  group.add(c2.rootGroup);
  group.add(c3.rootGroup);

  const citizens = [c1, c2, c3];

  // Shared Flying Trash Mesh attached directly to group (NOT citizen limb!)
  // This guarantees 100% direct trajectory straight from hand into the dustbin hopper mouth!
  const flyingTrashMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    roughness: 0.35,
    metalness: 0.1,
  });
  const flyingTrashMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 1), flyingTrashMat);
  flyingTrashMesh.scale.set(1.0, 1.3, 0.9);
  flyingTrashMesh.visible = false;
  flyingTrashMesh.castShadow = true;
  group.add(flyingTrashMesh);

  let currentActiveIndex = -1;
  let citizenTimer = 0;
  let hasAnyTossed = false;

  // Local target coordinate for the dustbin hopper opening:
  // In group coordinates, the dustbin is stopped at ~ (0, 2.15, -1.8)
  const hopperLocalTarget = new THREE.Vector3(0, 2.15, -1.8);
  const throwStartPos = new THREE.Vector3();
  const _tempWorld = new THREE.Vector3();

  const startSequentialToss = (dustbinWorldPos: THREE.Vector3) => {
    hasAnyTossed = false;
    currentActiveIndex = 0;
    citizenTimer = 0;
    flyingTrashMesh.visible = false;

    // Convert dustbin hopper world position into crowd group local space!
    const hopperWorld = dustbinWorldPos.clone().add(new THREE.Vector3(0, 2.15, 0));
    hopperLocalTarget.copy(group.worldToLocal(hopperWorld));

    citizens.forEach((c, idx) => {
      c.isDone = false;
      c.hasTossed = false;
      c.trashBagMesh.visible = true;
      c.rootGroup.position.set(idx * 1.3 + 0.4, 0, 1.2);
      c.rootGroup.lookAt(new THREE.Vector3(c.rootGroup.position.x, 0, hopperLocalTarget.z));
      c.leftLegPivot.rotation.x = 0;
      c.rightLegPivot.rotation.x = 0;
      c.leftArmPivot.rotation.set(0, 0, 0);
      c.rightArmPivot.rotation.set(0, 0, 0);
    });
  };

  const updateQueue = (delta: number, dustbinWorldPos?: THREE.Vector3) => {
    if (dustbinWorldPos) {
      const hopperWorld = dustbinWorldPos.clone().add(new THREE.Vector3(0, 2.15, 0));
      hopperLocalTarget.copy(group.worldToLocal(hopperWorld));
    }

    if (currentActiveIndex < 0 || currentActiveIndex >= citizens.length) {
      return;
    }

    citizenTimer += delta;
    const activeCitizen = citizens[currentActiveIndex];

    // Animation Keyframes:
    // 0.0s - 1.2s: Walk from queue to curb edge (x: 0, z: 0.35) facing the dustbin hopper
    // 1.2s - 2.5s: Wind up right arm and throw trash bag DIRECTLY INSIDE the dustbin hopper
    // 2.5s - 3.7s: Two-handed cheer ("Swachh Bharat / Thank you!"), step aside to viewing spot
    // 3.7s: Next citizen in queue takes their turn!

    const queueStartPos = new THREE.Vector3(currentActiveIndex * 1.3 + 0.4, 0, 1.2);
    const curbSpot = new THREE.Vector3(0.0, 0, 0.35);
    const cheerSpot = new THREE.Vector3(-1.3 - currentActiveIndex * 0.65, 0, 1.2);

    if (citizenTimer < 1.2) {
      // Step up to curbside facing the dustbin
      const walkT = citizenTimer / 1.2;
      activeCitizen.rootGroup.position.lerpVectors(queueStartPos, curbSpot, walkT);
      // Face towards the dustbin hopper!
      activeCitizen.rootGroup.lookAt(new THREE.Vector3(hopperLocalTarget.x, 0, hopperLocalTarget.z));

      // Walking arm & leg swing
      activeCitizen.leftLegPivot.rotation.x = Math.sin(citizenTimer * 12) * 0.55;
      activeCitizen.rightLegPivot.rotation.x = -Math.sin(citizenTimer * 12) * 0.55;
      activeCitizen.leftArmPivot.rotation.x = -Math.sin(citizenTimer * 12) * 0.35;
      activeCitizen.rightArmPivot.rotation.x = Math.sin(citizenTimer * 12) * 0.2;
    } else if (citizenTimer < 2.5) {
      // Plant feet at curb directly facing the dustbin hopper
      activeCitizen.leftLegPivot.rotation.x = 0;
      activeCitizen.rightLegPivot.rotation.x = 0;
      activeCitizen.rootGroup.position.copy(curbSpot);
      activeCitizen.rootGroup.lookAt(new THREE.Vector3(hopperLocalTarget.x, 0, hopperLocalTarget.z));

      const tossT = (citizenTimer - 1.2) / 1.3;

      if (tossT < 0.28) {
        // Wind-up: pull right arm back
        const windupT = tossT / 0.28;
        activeCitizen.rightArmPivot.rotation.x = THREE.MathUtils.lerp(0, -1.9, windupT);
        activeCitizen.leftArmPivot.rotation.x = THREE.MathUtils.lerp(0, -0.6, windupT);

        // Record start position from hand in group coordinates
        activeCitizen.rightArmPivot.getWorldPosition(_tempWorld);
        throwStartPos.copy(group.worldToLocal(_tempWorld));
        flyingTrashMat.color.setHex(activeCitizen.bagColor);
      } else if (tossT < 0.85) {
        // Forward throw stroke and airborne flight straight into the dustbin hopper!
        activeCitizen.trashBagMesh.visible = false;
        flyingTrashMesh.visible = true;

        const flyT = (tossT - 0.28) / 0.57;

        // Arm follows through forward
        activeCitizen.rightArmPivot.rotation.x = THREE.MathUtils.lerp(-1.9, 0.6, Math.min(1, flyT * 2.2));

        // Parabolic flight trajectory straight from hand directly into the dustbin hopper mouth:
        flyingTrashMesh.position.x = THREE.MathUtils.lerp(throwStartPos.x, hopperLocalTarget.x, flyT);
        flyingTrashMesh.position.z = THREE.MathUtils.lerp(throwStartPos.z, hopperLocalTarget.z, flyT);
        const arc = Math.sin(flyT * Math.PI) * 1.05;
        flyingTrashMesh.position.y = THREE.MathUtils.lerp(throwStartPos.y, hopperLocalTarget.y, flyT) + arc;

        // Tumbling rotation
        flyingTrashMesh.rotation.x += delta * 14;
        flyingTrashMesh.rotation.y += delta * 9;
      } else {
        // Trash has landed directly inside the dustbin hopper!
        // Drops down inside into the compactor bed before disappearing:
        const dropT = Math.min(1, (tossT - 0.85) / 0.15);
        flyingTrashMesh.position.x = hopperLocalTarget.x;
        flyingTrashMesh.position.z = hopperLocalTarget.z;
        flyingTrashMesh.position.y = hopperLocalTarget.y - dropT * 0.65;

        if (dropT >= 0.95) {
          flyingTrashMesh.visible = false;
          activeCitizen.hasTossed = true;
          hasAnyTossed = true;
        }

        // Two-handed celebratory cheer!
        activeCitizen.rightArmPivot.rotation.x = -2.6;
        activeCitizen.rightArmPivot.rotation.z = 0.45 + Math.sin(citizenTimer * 12) * 0.15;
        activeCitizen.leftArmPivot.rotation.x = -2.6;
        activeCitizen.leftArmPivot.rotation.z = -0.45 - Math.sin(citizenTimer * 12) * 0.15;
      }
    } else if (citizenTimer < 3.7) {
      // Step aside to sidewalk observation zone
      const stepT = (citizenTimer - 2.5) / 1.2;
      activeCitizen.rootGroup.position.lerpVectors(curbSpot, cheerSpot, stepT);
      activeCitizen.rootGroup.lookAt(new THREE.Vector3(cheerSpot.x, 0, cheerSpot.z + 1.0));

      activeCitizen.leftLegPivot.rotation.x = Math.sin(citizenTimer * 10) * 0.4;
      activeCitizen.rightLegPivot.rotation.x = -Math.sin(citizenTimer * 10) * 0.4;
      activeCitizen.rightArmPivot.rotation.set(0, 0, 0);
      activeCitizen.leftArmPivot.rotation.set(0, 0, 0);
    } else {
      // Citizen finished their turn! Move to next citizen in queue!
      activeCitizen.leftLegPivot.rotation.x = 0;
      activeCitizen.rightLegPivot.rotation.x = 0;
      activeCitizen.rightArmPivot.rotation.set(0, 0, 0);
      activeCitizen.leftArmPivot.rotation.set(0, 0, 0);
      activeCitizen.rootGroup.position.copy(cheerSpot);
      activeCitizen.rootGroup.lookAt(new THREE.Vector3(hopperLocalTarget.x, 0, hopperLocalTarget.z));
      activeCitizen.isDone = true;

      currentActiveIndex++;
      citizenTimer = 0;
    }
  };

  return {
    group,
    citizens,
    startSequentialToss,
    updateQueue,
    get hasAnyTossed() {
      return hasAnyTossed;
    },
  };
}
