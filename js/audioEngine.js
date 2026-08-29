/**
 * ============================================================================
 * AURA ARCADE — WEB AUDIO API SOUND SYNTHESIZER (js/audioEngine.js)
 * ----------------------------------------------------------------------------
 * Dynamically synthesizes retro arcade sound effects in real time using the
 * Web Audio API (oscillators, gain envelopes, noise buffers):
 * - Jump / Flap sound
 * - Laser Shoot sound
 * - Bounce sound
 * - Score / Pickup sound
 * - Hit / Explosion sound
 * - Game Over sound
 * ============================================================================
 */

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    /**
     * Initialize AudioContext on first user gesture to satisfy browser autoplay policy
     */
    initCtx() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Jump / Flap Sound FX (Pitch sweep upwards)
     */
    playJump() {
        if (this.muted) return;
        this.initCtx();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    /**
     * Laser Shoot Sound FX (Fast frequency drop)
     */
    playShoot() {
        if (this.muted) return;
        this.initCtx();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    /**
     * Paddle / Wall Bounce Sound FX
     */
    playBounce() {
        if (this.muted) return;
        this.initCtx();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    /**
     * Score / Food Pickup Sound FX (Two-tone ascending chime)
     */
    playScore() {
        if (this.muted) return;
        this.initCtx();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.1);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain2.gain.setValueAtTime(0.25, now + 0.08);
        gain2.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.2);
    }

    /**
     * Hit / Explosion Sound FX (Noise buffer)
     */
    playHit() {
        if (this.muted) return;
        this.initCtx();
        if (!this.ctx) return;

        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.15);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        whiteNoise.start();
    }

    /**
     * Game Over Sound FX (Descending minor triad)
     */
    playGameOver() {
        if (this.muted) return;
        this.initCtx();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [400, 350, 300, 220];

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);

            gain.gain.setValueAtTime(0.3, now + idx * 0.12);
            gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.12 + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.15);
        });
    }
}

// Export singleton instance
window.audioEngine = new AudioEngine();
