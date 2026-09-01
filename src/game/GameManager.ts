/**
 * Motor Principal del Juego (GameManager)
 * Orquesta la Escena 3D de Three.js, Luces, Maze, Jugador, Bot Rival, Jugadores Remotos Multijugador,
 * Flechas, Ciclo de Roles, Interacciones, Cambio Dinámico de Mapa y Condiciones de Victoria.
 */

import * as THREE from 'three';
import { PlayerController } from './PlayerController';
import { BotController } from './BotController';
import { RoleManager } from './RoleManager';
import { MazeGenerator, MazeOutput } from './MazeGenerator';
import { ArrowProjectile } from './ArrowProjectile';
import { RemotePlayer } from './RemotePlayer';
import { GameConfig, GameMode, GameState, LobbyRoomState, MatchStats, PlayerRole, WinConditionType, DEFAULT_CONFIG } from '../types';
import { audioManager } from '../audio/AudioManager';
import { multiplayerManager } from '../network/MultiplayerManager';

export class GameManager {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer | null = null;
  public player: PlayerController;
  public bot: BotController;
  public roleManager: RoleManager;
  public mazeData: MazeOutput | null = null;

  public config: GameConfig;
  public gameMode: GameMode = 'SOLO_BOT';
  public gameState: GameState = GameState.MENU;
  public activeArrows: ArrowProjectile[] = [];
  public remotePlayers: Map<string, RemotePlayer> = new Map();

  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private matchTimer: number = 0;
  private playerHits: number = 0;
  private botHits: number = 0;

  // Mapa Dinámico (Terremoto / Cambio de Laberinto)
  public mapShiftInterval: number = 0; // 0 = desactivado
  public mapShiftTimer: number = 0;

  private onStateChangeCallbacks: Array<(state: GameState, stats: MatchStats) => void> = [];
  private onRoleAlertCallbacks: Array<(role: PlayerRole, message: string) => void> = [];
  private onHitEffectCallbacks: Array<(type: 'damage' | 'hit_target') => void> = [];
  private onMapShiftCallbacks: Array<(message: string) => void> = [];

  // Búfer cacheado para colisionadores activos
  private activeCollidersCache: THREE.Box3[] = [];

  constructor(config: GameConfig = DEFAULT_CONFIG) {
    this.config = { ...config };
    this.scene = new THREE.Scene();

    // Atmósfera diáfana, clara y profesional
    this.scene.background = new THREE.Color(0xa8bccf);
    this.scene.fog = new THREE.Fog(0xa8bccf, 45, 110);

    // Iluminación solar cenital potente y uniforme
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.6);
    dirLight.position.set(30, 50, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x475569, 1.1);
    this.scene.add(hemiLight);

    this.roleManager = new RoleManager(this.config.roleSwitchTime, PlayerRole.HUNTER);
    this.player = new PlayerController(this.config);
    this.bot = new BotController(this.config);

    this.scene.add(this.player.rootObject);
    this.scene.add(this.bot.mesh);

