/**
 * ============================================================================
 * AURA ARCADE — ULTRA-SMOOTH FLAPPY BIRD ENGINE (js/games/flappyBird.js)
 * ----------------------------------------------------------------------------
 * Fixes:
 * - Hover Mode on start: Bird hovers gently in mid-air until player first flaps
 * - Ultra-gentle gravity (0.18) & capped max fall speed (4.0px)
 * - Relaxed pipe speed (1.8px/frame) and wide 185px gap
 * ============================================================================
 */

class FlappyBirdGame {
    constructor(canvas, onScoreUpdate, onGameOver) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScoreUpdate = onScoreUpdate;
        this.onGameOver = onGameOver;

        this.width = canvas.width;
        this.height = canvas.height;

        this.isRunning = false;
        this.isGameOver = false;
        this.hasStartedFlapping = false; // Hover state flag
        this.score = 0;
        this.tickCounter = 0;

        // Ultra-smooth floaty bird physics
        this.bird = {
            x: 140,
            y: this.height / 2,
            radius: 16,
            velocity: 0,
            gravity: 0.18,      // Ultra-gentle gravity
            jumpForce: -5.2,     // Soft, gentle flap
            maxFallSpeed: 4.0,   // Capped terminal fall speed
            rotation: 0,
            wingAngle: 0
        };

        this.particles = [];
        this.pipes = [];
        this.pipeWidth = 64;
        this.pipeGap = 185;       // Wide gap for easy passage
        this.pipeSpeed = 1.8;     // Slower pipe scrolling
        this.spawnTimer = 0;

        this.animId = null;
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    start() {
        this.bird.y = this.height / 2;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.bird.wingAngle = 0;

        this.pipes = [];
        this.particles = [];
        this.spawnTimer = 0;
        this.score = 0;
        this.tickCounter = 0;

        this.isRunning = true;
        this.isGameOver = false;
        this.hasStartedFlapping = false; // Start in Hover Mode

        this.onScoreUpdate(this.score);

        window.removeEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keydown', this.handleKeyDown);

        this.loop();
    }

