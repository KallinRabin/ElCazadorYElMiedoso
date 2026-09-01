/**
 * Generador Avanzado de Laberintos con Estilo Dibujado a Mano (Hand-Drawn & Cel-Shaded)
 * Genera texturas procedurales ilustradas (Paredes antiguas con grietas y musgo, losas agrietadas),
 * cámaras herméticas con marcos arquitectónicos exactos (dintel + jambas) para puertas de Entrada/Salida,
 * y obstáculos 3D distribuídos por el laberinto.
 */

import * as THREE from 'three';
import { Door } from './Door';
import { Trapdoor } from './Trapdoor';
import { HiddenPassage } from './HiddenPassage';

export interface MazeOutput {
  rootGroup: THREE.Group;
  colliders: THREE.Box3[];
  doors: Door[];
  trapdoors: Trapdoor[];
  passages: HiddenPassage[];
  arrowPickups: Array<{ id: string; mesh: THREE.Group; position: THREE.Vector3; collected: boolean }>;
  playerSpawn: THREE.Vector3;
  botSpawn: THREE.Vector3;
  interactiveMeshes: THREE.Object3D[];
  torches: THREE.PointLight[];
  crawlSpaces: THREE.Box3[];
}

class SeededRandom {
  private s: number;
  constructor(seed: number = 42) {
    this.s = seed % 2147483647;
    if (this.s <= 0) this.s += 2147483646;
  }
  public next(): number {
    this.s = (this.s * 16807) % 2147483647;
    return (this.s - 1) / 2147483646;
  }
  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  public choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

interface RoomDef {
  id: string;
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  entryDoor: { x: number; y: number; orientation: 'horizontal' | 'vertical'; name: string };
  exitDoor: { x: number; y: number; orientation: 'horizontal' | 'vertical'; name: string };
}

// --- GENERADORES DE TEXTURAS PROCEDURALES ESTILO DIBUJO / CÓMIC ---

function createHandDrawnWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Fondo base de piedra antigua
  ctx.fillStyle = '#4a5768';
  ctx.fillRect(0, 0, 512, 512);

  // Patrón de bloques de piedra irregulares
  const rows = 8;
  const rowHeight = 512 / rows;

  for (let r = 0; r < rows; r++) {
    const y = r * rowHeight;
    const cols = r % 2 === 0 ? 4 : 5;
    const colWidth = 512 / cols;

    for (let c = 0; c < cols; c++) {
      const x = c * colWidth;
      const bw = colWidth - 4;
      const bh = rowHeight - 4;

      // Color base del bloque con ligera variación
      const shade = 70 + ((r * 13 + c * 17) % 25);
      ctx.fillStyle = `rgb(${shade}, ${shade + 12}, ${shade + 28})`;
      ctx.fillRect(x + 2, y + 2, bw, bh);

      // Sombreado entintado interno
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(x + 2, y + bh - 4, bw, 6);

      // Trazo de tinta negra alrededor de la piedra
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(x + 2, y + 2, bw, bh);

      // Grietas dibujadas
      if ((r + c) % 3 === 0) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 10);
        ctx.lineTo(x + bw * 0.4, y + bh * 0.5);
        ctx.lineTo(x + bw * 0.7, y + bh * 0.4);
        ctx.lineTo(x + bw - 10, y + bh - 8);
        ctx.stroke();
      }

