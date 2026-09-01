/**
 * Entidad de Trampilla interactiva para suelos o paredes
 */

import * as THREE from 'three';
import { audioManager } from '../audio/AudioManager';

export class Trapdoor {
  public id: string;
  public group: THREE.Group;
  public hatchMesh: THREE.Mesh;
  public isOpen: boolean = false;
  public linkedPassageId?: string;

  private hingeGroup: THREE.Group;
  private currentAngle: number = 0;
  private targetAngle: number = 0;
  private speed: number = 4.0;

  constructor(id: string, position: THREE.Vector3, type: 'floor' | 'wall' = 'floor') {
    this.id = id;
    this.group = new THREE.Group();
    this.group.position.copy(position);

    // Marco exterior de hierro
    const frameGeo = new THREE.BoxGeometry(1.6, 0.15, 1.6);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e24,
      metalness: 0.8,
      roughness: 0.4,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 0.05;
    this.group.add(frame);

    // Bisagra
    this.hingeGroup = new THREE.Group();
    this.hingeGroup.position.set(-0.7, 0.1, 0);

    // Trampilla de rejas / madera reforzada
    const hatchGeo = new THREE.BoxGeometry(1.4, 0.08, 1.4);
    const hatchMat = new THREE.MeshStandardMaterial({
      color: 0x3d2b1f,
      roughness: 0.6,
      metalness: 0.3,
    });
    this.hatchMesh = new THREE.Mesh(hatchGeo, hatchMat);
    this.hatchMesh.position.set(0.7, 0, 0);
    this.hatchMesh.castShadow = true;
    this.hatchMesh.receiveShadow = true;

    // Manilla de anilla de hierro
    const ringGeo = new THREE.TorusGeometry(0.12, 0.03, 8, 16);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(1.1, 0.05, 0);
    this.hatchMesh.add(ring);

    this.hingeGroup.add(this.hatchMesh);
    this.group.add(this.hingeGroup);

    // Luz tenue inferior que sale de la trampilla
    const passageGlow = new THREE.PointLight(0x00ffff, 0.8, 3.0);
    passageGlow.position.set(0, -0.4, 0);
    this.group.add(passageGlow);

    if (type === 'wall') {
      this.group.rotation.x = Math.PI / 2;
    }

    this.hatchMesh.userData = { isTrapdoor: true, trapdoorInstance: this };
    frame.userData = { isTrapdoor: true, trapdoorInstance: this };
  }

  public toggle(): boolean {
    this.isOpen = !this.isOpen;
    this.targetAngle = this.isOpen ? -Math.PI * 0.55 : 0;
    audioManager.playTrapdoor();
    return true;
  }

  public open() {
    if (!this.isOpen) {
      this.isOpen = true;
      this.targetAngle = -Math.PI * 0.55;
      audioManager.playTrapdoor();
    }
  }

  public update(delta: number) {
    if (Math.abs(this.currentAngle - this.targetAngle) > 0.001) {
      const step = this.speed * delta;
      if (this.currentAngle < this.targetAngle) {
        this.currentAngle = Math.min(this.targetAngle, this.currentAngle + step);
      } else {
        this.currentAngle = Math.max(this.targetAngle, this.currentAngle - step);
      }
      this.hingeGroup.rotation.z = this.currentAngle;
    }
  }

  public getPrompt(): string {
    return this.isOpen ? '[E] Cruzar Pasadizo Secreto' : '[E] Abrir Trampilla';
  }
}
