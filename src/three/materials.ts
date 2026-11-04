import * as THREE from 'three';

/**
 * Procedural PBR Textures & Materials
 * Strictly adheres to Zero-404 Procedural directives.
 */

// 1. Asphalt Road Texture with Crisp White Shoulder Line on the Right
export function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark realistic asphalt base
  ctx.fillStyle = '#1c1f24';
  ctx.fillRect(0, 0, 1024, 1024);

  // Micro gravel noise
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const g = 26 + Math.floor(Math.random() * 32);
    ctx.fillStyle = `rgb(${g}, ${g + 2}, ${g + 4})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Yellow dashed center line (dividing 2 traffic lanes)
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 14;
  ctx.setLineDash([80, 60]);
  ctx.beginPath();
  ctx.moveTo(512, 0);
  ctx.lineTo(512, 1024);
  ctx.stroke();

  // LEFT Edge White Line
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 16;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(60, 0);
  ctx.lineTo(60, 1024);
  ctx.stroke();

  // RIGHT White Line (The exact white line where the Smart Dustbin drives!)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 20; // Crisp, bright solid white line
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(850, 0);
  ctx.lineTo(850, 1024);
  ctx.stroke();

  // Curbside Green Smart Autonomous Lane marker stripes next to white line
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 6;
  ctx.setLineDash([30, 40]);
  ctx.beginPath();
  ctx.moveTo(890, 0);
  ctx.lineTo(890, 1024);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 2. Concrete Sidewalk Paver Texture
export function createSidewalkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4;
  for (let x = 0; x <= 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 3. Grass Ground Texture
export function createGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e5238';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 7000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const g = 90 + Math.floor(Math.random() * 60);
    ctx.fillStyle = `rgb(25, ${g}, 45)`;
    ctx.fillRect(x, y, 2.5, 2.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 4. "Made in India" 🇮🇳 Emblem Badge Decal
export function createMadeInIndiaDecal(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Tricolor gradient background badge
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 256);

  // Saffron, White, Green stripes
  ctx.fillStyle = '#ff9933'; // Saffron
  ctx.fillRect(16, 16, 480, 24);
  ctx.fillStyle = '#ffffff'; // White
  ctx.fillRect(16, 40, 480, 24);
  ctx.fillStyle = '#138808'; // Green
  ctx.fillRect(16, 64, 480, 24);

  // Blue Chakra circle in center
  ctx.strokeStyle = '#000088';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 52, 11, 0, Math.PI * 2);
  ctx.stroke();

  // Bold Text: MADE IN INDIA
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MADE IN INDIA', 256, 145);

  // Subtitle: SWACHH BHARAT ROBOTICS
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('SWACHH BHARAT IOT ROVER', 256, 185);

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('200m Smart Interval • IR / Sonar / LiDAR', 256, 225);

  // Gold border
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 244);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 5. Green Hub Headquarters Signage
export function createGreenHubSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 512, 256);
  bg.addColorStop(0, '#064e3b');
  bg.addColorStop(1, '#022c22');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 240);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GREEN HUB', 256, 90);

  ctx.fillStyle = '#ff9933';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('🇮🇳 MADE IN INDIA COMMAND DEPOT', 256, 140);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('200M PATROL & RECYCLING DISPATCH', 256, 195);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 6. Indian Cow / Bull Skin Texture (Spotted white & brown hide)
export function createCowSkinTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Creamy white base
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 512);

  // Brown / black organic patches
  ctx.fillStyle = '#78350f';
  const patches = [
    { x: 120, y: 140, r: 80 },
    { x: 380, y: 160, r: 100 },
    { x: 260, y: 340, r: 90 },
    { x: 90, y: 400, r: 60 },
    { x: 440, y: 410, r: 70 },
  ];
  patches.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 7. Municipal Dustbin Ribbed Texture (Authentic molded plastic ribs)
export function createDustbinRibTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#047857'; // Municipal green
  ctx.fillRect(0, 0, 256, 256);

  // Vertical molded reinforcement ribs
  for (let x = 0; x < 256; x += 32) {
    ctx.fillStyle = '#065f46';
    ctx.fillRect(x, 0, 8, 256);
    ctx.fillStyle = '#059669';
    ctx.fillRect(x + 8, 0, 8, 256);
  }

  // Recycle arrows icon
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(128, 128, 40, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 8. 200m Station Signboard Texture
export function createStationSignTexture(stationNumber: number, distanceMeter: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#065f46';
  ctx.fillRect(0, 0, 512, 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`🇮🇳 SMART COLLECTION STOP #${stationNumber}`, 256, 48);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 70, 512, 186);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 48px monospace';
  ctx.fillText(`${distanceMeter} METERS`, 256, 142);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('1-Min Citizen Waste Deposit Stop', 256, 195);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 9. Caution Stripe Texture
export function createCautionStripeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, 256, 64);

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  for (let x = -64; x < 320; x += 48) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 24, 0);
    ctx.lineTo(x + 48, 64);
    ctx.lineTo(x + 24, 64);
    ctx.closePath();
  }
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 10. Solar Cell Texture
export function createSolarCellTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#02182b';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 11. Tire Tread Texture
export function createTireTreadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#09090b';
  for (let y = 0; y < 256; y += 32) {
    ctx.fillRect(0, y, 256, 12);
    ctx.beginPath();
    ctx.moveTo(30, y + 10);
    ctx.lineTo(128, y + 26);
    ctx.lineTo(226, y + 10);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