      // Manchas de musgo verde vivo
      if ((r * 3 + c * 7) % 4 === 0) {
        ctx.fillStyle = '#2d6a4f';
        ctx.beginPath();
        ctx.arc(x + bw * 0.3, y + bh - 4, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#52b788';
        ctx.beginPath();
        ctx.arc(x + bw * 0.3 + 4, y + bh - 6, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

function createHandDrawnFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Fondo de tierra/mortero oscuro
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 512);

  // Cuadrícula de losas de piedra
  const gridSize = 4;
  const tileSize = 512 / gridSize;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const x = c * tileSize + 4;
      const y = r * tileSize + 4;
      const tw = tileSize - 8;
      const th = tileSize - 8;

      const tone = 50 + ((r * 11 + c * 19) % 20);
      ctx.fillStyle = `rgb(${tone}, ${tone + 10}, ${tone + 20})`;
      ctx.fillRect(x, y, tw, th);

      // Trazos de tinta negra
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, tw, th);

      // Grietas de piedra en el suelo
      if ((r + c * 2) % 3 === 0) {
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + tw * 0.2, y + 6);
        ctx.lineTo(x + tw * 0.5, y + th * 0.45);
        ctx.lineTo(x + tw * 0.85, y + th * 0.8);
        ctx.stroke();
      }

