/**
 * Controlador de Físicas y Movimiento del Jugador en Primera Persona (PlayerMovement.ts)
 * Soporta caminar, correr (sprint), agachado inteligente bajo techos y túneles (sin teletransporte),
 * salto y aterrizaje/caminata sobre obstáculos 3D (rocas, escombros, plataformas).
 */

import * as THREE from 'three';
import { audioManager } from '../audio/AudioManager';

export class PlayerMovement {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public isGrounded: boolean = true;
  public isCrouched: boolean = false;
  public isSprinting: boolean = false;
  public isMoving: boolean = false;

  private walkSpeed: number;
  private runSpeed: number;
  private crouchSpeed: number;
  private jumpForce: number;
  private gravity: number = 22;
  private playerRadius: number = 0.38;
  private footstepTimer: number = 0;

  // Búferes cacheados para evitar recolección de basura
  private tempPlayerBox = new THREE.Box3();
  private tempPlayerCenter = new THREE.Vector3();
  private tempPlayerSize = new THREE.Vector3();

  constructor(
    startPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    walkSpeed: number = 4.8,
    runSpeed: number = 9.0,
    crouchSpeed: number = 2.8,
    jumpForce: number = 7.2
  ) {
    this.position = startPos.clone();
    this.velocity = new THREE.Vector3();
    this.walkSpeed = walkSpeed;
    this.runSpeed = runSpeed;
    this.crouchSpeed = crouchSpeed;
    this.jumpForce = jumpForce;
  }

  public configure(walkSpeed: number, runSpeed: number, crouchSpeed: number, jumpForce: number) {
    this.walkSpeed = walkSpeed;
    this.runSpeed = runSpeed;
    this.crouchSpeed = crouchSpeed;
    this.jumpForce = jumpForce;
  }

