/**
 * Tipos y constantes fundamentales para el juego de laberinto 3D
 */

export enum PlayerRole {
  HUNTER = 'HUNTER',
  RUNNER = 'RUNNER',
}

export enum GameState {
  MENU = 'MENU',
  COUNTDOWN = 'COUNTDOWN',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

export enum WinConditionType {
  HEALTH_ELIMINATION = 'HEALTH_ELIMINATION', // Eliminar al oponente
  SURVIVE_TIME = 'SURVIVE_TIME',             // Sobrevivir X tiempo/rondas
  ARROW_HITS = 'ARROW_HITS',                 // Acertar X flechas como cazador
}

export interface GameConfig {
  // Roles
  roleSwitchTime: number;          // Segundos por rol (ej: 15s)
  
  // Movimiento
  playerWalkSpeed: number;         // Velocidad al caminar (m/s)
  playerRunSpeed: number;          // Velocidad al correr (m/s)
  playerCrouchSpeed: number;       // Velocidad agachado (m/s)
  jumpForce: number;               // Fuerza de salto
  mouseSensitivity: number;        // Sensibilidad del ratón
  headBobEnabled: boolean;         // Activar balanceo de cabeza
  baseFOV: number;                 // Campo de visión base
  sprintFOV: number;               // FOV al correr
  
  // Stamina
  maxStamina: number;              // Stamina máxima
  staminaDrainRate: number;        // Consumo por segundo corriendo
  staminaRecoveryRate: number;     // Recuperación por segundo
  staminaRecoveryDelay: number;    // Segundos antes de recuperar tras correr
  
  // Combate & Arco
  playerMaxHealth: number;         // Vida máxima
  arrowDamage: number;             // Daño por flecha
  arrowReloadTime: number;         // Tiempo de recarga entre disparos (segundos)
  arrowInitialCount: number;       // Flechas iniciales de cazador
  arrowSpeed: number;              // Velocidad inicial de la flecha
  arrowGravity: number;            // Gravedad de la flecha
  
  // Laberinto & Partida
  mazeSeed: number;                // Semilla para generación procedural
  mazeSize: number;                // Tamaño de la cuadrícula (ej: 11x11, 15x15)
  winCondition: WinConditionType;  // Tipo de condición de victoria
  targetScoreOrHits: number;       // Meta de aciertos o rondas
  matchTimeLimit: number;          // Límite de tiempo en segundos (0 para ilimitado)
  botDifficulty: 'EASY' | 'MEDIUM' | 'HARD'; // Dificultad del oponente IA
}

export const DEFAULT_CONFIG: GameConfig = {
  roleSwitchTime: 15,
  playerWalkSpeed: 5.0,
  playerRunSpeed: 9.0,
  playerCrouchSpeed: 2.8,
  jumpForce: 7.0,
  mouseSensitivity: 1.0,
  headBobEnabled: true,
  baseFOV: 75,
  sprintFOV: 88,
  
  maxStamina: 100,
  staminaDrainRate: 28,
  staminaRecoveryRate: 20,
  staminaRecoveryDelay: 1.0,
  
  playerMaxHealth: 100,
  arrowDamage: 50,
  arrowReloadTime: 0.45,
  arrowInitialCount: 8,
  arrowSpeed: 36,
  arrowGravity: 9.8,
  
  mazeSeed: 42,
  mazeSize: 13,
  winCondition: WinConditionType.HEALTH_ELIMINATION,
  targetScoreOrHits: 3,
  matchTimeLimit: 180,
  botDifficulty: 'MEDIUM',
};

export interface PlayerStats {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  arrows: number;
  role: PlayerRole;
  isCrouched: boolean;
  isSprinting: boolean;
  isGrounded: boolean;
  isChargingBow: boolean;
  bowChargeProgress: number; // 0 to 1
  canShoot: boolean;
  reloadProgress: number;   // 0 to 1
}

export interface MatchStats {
  elapsedTime: number;
  currentRoleTimer: number;
  roleSwitchCount: number;
  playerRole: PlayerRole;
  botRole: PlayerRole;
  playerHits: number;
  botHits: number;
  winner: 'PLAYER' | 'BOT' | 'DRAW' | string | null;
  winReason: string;
}

export type GameMode = 'SOLO_BOT' | '1v1' | '1v1v1' | 'FFA' | '2v2';

export interface MultiplayerPlayer {
  id: string;
  name: string;
  isHost: boolean;
  team: 'BLUE' | 'RED' | 'SOLO';
  color: string;
  role: PlayerRole;
  health: number;
  score: number;
  isAlive: boolean;
  ping?: number;
}

export interface LobbyRoomState {
  roomId: string;
  mode: GameMode;
  hostId: string;
  players: MultiplayerPlayer[];
  mazeSeed: number;
  mazeSize: number;
  mapShiftInterval: number; // Segundos entre cambios de mapa (0 = sin cambio dinámico)
  roleSwitchTime: number;
  isGameStarted: boolean;
}

export type NetworkPacket =
  | { type: 'JOIN_LOBBY'; player: MultiplayerPlayer }
  | { type: 'LOBBY_STATE'; state: LobbyRoomState }
  | { type: 'START_GAME'; state: LobbyRoomState }
  | {
      type: 'PLAYER_TRANSFORM';
      id: string;
      position: [number, number, number];
      rotationY: number;
      pitch: number;
      isCrouched: boolean;
      isDrawingBow: boolean;
      bowTension: number;
    }
  | {
      type: 'SHOOT_ARROW';
      id: string;
      shooterId: string;
      origin: [number, number, number];
      velocity: [number, number, number];
    }
  | {
      type: 'DOOR_TOGGLE';
      doorId: string;
      isOpen: boolean;
    }
  | {
      type: 'PLAYER_HIT';
      targetId: string;
      shooterId: string;
      damage: number;
      newHealth: number;
    }
  | {
      type: 'MAP_SHIFT';
      newSeed: number;
      message: string;
    }
  | {
      type: 'GAME_OVER';
      winnerIdOrTeam: string;
      winnerName: string;
      reason: string;
    };


export interface InteractionTarget {
  id: string;
  type: 'DOOR' | 'TRAPDOOR' | 'PASSAGE' | 'ARROW_PICKUP' | 'LEVER';
  prompt: string;
  distance: number;
}