      // Musgo en las junturas
      if ((r + c) % 2 === 0) {
        ctx.fillStyle = '#1b4332';
        ctx.fillRect(x, y, tw, 6);
        ctx.fillStyle = '#40916c';
        ctx.fillRect(x + 4, y + 2, tw * 0.5, 4);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

export class MazeGenerator {
  public static generate(size: number = 15, seed: number = 42): MazeOutput {
    const mazeDim = Math.max(15, size % 2 === 0 ? size + 1 : size);
    const rng = new SeededRandom(seed);
    const cellSize = 4.0;
    const wallHeight = 4.6;

    const rootGroup = new THREE.Group();
    rootGroup.name = 'HandDrawnMazeRoot';

    const colliders: THREE.Box3[] = [];
    const doors: Door[] = [];
    const trapdoors: Trapdoor[] = [];
    const passages: HiddenPassage[] = [];
    const arrowPickups: Array<{ id: string; mesh: THREE.Group; position: THREE.Vector3; collected: boolean }> = [];
    const interactiveMeshes: THREE.Object3D[] = [];
    const torches: THREE.PointLight[] = [];
    const crawlSpaces: THREE.Box3[] = [];

    // --- TEXTURAS DIBUJADAS PROCEDURALES ---
    const wallTex = createHandDrawnWallTexture();
    const floorTex = createHandDrawnFloorTexture();

    const wallMat = new THREE.MeshToonMaterial({
      map: wallTex,
      color: 0xcccccc,
    });

    const wallCapMat = new THREE.MeshToonMaterial({
      color: 0x1e293b, // Tinta negra/azul oscuro
    });

    const floorMat = new THREE.MeshToonMaterial({
      map: floorTex,
      color: 0xbbbbbb,
    });

    const ceilingMat = new THREE.MeshToonMaterial({
      color: 0x18202c,
    });

    const woodBeamMat = new THREE.MeshToonMaterial({
      color: 0x854d24,
    });

    const mossRockMat = new THREE.MeshToonMaterial({
      color: 0x475569,
    });

    // 1. Grid del mapa (1: Muro, 0: Pasillo libre, 2: Interior Habitación, 3: Zona gateo, 4: Puerta)
    const grid: number[][] = Array.from({ length: mazeDim }, () => Array(mazeDim).fill(1));

    // 2. Definición de Habitaciones Herméticas con Entrada y Salida
    const center = Math.floor(mazeDim / 2);
    const rooms: RoomDef[] = [
      {
        id: 'central_hall',
        name: 'Gran Salón Central',
        x1: center - 2,
        y1: center - 2,
        x2: center + 2,
        y2: center + 2,
        entryDoor: { x: center, y: center - 2, orientation: 'horizontal', name: 'Entrada Norte' },
        exitDoor: { x: center, y: center + 2, orientation: 'horizontal', name: 'Salida Sur' },
      },
      {
        id: 'armory',
        name: 'Armería Antigua',
        x1: 2,
        y1: 2,
        x2: 5,
        y2: 5,
        entryDoor: { x: 3, y: 5, orientation: 'horizontal', name: 'Entrada Sur' },
        exitDoor: { x: 5, y: 3, orientation: 'vertical', name: 'Salida Este' },
      },
      {
        id: 'crypt',
        name: 'Cripta Olvidada',
        x1: mazeDim - 6,
        y1: mazeDim - 6,
        x2: mazeDim - 3,
        y2: mazeDim - 3,
        entryDoor: { x: mazeDim - 5, y: mazeDim - 6, orientation: 'horizontal', name: 'Entrada Norte' },
        exitDoor: { x: mazeDim - 6, y: mazeDim - 4, orientation: 'vertical', name: 'Salida Oeste' },
      },
      {
        id: 'guard_chamber',
        name: 'Puesto de Guardia',
        x1: mazeDim - 6,
        y1: 2,
        x2: mazeDim - 3,
        y2: 5,
        entryDoor: { x: mazeDim - 6, y: 3, orientation: 'vertical', name: 'Entrada Oeste' },
        exitDoor: { x: mazeDim - 4, y: 5, orientation: 'horizontal', name: 'Salida Sur' },
      },
    ];

    // Reservar interiores y perímetros
    rooms.forEach(room => {
      // Interior
      for (let y = room.y1 + 1; y < room.y2; y++) {
        for (let x = room.x1 + 1; x < room.x2; x++) {
          grid[y][x] = 2;
        }
      }
      // Perímetros sólidos
      for (let x = room.x1; x <= room.x2; x++) {
        grid[room.y1][x] = 1;
        grid[room.y2][x] = 1;
      }
      for (let y = room.y1; y <= room.y2; y++) {
        grid[y][room.x1] = 1;
        grid[y][room.x2] = 1;
      }

      // Marcar vanos de puerta
      grid[room.entryDoor.y][room.entryDoor.x] = 4;
      grid[room.exitDoor.y][room.exitDoor.x] = 4;
    });

    // 3. Generación de pasillos de Laberinto con DFS
    function carvePassages(cx: number, cy: number) {
      if (grid[cy][cx] === 1) grid[cy][cx] = 0;

      const dirs = [
        [0, -2],
        [2, 0],
        [0, 2],
        [-2, 0],
      ].sort(() => rng.next() - 0.5);

      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;

        if (nx > 0 && nx < mazeDim - 1 && ny > 0 && ny < mazeDim - 1) {
          const midX = cx + dx / 2;
          const midY = cy + dy / 2;

          if (grid[ny][nx] === 1 && grid[midY][midX] === 1) {
            grid[midY][midX] = 0;
            grid[ny][nx] = 0;
            carvePassages(nx, ny);
          }
        }
      }
    }

    carvePassages(1, 1);
    carvePassages(1, mazeDim - 2);

    // 4. Conectar laberinto a las puertas de Entrada y Salida
    rooms.forEach(room => {
      const e = room.entryDoor;
      const ex = e.orientation === 'horizontal' ? e.x : (e.x === room.x1 ? e.x - 1 : e.x + 1);
      const ey = e.orientation === 'horizontal' ? (e.y === room.y1 ? e.y - 1 : e.y + 1) : e.y;
      if (ey > 0 && ey < mazeDim - 1 && ex > 0 && ex < mazeDim - 1) grid[ey][ex] = 0;

      const x = room.exitDoor;
      const xx = x.orientation === 'horizontal' ? x.x : (x.x === room.x1 ? x.x - 1 : x.x + 1);
      const xy = x.orientation === 'horizontal' ? (x.y === room.y1 ? x.y - 1 : x.y + 1) : x.y;
      if (xy > 0 && xy < mazeDim - 1 && xx > 0 && xx < mazeDim - 1) grid[xy][xx] = 0;
    });

    // 5. Entrelazado (Braiding)
    for (let y = 1; y < mazeDim - 1; y += 2) {
      for (let x = 1; x < mazeDim - 1; x += 2) {
        if (grid[y][x] === 0) {
          const neighbors = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
          ];
          const closed = neighbors.filter(n => {
            const ny = y + n.dy;
            const nx = x + n.dx;
            return ny > 0 && ny < mazeDim - 1 && nx > 0 && nx < mazeDim - 1 && grid[ny][nx] === 1;
          });

          if (closed.length >= 3 && rng.next() < 0.4) {
            const pick = rng.choice(closed);
            grid[y + pick.dy][x + pick.dx] = 0;
          }
        }
      }
    }

    // 6. Multiplicación de Túneles y Pasajes de Gateo en Paredes (Crawl Holes)
    // Conectan pasillos y abren atajos agachándose a través de la pared
    const crawlTunnelCandidates = [
      { x: 1, y: center },
      { x: mazeDim - 2, y: center },
      { x: center, y: 1 },
      { x: center, y: mazeDim - 2 },
      { x: 4, y: 1 },
      { x: 1, y: 4 },
      { x: mazeDim - 5, y: mazeDim - 2 },
      { x: mazeDim - 2, y: mazeDim - 5 },
      { x: center - 3, y: center + 3 },
      { x: center + 3, y: center - 3 },
    ];

    crawlTunnelCandidates.forEach(cp => {
      if (cp.x > 0 && cp.x < mazeDim - 1 && cp.y > 0 && cp.y < mazeDim - 1) {
        // No sobrescribir habitaciones ni puertas
        if (grid[cp.y][cp.x] !== 2 && grid[cp.y][cp.x] !== 4) {
          grid[cp.y][cp.x] = 3; // Convertir en agujero/paso bajo de pared
        }
      }
    });

    // 7. Construcción de Suelo y Techo
    const totalWorldSize = mazeDim * cellSize;
    const floorGeo = new THREE.PlaneGeometry(totalWorldSize + 12, totalWorldSize + 12);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, 0);
    floorMesh.receiveShadow = true;
    rootGroup.add(floorMesh);

