/**
 * Sistema de combate con Arco y Flechas (BowSystem.ts)
 * Curvatura correcta de arco en primera persona (empuñadura hacia el frente, cuerda hacia el jugador),
 * gemas de zafiro de la imagen de referencia y recarga rápida.
 */

import * as THREE from 'three';
import { ArrowProjectile } from './ArrowProjectile';
import { audioManager } from '../audio/AudioManager';

export class BowSystem {
  public viewModel: THREE.Group;
  public bowMesh: THREE.Group;
  public stringLine: THREE.Line;
  public arrowMeshInBow: THREE.Group;

  public isCharging: boolean = false;
  public chargeProgress: number = 0; // 0 a 1
  public reloadTimer: number = 0;
  public arrowsCount: number = 8;
  public maxArrows: number = 20;

  private reloadDuration: number = 0.45;
  private arrowDamage: number = 50;
  private arrowSpeed: number = 38;
  private arrowGravity: number = 9.8;
  private chargeSpeed: number = 1.6; // ~0.625s para carga completa
  private isEquipped: boolean = false;
  private hasStoppedDrawSound: boolean = false;

  // Puntos de la cuerda del arco (Top, Nock, Bottom)
  private stringPositions: Float32Array;

  constructor(reloadDuration: number = 0.45, arrowDamage: number = 50, initialArrows: number = 8) {
    this.reloadDuration = reloadDuration;
    this.arrowDamage = damageFallback(arrowDamage);
    this.arrowsCount = initialArrows;

    this.viewModel = new THREE.Group();
    this.bowMesh = new THREE.Group();

    // Puntos de cuerda iniciales: Top (0, 0.48, 0.0), Nock (0, 0, 0.0), Bottom (0, -0.48, 0.0)
    this.stringPositions = new Float32Array([
      0.0, 0.48, 0.0,  // Top tip
      0.0, 0.0, 0.0,   // Nock point
      0.0, -0.48, 0.0  // Bottom tip
    ]);

    this.buildBowModel();
  }

  public configure(reloadDuration: number = 0.45, arrowDamage: number = 50, arrowSpeed: number = 38, arrowGravity: number = 9.8) {
    this.reloadDuration = reloadDuration;
    this.arrowDamage = damageFallback(arrowDamage);
    this.arrowSpeed = arrowSpeed;
    this.arrowGravity = arrowGravity;
  }