  public update(
    delta: number,
    inputDir: { forward: number; right: number },
    horizontalForward: THREE.Vector3,
    horizontalRight: THREE.Vector3,
    wantSprint: boolean,
    wantCrouch: boolean,
    wantJump: boolean,
    canSprintFromStamina: boolean,
    colliders: THREE.Box3[]
  ): { speed: number } {
    // 1. Determinar estado de agachado inteligente (permanece agachado si hay techo encima)
    if (wantCrouch) {
      this.isCrouched = true;
    } else if (this.isCrouched) {
      // Comprobar si hay espacio libre de 1.9m para levantarse
      const canStandUp = this.checkHeadroom(colliders);
      if (canStandUp) {
        this.isCrouched = false;
      } else {
        this.isCrouched = true; // Permanecer agachado sin forzar choque
      }
    } else {
      this.isCrouched = false;
    }

    this.isSprinting = wantSprint && canSprintFromStamina && !this.isCrouched && (inputDir.forward > 0 || Math.abs(inputDir.right) > 0);

    let targetSpeed = this.walkSpeed;
    if (this.isCrouched) {
      targetSpeed = this.crouchSpeed;
    } else if (this.isSprinting) {
      targetSpeed = this.runSpeed;
    }

    // 2. Vector de dirección deseada en el plano XZ
    const moveDir = new THREE.Vector3()
      .addScaledVector(horizontalForward, inputDir.forward)
      .addScaledVector(horizontalRight, inputDir.right);

    if (moveDir.lengthSq() > 0.001) {
      moveDir.normalize();
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }

    // Aceleración horizontal suave
    const targetVelX = moveDir.x * targetSpeed;
    const targetVelZ = moveDir.z * targetSpeed;
    const accelRate = this.isGrounded ? 18 : 6;

    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelX, accelRate * delta);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelZ, accelRate * delta);

    // 3. Salto y Gravedad
    if (this.isGrounded) {
      this.velocity.y = 0;
      if (wantJump && !this.isCrouched) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        audioManager.playJump();
      }
    } else {
      this.velocity.y -= this.gravity * delta;
    }

    // 4. Mover y Resolver Colisiones
    const displacement = this.velocity.clone().multiplyScalar(delta);

    // Detectar si hay un obstáculo/plataforma bajo los pies para aterrizar encima
    let groundHeight = 0;
    const px = this.position.x + displacement.x;
    const pz = this.position.z + displacement.z;
    const footMargin = this.playerRadius * 0.75;

    for (let i = 0; i < colliders.length; i++) {
      const box = colliders[i];
      if (box.isEmpty()) continue;
      if (
        px + footMargin > box.min.x &&
        px - footMargin < box.max.x &&
        pz + footMargin > box.min.z &&
        pz - footMargin < box.max.z
      ) {
        // Si el obstáculo es una plataforma/roca donde el jugador puede subir (alto <= 1.8m)
        if (box.max.y <= 1.8 && this.position.y >= box.max.y - 0.35) {
          if (box.max.y > groundHeight) {
            groundHeight = box.max.y;
          }
        }
      }
    }

    // Resolver colisiones laterales en X y Z
    this.position.x += displacement.x;
    this.resolveWallCollisions(colliders, 'x', groundHeight);

    this.position.z += displacement.z;
    this.resolveWallCollisions(colliders, 'z', groundHeight);

    // Resolver posición vertical Y
    const wasGrounded = this.isGrounded;
    this.position.y += displacement.y;

    // 1. Detección y tope de suelo / plataformas
    if (this.position.y <= groundHeight) {
      this.position.y = groundHeight;
      this.isGrounded = true;
      if (!wasGrounded) {
        audioManager.playLand();
      }
    } else {
      this.isGrounded = false;
    }

    // 2. Tope de Techo Sólido Infranqueable (4.6m)
    const playerHeight = this.isCrouched ? 1.0 : 1.9;
    const ceilingLimit = 4.6 - playerHeight;
    if (this.position.y >= ceilingLimit) {
      this.position.y = ceilingLimit;
      if (this.velocity.y > 0) {
        this.velocity.y = 0; // Frena el impulso vertical hacia arriba al topar con el techo
      }
    }

    // 5. Audio de pasos
    if (this.isGrounded && this.isMoving) {
      const stepInterval = this.isSprinting ? 0.28 : this.isCrouched ? 0.55 : 0.42;
      this.footstepTimer += delta;
      if (this.footstepTimer >= stepInterval) {
        this.footstepTimer = 0;
        audioManager.playFootstep(this.isSprinting ? 'run' : this.isCrouched ? 'crouch' : 'walk');
      }
    } else {
      this.footstepTimer = 0;
    }

    return {
      speed: new THREE.Vector2(this.velocity.x, this.velocity.z).length(),
    };
  }

  private checkHeadroom(colliders: THREE.Box3[]): boolean {
    const px = this.position.x;
    const py = this.position.y;
    const pz = this.position.z;

    // Caja de comprobación de espacio vertical de 1.95m con margen lateral de seguridad
    this.tempPlayerCenter.set(px, py + 0.975, pz);
    this.tempPlayerSize.set(this.playerRadius * 2.2, 1.95, this.playerRadius * 2.2);
    this.tempPlayerBox.setFromCenterAndSize(this.tempPlayerCenter, this.tempPlayerSize);

    for (let i = 0; i < colliders.length; i++) {
      const box = colliders[i];
      if (box.isEmpty()) continue;
      if (Math.abs(box.min.x - px) > 4.0 || Math.abs(box.min.z - pz) > 4.0) continue;

      // Si hay una estructura o viga en la parte superior (por encima de 1.05m de los pies)
      if (box.min.y >= py + 1.05 && this.tempPlayerBox.intersectsBox(box)) {
        return false;
      }
    }
    return true;
  }

  private resolveWallCollisions(colliders: THREE.Box3[], axis: 'x' | 'z', currentGround: number) {
    const playerHeight = this.isCrouched ? 1.0 : 1.9;
    const px = this.position.x;
    const py = this.position.y;
    const pz = this.position.z;

    this.tempPlayerCenter.set(px, py + playerHeight / 2, pz);
    this.tempPlayerSize.set(this.playerRadius * 2, playerHeight, this.playerRadius * 2);
    this.tempPlayerBox.setFromCenterAndSize(this.tempPlayerCenter, this.tempPlayerSize);

    for (let i = 0; i < colliders.length; i++) {
      const box = colliders[i];
      if (box.isEmpty()) continue;

      // 1. Si el jugador está caminando encima de este obstáculo, ignorar colisión lateral
      if (box.max.y <= currentGround + 0.05 && py >= box.max.y - 0.1) {
        continue;
      }

      // 2. Si la caja es una viga/dintel superior (solo existe por encima de 1.05m):
      if (box.min.y >= py + 1.05) {
        // Si el jugador está agachado (1.0m), pasa libremente por debajo del dintel (a 1.4m)
        if (this.isCrouched) {
          continue; // Sin colisión lateral, pasa limpio
        } else if (this.tempPlayerBox.intersectsBox(box)) {
          // Si estaba de pie y su cabeza toca la viga, simplemente activar agachado sin empujarlo
          this.isCrouched = true;
          continue;
        }
      }

      // 3. Muros sólidos desde el suelo:
      if (Math.abs(box.min.x - px) > 5.5 || Math.abs(box.min.z - pz) > 5.5) continue;

      if (this.tempPlayerBox.intersectsBox(box)) {
        if (axis === 'x') {
          const centerDistX = this.position.x - (box.min.x + box.max.x) / 2;
          if (centerDistX > 0) {
            this.position.x = box.max.x + this.playerRadius + 0.001;
          } else {
            this.position.x = box.min.x - this.playerRadius - 0.001;
          }
          this.velocity.x = 0;
        } else if (axis === 'z') {
          const centerDistZ = this.position.z - (box.min.z + box.max.z) / 2;
          if (centerDistZ > 0) {
            this.position.z = box.max.z + this.playerRadius + 0.001;
          } else {
            this.position.z = box.min.z - this.playerRadius - 0.001;
          }
          this.velocity.z = 0;
        }

        this.tempPlayerCenter.set(this.position.x, py + playerHeight / 2, this.position.z);
        this.tempPlayerBox.setFromCenterAndSize(this.tempPlayerCenter, this.tempPlayerSize);
      }
    }
  }

  public teleport(newPos: THREE.Vector3) {
    this.position.copy(newPos);
    this.velocity.set(0, 0, 0);
  }

  public getPlayerBoundingBox(): THREE.Box3 {
    const height = this.isCrouched ? 1.0 : 1.9;
    return new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(this.position.x, this.position.y + height / 2, this.position.z),
      new THREE.Vector3(this.playerRadius * 2, height, this.playerRadius * 2)
    );
  }
}
