/**
 * Sistema de gestión de salud y daño
 */

export class HealthSystem {
  private currentHealth: number;
  private maxHealth: number;
  private isDead: boolean = false;
  private invulnerabilityTimer: number = 0;
  private onDamageCallbacks: Array<(amount: number, remaining: number) => void> = [];
  private onDeathCallbacks: Array<() => void> = [];

  constructor(maxHealth: number = 100) {
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
  }

  public configure(maxHealth: number) {
    this.maxHealth = maxHealth;
    this.currentHealth = Math.min(this.currentHealth, maxHealth);
  }

  public update(delta: number) {
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= delta;
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.isDead || this.invulnerabilityTimer > 0) return false;

    this.currentHealth -= amount;
    this.invulnerabilityTimer = 0.3; // Pequeño i-frame para evitar spam de daño en 1 frame

    this.onDamageCallbacks.forEach(cb => cb(amount, this.currentHealth));

    if (this.currentHealth <= 0) {
      this.currentHealth = 0;
      this.isDead = true;
      this.onDeathCallbacks.forEach(cb => cb());
    }

    return true;
  }

  public heal(amount: number) {
    if (this.isDead) return;
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
  }

  public reset() {
    this.currentHealth = this.maxHealth;
    this.isDead = false;
    this.invulnerabilityTimer = 0;
  }

  public onDamage(cb: (amount: number, remaining: number) => void) {
    this.onDamageCallbacks.push(cb);
  }

  public onDeath(cb: () => void) {
    this.onDeathCallbacks.push(cb);
  }

  public getHealth(): number {
    return this.currentHealth;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public getRatio(): number {
    return this.maxHealth > 0 ? this.currentHealth / this.maxHealth : 0;
  }

  public isAlive(): boolean {
    return !this.isDead;
  }
}