    const ceilingGeo = new THREE.PlaneGeometry(totalWorldSize + 12, totalWorldSize + 12);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(0, wallHeight, 0);
    rootGroup.add(ceilingMesh);

    // 8. Construcción de Muros Sólidos y Zonas de Puerta Herméticas
    const wallGeo = new THREE.BoxGeometry(cellSize, wallHeight, cellSize);
    const capGeo = new THREE.BoxGeometry(cellSize * 1.02, 0.22, cellSize * 1.02);
    const lowCeilingGeo = new THREE.BoxGeometry(cellSize, wallHeight - 1.4, cellSize);

    // Geometrías para marcos de paso de puerta (Jambas laterales y dintel superior)
    // Para cellSize = 4.0m y puerta = 2.2m ancho x 3.2m alto:
    // Jambas laterales: ancho 0.9m cada una, alto 4.6m
    // Dintel superior: ancho 2.2m, alto 1.4m (de y=3.2 a 4.6m)
    const jambGeoH = new THREE.BoxGeometry(0.9, wallHeight, cellSize);
    const jambGeoV = new THREE.BoxGeometry(cellSize, wallHeight, 0.9);
    const lintelHeight = wallHeight - 3.2; // 1.4m
    const lintelCenterY = 3.2 + lintelHeight / 2; // 3.9m
    const lintelGeoH = new THREE.BoxGeometry(2.2, lintelHeight, cellSize);
    const lintelGeoV = new THREE.BoxGeometry(cellSize, lintelHeight, 2.2);

