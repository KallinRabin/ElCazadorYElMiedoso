/**
 * Controlador Principal del Jugador en Primera Persona
 * Unifica Cámara, Movimiento, Stamina, Salud, Arco e Interacciones
 */

import * as THREE from 'three';
import { PlayerCamera } from './PlayerCamera';
import { PlayerMovement } from './PlayerMovement';
import { StaminaSystem } from './StaminaSystem';
import { HealthSystem } from './HealthSystem';
import { BowSystem } from './BowSystem';
import { InteractionSystem } from './InteractionSystem';
import { PlayerRole, GameConfig, PlayerStats } from '../types';
import { ArrowProjectile } from './ArrowProjectile';

export class PlayerController {
  public cameraController: PlayerCamera;
  public movementController: PlayerMovement;
  public staminaSystem: StaminaSystem;
  public healthSystem: HealthSystem;
  public bowSystem: BowSystem;
  public interactionSystem: InteractionSystem;

  public role: PlayerRole = PlayerRole.HUNTER;
  public rootObject: THREE.Object3D;

  // Estados de entrada (Input state)
  private keys: { [key: string]: boolean } = {};
  private wantSprint: boolean = false;
  private wantCrouch: boolean = false;
  private wantJump: boolean = false;
  private isPointerLocked: boolean = false;

  constructor(config: GameConfig, aspect: number = 16 / 9) {
    this.cameraController = new PlayerCamera(config.baseFOV, aspect);
    this.movementController = new PlayerMovement(
      new THREE.Vector3(0, 0, 0),
      config.playerWalkSpeed,
      config.playerRunSpeed,
      config.playerCrouchSpeed,
      config.jumpForce
    );
    this.staminaSystem = new StaminaSystem(
      config.maxStamina,
      config.staminaDrainRate,
      config.staminaRecoveryRate,
      config.staminaRecoveryDelay
    );
    this.healthSystem = new HealthSystem(config.playerMaxHealth);
    this.bowSystem = new BowSystem(config.arrowReloadTime, config.arrowDamage, config.arrowInitialCount);
    this.interactionSystem = new InteractionSystem();

    // Contenedor principal que se añade a la escena Three.js
    this.rootObject = new THREE.Object3D();
    this.rootObject.add(this.cameraController.yawObject);
    this.cameraController.camera.add(this.bowSystem.viewModel);
  }

  public configure(config: GameConfig) {
    this.cameraController.configure(config.mouseSensitivity, config.headBobEnabled, config.baseFOV, config.sprintFOV);
    this.movementController.configure(
      config.playerWalkSpeed,
      config.playerRunSpeed,
      config.playerCrouchSpeed,
      config.jumpForce
    );
    this.staminaSystem.configure(
      config.maxStamina,
      config.staminaDrainRate,
      config.staminaRecoveryRate,
      config.staminaRecoveryDelay
    );
    this.healthSystem.configure(config.playerMaxHealth);
    this.bowSystem.configure(config.arrowReloadTime, config.arrowDamage, config.arrowSpeed, config.arrowGravity);
  }

  public setRole(role: PlayerRole) {
    this.role = role;
    this.bowSystem.setEquipped(role === PlayerRole.HUNTER);
  }

  public onKeyDown(e: KeyboardEvent) {
    this.keys[e.code] = true;

    if (e.code === 'KeyE') {
      const teleportDest = this.interactionSystem.interact(this.movementController.position);
      if (teleportDest) {
        this.movementController.teleport(teleportDest);
      }
    }
  }

  public onKeyUp(e: KeyboardEvent) {
    this.keys[e.code] = false;
  }

  public onMouseDown(button: number) {
    if (button === 0 && this.role === PlayerRole.HUNTER) {
      this.bowSystem.startCharging();
    }
  }

  public onMouseUp(button: number, onShoot?: (arrow: ArrowProjectile) => void) {
    if (button === 0 && this.role === PlayerRole.HUNTER && this.bowSystem.isCharging) {
      const camWorldPos = new THREE.Vector3();
      this.cameraController.camera.getWorldPosition(camWorldPos);
      const forwardDir = this.cameraController.getForwardVector();

      const arrow = this.bowSystem.releaseAndShoot(
        camWorldPos.clone().add(forwardDir.clone().multiplyScalar(0.6)),
        forwardDir,
        true
      );

      if (arrow && onShoot) {
        onShoot(arrow);
      }
    }
  }

  public onMouseMove(movementX: number, movementY: number) {
    this.cameraController.onMouseMove(movementX, movementY);
  }

  public update(
    delta: number,
    colliders: THREE.Box3[],
    interactiveObjects: THREE.Object3D[]
  ) {
    // 1. Procesar teclas de movimiento
    let forward = 0;
    let right = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) forward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) forward -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) right += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) right -= 1;

    this.wantSprint = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
    this.wantCrouch = !!(this.keys['KeyC'] || this.keys['ControlLeft'] || this.keys['ControlRight']);
    this.wantJump = !!this.keys['Space'];

    // 2. Actualizar Stamina
    const isMoving = forward !== 0 || right !== 0;
    const { canSprint } = this.staminaSystem.update(delta, this.wantSprint, isMoving);

    // 3. Actualizar Movimiento
    const horizForward = this.cameraController.getHorizontalForwardVector();
    const horizRight = this.cameraController.getHorizontalRightVector();

    const { speed } = this.movementController.update(
      delta,
      { forward, right },
      horizForward,
      horizRight,
      this.wantSprint,
      this.wantCrouch,
      this.wantJump,
      canSprint,
      colliders
    );

    // Sincronizar posición del contenedor raíz con la posición física del jugador
    this.rootObject.position.copy(this.movementController.position);

    // 4. Actualizar Cámara (FOV, head bobbing, altura de agachado)
    this.cameraController.update(
      delta,
      this.movementController.isSprinting,
      this.movementController.isCrouched,
      this.movementController.isMoving,
      this.movementController.isGrounded,
      speed
    );

    // 5. Actualizar Arco
    this.bowSystem.update(delta);

    // 6. Actualizar Interacciones (Raycasting al centro de pantalla)
    this.interactionSystem.update(this.cameraController.camera, interactiveObjects);

    // 7. Actualizar Salud
    this.healthSystem.update(delta);
  }

  public getStats(): PlayerStats {
    return {
      health: this.healthSystem.getHealth(),
      maxHealth: this.healthSystem.getMaxHealth(),
      stamina: this.staminaSystem.getCurrent(),
      maxStamina: this.staminaSystem.getMax(),
      arrows: this.bowSystem.arrowsCount,
      role: this.role,
      isCrouched: this.movementController.isCrouched,
      isSprinting: this.movementController.isSprinting,
      isGrounded: this.movementController.isGrounded,
      isChargingBow: this.bowSystem.isCharging,
      bowChargeProgress: this.bowSystem.chargeProgress,
      canShoot: this.bowSystem.getCanShoot(),
      reloadProgress: this.bowSystem.getReloadProgress(),
    };
  }

  public spawnAt(pos: THREE.Vector3) {
    this.movementController.teleport(pos);
    this.rootObject.position.copy(pos);
  }
}
