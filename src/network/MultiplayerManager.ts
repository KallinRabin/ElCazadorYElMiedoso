/**
 * Gestor de Red Multijugador WebRTC Peer-to-Peer (MultiplayerManager.ts)
 * Permite crear salas con códigos cortos (ej: LAB-8391) o unirse a salas existentes,
 * sincronizando jugadores remotos, disparos, puertas, daño y cambios de mapa procedurales.
 */

import Peer, { DataConnection } from 'peerjs';
import { GameMode, LobbyRoomState, MultiplayerPlayer, NetworkPacket, PlayerRole } from '../types';

export class MultiplayerManager {
  public peer: Peer | null = null;
  public myId: string = '';
  public myPlayer: MultiplayerPlayer | null = null;
  public isHost: boolean = false;
  public currentLobby: LobbyRoomState | null = null;

  // Conexiones de red P2P
  private hostConnection: DataConnection | null = null; // Si soy cliente, conexión al host
  private clientConnections: Map<string, DataConnection> = new Map(); // Si soy host, conexiones a los clientes

  // Callbacks de eventos
  public onLobbyUpdate: ((lobby: LobbyRoomState) => void) | null = null;
  public onGameStart: ((lobby: LobbyRoomState) => void) | null = null;
  public onRemoteTransform: ((packet: Extract<NetworkPacket, { type: 'PLAYER_TRANSFORM' }>) => void) | null = null;
  public onRemoteShoot: ((packet: Extract<NetworkPacket, { type: 'SHOOT_ARROW' }>) => void) | null = null;
  public onRemoteDoor: ((doorId: string, isOpen: boolean) => void) | null = null;
  public onRemoteHit: ((targetId: string, shooterId: string, damage: number, newHealth: number) => void) | null = null;
  public onRemoteMapShift: ((newSeed: number, message: string) => void) | null = null;
  public onRemoteRoleSwitch: ((packet: Extract<NetworkPacket, { type: 'ROLE_SWITCH' }>) => void) | null = null;
  public onRemoteGameOver: ((winnerIdOrTeam: string, winnerName: string, reason: string) => void) | null = null;

