/**
 * Proyectil Físico de Flecha
 * Incluye trayectoria balística con gravedad, colisión contra paredes, suelo, puertas y jugadores
 */

import * as THREE from 'three';
import { audioManager } from '../audio/AudioManager';

export class ArrowProjectile {
  public id: string = Math.random().toString(36).substring(2, 9);
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public isStuck: boolean = false;
  public isExpired: boolean = false;
  public lifetime: number = 15; // Segundos antes de desaparecer si queda clavada
  public ownerIsPlayer: boolean;
  public damage: number = 50;

  private gravity: number = 9.8;
  private previousPosition: THREE.Vector3;
  private stuckTime: number = 0;

  constructor(
    startPos: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number = 36,
    damage: number = 50,
    ownerIsPlayer: boolean = true,
    gravity: number = 9.8
  ) {
    this.position = startPos.clone();
    this.previousPosition = startPos.clone();
    this.velocity = direction.clone().normalize().multiplyScalar(speed);
    this.damage = damage;
    this.ownerIsPlayer = ownerIsPlayer;
    this.gravity = gravity;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    // Eje de la flecha (madera noble ilustrada)
    const shaftGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.82, 8);
    const shaftMat = new THREE.MeshToonMaterial({ color: 0x8a5229 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.rotation.x = Math.PI / 2;
    this.mesh.add(shaft);

    // Anillos dorados en el cuello y culatín
    const ringGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.025, 8);
    const ringMat = new THREE.MeshToonMaterial({ color: 0xf59e0b });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.z = 0.38;
    this.mesh.add(ring1);

    const ring2 = ring1.clone();
    ring2.position.z = -0.32;
    this.mesh.add(ring2);

    // Punta de cristal zafiro/hielo con púas laterales estilo imagen
    const tipGeo = new THREE.ConeGeometry(0.045, 0.16, 5);
    const tipMat = new THREE.MeshToonMaterial({
      color: 0x38bdf8, // Azul cristalino
    });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = 0.48;
    this.mesh.add(tip);

    // Púas laterales de cristal
    const barbGeo = new THREE.BoxGeometry(0.08, 0.015, 0.05);
    const barb = new THREE.Mesh(barbGeo, tipMat);
    barb.position.set(0, 0, 0.42);
    this.mesh.add(barb);

    // Plumas bicolor: cian y oro estilo dibujo
    const featherGeo = new THREE.BoxGeometry(0.006, 0.075, 0.16);
    const featherMat1 = new THREE.MeshToonMaterial({ color: 0x06b6d4 }); // Cian
    const featherMat2 = new THREE.MeshToonMaterial({ color: 0xf59e0b }); // Oro
    
    const f1 = new THREE.Mesh(featherGeo, featherMat1);
    f1.position.z = -0.32;
    this.mesh.add(f1);

    const f2 = new THREE.Mesh(featherGeo, featherMat2);
    f2.rotation.z = Math.PI / 2;
    f2.position.z = -0.32;
    this.mesh.add(f2);

    // Halo luminoso cristalino
    const trailLight = new THREE.PointLight(0x38bdf8, 1.2, 3.5);
    this.mesh.add(trailLight);

    // Orientar flecha en la dirección inicial
    this.alignWithVelocity();
  }

  private alignWithVelocity() {
    if (this.velocity.lengthSq() > 0.001) {
      const dir = this.velocity.clone().normalize();
      const targetPos = this.position.clone().add(dir);
      this.mesh.lookAt(targetPos);
    }
  }

  public update(
    delta: number,
    colliders: THREE.Box3[],
    targets: Array<{ id: string; box: THREE.Box3; isPlayer: boolean; onHit: (dmg: number) => void }>
  ): boolean {
    if (this.isExpired) return false;

    if (this.isStuck) {
      this.stuckTime += delta;
      if (this.stuckTime >= this.lifetime) {
        this.isExpired = true;
      }
      return true;
    }

    this.previousPosition.copy(this.position);

    // Aplicar gravedad balística
    this.velocity.y -= this.gravity * delta;

    // Calcular desplazamiento
    const stepMove = this.velocity.clone().multiplyScalar(delta);
    const nextPos = this.position.clone().add(stepMove);

    // Rayo continuo desde previousPosition hasta nextPos para no atravesar muros finos
    const moveDir = nextPos.clone().sub(this.previousPosition);
    const moveDist = moveDir.length();
    if (moveDist > 0.0001) {
      const ray = new THREE.Ray(this.previousPosition, moveDir.clone().normalize());

      // 1. Chequeo contra objetivos (Jugador / Bot)
      for (const target of targets) {
        // No auto-dañarse
        if (target.isPlayer === this.ownerIsPlayer) continue;

        const intersect = ray.intersectBox(target.box, new THREE.Vector3());
        if (intersect && intersect.distanceTo(this.previousPosition) <= moveDist) {
          // Impacto en jugador / bot
          this.position.copy(intersect);
          this.mesh.position.copy(this.position);
          this.isStuck = true;
          this.lifetime = 2.0; // Desaparece antes
          target.onHit(this.damage);
          audioManager.playArrowHit('flesh');
          return true;
        }
      }

      // 2. Chequeo contra colisionadores de entorno (Paredes, suelo, puertas)
      let closestHitDist = moveDist;
      let hitPoint: THREE.Vector3 | null = null;

      for (const box of colliders) {
        const hit = ray.intersectBox(box, new THREE.Vector3());
        if (hit) {
          const d = hit.distanceTo(this.previousPosition);
          if (d < closestHitDist) {
            closestHitDist = d;
            hitPoint = hit;
          }
        }
      }

      // Chequeo con suelo plano y=0
      if (nextPos.y <= 0.05) {
        this.position.y = 0.05;
        this.isStuck = true;
        this.mesh.position.copy(this.position);
        audioManager.playArrowHit('wall');
        return true;
      }

      if (hitPoint) {
        this.position.copy(hitPoint);
        this.mesh.position.copy(this.position);
        this.isStuck = true;
        audioManager.playArrowHit('wood');
        return true;
      }
    }

    this.position.copy(nextPos);
    this.mesh.position.copy(this.position);
    this.alignWithVelocity();

    return true;
  }
}
