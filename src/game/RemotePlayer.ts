/**
 * Representación 3D de un Jugador Remoto con el Personaje "Loco Joven" (RemotePlayer.ts)
 * Estilo cómic a lápiz / Jamie Hewlett, arco recurvo 3D y placa de nombre flotante.
 */

import * as THREE from 'three';
import { MultiplayerPlayer, PlayerRole } from '../types';
import { buildLocoJovenCharacter } from './CharacterModelBuilder';

export class RemotePlayer {
  public data: MultiplayerPlayer;
  public group: THREE.Group;
  public colliderBox: THREE.Box3;
  
  // Nodos visuales de Loco Joven
  private characterRoot: THREE.Group;
  private headNode: THREE.Group;
  private bodyNode: THREE.Group;
  private bowGroup: THREE.Group;
  private nameplateSprite: THREE.Sprite;

  // Interpolación de red
  private targetPosition: THREE.Vector3;
  private targetRotationY: number = 0;
  private targetPitch: number = 0;
  private isCrouched: boolean = false;

  constructor(data: MultiplayerPlayer) {
    this.data = data;
    this.group = new THREE.Group();
    this.group.name = `RemotePlayer_${data.id}`;

    this.targetPosition = new THREE.Vector3();
    this.colliderBox = new THREE.Box3();

    // Color de sudadera según equipo o jugador
    const colorHex = data.team === 'RED' ? 0xe11d48 : data.team === 'BLUE' ? 0x0284c7 : 0xf59e0b;

    // 1. Construir modelo 3D del personaje "Loco Joven"
    const char = buildLocoJovenCharacter(colorHex);
    this.characterRoot = char.root;
    this.headNode = char.head;
    this.bodyNode = char.body;
    this.group.add(this.characterRoot);

    // 2. Arco 3D en mano de Loco Joven
    this.bowGroup = new THREE.Group();
    this.bowGroup.position.set(0, 0, 0.2);

    const woodMat = new THREE.MeshToonMaterial({ color: 0x78350f });
    const limbGeo = new THREE.CylinderGeometry(0.025, 0.04, 0.65, 6);
    
    const upperLimb = new THREE.Mesh(limbGeo, woodMat);
    upperLimb.position.set(0, 0.32, -0.08);
    upperLimb.rotation.x = -0.35;
    this.bowGroup.add(upperLimb);

    const lowerLimb = new THREE.Mesh(limbGeo, woodMat);
    lowerLimb.position.set(0, -0.32, -0.08);
    lowerLimb.rotation.x = 0.35;
    this.bowGroup.add(lowerLimb);

    // Gemas de zafiro en los extremos
    const gemGeo = new THREE.OctahedronGeometry(0.045, 0);
    const gemMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const gemTop = new THREE.Mesh(gemGeo, gemMat);
    gemTop.position.set(0, 0.6, -0.15);
    this.bowGroup.add(gemTop);

    const gemBottom = new THREE.Mesh(gemGeo, gemMat);
    gemBottom.position.set(0, -0.6, -0.15);
    this.bowGroup.add(gemBottom);

    // Cuerda
    const stringGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.6, -0.15),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.6, -0.15),
    ]);
    const stringMat = new THREE.LineBasicMaterial({ color: 0x38bdf8 });
    const bowString = new THREE.Line(stringGeo, stringMat);
    this.bowGroup.add(bowString);

    char.bowAttachPoint.add(this.bowGroup);
    this.bowGroup.visible = (data.role === PlayerRole.HUNTER);

    // 3. Placa de Nombre y Vida Estilo Cómic
    this.nameplateSprite = this.createNameplateSprite();
    this.nameplateSprite.position.set(0, 2.15, 0);
    this.group.add(this.nameplateSprite);

    this.updateCollider();
  }

  private createNameplateSprite(): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect(10, 10, 236, 60, 12);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    ctx.fillStyle = this.data.team === 'RED' ? '#f43f5e' : this.data.team === 'BLUE' ? '#38bdf8' : '#fbbf24';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.data.name, 128, 38);

    const healthPercent = Math.max(0, this.data.health / 100);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(30, 48, 196, 12);
    ctx.fillStyle = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(30, 48, 196 * healthPercent, 12);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.6, 0.5, 1.0);
    return sprite;
  }

  public updateHealth(newHealth: number) {
    this.data.health = newHealth;
    this.data.isAlive = newHealth > 0;
    this.group.visible = this.data.isAlive;

    const newSprite = this.createNameplateSprite();
    this.nameplateSprite.material.dispose();
    this.nameplateSprite.material = newSprite.material;
  }

  public setRole(role: PlayerRole) {
    this.data.role = role;
    this.bowGroup.visible = (role === PlayerRole.HUNTER);
  }

  public setTransform(
    pos: [number, number, number],
    rotY: number,
    pitch: number,
    isCrouched: boolean,
    bowTension: number
  ) {
    this.targetPosition.set(pos[0], pos[1], pos[2]);
    this.targetRotationY = rotY;
    this.targetPitch = pitch;
    this.isCrouched = isCrouched;
  }

  public update(delta: number) {
    if (!this.data.isAlive) return;

    // Interpolación suave
    this.group.position.lerp(this.targetPosition, 18 * delta);
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, this.targetRotationY, 18 * delta);

    // Inclinación de la cabeza y arco
    this.headNode.rotation.x = this.targetPitch * 0.5;
    this.bowGroup.rotation.x = this.targetPitch;

    // Agachado
    const targetScaleY = this.isCrouched ? 0.65 : 1.0;
    this.characterRoot.scale.y = THREE.MathUtils.lerp(this.characterRoot.scale.y, targetScaleY, 12 * delta);
    this.nameplateSprite.position.y = this.isCrouched ? 1.55 : 2.15;

    this.updateCollider();
  }

  private updateCollider() {
    const height = this.isCrouched ? 1.0 : 1.9;
    const px = this.group.position.x;
    const py = this.group.position.y;
    const pz = this.group.position.z;

    this.colliderBox.setFromCenterAndSize(
      new THREE.Vector3(px, py + height / 2, pz),
      new THREE.Vector3(0.8, height, 0.8)
    );
  }

  public destroy(scene: THREE.Scene) {
    scene.remove(this.group);
  }
}