    this.setupRoleListeners();
    this.setupNetworkListeners();
  }

  private setupRoleListeners() {
    this.roleManager.onRoleSwitch((playerRole, botRole, switchCount) => {
      if (this.gameMode === 'SOLO_BOT') {
        this.player.setRole(playerRole);
        this.bot.setRole(botRole);

        // Si le toca ser cazador y tiene menos de 5 flechas, recargar a 5
        if (playerRole === PlayerRole.HUNTER) {
          if (this.player.bowSystem.arrowsCount < 5) {
            this.player.bowSystem.arrowsCount = 5;
          }
          this.player.bowSystem.setEquipped(true);
        } else {
          this.player.bowSystem.setEquipped(false);
        }

        const msg = playerRole === PlayerRole.HUNTER
          ? '¡AHORA ERES EL CAZADOR! Tienes el arco listo.'
          : '¡AHORA ERES EL CORREDOR! Escóndete y huye.';

        this.onRoleAlertCallbacks.forEach(cb => cb(playerRole, msg));
      } else if (this.gameMode === '1v1' && multiplayerManager.isHost) {
        // En 1v1, el host sincroniza el intercambio de rol
        const hostRole = playerRole;
        const clientRole = playerRole === PlayerRole.HUNTER ? PlayerRole.RUNNER : PlayerRole.HUNTER;

        this.applyRoleChange(hostRole);

        const rolesMap: Record<string, PlayerRole> = {};
        rolesMap[multiplayerManager.myId] = hostRole;

        this.remotePlayers.forEach((rp, id) => {
          rp.setRole(clientRole);
          rolesMap[id] = clientRole;
        });

        multiplayerManager.sendRoleSwitch(rolesMap, switchCount);
      }
    });

    // Daño a jugador local
    this.player.healthSystem.onDamage(() => {
      this.botHits++;
      audioManager.playHurt();
      this.onHitEffectCallbacks.forEach(cb => cb('damage'));
      this.checkWinConditions();
    });

    this.player.healthSystem.onDeath(() => {
      if (this.gameMode === 'SOLO_BOT') {
        this.endGame('BOT', 'El cazador rival te ha eliminado.');
      } else {
        multiplayerManager.sendGameOver('RIVAL', 'Rival', 'Has sido eliminado por una flecha.');
        this.endGame('RIVAL', 'Has sido eliminado en el laberinto.');
      }
    });

    // Daño a bot local
    this.bot.healthSystem.onDamage(() => {
      this.playerHits++;
      this.onHitEffectCallbacks.forEach(cb => cb('hit_target'));
      this.checkWinConditions();
    });

    this.bot.healthSystem.onDeath(() => {
      this.endGame('PLAYER', '¡Has eliminado al corredor rival con tu flecha!');
    });
  }

  public applyRoleChange(newRole: PlayerRole) {
    this.player.setRole(newRole);

    if (newRole === PlayerRole.HUNTER) {
      if (this.player.bowSystem.arrowsCount < 5) {
        this.player.bowSystem.arrowsCount = 5;
      }
      this.player.bowSystem.setEquipped(true);
    } else {
      this.player.bowSystem.setEquipped(false);
    }

    const msg = newRole === PlayerRole.HUNTER
      ? '¡AHORA ERES EL CAZADOR! Tienes el arco listo.'
      : '¡AHORA ERES EL CORREDOR! Escóndete y huye.';

    this.onRoleAlertCallbacks.forEach(cb => cb(newRole, msg));
  }

  private setupNetworkListeners() {
    // Transformación de jugadores remotos
    multiplayerManager.onRemoteTransform = (packet) => {
      const rp = this.remotePlayers.get(packet.id);
      if (rp) {
        rp.setTransform(packet.position, packet.rotationY, packet.pitch, packet.isCrouched, packet.bowTension);
      }
    };

    // Disparos remotos
    multiplayerManager.onRemoteShoot = (packet) => {
      const origin = new THREE.Vector3(packet.origin[0], packet.origin[1], packet.origin[2]);
      const velocity = new THREE.Vector3(packet.velocity[0], packet.velocity[1], packet.velocity[2]);
      const arrow = new ArrowProjectile(origin, velocity, 38, this.config.arrowDamage, packet.shooterId);
      arrow.id = packet.id;
      this.scene.add(arrow.mesh);
      this.activeArrows.push(arrow);
      audioManager.playBowRelease();
    };

    // Cambio de rol remoto sincronizado
    multiplayerManager.onRemoteRoleSwitch = (packet) => {
      const myRole = packet.roles[multiplayerManager.myId];
      if (myRole) {
        this.applyRoleChange(myRole);
      }

      this.remotePlayers.forEach((rp, id) => {
        const theirRole = packet.roles[id];
        if (theirRole) {
          rp.setRole(theirRole);
        }
      });
    };

    // Apertura/cierre de puertas
    multiplayerManager.onRemoteDoor = (doorId, isOpen) => {
      if (this.mazeData) {
        const door = this.mazeData.doors.find(d => d.id === doorId);
        if (door) {
          if (isOpen) door.open();
          else door.close();
        }
      }
    };

    // Daño remoto recibido
    multiplayerManager.onRemoteHit = (targetId, shooterId, damage, newHealth) => {
      if (targetId === multiplayerManager.myId) {
        this.player.healthSystem.takeDamage(damage);
      } else {
        const rp = this.remotePlayers.get(targetId);
        if (rp) {
          rp.updateHealth(newHealth);
        }
      }
    };

    // Cambio dinámico de mapa sincronizado
    multiplayerManager.onRemoteMapShift = (newSeed, message) => {
      this.rebuildMazeWithSeed(newSeed, message);
    };

    // Fin de partida remoto
    multiplayerManager.onRemoteGameOver = (winnerIdOrTeam, winnerName, reason) => {
      this.endGame(winnerIdOrTeam, reason);
    };
  }

  public initRenderer(container: HTMLCanvasElement) {
    if (this.renderer) {
      this.renderer.dispose();
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas: container,
      antialias: true,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.player.cameraController.camera.aspect = window.innerWidth / window.innerHeight;
    this.player.cameraController.camera.updateProjectionMatrix();

    window.addEventListener('resize', this.onWindowResize);
  }

  private onWindowResize = () => {
    if (!this.renderer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.player.cameraController.camera.aspect = w / h;
    this.player.cameraController.camera.updateProjectionMatrix();
  };

  public startMatch(config?: Partial<GameConfig>) {
    this.gameMode = 'SOLO_BOT';
    this.mapShiftInterval = 0;
    this.mapShiftTimer = 0;

    // Limpiar jugadores remotos
    this.remotePlayers.forEach(rp => rp.destroy(this.scene));
    this.remotePlayers.clear();
    this.bot.mesh.visible = true;

    if (config) {
      this.config = { ...this.config, ...config };
      this.player.configure(this.config);
      this.roleManager.configure(this.config.roleSwitchTime);
    }

    audioManager.init();

    // 1. Limpiar laberinto previo
    if (this.mazeData) {
      this.scene.remove(this.mazeData.rootGroup);
    }

    // 2. Limpiar flechas
    this.activeArrows.forEach(a => this.scene.remove(a.mesh));
    this.activeArrows = [];

    // 3. Generar nuevo laberinto
    this.mazeData = MazeGenerator.generate(this.config.mazeSize, this.config.mazeSeed);
    this.scene.add(this.mazeData.rootGroup);

    // 4. Registrar interactivos
    this.setupInteractives();

    // 5. Posicionar Jugador y Bot
    this.player.spawnAt(this.mazeData.playerSpawn);
    this.bot.teleport(this.mazeData.botSpawn);

    // 6. Resetear estadísticas y equipar arco
    this.matchTimer = 0;
    this.playerHits = 0;
    this.botHits = 0;
    this.player.healthSystem.reset();
    this.bot.healthSystem.reset();
    this.roleManager.reset(PlayerRole.HUNTER);
    this.player.setRole(PlayerRole.HUNTER);
    this.bot.setRole(PlayerRole.RUNNER);
    this.player.bowSystem.setEquipped(true);
    this.player.bowSystem.resetArrows(10);

    this.gameState = GameState.PLAYING;
    this.startLoop();
  }

  public startMultiplayerMatch(lobby: LobbyRoomState) {
    this.gameMode = lobby.mode;
    this.mapShiftInterval = lobby.mapShiftInterval;
    this.mapShiftTimer = 0;
    this.config.mazeSize = lobby.mazeSize;
    this.config.mazeSeed = lobby.mazeSeed;

    audioManager.init();

    // Ocultar bot en partidas multijugador puras
    this.bot.mesh.visible = false;

    // 1. Limpiar laberinto previo y jugadores remotos
    if (this.mazeData) {
      this.scene.remove(this.mazeData.rootGroup);
    }
    this.remotePlayers.forEach(rp => rp.destroy(this.scene));
    this.remotePlayers.clear();

    // 2. Generar laberinto sincronizado
    this.mazeData = MazeGenerator.generate(this.config.mazeSize, this.config.mazeSeed);
    this.scene.add(this.mazeData.rootGroup);
    this.setupInteractives();

    // 3. Crear avatares 3D para cada jugador remoto
    lobby.players.forEach(p => {
      if (p.id !== multiplayerManager.myId) {
        const rp = new RemotePlayer(p);
        this.remotePlayers.set(p.id, rp);
        this.scene.add(rp.group);
        rp.group.position.copy(this.mazeData!.botSpawn);
      }
    });

    // 4. Configurar rol y armas según modo
    let myInitialRole = PlayerRole.HUNTER;
    let remoteInitialRole = PlayerRole.RUNNER;

    if (this.gameMode === '1v1') {
      if (multiplayerManager.isHost) {
        myInitialRole = PlayerRole.HUNTER;
        remoteInitialRole = PlayerRole.RUNNER;
      } else {
        myInitialRole = PlayerRole.RUNNER;
        remoteInitialRole = PlayerRole.HUNTER;
      }
    }

    this.remotePlayers.forEach(rp => {
      rp.setRole(remoteInitialRole);
    });

    this.roleManager.reset(myInitialRole);
    this.applyRoleChange(myInitialRole);

    this.player.spawnAt(this.mazeData.playerSpawn);
    this.player.healthSystem.reset();

    if (myInitialRole === PlayerRole.HUNTER) {
      this.player.bowSystem.resetArrows(8);
      this.player.bowSystem.setEquipped(true);
    } else {
      this.player.bowSystem.setEquipped(false);
    }

    this.matchTimer = 0;
    this.playerHits = 0;
    this.gameState = GameState.PLAYING;
    this.startLoop();
  }

  private setupInteractives() {
    if (!this.mazeData) return;
    this.player.interactionSystem.clear();
    this.mazeData.doors.forEach(door => {
      this.player.interactionSystem.registerDoor(door);
    });
    this.mazeData.passages.forEach(p => {
      this.player.interactionSystem.registerTrapdoor(p.entranceA, p);
      this.player.interactionSystem.registerTrapdoor(p.entranceB, p);
    });
    this.mazeData.arrowPickups.forEach(pickup => {
      this.player.interactionSystem.registerArrowPickup(pickup.id, pickup.mesh, () => {
        pickup.collected = true;
        pickup.mesh.visible = false;
        this.player.bowSystem.addArrows(5);
      });
    });
  }

  public rebuildMazeWithSeed(newSeed: number, alertMsg: string = '¡EL LABERINTO SE HA TRANSFORMADO!') {
    if (this.mazeData) {
      this.scene.remove(this.mazeData.rootGroup);
    }
    this.config.mazeSeed = newSeed;
    this.mazeData = MazeGenerator.generate(this.config.mazeSize, newSeed);
    this.scene.add(this.mazeData.rootGroup);
    this.setupInteractives();

    // Teletransportar a posiciones seguras
    this.player.spawnAt(this.mazeData.playerSpawn);
    if (this.bot.mesh.visible) {
      this.bot.teleport(this.mazeData.botSpawn);
    }

    audioManager.playLand();
    this.onMapShiftCallbacks.forEach(cb => cb(alertMsg));
  }

  private shiftMaze() {
    this.mapShiftTimer = 0;
    const newSeed = Math.floor(Math.random() * 999999) + 1;
    const msg = '⚡ ¡TERREMOTO! EL LABERINTO HA CAMBIADO DE FORMA ⚡';
    
    if (multiplayerManager.isHost) {
      multiplayerManager.sendMapShift(newSeed, msg);
    }
    this.rebuildMazeWithSeed(newSeed, msg);
  }

  private startLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = Math.min(0.06, (currentTime - this.lastTime) / 1000);
      this.lastTime = currentTime;

      if (this.gameState === GameState.PLAYING) {
        this.update(delta);
      }

      if (this.renderer && this.player) {
        this.renderer.render(this.scene, this.player.cameraController.camera);
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private update(delta: number) {
    if (!this.mazeData) return;

    this.matchTimer += delta;

    // 1. Manejar Mapa Dinámico (si está habilitado)
    if (this.mapShiftInterval > 0) {
      this.mapShiftTimer += delta;
      if (this.mapShiftTimer >= this.mapShiftInterval) {
        if (this.gameMode === 'SOLO_BOT' || multiplayerManager.isHost) {
          this.shiftMaze();
        }
      }
    }

    // 2. Actualizar ciclo de roles en Solo/1v1
    if (this.gameMode === 'SOLO_BOT' || (this.gameMode === '1v1' && multiplayerManager.isHost)) {
      this.roleManager.update(delta);
    }

    // 3. Construir lista de colisionadores activos
    this.activeCollidersCache.length = 0;
    for (let i = 0; i < this.mazeData.colliders.length; i++) {
      this.activeCollidersCache.push(this.mazeData.colliders[i]);
    }
    for (let i = 0; i < this.mazeData.doors.length; i++) {
      const door = this.mazeData.doors[i];
      door.update(delta);
      if (!door.collider.isEmpty()) {
        this.activeCollidersCache.push(door.collider);
      }
    }

    // 4. Actualizar Jugador Local
    this.player.update(delta, this.activeCollidersCache, this.mazeData.interactiveMeshes);

    // 5. Broadcast de red (si estamos en multijugador)
    if (this.gameMode !== 'SOLO_BOT' && multiplayerManager.peer) {
      const pos = this.player.movementController.position;
      const rotY = this.player.cameraController.yawObject.rotation.y;
      const pitch = this.player.cameraController.pitchObject.rotation.x;
      const isCrouched = this.player.movementController.isCrouched;
      const isDrawing = this.player.bowSystem.isDrawing;
      const tension = this.player.bowSystem.getChargeProgress();

      multiplayerManager.sendTransform(
        [pos.x, pos.y, pos.z],
        rotY,
        pitch,
        isCrouched,
        isDrawing,
        tension
      );
    }

    // 6. Actualizar Jugadores Remotos
    this.remotePlayers.forEach(rp => {
      rp.update(delta);
    });

    // 7. Actualizar Bot (solo si está activo en Solo)
    if (this.gameMode === 'SOLO_BOT' && this.bot.mesh.visible) {
      this.bot.update(delta, this.player.movementController.position, this.activeCollidersCache, (botArrow) => {
        botArrow.shooterId = 'BOT';
        this.scene.add(botArrow.mesh);
        this.activeArrows.push(botArrow);
      });
    }

    // 8. Actualizar Flechas y Detección de Impactos
    const hitTargets: Array<{ id: string; box: THREE.Box3; isPlayer: boolean; onHit: (dmg: number) => void }> = [
      {
        id: multiplayerManager.myId || 'PLAYER_LOCAL',
        box: this.player.movementController.getPlayerBoundingBox(),
        isPlayer: true,
        onHit: (dmg) => this.player.healthSystem.takeDamage(dmg),
      },
    ];

    if (this.gameMode === 'SOLO_BOT' && this.bot.mesh.visible) {
      hitTargets.push({
        id: 'BOT',
        box: this.bot.colliderBox,
        isPlayer: false,
        onHit: (dmg) => this.bot.healthSystem.takeDamage(dmg),
      });
    }

    // Añadir cajas de jugadores remotos
    this.remotePlayers.forEach(rp => {
      if (rp.data.isAlive) {
        hitTargets.push({
          id: rp.data.id,
          box: rp.colliderBox,
          isPlayer: true,
          onHit: (dmg) => {
            const newHp = Math.max(0, rp.data.health - dmg);
            rp.updateHealth(newHp);
            multiplayerManager.sendPlayerHit(rp.data.id, dmg, newHp);
            this.playerHits++;
            this.onHitEffectCallbacks.forEach(cb => cb('hit_target'));
            audioManager.playHurt();

            if (newHp <= 0) {
              this.endGame('PLAYER', '¡Has eliminado al rival con tu flecha certera!');
            }
          },
        });
      }
    });

    for (let i = this.activeArrows.length - 1; i >= 0; i--) {
      const arrow = this.activeArrows[i];
      const alive = arrow.update(delta, this.activeCollidersCache, hitTargets);
      if (arrow.isExpired || !alive) {
        this.scene.remove(arrow.mesh);
        this.activeArrows.splice(i, 1);
      }
    }

    // 9. Evaluar condiciones de victoria
    this.checkWinConditions();
  }

  public shootPlayerArrow(arrow: ArrowProjectile) {
    arrow.shooterId = multiplayerManager.myId || 'PLAYER_LOCAL';
    this.scene.add(arrow.mesh);
    this.activeArrows.push(arrow);

    if (this.gameMode !== 'SOLO_BOT') {
      const pos = arrow.mesh.position;
      const vel = arrow.velocity;
      multiplayerManager.sendShootArrow(
        arrow.id,
        [pos.x, pos.y, pos.z],
        [vel.x, vel.y, vel.z]
      );
    }
  }

  private checkWinConditions() {
    if (this.gameState !== GameState.PLAYING) return;

    // Límite de tiempo de 3 minutos (180s)
    const MATCH_TIME_LIMIT = 180;
    if (this.matchTimer >= MATCH_TIME_LIMIT) {
      if (this.player.role === PlayerRole.RUNNER) {
        this.endGame('PLAYER', '¡VICTORIA DEL CORREDOR! Lograste sobrevivir y esconderte durante los 3 minutos.');
      } else {
        this.endGame('RIVAL', '¡TIEMPO AGOTADO! El corredor eludió tus flechas y sobrevivió.');
      }
    }

    if (this.gameMode === 'SOLO_BOT') {
      if (this.config.matchTimeLimit > 0 && this.matchTimer >= this.config.matchTimeLimit) {
        if (this.playerHits > this.botHits) {
          this.endGame('PLAYER', '¡Tiempo concluido! Mayor precisión de combate.');
        } else if (this.botHits > this.playerHits) {
          this.endGame('BOT', '¡Tiempo concluido! El rival infligió más daño.');
        } else {
          this.endGame('DRAW', '¡Tiempo concluido en empate!');
        }
      }
    }
  }

  public endGame(winner: string, reason: string) {
    this.gameState = GameState.GAME_OVER;
    if (winner === 'PLAYER' || winner === multiplayerManager.myId) {
      audioManager.playVictory();
    } else {
      audioManager.playDefeat();
    }

    const stats = this.getMatchStats(winner, reason);
    this.onStateChangeCallbacks.forEach(cb => cb(this.gameState, stats));
  }

  public getMatchStats(winner: string | null = null, winReason: string = ''): MatchStats {
    return {
      elapsedTime: Math.floor(this.matchTimer),
      currentRoleTimer: this.roleManager.getTimeRemaining(),
      roleSwitchCount: this.roleManager.getSwitchCount(),
      playerRole: this.roleManager.getPlayerRole(),
      botRole: this.roleManager.getBotRole(),
      playerHits: this.playerHits,
      botHits: this.botHits,
      winner,
      winReason,
    };
  }

  public onStateChange(cb: (state: GameState, stats: MatchStats) => void) {
    this.onStateChangeCallbacks.push(cb);
  }

  public onRoleAlert(cb: (role: PlayerRole, message: string) => void) {
    this.onRoleAlertCallbacks.push(cb);
  }

  public onHitEffect(cb: (type: 'damage' | 'hit_target') => void) {
    this.onHitEffectCallbacks.push(cb);
  }

  public onMapShiftAlert(cb: (message: string) => void) {
    this.onMapShiftCallbacks.push(cb);
  }

  public destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    this.remotePlayers.forEach(rp => rp.destroy(this.scene));
    this.remotePlayers.clear();
    this.renderer?.dispose();
  }
}