    for (let y = 0; y < mazeDim; y++) {
      for (let x = 0; x < mazeDim; x++) {
        const wx = (x - mazeDim / 2 + 0.5) * cellSize;
        const wz = (y - mazeDim / 2 + 0.5) * cellSize;
        const cell = grid[y][x];

        if (cell === 1) {
          // Muro Sólido de Piedra
          const wall = new THREE.Mesh(wallGeo, wallMat);
          wall.position.set(wx, wallHeight / 2, wz);
          wall.castShadow = true;
          wall.receiveShadow = true;
          rootGroup.add(wall);

          const cap = new THREE.Mesh(capGeo, wallCapMat);
          cap.position.set(wx, wallHeight - 0.11, wz);
          rootGroup.add(cap);

          const box = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(wx, wallHeight / 2, wz),
            new THREE.Vector3(cellSize, wallHeight, cellSize)
          );
          colliders.push(box);
        } else if (cell === 4) {
          // Vano de Puerta Hermético: Averiguar si la orientación es horizontal o vertical
          let isHorizontal = true;
          rooms.forEach(r => {
            if ((r.entryDoor.x === x && r.entryDoor.y === y && r.entryDoor.orientation === 'vertical') ||
                (r.exitDoor.x === x && r.exitDoor.y === y && r.exitDoor.orientation === 'vertical')) {
              isHorizontal = false;
            }
          });

          if (isHorizontal) {
            // Jambas laterales en X (izquierda y derecha a ±1.55m del centro)
            const jambLeft = new THREE.Mesh(jambGeoH, wallMat);
            jambLeft.position.set(wx - 1.55, wallHeight / 2, wz);
            jambLeft.castShadow = true;
            rootGroup.add(jambLeft);
            colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(wx - 1.55, wallHeight / 2, wz), new THREE.Vector3(0.9, wallHeight, cellSize)));

            const jambRight = new THREE.Mesh(jambGeoH, wallMat);
            jambRight.position.set(wx + 1.55, wallHeight / 2, wz);
            jambRight.castShadow = true;
            rootGroup.add(jambRight);
            colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(wx + 1.55, wallHeight / 2, wz), new THREE.Vector3(0.9, wallHeight, cellSize)));

            // Dintel superior (de y=3.2 a 4.6m)
            const lintel = new THREE.Mesh(lintelGeoH, wallMat);
            lintel.position.set(wx, lintelCenterY, wz);
            lintel.castShadow = true;
            rootGroup.add(lintel);
            colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(wx, lintelCenterY, wz), new THREE.Vector3(2.2, lintelHeight, cellSize)));
          } else {
            // Jambas laterales en Z (arriba y abajo a ±1.55m del centro)
            const jambTop = new THREE.Mesh(jambGeoV, wallMat);
            jambTop.position.set(wx, wallHeight / 2, wz - 1.55);
            jambTop.castShadow = true;
            rootGroup.add(jambTop);
            colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(wx, wallHeight / 2, wz - 1.55), new THREE.Vector3(cellSize, wallHeight, 0.9)));

            const jambBottom = new THREE.Mesh(jambGeoV, wallMat);
            jambBottom.position.set(wx, wallHeight / 2, wz + 1.55);
            jambBottom.castShadow = true;
            rootGroup.add(jambBottom);
            colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(wx, wallHeight / 2, wz + 1.55), new THREE.Vector3(cellSize, wallHeight, 0.9)));

            // Dintel superior en Z
            const lintel = new THREE.Mesh(lintelGeoV, wallMat);
            lintel.position.set(wx, lintelCenterY, wz);
            lintel.castShadow = true;
            rootGroup.add(lintel);
            colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(wx, lintelCenterY, wz), new THREE.Vector3(cellSize, lintelHeight, 2.2)));
          }
        } else if (cell === 3) {
          // Agujero / Túnel de gateo en la pared
          const lowCeiling = new THREE.Mesh(lowCeilingGeo, woodBeamMat);
          lowCeiling.position.set(wx, 1.4 + (wallHeight - 1.4) / 2, wz);
          lowCeiling.castShadow = true;
          rootGroup.add(lowCeiling);

          // Vigas laterales decorativas de madera
          const postGeo = new THREE.BoxGeometry(0.2, 1.4, 0.2);
          const postLeft = new THREE.Mesh(postGeo, woodBeamMat);
          postLeft.position.set(wx - 1.8, 0.7, wz);
          rootGroup.add(postLeft);

          const postRight = new THREE.Mesh(postGeo, woodBeamMat);
          postRight.position.set(wx + 1.8, 0.7, wz);
          rootGroup.add(postRight);

          // Indicador luminoso sutil
          const crawlGlow = new THREE.PointLight(0x38bdf8, 0.6, 3.0);
          crawlGlow.position.set(wx, 0.8, wz);
          rootGroup.add(crawlGlow);

          const crawlBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(wx, 1.4 + (wallHeight - 1.4) / 2, wz),
            new THREE.Vector3(cellSize, wallHeight - 1.4, cellSize)
          );
          colliders.push(crawlBox);

          crawlSpaces.push(
            new THREE.Box3().setFromCenterAndSize(
              new THREE.Vector3(wx, 0.7, wz),
              new THREE.Vector3(cellSize, 1.4, cellSize)
            )
          );
        }
      }
    }

    // 9. Colocación de Puertas Herméticas (Entrada y Salida)
    rooms.forEach((room) => {
      // Puerta de Entrada
      const entryWx = (room.entryDoor.x - mazeDim / 2 + 0.5) * cellSize;
      const entryWz = (room.entryDoor.y - mazeDim / 2 + 0.5) * cellSize;
      const entryDoorObj = new Door(
        `door_${room.id}_entry`,
        new THREE.Vector3(entryWx, 0, entryWz),
        room.entryDoor.orientation,
        false
      );
      rootGroup.add(entryDoorObj.group);
      doors.push(entryDoorObj);
      interactiveMeshes.push(entryDoorObj.group);

      // Puerta de Salida
      const exitWx = (room.exitDoor.x - mazeDim / 2 + 0.5) * cellSize;
      const exitWz = (room.exitDoor.y - mazeDim / 2 + 0.5) * cellSize;
      const exitDoorObj = new Door(
        `door_${room.id}_exit`,
        new THREE.Vector3(exitWx, 0, exitWz),
        room.exitDoor.orientation,
        false
      );
      rootGroup.add(exitDoorObj.group);
      doors.push(exitDoorObj);
      interactiveMeshes.push(exitDoorObj.group);

      // Monolito / Altar central dentro de la habitación
      const rCenterWx = ((room.x1 + room.x2) / 2 - mazeDim / 2 + 0.5) * cellSize;
      const rCenterWz = ((room.y1 + room.y2) / 2 - mazeDim / 2 + 0.5) * cellSize;
      
      const monumentGeo = new THREE.BoxGeometry(1.4, 2.0, 1.4);
      const monument = new THREE.Mesh(monumentGeo, wallMat);
      monument.position.set(rCenterWx, 1.0, rCenterWz);
      monument.castShadow = true;
      rootGroup.add(monument);

      colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(rCenterWx, 1.0, rCenterWz),
        new THREE.Vector3(1.4, 2.0, 1.4)
      ));
    });

    // 10. Obstáculos 3D en el laberinto (Rocas rotas y bloques de cobertura musgosa)
    const obstacleLocations = [
      new THREE.Vector3((3 - mazeDim / 2 + 0.5) * cellSize, 0.5, (center - mazeDim / 2 + 0.5) * cellSize),
      new THREE.Vector3((mazeDim - 4 - mazeDim / 2 + 0.5) * cellSize, 0.5, (center - mazeDim / 2 + 0.5) * cellSize),
      new THREE.Vector3((center - mazeDim / 2 + 0.5) * cellSize, 0.5, (3 - mazeDim / 2 + 0.5) * cellSize),
      new THREE.Vector3((center - mazeDim / 2 + 0.5) * cellSize, 0.5, (mazeDim - 4 - mazeDim / 2 + 0.5) * cellSize),
    ];

    obstacleLocations.forEach((pos) => {
      const rockGeo = new THREE.BoxGeometry(1.2, 0.9, 1.2);
      const rock = new THREE.Mesh(rockGeo, mossRockMat);
      rock.position.copy(pos);
      rock.rotation.y = 0.4;
      rock.castShadow = true;
      rootGroup.add(rock);

      colliders.push(new THREE.Box3().setFromCenterAndSize(
        pos,
        new THREE.Vector3(1.2, 0.9, 1.2)
      ));
    });

    // 11. Trampillas y Pasadizos Secretos
    const trapPosA = new THREE.Vector3((1 - mazeDim / 2 + 0.5) * cellSize, 0.02, (mazeDim - 2 - mazeDim / 2 + 0.5) * cellSize);
    const trapPosB = new THREE.Vector3((mazeDim - 2 - mazeDim / 2 + 0.5) * cellSize, 0.02, (1 - mazeDim / 2 + 0.5) * cellSize);

    const trapdoorA = new Trapdoor('trap_comic_A', trapPosA, 'floor');
    const trapdoorB = new Trapdoor('trap_comic_B', trapPosB, 'floor');

    rootGroup.add(trapdoorA.group);
    rootGroup.add(trapdoorB.group);
    trapdoors.push(trapdoorA, trapdoorB);
    interactiveMeshes.push(trapdoorA.group, trapdoorB.group);

    const secretPassage = new HiddenPassage(
      'passage_secret_drawn',
      trapdoorA,
      trapdoorB,
      trapPosA.clone().add(new THREE.Vector3(0, 0.5, 0)),
      trapPosB.clone().add(new THREE.Vector3(0, 0.5, 0))
    );
    passages.push(secretPassage);

    // 12. Carcajs de Flechas
    const arrowSpots = [
      new THREE.Vector3(((rooms[1].x1 + rooms[1].x2) / 2 - mazeDim / 2 + 0.5) * cellSize + 1.2, 0.5, ((rooms[1].y1 + rooms[1].y2) / 2 - mazeDim / 2 + 0.5) * cellSize),
      new THREE.Vector3(((rooms[2].x1 + rooms[2].x2) / 2 - mazeDim / 2 + 0.5) * cellSize, 0.5, ((rooms[2].y1 + rooms[2].y2) / 2 - mazeDim / 2 + 0.5) * cellSize + 1.2),
      new THREE.Vector3((1 - mazeDim / 2 + 0.5) * cellSize, 0.5, (center - mazeDim / 2 + 0.5) * cellSize),
      new THREE.Vector3((mazeDim - 2 - mazeDim / 2 + 0.5) * cellSize, 0.5, (center - mazeDim / 2 + 0.5) * cellSize),
    ];

    arrowSpots.forEach((pos, idx) => {
      const pickupGroup = new THREE.Group();
      pickupGroup.position.copy(pos);

      const quiverGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.7, 8);
      const quiverMat = new THREE.MeshToonMaterial({ color: 0xeab308 });
      const quiver = new THREE.Mesh(quiverGeo, quiverMat);
      quiver.rotation.z = 0.25;
      pickupGroup.add(quiver);

      const glowLight = new THREE.PointLight(0xfacc15, 1.2, 3.5);
      glowLight.position.set(0, 0.3, 0);
      pickupGroup.add(glowLight);

      pickupGroup.userData = { isArrowPickup: true, pickupId: `arrow_pickup_${idx}` };
      rootGroup.add(pickupGroup);

      arrowPickups.push({
        id: `arrow_pickup_${idx}`,
        mesh: pickupGroup,
        position: pos,
        collected: false,
      });
      interactiveMeshes.push(pickupGroup);
    });

    // 13. Spawns opuestos
    const playerSpawn = new THREE.Vector3((1 - mazeDim / 2 + 0.5) * cellSize, 0.9, (1 - mazeDim / 2 + 0.5) * cellSize);
    const botSpawn = new THREE.Vector3((mazeDim - 2 - mazeDim / 2 + 0.5) * cellSize, 0.9, (mazeDim - 2 - mazeDim / 2 + 0.5) * cellSize);

    return {
      rootGroup,
      colliders,
      doors,
      trapdoors,
      passages,
      arrowPickups,
      playerSpawn,
      botSpawn,
      interactiveMeshes,
      torches,
      crawlSpaces,
    };
  }
}
