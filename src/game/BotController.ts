/**
 * Controlador de IA para el Segundo Jugador (Bot Rival) con el modelo de "Loco Joven"
 * Modos de comportamiento según rol (Cazador agresivo vs Corredor evasivo)
 * Modelo 3D, animación, disparo de flechas, navegación y audio espacial
 */

import * as THREE from 'three';
import { HealthSystem } from './HealthSystem';
import { StaminaSystem } from './StaminaSystem';
import { ArrowProjectile } from './ArrowProjectile';
import { PlayerRole, GameConfig } from '../types';
import { audioManager } from '../audio/AudioManager';
import { buildLocoJovenCharacter } from './CharacterModelBuilder';

export class BotController {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public healthSystem: HealthSystem;
  public staminaSystem: StaminaSystem;
  public role: PlayerRole = PlayerRole.RUNNER;
  public colliderBox: THREE.Box3;

  private walkSpeed: number = 4.4;
  private runSpeed: number = 8.2;
  private roleSwitchTime: number = 15;
  private difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM';

  // Componentes visuales del modelo 3D del bot
  private characterGroup: THREE.Group;
  private headNode: THREE.Group;
  private bowMesh: THREE.Group;
  private auraLight: THREE.PointLight;

  // Estados de IA
  private stateTimer: number = 0;
  private shootCooldown: number = 2.0;
  private isChargingBow: boolean = false;
  private chargeTimer: number = 0;
  private targetPosition: THREE.Vector3 | null = null;
  private footstepTimer: number = 0;

  constructor(config: GameConfig, startPos: THREE.Vector3 = new THREE.Vector3(10, 0, 10)) {
    this.position = startPos.clone();
    this.velocity = new THREE.Vector3();
    this.healthSystem = new HealthSystem(config.playerMaxHealth);
    this.staminaSystem = new StaminaSystem(config.maxStamina, config.staminaDrainRate, config.staminaRecoveryRate);
    this.difficulty = config.botDifficulty;
    this.walkSpeed = config.playerWalkSpeed * 0.9;
    this.runSpeed = config.playerRunSpeed * 0.9;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    // 1. Construcción del modelo 3D de "Loco Joven" Rival (Sudadera Carmesí)
    const char = buildLocoJovenCharacter(0xe11d48);
    this.characterGroup = char.root;
    this.headNode = char.head;
    this.mesh.add(this.characterGroup);

    // Luz de aura del bot
    this.auraLight = new THREE.PointLight(0x06b6d4, 1.4, 6.0);
    this.auraLight.position.set(0, 1.4, 0);
    this.mesh.add(this.auraLight);

    // Arco en mano del bot
    this.bowMesh = this.createBotBow();
    char.bowAttachPoint.add(this.bowMesh);

    this.colliderBox = new THREE.Box3();
    this.updateCollider();
  }

