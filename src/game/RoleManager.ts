/**
 * Gestor del sistema de roles (Cazador / Corredor)
 * Maneja el ciclo de intercambio automático cada 15 segundos (o configurable)
 */

import { PlayerRole } from '../types';
import { audioManager } from '../audio/AudioManager';

export class RoleManager {
  private playerRole: PlayerRole = PlayerRole.HUNTER;
  private botRole: PlayerRole = PlayerRole.RUNNER;
  private switchInterval: number = 15; // Segundos por turno
  private currentTimer: number = 15;
  private switchCount: number = 0;
  private isPaused: boolean = false;
  private lastWarningSecond: number = -1;

  private onRoleSwitchCallbacks: Array<(playerRole: PlayerRole, botRole: PlayerRole, switchCount: number) => void> = [];
  private onTickCallbacks: Array<(timeRemaining: number) => void> = [];

  constructor(switchInterval: number = 15, initialPlayerRole: PlayerRole = PlayerRole.HUNTER) {
    this.switchInterval = switchInterval;
    this.currentTimer = switchInterval;
    this.playerRole = initialPlayerRole;
    this.botRole = initialPlayerRole === PlayerRole.HUNTER ? PlayerRole.RUNNER : PlayerRole.HUNTER;
  }

  public configure(switchInterval: number) {
    this.switchInterval = switchInterval;
    if (this.currentTimer > switchInterval) {
      this.currentTimer = switchInterval;
    }
  }

  public reset(initialPlayerRole: PlayerRole = PlayerRole.HUNTER) {
    this.currentTimer = this.switchInterval;
    this.playerRole = initialPlayerRole;
    this.botRole = initialPlayerRole === PlayerRole.HUNTER ? PlayerRole.RUNNER : PlayerRole.HUNTER;
    this.switchCount = 0;
    this.isPaused = false;
    this.lastWarningSecond = -1;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public update(delta: number) {
    if (this.isPaused) return;

    this.currentTimer -= delta;

    // Aviso sonoro en los últimos 3 segundos
    const ceilSec = Math.ceil(this.currentTimer);
    if (ceilSec > 0 && ceilSec <= 3 && ceilSec !== this.lastWarningSecond) {
      this.lastWarningSecond = ceilSec;
      audioManager.playRoleWarning();
    }

    if (this.currentTimer <= 0) {
      this.switchRoles();
    }

    this.onTickCallbacks.forEach(cb => cb(Math.max(0, this.currentTimer)));
  }

  public forceSwitch() {
    this.switchRoles();
  }

  private switchRoles() {
    // Intercambiar roles
    const oldPlayerRole = this.playerRole;
    this.playerRole = oldPlayerRole === PlayerRole.HUNTER ? PlayerRole.RUNNER : PlayerRole.HUNTER;
    this.botRole = oldPlayerRole === PlayerRole.HUNTER ? PlayerRole.HUNTER : PlayerRole.RUNNER;
    
    this.currentTimer = this.switchInterval;
    this.switchCount++;
    this.lastWarningSecond = -1;

    // Reproducir audio de cambio de rol
    audioManager.playRoleSwitch(this.playerRole);

    // Notificar suscriptores
    this.onRoleSwitchCallbacks.forEach(cb => cb(this.playerRole, this.botRole, this.switchCount));
  }

  public onRoleSwitch(cb: (playerRole: PlayerRole, botRole: PlayerRole, switchCount: number) => void) {
    this.onRoleSwitchCallbacks.push(cb);
  }

  public onTick(cb: (timeRemaining: number) => void) {
    this.onTickCallbacks.push(cb);
  }

  public getPlayerRole(): PlayerRole {
    return this.playerRole;
  }

  public getBotRole(): PlayerRole {
    return this.botRole;
  }

  public getTimeRemaining(): number {
    return Math.max(0, this.currentTimer);
  }

  public getSwitchInterval(): number {
    return this.switchInterval;
  }

  public getSwitchCount(): number {
    return this.switchCount;
  }

  public isPlayerHunter(): boolean {
    return this.playerRole === PlayerRole.HUNTER;
  }
}