    flap() {
        if (this.isGameOver) return;
        if (!this.isRunning) {
            this.start();
            return;
        }

        // First flap activates active physics & pipe movement
        this.hasStartedFlapping = true;
        this.bird.velocity = this.bird.jumpForce;

        if (window.audioEngine) window.audioEngine.playJump();

        // Particle burst
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.bird.x - 10,
                y: this.bird.y + (Math.random() * 10 - 5),
                vx: -Math.random() * 2 - 1,
                vy: Math.random() * 2 - 1,
                life: 1.0,
                color: '#f59e0b'
            });
        }
    }

    handleKeyDown(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            this.flap();
        }
    }

    loop() {
        if (!this.isRunning) return;
        this.tickCounter++;

        this.update();
        this.render();

        if (!this.isGameOver) {
            this.animId = requestAnimationFrame(() => this.loop());
        }
    }

    update() {
        // HOVER MODE: If player hasn't pressed Space yet, hover gently in place
        if (!this.hasStartedFlapping) {
            this.bird.y = (this.height / 2) + Math.sin(this.tickCounter * 0.08) * 8;
            this.bird.wingAngle = Math.sin(this.tickCounter * 0.2) * 0.5;
            return;
        }

        // Active Gravity & Physics
        this.bird.velocity += this.bird.gravity;
        if (this.bird.velocity > this.bird.maxFallSpeed) {
            this.bird.velocity = this.bird.maxFallSpeed;
        }
        this.bird.y += this.bird.velocity;

        // Rotation & Wing Animation
        this.bird.rotation = Math.min(Math.PI / 6, Math.max(-Math.PI / 6, this.bird.velocity * 0.06));
        this.bird.wingAngle = Math.sin(this.tickCounter * 0.2) * 0.5;

        // Ceiling & Floor Collision
        if (this.bird.y - this.bird.radius <= 0 || this.bird.y + this.bird.radius >= this.height) {
            this.triggerGameOver();
            return;
        }

        // Particles
        if (this.tickCounter % 5 === 0) {
            this.particles.push({
                x: this.bird.x - 12,
                y: this.bird.y,
                vx: -1.0,
                vy: (Math.random() - 0.5) * 0.3,
                life: 0.8,
                color: 'rgba(245, 158, 11, 0.5)'
            });
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.03;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Spawn Pipes
        this.spawnTimer++;
        if (this.spawnTimer > 120) {
            this.spawnTimer = 0;
            const minHeight = 60;
            const maxHeight = this.height - this.pipeGap - minHeight;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

            this.pipes.push({
                x: this.width,
                topHeight: topHeight,
                bottomY: topHeight + this.pipeGap,
                passed: false
            });
        }

        // Move Pipes & Collision Check
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const p = this.pipes[i];
            p.x -= this.pipeSpeed;

            if (!p.passed && p.x + this.pipeWidth < this.bird.x) {
                p.passed = true;
                this.score++;
                this.onScoreUpdate(this.score);
                if (window.audioEngine) window.audioEngine.playScore();
            }

            // Box Collision
            if (this.bird.x + this.bird.radius > p.x && this.bird.x - this.bird.radius < p.x + this.pipeWidth) {
                if (this.bird.y - this.bird.radius < p.topHeight || this.bird.y + this.bird.radius > p.bottomY) {
                    this.triggerGameOver();
                    return;
                }
            }

            if (p.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
    }

    triggerGameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        if (window.audioEngine) window.audioEngine.playGameOver();
        this.onGameOver(this.score);
    }

    render() {
        // Sky Background
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        skyGrad.addColorStop(0, '#0b132b');
        skyGrad.addColorStop(0.6, '#1c2541');
        skyGrad.addColorStop(1, '#3a506b');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Parallax Mountains
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height);
        this.ctx.lineTo(120, this.height - 120);
        this.ctx.lineTo(240, this.height);
        this.ctx.lineTo(400, this.height - 160);
        this.ctx.lineTo(580, this.height);
        this.ctx.lineTo(720, this.height - 100);
        this.ctx.lineTo(this.width, this.height);
        this.ctx.fill();

        // Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = Math.max(0, p.life);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;

        // Render Pipes
        this.pipes.forEach(p => {
            const pipeGrad = this.ctx.createLinearGradient(p.x, 0, p.x + this.pipeWidth, 0);
            pipeGrad.addColorStop(0, '#059669');
            pipeGrad.addColorStop(0.3, '#10b981');
            pipeGrad.addColorStop(0.8, '#047857');
            pipeGrad.addColorStop(1, '#064e3b');

            this.ctx.fillStyle = pipeGrad;

            // Top Pipe
            this.ctx.fillRect(p.x, 0, this.pipeWidth, p.topHeight);
            this.ctx.fillRect(p.x - 4, p.topHeight - 20, this.pipeWidth + 8, 20);

            // Bottom Pipe
            const bottomHeight = this.height - p.bottomY;
            this.ctx.fillRect(p.x, p.bottomY, this.pipeWidth, bottomHeight);
            this.ctx.fillRect(p.x - 4, p.bottomY, this.pipeWidth + 8, 20);

            // Borders
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(p.x - 4, p.topHeight - 20, this.pipeWidth + 8, 20);
            this.ctx.strokeRect(p.x - 4, p.bottomY, this.pipeWidth + 8, 20);
        });

        // Hover Prompt Text when in Hover Mode
        if (!this.hasStartedFlapping) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            this.ctx.font = 'bold 18px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PRESS SPACEBAR OR TAP TO FLAP', this.width / 2, this.height / 2 + 70);
        }

        // Render Bird
        this.ctx.save();
        this.ctx.translate(this.bird.x, this.bird.y);
        this.ctx.rotate(this.bird.rotation);

        const birdGrad = this.ctx.createRadialGradient(-2, -2, 2, 0, 0, this.bird.radius);
        birdGrad.addColorStop(0, '#fde047');
        birdGrad.addColorStop(0.7, '#f59e0b');
        birdGrad.addColorStop(1, '#d97706');
        this.ctx.fillStyle = birdGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.bird.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Wing
        this.ctx.save();
        this.ctx.rotate(this.bird.wingAngle);
        this.ctx.fillStyle = '#facc15';
        this.ctx.beginPath();
        this.ctx.ellipse(-6, 2, 10, 6, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // Eye
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(6, -6, 5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#0f172a';
        this.ctx.beginPath();
        this.ctx.arc(7, -6, 2.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Beak
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.moveTo(10, -2);
        this.ctx.lineTo(20, 3);
        this.ctx.lineTo(10, 8);
        this.ctx.fill();

        this.ctx.restore();
    }

    stop() {
        this.isRunning = false;
        if (this.animId) cancelAnimationFrame(this.animId);
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}

window.FlappyBirdGame = FlappyBirdGame;
