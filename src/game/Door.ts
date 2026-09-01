/**
 * Entidad de Puerta interactiva con bisagra 3D, animación y colisión
 */

import * as THREE from 'three';
import { audioManager } from '../audio/AudioManager';

export class Door {
  public id: string;
  public group: THREE.Group;
  public doorMesh: THREE.Mesh;
  public frameMesh: THREE.Mesh;
  public isOpen: boolean = false;
  public isLocked: boolean = false;
  
  private targetRotation: number = 0;
  private currentRotation: number = 0;
  private swingSpeed: number = 5.0; // rad/s
  private position: THREE.Vector3;
  private baseAngle: number; // Orientación base en el laberinto

  // Bounding box para colisión cuando está cerrada
  public collider: THREE.Box3;

  constructor(id: string, position: THREE.Vector3, orientation: 'horizontal' | 'vertical' = 'horizontal', initiallyOpen: boolean = false) {
    this.id = id;
    this.position = position.clone();
    this.isOpen = initiallyOpen;
    this.baseAngle = orientation === 'horizontal' ? 0 : Math.PI / 2;

    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = this.baseAngle;

    // Marco de madera / piedra estilo dibujo
    const frameGeo = new THREE.BoxGeometry(2.3, 3.3, 0.35);
    const frameMat = new THREE.MeshToonMaterial({
      color: 0x2e3846, // Tono piedra oscura entintada
    });
    this.frameMesh = new THREE.Mesh(frameGeo, frameMat);
    this.frameMesh.position.set(0, 1.65, 0);
    this.frameMesh.castShadow = true;
    this.frameMesh.receiveShadow = true;

    // Bisagra lateral: la hoja rota sobre x = -0.95
    const hingeGroup = new THREE.Group();
    hingeGroup.position.set(-0.95, 0, 0);

    // Hoja de la puerta de tablones de madera estilizada
    const doorGeo = new THREE.BoxGeometry(1.9, 2.9, 0.14);
    const doorMat = new THREE.MeshToonMaterial({
      color: 0xb46932, // Tono madera vibrante estilo ilustración
    });
    this.doorMesh = new THREE.Mesh(doorGeo, doorMat);
    this.doorMesh.position.set(0.95, 1.5, 0);
    this.doorMesh.castShadow = true;
    this.doorMesh.receiveShadow = true;

    // Manilla / cerrojo de hierro
    const handleGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.28, 8);
    const handleMat = new THREE.MeshToonMaterial({ color: 0x181e28 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(1.6, 1.4, 0.12);
    this.doorMesh.add(handle);

    // Clavos / herrajes decorativos
    const ironBandGeo = new THREE.BoxGeometry(1.86, 0.09, 0.16);
    const bandMat = new THREE.MeshToonMaterial({ color: 0x1f2937 });
    const bandTop = new THREE.Mesh(ironBandGeo, bandMat);
    bandTop.position.set(0.95, 2.3, 0);
    const bandBottom = new THREE.Mesh(ironBandGeo, bandMat);
    bandBottom.position.set(0.95, 0.6, 0);
    this.doorMesh.add(bandTop);
    this.doorMesh.add(bandBottom);

    hingeGroup.add(this.doorMesh);
    this.group.add(hingeGroup);

    // Tagging para raycasting de interacción
    this.doorMesh.userData = { isDoor: true, doorInstance: this };
    this.frameMesh.userData = { isDoor: true, doorInstance: this };

    this.currentRotation = initiallyOpen ? Math.PI / 2 : 0;
    this.targetRotation = this.currentRotation;
    hingeGroup.rotation.y = this.currentRotation;

    this.collider = new THREE.Box3();
    this.updateCollider();
  }

  public toggle(): boolean {
    if (this.isLocked) return false;
    this.isOpen = !this.isOpen;
    this.targetRotation = this.isOpen ? Math.PI / 2 : 0;

    audioManager.playDoor(this.isOpen ? 'open' : 'close');
    return true;
  }

  public open() {
    if (!this.isOpen && !this.isLocked) {
      this.isOpen = true;
      this.targetRotation = Math.PI / 2;
      audioManager.playDoor('open');
    }
  }

  public close() {
    if (this.isOpen) {
      this.isOpen = false;
      this.targetRotation = 0;
      audioManager.playDoor('close');
    }
  }

  public update(delta: number) {
    if (Math.abs(this.currentRotation - this.targetRotation) > 0.001) {
      const step = this.swingSpeed * delta;
      if (this.currentRotation < this.targetRotation) {
        this.currentRotation = Math.min(this.targetRotation, this.currentRotation + step);
      } else {
        this.currentRotation = Math.max(this.targetRotation, this.currentRotation - step);
      }

      const hingeGroup = this.group.children[0];
      if (hingeGroup) {
        hingeGroup.rotation.y = this.currentRotation;
      }
      this.updateCollider();
    }
  }

  private updateCollider() {
    if (this.isOpen || this.currentRotation > 0.08) {
      // Mientras la puerta esté abierta o girando en transición, mantener collider libre
      this.collider.makeEmpty();
    } else {
      // Cuando la puerta está 100% cerrada en su marco, sella el vano
      const boxSize = new THREE.Vector3(2.0, 3.2, 0.35);
      if (this.baseAngle !== 0) {
        boxSize.set(0.35, 3.2, 2.0);
      }
      this.collider.setFromCenterAndSize(
        new THREE.Vector3(this.position.x, this.position.y + 1.6, this.position.z),
        boxSize
      );
    }
  }

  public getPrompt(): string {
    return this.isOpen ? '[E] Cerrar Puerta' : '[E] Abrir Puerta';
  }
}
