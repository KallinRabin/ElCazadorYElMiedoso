/**
 * Constructor del Modelo 3D del Personaje "Loco Joven" (CharacterModelBuilder.ts)
 * Recrea fielmente el diseño estilo boceto a lápiz / Jamie Hewlett:
 * - Pelo puntiagudo desordenado (mechones de grafito)
 * - Ojos saltones con ojeras marcadas y sonrisa picara
 * - Sudadera con capucha abierta sobre camiseta con calavera
 * - Mochila con correas colgando
 * - Pantalones cargo con bolsillos laterales y parches
 * - Zapatillas de lona estilo Converse
 */

import * as THREE from 'three';

// 1. Textura procedural para camiseta con calavera entintada
function createSkullShirtTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Fondo blanco papel pergamino
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, 256, 256);

  // Trama de lápiz sutil
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 256; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 20, 256);
    ctx.stroke();
  }

  // Dibujo de la calavera en el pecho estilo cómic
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;

  // Cráneo
  ctx.beginPath();
  ctx.arc(128, 100, 45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Mandíbula
  ctx.fillRect(108, 130, 40, 30);
  ctx.strokeRect(108, 130, 40, 30);

  // Ojos calavera
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(112, 100, 12, 0, Math.PI * 2);
  ctx.arc(144, 100, 12, 0, Math.PI * 2);
  ctx.fill();

  // Nariz y dientes
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(124, 118, 8, 10);
  ctx.fillRect(116, 142, 6, 14);
  ctx.fillRect(126, 142, 6, 14);
  ctx.fillRect(136, 142, 6, 14);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

// 2. Textura para rostro expresivo con ojeras y sonrisa
function createFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Tono de piel papel
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 256);

  // Ojeras marcadas a lápiz
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(85, 115, 28, 0.2, Math.PI - 0.2);
  ctx.arc(171, 115, 28, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Cejas expresivas caóticas
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(60, 75);
  ctx.lineTo(110, 85);
  ctx.moveTo(146, 85);
  ctx.lineTo(196, 75);
  ctx.stroke();

  // Sonrisa pícara con dientes
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(128, 180, 50, 25, 0, 0, Math.PI);
  ctx.fill();
  ctx.stroke();

  // Dientes afilados
  ctx.fillStyle = '#ffffff';
  for (let x = 90; x <= 160; x += 14) {
    ctx.fillRect(x, 180, 10, 12);
  }

  // Trazos de carboncillo en mejillas
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(40 + i * 5, 145);
    ctx.lineTo(55 + i * 5, 160);
    ctx.moveTo(190 + i * 5, 145);
    ctx.lineTo(205 + i * 5, 160);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export function buildLocoJovenCharacter(hoodieColorHex: number = 0x3b82f6): {
  root: THREE.Group;
  head: THREE.Group;
  body: THREE.Group;
  bowAttachPoint: THREE.Group;
} {
  const root = new THREE.Group();
  root.name = 'LocoJovenCharacter';

  // Materiales con estilo entintado
  const pencilInkMat = new THREE.MeshToonMaterial({ color: 0x0f172a }); // Tinta negra oscura
  const skinMat = new THREE.MeshToonMaterial({ map: createFaceTexture(), color: 0xf1f5f9 });
  const shirtMat = new THREE.MeshToonMaterial({ map: createSkullShirtTexture() });
  const hoodieMat = new THREE.MeshToonMaterial({ color: hoodieColorHex });
  const pantsMat = new THREE.MeshToonMaterial({ color: 0x475569 }); // Pantalón cargo gris/oliva
  const patchMat = new THREE.MeshToonMaterial({ color: 0x1e293b }); // Parche de tela cosido
  const shoesMat = new THREE.MeshToonMaterial({ color: 0x0f172a }); // Zapatillas converse
  const whiteRubberMat = new THREE.MeshToonMaterial({ color: 0xf8fafc }); // Suela de goma blanca
  const backpackMat = new THREE.MeshToonMaterial({ color: 0x1e293b }); // Mochila oscura

  // =========================================================================
  // 1. PIERNAS & PANTALONES CARGO CON PARCHES & ZAPATILLAS CONVERSE
  // =========================================================================
  const legsGroup = new THREE.Group();
  legsGroup.position.set(0, 0, 0);

  const legGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.72, 8);
  const legLeft = new THREE.Mesh(legGeo, pantsMat);
  legLeft.position.set(-0.19, 0.42, 0);
  legLeft.castShadow = true;
  legsGroup.add(legLeft);

  const legRight = new THREE.Mesh(legGeo, pantsMat);
  legRight.position.set(0.19, 0.42, 0);
  legRight.castShadow = true;
  legsGroup.add(legRight);

  // Bolsillos laterales de cargo
  const pocketGeo = new THREE.BoxGeometry(0.12, 0.18, 0.16);
  const pocketL = new THREE.Mesh(pocketGeo, pantsMat);
  pocketL.position.set(-0.31, 0.40, 0);
  legsGroup.add(pocketL);

  const pocketR = new THREE.Mesh(pocketGeo, pantsMat);
  pocketR.position.set(0.31, 0.40, 0);
  legsGroup.add(pocketR);

  // Parche cosido en la rodilla
  const patchGeo = new THREE.BoxGeometry(0.12, 0.14, 0.04);
  const patch = new THREE.Mesh(patchGeo, patchMat);
  patch.position.set(-0.19, 0.36, 0.14);
  legsGroup.add(patch);

  // Zapatillas Converse clásicas (Suela de goma blanca + puntera + tela negra)
  const shoeGeo = new THREE.BoxGeometry(0.18, 0.15, 0.38);
  const toeGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.16, 8, 1, false, 0, Math.PI);
  const soleGeo = new THREE.BoxGeometry(0.20, 0.05, 0.40);

  // Zapatilla Izquierda
  const shoeL = new THREE.Mesh(shoeGeo, shoesMat);
  shoeL.position.set(-0.19, 0.10, 0.05);
  shoeL.castShadow = true;
  legsGroup.add(shoeL);

  const soleL = new THREE.Mesh(soleGeo, whiteRubberMat);
  soleL.position.set(-0.19, 0.025, 0.05);
  legsGroup.add(soleL);

  const toeL = new THREE.Mesh(toeGeo, whiteRubberMat);
  toeL.rotation.x = Math.PI / 2;
  toeL.position.set(-0.19, 0.08, 0.20);
  legsGroup.add(toeL);

  // Zapatilla Derecha
  const shoeR = new THREE.Mesh(shoeGeo, shoesMat);
  shoeR.position.set(0.19, 0.10, 0.05);
  shoeR.castShadow = true;
  legsGroup.add(shoeR);

  const soleR = new THREE.Mesh(soleGeo, whiteRubberMat);
  soleR.position.set(0.19, 0.025, 0.05);
  legsGroup.add(soleR);

  const toeR = new THREE.Mesh(toeGeo, whiteRubberMat);
  toeR.rotation.x = Math.PI / 2;
  toeR.position.set(0.19, 0.08, 0.20);
  legsGroup.add(toeR);

  root.add(legsGroup);

  // =========================================================================
  // 2. TORSO: CAMISETA DE CALAVERA + SUDADERA ABIERTA + MOCHILA CON CORREAS
  // =========================================================================
  const body = new THREE.Group();
  body.position.set(0, 0.78, 0);

  // Camiseta interior con estampado de calavera
  const shirtGeo = new THREE.CylinderGeometry(0.26, 0.25, 0.65, 8);
  const shirt = new THREE.Mesh(shirtGeo, shirtMat);
  shirt.position.set(0, 0.32, 0);
  shirt.castShadow = true;
  body.add(shirt);

  // Solapas de la sudadera abierta
  const flapGeo = new THREE.BoxGeometry(0.10, 0.62, 0.34);
  const flapL = new THREE.Mesh(flapGeo, hoodieMat);
  flapL.position.set(-0.25, 0.32, 0.04);
  body.add(flapL);

  const flapR = new THREE.Mesh(flapGeo, hoodieMat);
  flapR.position.set(0.25, 0.32, 0.04);
  body.add(flapR);

  const hoodieBack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.62, 0.12), hoodieMat);
  hoodieBack.position.set(0, 0.32, -0.18);
  body.add(hoodieBack);

  // Capucha caída en los hombros
  const hoodFoldGeo = new THREE.TorusGeometry(0.22, 0.08, 6, 8, Math.PI);
  const hoodFold = new THREE.Mesh(hoodFoldGeo, hoodieMat);
  hoodFold.rotation.x = -Math.PI / 2.5;
  hoodFold.position.set(0, 0.58, -0.16);
  body.add(hoodFold);

  // Mochila a la espalda
  const backpackGeo = new THREE.BoxGeometry(0.38, 0.44, 0.22);
  const backpack = new THREE.Mesh(backpackGeo, backpackMat);
  backpack.position.set(0, 0.36, -0.30);
  backpack.castShadow = true;
  body.add(backpack);

  // Correas de la mochila
  const strapGeo = new THREE.BoxGeometry(0.06, 0.54, 0.04);
  const strapL = new THREE.Mesh(strapGeo, pencilInkMat);
  strapL.position.set(-0.16, 0.35, 0.16);
  body.add(strapL);

  const strapR = new THREE.Mesh(strapGeo, pencilInkMat);
  strapR.position.set(0.16, 0.35, 0.16);
  body.add(strapR);

  // Brazos con mangas arremangadas
  const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.56, 8);
  const armL = new THREE.Mesh(armGeo, hoodieMat);
  armL.position.set(-0.38, 0.32, 0);
  armL.rotation.z = 0.15;
  body.add(armL);

  const armR = new THREE.Mesh(armGeo, hoodieMat);
  armR.position.set(0.38, 0.32, 0);
  armR.rotation.z = -0.15;
  body.add(armR);

  // Manos a lápiz
  const handGeo = new THREE.SphereGeometry(0.07, 6, 6);
  const handL = new THREE.Mesh(handGeo, skinMat);
  handL.position.set(-0.42, 0.02, 0);
  body.add(handL);

  const handR = new THREE.Mesh(handGeo, skinMat);
  handR.position.set(0.42, 0.02, 0);
  body.add(handR);

  // Punto de anclaje para el arco en mano derecha
  const bowAttachPoint = new THREE.Group();
  bowAttachPoint.position.set(0.44, 0.05, 0.15);
  body.add(bowAttachPoint);

  root.add(body);

  // =========================================================================
  // 3. CABEZA: ROSTRO EXPRESIVO + PELO PUNTIAGUDO CAÓTICO ESTILO GORILLAZ
  // =========================================================================
  const head = new THREE.Group();
  head.position.set(0, 1.48, 0);

  // Cuello
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.11, 0.16, 8), skinMat);
  neck.position.set(0, -0.06, 0);
  head.add(neck);

  // Cabeza con textura de rostro
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), skinMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Ojos saltones grandes tridimensionales
  const eyeWhiteGeo = new THREE.SphereGeometry(0.075, 8, 8);
  const eyeWhiteMat = new THREE.MeshToonMaterial({ color: 0xffffff });
  const pupilGeo = new THREE.SphereGeometry(0.025, 6, 6);

  // Ojo Izquierdo
  const eyeL = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  eyeL.position.set(-0.09, 0.03, 0.20);
  const pupilL = new THREE.Mesh(pupilGeo, pencilInkMat);
  pupilL.position.set(0, 0, 0.065);
  eyeL.add(pupilL);
  head.add(eyeL);

  // Ojo Derecho
  const eyeR = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  eyeR.position.set(0.09, 0.03, 0.20);
  const pupilR = new THREE.Mesh(pupilGeo, pencilInkMat);
  pupilR.position.set(0, 0, 0.065);
  eyeR.add(pupilR);
  head.add(eyeR);

  // Nariz puntiaguda dibujada
  const noseGeo = new THREE.ConeGeometry(0.03, 0.08, 4);
  const nose = new THREE.Mesh(noseGeo, skinMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.02, 0.26);
  head.add(nose);

  // Orejas
  const earGeo = new THREE.SphereGeometry(0.06, 6, 6);
  const earL = new THREE.Mesh(earGeo, skinMat);
  earL.position.set(-0.25, 0, 0);
  head.add(earL);

  const earR = new THREE.Mesh(earGeo, skinMat);
  earR.position.set(0.25, 0, 0);
  head.add(earR);

  // =========================================================================
  // 4. CABELLO PUNTIAGUDO CAÓTICO EN MECHONES A LÁPIZ (ICÓNICO "LOCO JOVEN")
  // =========================================================================
  const hairGroup = new THREE.Group();
  const spikeGeoLarge = new THREE.ConeGeometry(0.09, 0.28, 4);
  const spikeGeoMedium = new THREE.ConeGeometry(0.07, 0.22, 4);
  const spikeGeoSmall = new THREE.ConeGeometry(0.05, 0.16, 4);

  // Distribución caótica de mechones de pelo alrededor de la cabeza
  const spikesData = [
    // Coronilla y flequillo alborotado
    { geo: spikeGeoLarge, pos: [0, 0.24, 0.12], rot: [0.4, 0, 0] },
    { geo: spikeGeoLarge, pos: [-0.12, 0.22, 0.14], rot: [0.3, 0.3, 0.2] },
    { geo: spikeGeoLarge, pos: [0.12, 0.22, 0.14], rot: [0.3, -0.3, -0.2] },
    { geo: spikeGeoMedium, pos: [-0.06, 0.15, 0.24], rot: [0.8, -0.2, 0.1] },
    { geo: spikeGeoMedium, pos: [0.06, 0.15, 0.24], rot: [0.8, 0.2, -0.1] },
    // Parte superior central
    { geo: spikeGeoLarge, pos: [0, 0.30, 0], rot: [0, 0, 0] },
    { geo: spikeGeoLarge, pos: [-0.14, 0.26, 0], rot: [0, 0, 0.5] },
    { geo: spikeGeoLarge, pos: [0.14, 0.26, 0], rot: [0, 0, -0.5] },
    // Laterales rebeldes
    { geo: spikeGeoMedium, pos: [-0.22, 0.14, 0.08], rot: [0.2, 0.3, 1.1] },
    { geo: spikeGeoMedium, pos: [0.22, 0.14, 0.08], rot: [0.2, -0.3, -1.1] },
    { geo: spikeGeoMedium, pos: [-0.24, 0.08, -0.05], rot: [-0.2, 0.4, 1.3] },
    { geo: spikeGeoMedium, pos: [0.24, 0.08, -0.05], rot: [-0.2, -0.4, -1.3] },
    // Nuca y parte trasera
    { geo: spikeGeoLarge, pos: [0, 0.22, -0.18], rot: [-0.5, 0, 0] },
    { geo: spikeGeoMedium, pos: [-0.12, 0.18, -0.18], rot: [-0.4, 0.3, 0.3] },
    { geo: spikeGeoMedium, pos: [0.12, 0.18, -0.18], rot: [-0.4, -0.3, -0.3] },
    { geo: spikeGeoSmall, pos: [0, 0.08, -0.22], rot: [-0.8, 0, 0] },
  ];

  spikesData.forEach((s) => {
    const spike = new THREE.Mesh(s.geo, pencilInkMat);
    spike.position.set(s.pos[0], s.pos[1], s.pos[2]);
    spike.rotation.set(s.rot[0], s.rot[1], s.rot[2]);
    spike.castShadow = true;
    hairGroup.add(spike);
  });

  head.add(hairGroup);
  root.add(head);

  return { root, head, body, bowAttachPoint };
}
