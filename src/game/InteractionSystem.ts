/**
 * Sistema de interacción en primera persona
 * Detecta objetos interactuables mediante Raycasting y ejecuta acciones
 */

import * as THREE from 'three';
import { Door } from './Door';
import { Trapdoor } from './Trapdoor';
import { HiddenPassage } from './HiddenPassage';

export interface InteractiveItem {
  id: string;
  type: 'DOOR' | 'TRAPDOOR' | 'PASSAGE' | 'ARROW_PICKUP';
  instance: Door | Trapdoor | { id: string; pickupArrows: () => number };
  getPrompt: () => string;
  interact: (playerPos: THREE.Vector3) => THREE.Vector3 | null; // Retorna nueva posición si teletransporta
}

export class InteractionSystem {
  private raycaster: THREE.Raycaster;
  private maxDistance: number = 3.2; // Rango de alcance del brazo
  private currentTarget: InteractiveItem | null = null;
  private interactables: InteractiveItem[] = [];

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = this.maxDistance;
  }

  public registerDoor(door: Door) {
    this.interactables.push({
      id: door.id,
      type: 'DOOR',
      instance: door,
      getPrompt: () => door.getPrompt(),
      interact: () => {
        door.toggle();
        return null;
      },
    });
  }

  public registerTrapdoor(trapdoor: Trapdoor, linkedPassage?: HiddenPassage) {
    this.interactables.push({
      id: trapdoor.id,
      type: linkedPassage ? 'PASSAGE' : 'TRAPDOOR',
      instance: trapdoor,
      getPrompt: () => {
        if (linkedPassage && trapdoor.isOpen) {
          return '[E] Cruzar Pasadizo Secreto';
        }
        return trapdoor.getPrompt();
      },
      interact: () => {
        if (linkedPassage && trapdoor.isOpen) {
          return linkedPassage.traverseFrom(trapdoor);
        } else {
          trapdoor.toggle();
          return null;
        }
      },
    });
  }

  public registerArrowPickup(id: string, mesh: THREE.Object3D, onPickup: () => void) {
    this.interactables.push({
      id,
      type: 'ARROW_PICKUP',
      instance: { id, pickupArrows: () => { onPickup(); return 5; } },
      getPrompt: () => '[E] Recoger Flechas (+5)',
      interact: () => {
        onPickup();
        return null;
      },
    });
  }

  public clear() {
    this.interactables = [];
    this.currentTarget = null;
  }

  public update(camera: THREE.Camera, interactiveObjects: THREE.Object3D[]): InteractiveItem | null {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = this.raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      if (hit.distance <= this.maxDistance) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          if (obj.userData?.doorInstance) {
            const door = obj.userData.doorInstance as Door;
            this.currentTarget = this.interactables.find(i => i.instance === door) || null;
            return this.currentTarget;
          }
          if (obj.userData?.trapdoorInstance) {
            const trap = obj.userData.trapdoorInstance as Trapdoor;
            this.currentTarget = this.interactables.find(i => i.instance === trap) || null;
            return this.currentTarget;
          }
          if (obj.userData?.isArrowPickup) {
            const id = obj.userData.pickupId;
            this.currentTarget = this.interactables.find(i => i.id === id) || null;
            return this.currentTarget;
          }
          obj = obj.parent;
        }
      }
    }

    this.currentTarget = null;
    return null;
  }

  public interact(playerPos: THREE.Vector3): THREE.Vector3 | null {
    if (this.currentTarget) {
      return this.currentTarget.interact(playerPos);
    }
    return null;
  }

  public getCurrentTarget(): InteractiveItem | null {
    return this.currentTarget;
  }
}