  // Generador de ID de sala amigable
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'LAB-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public async createRoom(
    playerName: string,
    mode: GameMode = '1v1',
    mapShiftInterval: number = 30
  ): Promise<string> {
    this.isHost = true;
    const roomCode = this.generateRoomCode();
    const peerId = `lab3d_${roomCode.toLowerCase().replace('-', '_')}`;

    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer(peerId, {
          debug: 0,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
            ],
          },
        });

        this.peer.on('open', (id) => {
          this.myId = id;
          this.myPlayer = {
            id: this.myId,
            name: playerName || 'Anfitrión',
            isHost: true,
            team: mode === '2v2' ? 'BLUE' : 'SOLO',
            color: '#38bdf8',
            role: PlayerRole.HUNTER,
            health: 100,
            score: 0,
            isAlive: true,
          };

          this.currentLobby = {
            roomId: roomCode,
            mode,
            hostId: this.myId,
            players: [this.myPlayer],
            mazeSeed: Math.floor(Math.random() * 999999),
            mazeSize: mode === 'FFA' ? 15 : 13,
            mapShiftInterval,
            roleSwitchTime: 15,
            isGameStarted: false,
          };

          this.setupHostListeners();
          resolve(roomCode);
        });

        this.peer.on('error', (err) => {
          console.warn('Error al iniciar peer host:', err);
          // Si el ID ya está en uso, reintentar con otro código
          if (err.type === 'unavailable-id') {
            this.peer?.destroy();
            this.createRoom(playerName, mode, mapShiftInterval).then(resolve).catch(reject);
          } else {
            reject(err);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  public async joinRoom(roomCode: string, playerName: string): Promise<LobbyRoomState> {
    this.isHost = false;
    const formattedCode = roomCode.trim().toUpperCase();
    const targetPeerId = `lab3d_${formattedCode.toLowerCase().replace('-', '_')}`;

    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer({
          debug: 0,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
            ],
          },
        });

        this.peer.on('open', (myPeerId) => {
          this.myId = myPeerId;
          const conn = this.peer!.connect(targetPeerId, {
            reliable: true,
          });

          this.hostConnection = conn;

          conn.on('open', () => {
            const team = 'RED';
            const color = '#f43f5e';

            this.myPlayer = {
              id: this.myId,
              name: playerName || `Jugador_${Math.floor(Math.random() * 900) + 100}`,
              isHost: false,
              team,
              color,
              role: PlayerRole.RUNNER,
              health: 100,
              score: 0,
              isAlive: true,
            };

            // Enviar paquete de unión
            conn.send({
              type: 'JOIN_LOBBY',
              player: this.myPlayer,
            } as NetworkPacket);

            this.setupClientListeners(conn, resolve, reject);
          });

          conn.on('error', (err) => {
            reject(err);
          });
        });

        this.peer.on('error', (err) => {
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  private setupHostListeners() {
    if (!this.peer) return;

    this.peer.on('connection', (conn) => {
      conn.on('open', () => {
        this.clientConnections.set(conn.peer, conn);

        conn.on('data', (data: any) => {
          this.handleHostReceivedPacket(data as NetworkPacket, conn.peer);
        });

        conn.on('close', () => {
          this.clientConnections.delete(conn.peer);
          if (this.currentLobby) {
            this.currentLobby.players = this.currentLobby.players.filter((p) => p.id !== conn.peer);
            this.broadcast({
              type: 'LOBBY_STATE',
              state: this.currentLobby,
            });
            this.onLobbyUpdate?.(this.currentLobby);

            if (this.currentLobby.isGameStarted && this.currentLobby.players.length <= 1) {
              this.onRemoteGameOver?.(this.myId, this.myPlayer?.name || 'Anfitrión', '¡Victoria por abandono! Tu rival se ha desconectado de la partida.');
            }
          }
        });
      });
    });
  }

  private setupClientListeners(
    conn: DataConnection,
    onJoinSuccess: (lobby: LobbyRoomState) => void,
    onJoinError: (err: any) => void
  ) {
    let joined = false;

    conn.on('data', (data: any) => {
      const packet = data as NetworkPacket;

      if (packet.type === 'LOBBY_STATE') {
        this.currentLobby = packet.state;
        this.onLobbyUpdate?.(packet.state);
        if (!joined) {
          joined = true;
          onJoinSuccess(packet.state);
        }
      } else if (packet.type === 'START_GAME') {
        this.currentLobby = packet.state;
        this.onGameStart?.(packet.state);
      } else if (packet.type === 'PLAYER_TRANSFORM') {
        this.onRemoteTransform?.(packet);
      } else if (packet.type === 'SHOOT_ARROW') {
        this.onRemoteShoot?.(packet);
      } else if (packet.type === 'DOOR_TOGGLE') {
        this.onRemoteDoor?.(packet.doorId, packet.isOpen);
      } else if (packet.type === 'PLAYER_HIT') {
        this.onRemoteHit?.(packet.targetId, packet.shooterId, packet.damage, packet.newHealth);
      } else if (packet.type === 'MAP_SHIFT') {
        this.onRemoteMapShift?.(packet.newSeed, packet.message);
      } else if (packet.type === 'ROLE_SWITCH') {
        this.onRemoteRoleSwitch?.(packet);
      } else if (packet.type === 'GAME_OVER') {
        this.onRemoteGameOver?.(packet.winnerIdOrTeam, packet.winnerName, packet.reason);
      }
    });

    conn.on('close', () => {
      if (this.currentLobby?.isGameStarted) {
        this.onRemoteGameOver?.(this.myId, this.myPlayer?.name || 'Jugador', '¡Victoria por abandono! El anfitrión se ha desconectado de la sala.');
      }
    });

    setTimeout(() => {
      if (!joined) {
        onJoinError(new Error('Tiempo de espera agotado al unirse a la sala.'));
      }
    }, 10000);
  }

  private handleHostReceivedPacket(packet: NetworkPacket, senderId: string) {
    if (packet.type === 'JOIN_LOBBY') {
      if (!this.currentLobby) return;
      // Asignar equipo según modo
      const player = packet.player;
      player.id = senderId;
      const count = this.currentLobby.players.length;

      if (this.currentLobby.mode === '2v2') {
        player.team = count % 2 === 0 ? 'BLUE' : 'RED';
        player.color = player.team === 'BLUE' ? '#38bdf8' : '#f43f5e';
      } else if (this.currentLobby.mode === '1v1v1') {
        const colors = ['#38bdf8', '#f43f5e', '#22c55e'];
        player.color = colors[count % 3];
      } else if (this.currentLobby.mode === 'FFA') {
        const colors = ['#38bdf8', '#f43f5e', '#22c55e', '#fbbf24'];
        player.color = colors[count % 4];
      }

      this.currentLobby.players.push(player);
      this.broadcast({
        type: 'LOBBY_STATE',
        state: this.currentLobby,
      });
      this.onLobbyUpdate?.(this.currentLobby);
    } else {
      // Retransmitir paquete a todos los demás clientes
      this.broadcast(packet, senderId);

      // Procesar localmente en el host
      if (packet.type === 'PLAYER_TRANSFORM') {
        this.onRemoteTransform?.(packet);
      } else if (packet.type === 'SHOOT_ARROW') {
        this.onRemoteShoot?.(packet);
      } else if (packet.type === 'DOOR_TOGGLE') {
        this.onRemoteDoor?.(packet.doorId, packet.isOpen);
      } else if (packet.type === 'PLAYER_HIT') {
        this.onRemoteHit?.(packet.targetId, packet.shooterId, packet.damage, packet.newHealth);
      }
    }
  }

  public startGame() {
    if (!this.isHost || !this.currentLobby) return;
    this.currentLobby.isGameStarted = true;
    this.broadcast({
      type: 'START_GAME',
      state: this.currentLobby,
    });
    this.onGameStart?.(this.currentLobby);
  }

  public broadcast(packet: NetworkPacket, excludeSenderId?: string) {
    if (this.isHost) {
      this.clientConnections.forEach((conn, peerId) => {
        if (peerId !== excludeSenderId && conn.open) {
          conn.send(packet);
        }
      });
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(packet);
    }
  }

  public sendTransform(
    position: [number, number, number],
    rotationY: number,
    pitch: number,
    isCrouched: boolean,
    isDrawingBow: boolean,
    bowTension: number
  ) {
    this.broadcast({
      type: 'PLAYER_TRANSFORM',
      id: this.myId,
      position,
      rotationY,
      pitch,
      isCrouched,
      isDrawingBow,
      bowTension,
    });
  }

  public sendShootArrow(
    arrowId: string,
    origin: [number, number, number],
    velocity: [number, number, number]
  ) {
    this.broadcast({
      type: 'SHOOT_ARROW',
      id: arrowId,
      shooterId: this.myId,
      origin,
      velocity,
    });
  }

  public sendDoorToggle(doorId: string, isOpen: boolean) {
    this.broadcast({
      type: 'DOOR_TOGGLE',
      doorId,
      isOpen,
    });
  }

  public sendPlayerHit(targetId: string, damage: number, newHealth: number) {
    this.broadcast({
      type: 'PLAYER_HIT',
      targetId,
      shooterId: this.myId,
      damage,
      newHealth,
    });
  }

  public sendMapShift(newSeed: number, message: string) {
    this.broadcast({
      type: 'MAP_SHIFT',
      newSeed,
      message,
    });
  }

  public sendRoleSwitch(roles: Record<string, PlayerRole>, switchCount: number) {
    this.broadcast({
      type: 'ROLE_SWITCH',
      roles,
      switchCount,
    });
  }

  public sendGameOver(winnerIdOrTeam: string, winnerName: string, reason: string) {
    this.broadcast({
      type: 'GAME_OVER',
      winnerIdOrTeam,
      winnerName,
      reason,
    });
  }

  public disconnect() {
    this.clientConnections.forEach((conn) => conn.close());
    this.clientConnections.clear();
    this.hostConnection?.close();
    this.peer?.destroy();
    this.peer = null;
    this.currentLobby = null;
    this.myPlayer = null;
  }
}

export const multiplayerManager = new MultiplayerManager();
