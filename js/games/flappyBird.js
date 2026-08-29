/**
 * ============================================================================
 * AURA ARCADE — FLAPPY BIRD GAME ENGINE (js/games/flappyBird.js)
 * ----------------------------------------------------------------------------
 * Features:
 * - Gravity physics & bird velocity dynamics
 * - Procedural pipe pairs with gap generation
 * - Rectangular & circular collision math
 * - Web Audio sound FX integration
 * ============================================================================
 */

class FlappyBirdGame {
    constructor(canvas, onScoreUpdate, onGameOver) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScoreUpdate = onScoreUpdate;
        this.onGameOver = onGameOver;

        // Viewport bounds
        this.width = canvas.width;
        this.height = canvas.height;

        // Game State
        this.isRunning = false;
        this.isGameOver = false;
        this.score = 0;

        // Bird Physics Properties
        this.bird = {
            x: 120,
            y: this.height / 2,
            radius: 16,
            velocity: 0,
            gravity: 0.45,
            jumpForce: -8.5,
            rotation: 0
        };

        // Pipe System
        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 155;
        this.pipeSpeed = 2.8;
        this.spawnTimer = 0;

        // Animation frame tracker
        this.animId = null;

        // Event listener references
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    /**
     * Start / Reset Game Session
     */
    start() {
        this.bird.y = this.height / 2;
        this.bird.velocity = 0;
        this.bird.rotation = 0;

        this.pipes = [];
        this.spawnTimer = 0;
        this.score = 0;
        this.isRunning = true;
        this.isGameOver = false;

        this.onScoreUpdate(this.score);

        window.removeEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keydown', this.handleKeyDown);

        this.loop();
    }

    /**
     * Trigger Jump Flap
     */
    flap() {
        if (this.isGameOver) return;
        if (!this.isRunning) {
            this.start();
            return;
        }

        this.bird.velocity = this.bird.jumpForce;
        if (window.audioEngine) window.audioEngine.playJump();
    }

    /**
     * Keyboard Controller Handler
     */
    handleKeyDown(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            this.flap();
        }
    }

    /**
     * Main Game Loop
     */
    loop() {
        if (!this.isRunning) return;

        this.update();
        this.render();

        if (!this.isGameOver) {
            this.animId = requestAnimationFrame(() => this.loop());
        }
    }

    /**
     * Update Physics & Collisions
     */
    update() {
        // Apply Gravity to Bird
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;

        // Calculate smooth rotation angle based on velocity
        this.bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, this.bird.velocity * 0.08));

        // Ceiling & Floor Collision
        if (this.bird.y - this.bird.radius <= 0 || this.bird.y + this.bird.radius >= this.height) {
            this.triggerGameOver();
            return;
        }

        // Spawn Pipes Procedurally
        this.spawnTimer++;
        if (this.spawnTimer > 90) {
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

        // Move Pipes & Check Collisions
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const p = this.pipes[i];
            p.x -= this.pipeSpeed;

            // Score Increment
            if (!p.passed && p.x + this.pipeWidth < this.bird.x) {
                p.passed = true;
                this.score++;
                this.onScoreUpdate(this.score);
                if (window.audioEngine) window.audioEngine.playScore();
            }

            // Pipe Collision Box Detection
            if (this.bird.x + this.bird.radius > p.x && this.bird.x - this.bird.radius < p.x + this.pipeWidth) {
                if (this.bird.y - this.bird.radius < p.topHeight || this.bird.y + this.bird.radius > p.bottomY) {
                    this.triggerGameOver();
                    return;
                }
            }

            // Remove offscreen pipes
            if (p.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
    }

    /**
     * Trigger Game Over state
     */
    triggerGameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        if (window.audioEngine) window.audioEngine.playGameOver();
        this.onGameOver(this.score);
    }

    /**
     * Render Canvas Pass
     */
    render() {
        // Clear Background (Sky Blue)
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Render Clouds
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        this.ctx.beginPath();
        this.ctx.arc(100, 100, 40, 0, Math.PI * 2);
        this.ctx.arc(140, 90, 50, 0, Math.PI * 2);
        this.ctx.arc(500, 150, 60, 0, Math.PI * 2);
        this.ctx.fill();

        // Render Pipes
        this.ctx.fillStyle = '#10b981';
        this.ctx.strokeStyle = '#047857';
        this.ctx.lineWidth = 3;

        this.pipes.forEach(p => {
            // Top Pipe
            this.ctx.fillRect(p.x, 0, this.pipeWidth, p.topHeight);
            this.ctx.strokeRect(p.x, 0, this.pipeWidth, p.topHeight);

            // Bottom Pipe
            const bottomHeight = this.height - p.bottomY;
            this.ctx.fillRect(p.x, p.bottomY, this.pipeWidth, bottomHeight);
            this.ctx.strokeRect(p.x, p.bottomY, this.pipeWidth, bottomHeight);
        });

        // Render Bird Vector Graphic
        this.ctx.save();
        this.ctx.translate(this.bird.x, this.bird.y);
        this.ctx.rotate(this.bird.rotation);

        // Bird Body
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.bird.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Bird Eye
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(6, -6, 5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(7, -6, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Bird Beak
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.moveTo(10, 0);
        this.ctx.lineTo(20, 4);
        this.ctx.lineTo(10, 8);
        this.ctx.fill();

        this.ctx.restore();
    }

    /**
     * Stop Game Session
     */
    stop() {
        this.isRunning = false;
        if (this.animId) cancelAnimationFrame(this.animId);
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}

// Export to global scope
window.FlappyBirdGame = FlappyBirdGame;
