/**
 * Simple sound manager using Web Audio API
 * Uses synthesized sounds (no audio files needed)
 */
export class SoundManager {
  private context: AudioContext | null = null;
  private masterVolume: number = 0.3;
  private enabled: boolean = true;
  
  constructor() {
    // Lazy init on first interaction (browser requirement)
  }
  
  private initContext(): void {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }
  
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  public setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * Play a simple tone
   */
  private playTone(
    frequency: number, 
    duration: number, 
    type: OscillatorType = 'square',
    volume: number = 1
  ): void {
    if (!this.enabled) return;
    
    try {
      this.initContext();
      if (!this.context) return;
      
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);
      
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      
      const finalVolume = this.masterVolume * volume;
      gainNode.gain.setValueAtTime(finalVolume, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
      
      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + duration);
    } catch (e) {
      // Silently fail if audio isn't available
    }
  }
  
  /**
   * Attack/swing sound
   */
  public playAttack(): void {
    this.playTone(200, 0.1, 'sawtooth', 0.5);
    setTimeout(() => this.playTone(150, 0.05, 'square', 0.3), 50);
  }
  
  /**
   * Hit/impact sound
   */
  public playHit(): void {
    this.playTone(300, 0.08, 'square', 0.6);
    this.playTone(200, 0.1, 'sawtooth', 0.4);
  }
  
  /**
   * Enemy death sound
   */
  public playDeath(): void {
    this.playTone(400, 0.1, 'square', 0.5);
    setTimeout(() => this.playTone(300, 0.1, 'square', 0.4), 50);
    setTimeout(() => this.playTone(200, 0.15, 'sawtooth', 0.3), 100);
  }
  
  /**
   * Player hurt sound
   */
  public playHurt(): void {
    this.playTone(150, 0.15, 'sawtooth', 0.5);
  }
  
  /**
   * Wave complete sound
   */
  public playWaveComplete(): void {
    this.playTone(400, 0.1, 'sine', 0.4);
    setTimeout(() => this.playTone(500, 0.1, 'sine', 0.4), 100);
    setTimeout(() => this.playTone(600, 0.2, 'sine', 0.5), 200);
  }
  
  /**
   * Button/UI click sound
   */
  public playClick(): void {
    this.playTone(800, 0.05, 'sine', 0.2);
  }
}

// Singleton instance
let soundManagerInstance: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
  }
  return soundManagerInstance;
}
