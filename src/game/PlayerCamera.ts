/**
 * Controlador de Cámara en Primera Persona
 * Sensibilidad de ratón, pitch/yaw, head bobbing, FOV dinámico y transición de altura de agachado
 */

import * as THREE from 'three';

export class PlayerCamera {
  public camera: THREE.PerspectiveCamera;
  public yawObject: THREE.Object3D;
  public pitchObject: THREE.Object3D;

  private sensitivity: number = 0.0022;
  private pitch: number = 0;
  private yaw: number = 0;
  private baseFOV: number = 75;
  private sprintFOV: number = 88;
  private currentFOV: number = 75;

  private headBobTimer: number = 0;
  private headBobEnabled: boolean = true;
  private standEyeHeight: number = 1.68;
  private crouchEyeHeight: number = 0.85;
  private currentEyeHeight: number = 1.68;

  constructor(fov: number = 75, aspect: number = 16 / 9) {
    this.baseFOV = fov;
    this.currentFOV = fov;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);

    this.pitchObject = new THREE.Object3D();
    this.pitchObject.add(this.camera);

    this.yawObject = new THREE.Object3D();
    this.yawObject.position.y = this.standEyeHeight;
    this.yawObject.add(this.pitchObject);
  }

  public configure(sensitivity: number, headBob: boolean, baseFOV: number, sprintFOV: number) {
    this.sensitivity = 0.0022 * sensitivity;
    this.headBobEnabled = headBob;
    this.baseFOV = baseFOV;
    this.sprintFOV = sprintFOV;
  }

  public onMouseMove(movementX: number, movementY: number) {
    this.yaw -= movementX * this.sensitivity;
    this.pitch -= movementY * this.sensitivity;

    // Límite vertical (-85° a +85°)
    const maxPitch = (85 * Math.PI) / 180;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    this.yawObject.rotation.y = this.yaw;
    this.pitchObject.rotation.x = this.pitch;
  }

  public update(
    delta: number,
    isSprinting: boolean,
    isCrouched: boolean,
    isMoving: boolean,
    isGrounded: boolean,
    speed: number
  ) {
    // 1. Interpolar FOV según estado de sprint
    const targetFOV = isSprinting && isMoving ? this.sprintFOV : isCrouched ? this.baseFOV - 4 : this.baseFOV;
    this.currentFOV = THREE.MathUtils.lerp(this.currentFOV, targetFOV, 8 * delta);
    this.camera.fov = this.currentFOV;
    this.camera.updateProjectionMatrix();

    // 2. Interpolar altura de ojos (agachado vs de pie)
    const targetEyeHeight = isCrouched ? this.crouchEyeHeight : this.standEyeHeight;
    this.currentEyeHeight = THREE.MathUtils.lerp(this.currentEyeHeight, targetEyeHeight, 10 * delta);
    this.yawObject.position.y = this.currentEyeHeight;

    // 3. Head bobbing
    if (this.headBobEnabled && isMoving && isGrounded) {
      const bobFreq = isSprinting ? 14 : isCrouched ? 7 : 10;
      const bobAmp = isSprinting ? 0.045 : isCrouched ? 0.015 : 0.025;

      this.headBobTimer += delta * bobFreq;
      this.camera.position.y = Math.sin(this.headBobTimer) * bobAmp;
      this.camera.position.x = Math.cos(this.headBobTimer * 0.5) * (bobAmp * 0.5);
    } else {
      this.headBobTimer = 0;
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 0, 10 * delta);
      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, 0, 10 * delta);
    }
  }

  public getForwardVector(): THREE.Vector3 {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(this.camera.getWorldQuaternion(new THREE.Quaternion()));
    return dir.normalize();
  }

  public getHorizontalForwardVector(): THREE.Vector3 {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    return dir.normalize();
  }

  public getHorizontalRightVector(): THREE.Vector3 {
    const dir = new THREE.Vector3(1, 0, 0);
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    return dir.normalize();
  }

  public setRotation(yaw: number, pitch: number = 0) {
    this.yaw = yaw;
    this.pitch = pitch;
    this.yawObject.rotation.y = this.yaw;
    this.pitchObject.rotation.x = this.pitch;
  }
}