  private buildBowModel() {
    // --- MATERIALES ESTILO CÓMIC DE LA IMAGEN DE REFERENCIA ---
    const woodMat = new THREE.MeshToonMaterial({
      color: 0x8a522b, // Madera noble cálida
    });

    const darkWoodMat = new THREE.MeshToonMaterial({
      color: 0x5a341a, // Sombras y alas del elevador
    });

    const leatherGripMat = new THREE.MeshToonMaterial({
      color: 0x3d2314, // Cuero oscuro de la empuñadura
    });

    const bronzeCollarMat = new THREE.MeshToonMaterial({
      color: 0xb45309, // Cuello de bronce
    });

    const sapphireMat = new THREE.MeshToonMaterial({
      color: 0x0284c7, // Zafiro azul brillante
    });

    const goldTrimMat = new THREE.MeshToonMaterial({
      color: 0xf59e0b, // Engastes dorados
    });

    // 1. Curva del arco clásica y correcta:
    // El centro (empuñadura) está empujado HACIA ADELANTE (-Z)
    // Las puntas conectan con la cuerda en Z = 0.
    const curvePoints: THREE.Vector3[] = [];
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI - Math.PI / 2; // -PI/2 a +PI/2
      const y = Math.sin(t) * 0.48;
      // Curvatura: empuñadura a z = -0.22, puntas a z = 0.0
      const z = -Math.cos(t) * 0.22;
      // Ligero detalle recurvo en los extremos finales
      const recurve = Math.pow(Math.abs(Math.sin(t)), 6) * -0.03;
      curvePoints.push(new THREE.Vector3(0, y, z + recurve));
    }

    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 30, 0.022, 8, false);
    const woodBody = new THREE.Mesh(tubeGeo, woodMat);
    this.bowMesh.add(woodBody);

    // 2. Alas ornamentales de madera tallada en el riser
    const wingGeo = new THREE.BoxGeometry(0.018, 0.16, 0.05);
    const topWing = new THREE.Mesh(wingGeo, darkWoodMat);
    topWing.position.set(0, 0.16, -0.19);
    topWing.rotation.x = -0.2;
    this.bowMesh.add(topWing);

    const botWing = new THREE.Mesh(wingGeo, darkWoodMat);
    botWing.position.set(0, -0.16, -0.19);
    botWing.rotation.x = 0.2;
    this.bowMesh.add(botWing);

    // 3. Empuñadura de cuero central (donde la mano sujeta el arco)
    const gripGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.14, 8);
    const grip = new THREE.Mesh(gripGeo, leatherGripMat);
    grip.position.set(0, 0, -0.22);
    this.bowMesh.add(grip);

    // 4. Collares de bronce con tachuelas celestes (arriba y abajo del agarre)
    [-0.08, 0.08].forEach(yPos => {
      const collarGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.032, 8);
      const collar = new THREE.Mesh(collarGeo, bronzeCollarMat);
      collar.position.set(0, yPos, -0.21);
      this.bowMesh.add(collar);

      // Tachuelas de zafiro alrededor
      for (let a = 0; a < 4; a++) {
        const studGeo = new THREE.SphereGeometry(0.007, 6, 6);
        const stud = new THREE.Mesh(studGeo, sapphireMat);
        const angle = (a / 4) * Math.PI * 2;
        stud.position.set(
          Math.cos(angle) * 0.034,
          yPos,
          -0.21 + Math.sin(angle) * 0.034
        );
        this.bowMesh.add(stud);
      }
    });

    // 5. Gemas de Zafiro engastadas en las palas superior e inferior
    [-0.26, 0.26].forEach(yPos => {
      // Engaste dorado
      const bezelGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.01, 8);
      const bezel = new THREE.Mesh(bezelGeo, goldTrimMat);
      bezel.position.set(0.025, yPos, -0.15);
      bezel.rotation.z = Math.PI / 2;
      this.bowMesh.add(bezel);

      // Gema ovalada de zafiro
      const gemGeo = new THREE.SphereGeometry(0.016, 8, 8);
      const gem = new THREE.Mesh(gemGeo, sapphireMat);
      gem.position.set(0.03, yPos, -0.15);
      gem.scale.set(0.7, 1.4, 0.9);
      this.bowMesh.add(gem);

      // Luz celeste
      const gemGlow = new THREE.PointLight(0x38bdf8, 0.8, 1.5);
      gemGlow.position.set(0.03, yPos, -0.15);
      this.bowMesh.add(gemGlow);
    });

    // 6. Puntas ornamentadas (scrolled tips) en los extremos
    const tipScrollGeo = new THREE.TorusGeometry(0.025, 0.01, 6, 12, Math.PI * 1.1);
    const topScroll = new THREE.Mesh(tipScrollGeo, woodMat);
    topScroll.position.set(0, 0.48, -0.02);
    topScroll.rotation.y = Math.PI / 2;
    topScroll.rotation.z = -0.4;
    this.bowMesh.add(topScroll);

    const botScroll = new THREE.Mesh(tipScrollGeo, woodMat);
    botScroll.position.set(0, -0.48, -0.02);
    botScroll.rotation.y = Math.PI / 2;
    botScroll.rotation.z = 0.4;
    this.bowMesh.add(botScroll);

    // 7. Cuerda celeste trenzada luminosa
    const stringGeo = new THREE.BufferGeometry();
    stringGeo.setAttribute('position', new THREE.BufferAttribute(this.stringPositions, 3));
    const stringMat = new THREE.LineBasicMaterial({ color: 0x7dd3fc, linewidth: 2 });
    this.stringLine = new THREE.Line(stringGeo, stringMat);
    this.bowMesh.add(this.stringLine);

    // 8. Flecha de cristal y plumas oro/cian
    this.arrowMeshInBow = new THREE.Group();

    // Astil
    const shaftGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.78, 8);
    const shaftMat = new THREE.MeshToonMaterial({ color: 0x8a5229 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.z = -0.38;
    this.arrowMeshInBow.add(shaft);

    // Anillos dorados
    const ringGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.02, 8);
    const ringMat = new THREE.MeshToonMaterial({ color: 0xf59e0b });
    const r1 = new THREE.Mesh(ringGeo, ringMat);
    r1.rotation.x = Math.PI / 2;
    r1.position.z = -0.70;
    this.arrowMeshInBow.add(r1);

    const r2 = r1.clone();
    r2.position.z = -0.06;
    this.arrowMeshInBow.add(r2);

    // Punta de cristal zafiro con púas laterales
    const crystalTipGeo = new THREE.ConeGeometry(0.035, 0.14, 5);
    const crystalTipMat = new THREE.MeshToonMaterial({ color: 0x38bdf8 });
    const crystalTip = new THREE.Mesh(crystalTipGeo, crystalTipMat);
    crystalTip.rotation.x = -Math.PI / 2;
    crystalTip.position.z = -0.78;
    this.arrowMeshInBow.add(crystalTip);

    const barbGeo = new THREE.BoxGeometry(0.07, 0.01, 0.04);
    const barb = new THREE.Mesh(barbGeo, crystalTipMat);
    barb.position.set(0, 0, -0.73);
    this.arrowMeshInBow.add(barb);

    // Plumas bicolor: cian y oro
    const fletchGeo = new THREE.BoxGeometry(0.005, 0.065, 0.13);
    const fletchCian = new THREE.MeshToonMaterial({ color: 0x06b6d4 });
    const fletchGold = new THREE.MeshToonMaterial({ color: 0xf59e0b });

    const f1 = new THREE.Mesh(fletchGeo, fletchCian);
    f1.position.z = -0.05;
    this.arrowMeshInBow.add(f1);

    const f2 = new THREE.Mesh(fletchGeo, fletchGold);
    f2.rotation.z = Math.PI / 2;
    f2.position.z = -0.05;
    this.arrowMeshInBow.add(f2);

    this.arrowMeshInBow.position.set(0, 0, 0);
    this.bowMesh.add(this.arrowMeshInBow);

    // Posición en primera persona natural
    this.bowMesh.position.set(0.22, -0.20, -0.38);
    this.bowMesh.rotation.set(0.05, -0.05, -0.05);

    this.viewModel.add(this.bowMesh);
  }

  public setEquipped(equipped: boolean) {
    this.isEquipped = equipped;
    this.viewModel.visible = equipped;
    if (!equipped && this.isCharging) {
      this.cancelCharge();
    }
  }

  public startCharging(): boolean {
    if (!this.isEquipped || this.reloadTimer > 0 || this.arrowsCount <= 0) {
      return false;
    }
    this.isCharging = true;
    this.chargeProgress = 0;
    this.hasStoppedDrawSound = false;
    audioManager.startBowDraw();
    return true;
  }

  public cancelCharge() {
    this.isCharging = false;
    this.chargeProgress = 0;
    this.hasStoppedDrawSound = true;
    audioManager.stopBowDraw();
    this.updateStringGeometry(0);
  }

  public releaseAndShoot(
    spawnPos: THREE.Vector3,
    direction: THREE.Vector3,
    ownerIsPlayer: boolean = true
  ): ArrowProjectile | null {
    if (!this.isCharging) return null;

    const actualCharge = Math.max(0.3, this.chargeProgress);
    this.isCharging = false;
    this.chargeProgress = 0;
    this.hasStoppedDrawSound = true;
    audioManager.stopBowDraw();
    this.updateStringGeometry(0);

    if (this.arrowsCount <= 0) {
      return null;
    }

    this.arrowsCount--;
    this.reloadTimer = this.reloadDuration;

    audioManager.playBowRelease();

    const effectiveSpeed = this.arrowSpeed * (0.6 + 0.4 * actualCharge);
    const effectiveDamage = Math.round(this.arrowDamage * (0.5 + 0.5 * actualCharge));

    return new ArrowProjectile(
      spawnPos,
      direction,
      effectiveSpeed,
      effectiveDamage,
      'PLAYER_LOCAL',
      this.arrowGravity
    );
  }

  public addArrows(count: number) {
    this.arrowsCount = Math.min(this.maxArrows, this.arrowsCount + count);
    audioManager.playPickup();
  }

  public resetArrows(count?: number) {
    this.arrowsCount = count ?? 8;
  }

  public get isDrawing(): boolean {
    return this.isCharging;
  }

  public getChargeProgress(): number {
    return this.chargeProgress;
  }

  public update(delta: number) {
    if (this.reloadTimer > 0) {
      this.reloadTimer -= delta;
      if (this.reloadTimer < 0) this.reloadTimer = 0;
    }

    if (this.isCharging) {
      this.chargeProgress = Math.min(1.0, this.chargeProgress + this.chargeSpeed * delta);
      this.updateStringGeometry(this.chargeProgress);

      // Al llegar al tensado máximo, cortar inmediatamente el sonido de crujido/tensión
      if (this.chargeProgress >= 1.0 && !this.hasStoppedDrawSound) {
        audioManager.stopBowDraw();
        this.hasStoppedDrawSound = true;
      }

      // Centrar ligeramente al apuntar
      const targetX = 0.02 + (1 - this.chargeProgress) * 0.20;
      const targetY = -0.10 + (1 - this.chargeProgress) * -0.10;
      const targetZ = -0.34 + this.chargeProgress * 0.04;
      this.bowMesh.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 12 * delta);
      this.arrowMeshInBow.visible = true;
    } else {
      // Reposo
      this.bowMesh.position.lerp(new THREE.Vector3(0.22, -0.20, -0.38), 10 * delta);
      this.arrowMeshInBow.visible = this.reloadTimer === 0 && this.arrowsCount > 0;
    }
  }

  private updateStringGeometry(charge: number) {
    if (!this.stringLine || !this.stringPositions) return;

    // Desplazar nock point hacia atrás en +Z (hacia el tirador)
    const pullBack = charge * 0.26;
    this.stringPositions[3] = 0.0;       // X
    this.stringPositions[4] = 0.0;       // Y
    this.stringPositions[5] = pullBack;  // Z

    const posAttr = this.stringLine.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.copyArray(this.stringPositions);
    posAttr.needsUpdate = true;

    // Acompañar flecha con la cuerda
    this.arrowMeshInBow.position.z = pullBack;
  }

  public getCanShoot(): boolean {
    return this.isEquipped && this.reloadTimer === 0 && this.arrowsCount > 0;
  }

  public getReloadProgress(): number {
    return this.reloadDuration > 0 ? (this.reloadDuration - this.reloadTimer) / this.reloadDuration : 1;
  }
}

function damageFallback(val: number): number {
  return typeof val === 'number' && !isNaN(val) ? val : 50;
}
