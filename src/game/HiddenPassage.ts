/**
 * Sistema reutilizable de Pasadizo Secreto (HiddenPassage)
 * Conecta dos puntos distantes del laberinto a través de trampillas o túneles de escape
 */

import * as THREE from 'three';
import { Trapdoor } from './Trapdoor';
import { audioManager } from '../audio/AudioManager';

export class HiddenPassage {
  public id: string;
  public entranceA: Trapdoor;
  public entranceB: Trapdoor;
  public exitPointA: THREE.Vector3;
  public exitPointB: THREE.Vector3;

  constructor(id: string, entranceA: Trapdoor, entranceB: Trapdoor, exitPointA: THREE.Vector3, exitPointB: THREE.Vector3) {
    this.id = id;
    this.entranceA = entranceA;
    this.entranceB = entranceB;
    this.exitPointA = exitPointA.clone();
    this.exitPointB = exitPointB.clone();

    this.entranceA.linkedPassageId = this.id;
    this.entranceB.linkedPassageId = this.id;
  }

  /**
   * Obtiene el destino de teletransporte cuando el jugador interactúa con una entrada
   */
  public traverseFrom(currentEntrance: Trapdoor): THREE.Vector3 {
    audioManager.playPassageTeleport();
    if (currentEntrance.id === this.entranceA.id) {
      // Asegurarse de que la trampilla destino se abra para salir
      this.entranceB.open();
      return this.exitPointB.clone();
    } else {
      this.entranceA.open();
      return this.exitPointA.clone();
    }
  }

  public update(delta: number) {
    this.entranceA.update(delta);
    this.entranceB.update(delta);
  }
}
