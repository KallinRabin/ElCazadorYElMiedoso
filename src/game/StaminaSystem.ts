/**
 * Sistema de gestión de stamina para el jugador
 */

export class StaminaSystem {
  private currentStamina: number;
  private maxStamina: number;
  private drainRate: number;
  private recoveryRate: number;
  private recoveryDelay: number;
  private delayTimer: number = 0;
  private isExhausted: boolean = false;

  constructor(maxStamina: number = 100, drainRate: number = 28, recoveryRate: number = 20, recoveryDelay: number = 1.0) {
    this.maxStamina = maxStamina;
    this.currentStamina = maxStamina;
    this.drainRate = drainRate;
    this.recoveryRate = recoveryRate;
    this.recoveryDelay = recoveryDelay;
  }

  public configure(maxStamina: number, drainRate: number, recoveryRate: number, recoveryDelay: number) {
    this.maxStamina = maxStamina;
    this.drainRate = drainRate;
    this.recoveryRate = recoveryRate;
    this.recoveryDelay = recoveryDelay;
    this.currentStamina = Math.min(this.currentStamina, maxStamina);
  }

  public update(delta: number, isSprinting: boolean, isMoving: boolean): { canSprint: boolean } {
    if (isSprinting && isMoving && !this.isExhausted) {
      // Consumir stamina
      this.currentStamina -= this.drainRate * delta;
      this.delayTimer = this.recoveryDelay;

      if (this.currentStamina <= 0) {
        this.currentStamina = 0;
        this.isExhausted = true; // Agotado, no puede correr hasta recuperar un mínimo
      }
    } else {
      // Recuperar stamina tras el delay
      if (this.delayTimer > 0) {
        this.delayTimer -= delta;
      } else {
        this.currentStamina += this.recoveryRate * delta;
        if (this.currentStamina > this.maxStamina) {
          this.currentStamina = this.maxStamina;
        }

        // Si estaba agotado, recupera la capacidad de correr cuando supera el 25%
        if (this.isExhausted && this.currentStamina >= this.maxStamina * 0.25) {
          this.isExhausted = false;
        }
      }
    }

    return {
      canSprint: this.currentStamina > 0 && !this.isExhausted,
    };
  }

  public consumeFixed(amount: number): boolean {
    if (this.currentStamina >= amount) {
      this.currentStamina -= amount;
      this.delayTimer = this.recoveryDelay;
      return true;
    }
    return false;
  }

  public reset() {
    this.currentStamina = this.maxStamina;
    this.delayTimer = 0;
    this.isExhausted = false;
  }

  public getCurrent(): number {
    return this.currentStamina;
  }

  public getMax(): number {
    return this.maxStamina;
  }

  public getRatio(): number {
    return this.maxStamina > 0 ? this.currentStamina / this.maxStamina : 0;
  }

  public isExhaustedState(): boolean {
    return this.isExhausted;
  }
}