  private createBotBow(): THREE.Group {
    const bowGroup = new THREE.Group();
    const woodMat = new THREE.MeshToonMaterial({ color: 0x78350f });
    const limbGeo = new THREE.CylinderGeometry(0.025, 0.04, 0.65, 6);

    const upperLimb = new THREE.Mesh(limbGeo, woodMat);
    upperLimb.position.set(0, 0.32, -0.08);
    upperLimb.rotation.x = -0.35;
    bowGroup.add(upperLimb);

    const lowerLimb = new THREE.Mesh(limbGeo, woodMat);
    lowerLimb.position.set(0, -0.32, -0.08);
    lowerLimb.rotation.x = 0.35;
    bowGroup.add(lowerLimb);

    const stringGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.6, -0.15),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.6, -0.15),
    ]);
    const stringMat = new THREE.LineBasicMaterial({ color: 0xf43f5e });
    const stringLine = new THREE.Line(stringGeo, stringMat);
    bowGroup.add(stringLine);

    return bowGroup;
  }

  public setRole(role: PlayerRole) {
    this.role = role;
    this.isChargingBow = false;
    this.chargeTimer = 0;
    this.shootCooldown = 1.5;

    if (role === PlayerRole.HUNTER) {
      this.auraLight.color.setHex(0xef4444);
      this.bowMesh.visible = true;
    } else {
      this.auraLight.color.setHex(0x06b6d4);
      this.bowMesh.visible = false;
    }
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    colliders: THREE.Box3[],
    onShootArrow?: (arrow: ArrowProjectile) => void
  ) {
    if (!this.healthSystem.isAlive()) {
      this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, Math.PI / 2, 8 * delta);
      return;
    }

    this.healthSystem.update(delta);
    this.stateTimer += delta;

    const toPlayer = playerPos.clone().sub(this.position);
    const distToPlayer = toPlayer.length();
    const dirToPlayer = toPlayer.clone().normalize();

    let desiredMove = new THREE.Vector3();
    let isSprinting = false;

    if (this.role === PlayerRole.HUNTER) {
      // Comportamiento CAZADOR
      if (distToPlayer > 8.0) {
        desiredMove.copy(dirToPlayer);
        isSprinting = true;
      } else if (distToPlayer > 3.0) {
        desiredMove.copy(dirToPlayer).multiplyScalar(0.7);
      } else {
        desiredMove.set(Math.sin(this.stateTimer * 2), 0, Math.cos(this.stateTimer * 2));
      }

      this.mesh.lookAt(playerPos.x, this.position.y, playerPos.z);

      if (this.shootCooldown > 0) {
        this.shootCooldown -= delta;
      } else if (distToPlayer < 24.0) {
        if (!this.isChargingBow) {
          this.isChargingBow = true;
          this.chargeTimer = 0;
        } else {
          this.chargeTimer += delta;
          if (this.chargeTimer >= 0.8) {
            this.isChargingBow = false;
            this.shootCooldown = this.difficulty === 'HARD' ? 1.4 : this.difficulty === 'MEDIUM' ? 2.2 : 3.0;

            if (onShootArrow) {
              const spawnPos = this.position.clone().add(new THREE.Vector3(0, 1.4, 0)).add(dirToPlayer.clone().multiplyScalar(0.7));
              const shootVel = dirToPlayer.clone().multiplyScalar(32);
              shootVel.y += 1.2;
              const arrow = new ArrowProjectile(spawnPos, shootVel.normalize(), 34, 40, 'BOT');
              onShootArrow(arrow);
            }
          }
        }
      }
    } else {
      // Comportamiento CORREDOR
      const fleeDir = dirToPlayer.clone().negate();
      if (distToPlayer < 12.0) {
        desiredMove.copy(fleeDir);
        isSprinting = true;
      } else {
        if (!this.targetPosition || this.stateTimer > 4.0) {
          this.stateTimer = 0;
          this.targetPosition = new THREE.Vector3(
            this.position.x + (Math.random() - 0.5) * 20,
            0,
            this.position.z + (Math.random() - 0.5) * 20
          );
        }
        desiredMove = this.targetPosition.clone().sub(this.position).normalize();
      }

      if (desiredMove.lengthSq() > 0.01) {
        const lookTarget = this.position.clone().add(desiredMove);
        this.mesh.lookAt(lookTarget.x, this.position.y, lookTarget.z);
      }
    }

    const currentSpeed = isSprinting ? this.runSpeed : this.walkSpeed;
    const targetVel = desiredMove.clone().multiplyScalar(currentSpeed);
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVel.x, 8 * delta);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVel.z, 8 * delta);

    const displacement = this.velocity.clone().multiplyScalar(delta);
    this.position.x += displacement.x;
    this.resolveBotCollisions(colliders, 'x');

    this.position.z += displacement.z;
    this.resolveBotCollisions(colliders, 'z');

    this.mesh.position.copy(this.position);
    this.updateCollider();
  }

  private resolveBotCollisions(colliders: THREE.Box3[], axis: 'x' | 'z') {
    const radius = 0.45;
    const bx = this.position.x;
    const bz = this.position.z;
    const botBox = new THREE.Box3(
      new THREE.Vector3(bx - radius, 0, bz - radius),
      new THREE.Vector3(bx + radius, 1.9, bz + radius)
    );

    for (let i = 0; i < colliders.length; i++) {
      const box = colliders[i];
      if (box.isEmpty()) continue;
      if (Math.abs(box.min.x - bx) > 5.0 || Math.abs(box.min.z - bz) > 5.0) continue;

      if (botBox.intersectsBox(box)) {
        if (axis === 'x') {
          const centerX = (box.min.x + box.max.x) / 2;
          this.position.x = this.position.x > centerX ? box.max.x + radius + 0.01 : box.min.x - radius - 0.01;
          this.velocity.x = 0;
        } else {
          const centerZ = (box.min.z + box.max.z) / 2;
          this.position.z = this.position.z > centerZ ? box.max.z + radius + 0.01 : box.min.z - radius - 0.01;
          this.velocity.z = 0;
        }
      }
    }
  }

  private updateCollider() {
    this.colliderBox.setFromCenterAndSize(
      new THREE.Vector3(this.position.x, this.position.y + 0.95, this.position.z),
      new THREE.Vector3(0.9, 1.9, 0.9)
    );
  }

  public teleport(newPos: THREE.Vector3) {
    this.position.copy(newPos);
    this.velocity.set(0, 0, 0);
    this.mesh.position.copy(this.position);
    this.updateCollider();
  }
}
