/**
 * ============================================================================
 * AURA ARCADE — CHROME DINO RUNNER GAME ENGINE (js/games/dinoRunner.js)
 * ----------------------------------------------------------------------------
 * Features:
 * - Jump & duck gravity physics
 * - Procedural cactus & flying bird obstacle spawning
 * - Continuous speed acceleration scaling
 * - Web Audio sound FX integration
 * ============================================================================
 */

class DinoRunnerGame {
    constructor(canvas, onScoreUpdate, onGameOver) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScoreUpdate = onScoreUpdate;
        this.onGameOver = onGameOver;

        this.width = canvas.width;
        this.height = canvas.height;

        this.groundY = this.height - 60;

        // Dino Physics Properties
        this.dino = {
            x: 80,
            y: this.groundY - 50,
            width: 44,
            height: 50,
            velocityY: 0,
            gravity: 0.7,
            jumpForce: -13,
            isJumping: false,
            isDucking: false
        };

        // Obstacles Array (Cacti & Birds)
        this.obstacles = [];
        this.spawnTimer = 0;
        this.gameSpeed = 6;

        // Ground parallax offset
        this.groundOffsetX = 0;

        this.isRunning = false;
        this.isGameOver = false;
        this.score = 0;
        this.animId = null;

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    start() {
        this.dino.y = this.groundY - 50;
        this.dino.height = 50;
        this.dino.velocityY = 0;
        this.dino.isJumping = false;
        this.dino.isDucking = false;

        this.obstacles = [];
        this.spawnTimer = 0;
        this.gameSpeed = 6;
        this.score = 0;

        this.isRunning = true;
        this.isGameOver = false;

        this.onScoreUpdate(this.score);

        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        this.loop();
    }

    jump() {
        if (!this.dino.isJumping && !this.isGameOver) {
            this.dino.velocityY = this.dino.jumpForce;
            this.dino.isJumping = true;
            if (window.audioEngine) window.audioEngine.playJump();
        }
    }

    duck(isDucking) {
        if (this.dino.isJumping) return;
        this.dino.isDucking = isDucking;
        if (isDucking) {
            this.dino.height = 28;
            this.dino.y = this.groundY - 28;
        } else {
            this.dino.height = 50;
            this.dino.y = this.groundY - 50;
        }
    }

    handleKeyDown(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            e.preventDefault();
            this.jump();
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            e.preventDefault();
            this.duck(true);
        }
    }

    handleKeyUp(e) {
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            this.duck(false);
        }
    }

    loop() {
        if (!this.isRunning) return;

        this.update();
        this.render();

        if (!this.isGameOver) {
            this.animId = requestAnimationFrame(() => this.loop());
        }
    }

    update() {
        // Speed Scaling over time
        this.gameSpeed += 0.0015;

        // Score Increment based on distance
        this.score += 0.15;
        this.onScoreUpdate(Math.floor(this.score));

        // Ground scrolling
        this.groundOffsetX = (this.groundOffsetX + this.gameSpeed) % 40;

        // Dino Gravity & Jump Update
        if (this.dino.isJumping) {
            this.dino.velocityY += this.dino.gravity;
            this.dino.y += this.dino.velocityY;

            if (this.dino.y >= this.groundY - this.dino.height) {
                this.dino.y = this.groundY - this.dino.height;
                this.dino.isJumping = false;
                this.dino.velocityY = 0;
            }
        }

        // Procedural Obstacle Spawning
        this.spawnTimer++;
        if (this.spawnTimer > Math.max(50, 110 - Math.floor(this.gameSpeed * 3))) {
            this.spawnTimer = 0;

            const isBird = Math.random() < 0.3 && this.score > 100;
            if (isBird) {
                // Pterodactyl Bird Obstacle
                this.obstacles.push({
                    x: this.width,
                    y: this.groundY - 65,
                    width: 38,
                    height: 26,
                    type: 'bird'
                });
            } else {
                // Cactus Obstacle
                const height = Math.random() > 0.5 ? 45 : 32;
                this.obstacles.push({
                    x: this.width,
                    y: this.groundY - height,
                    width: 24,
                    height: height,
                    type: 'cactus'
                });
            }
        }

        // Move Obstacles & Check Collisions
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= this.gameSpeed;

            // AABB Collision Detection
            if (
                this.dino.x < obs.x + obs.width &&
                this.dino.x + this.dino.width > obs.x &&
                this.dino.y < obs.y + obs.height &&
                this.dino.y + this.dino.height > obs.y
            ) {
                this.triggerGameOver();
                return;
            }

            if (obs.x + obs.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
    }

    triggerGameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        if (window.audioEngine) window.audioEngine.playGameOver();
        this.onGameOver(Math.floor(this.score));
    }

    render() {
        // Clear Canvas
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Render Ground Line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.width, this.groundY);
        this.ctx.stroke();

        // Render Ground Dots Parallax
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let x = -this.groundOffsetX; x < this.width; x += 40) {
            this.ctx.fillRect(x, this.groundY + 12, 16, 2);
            this.ctx.fillRect(x + 20, this.groundY + 28, 8, 2);
        }

        // Render Dino Sprite
        this.ctx.fillStyle = '#10b981';
        if (this.dino.isDucking) {
            // Ducking Dino
            this.ctx.fillRect(this.dino.x, this.dino.y, this.dino.width + 10, this.dino.height);
        } else {
            // Standing / Jumping Dino
            this.ctx.fillRect(this.dino.x, this.dino.y, this.dino.width, this.dino.height);
            // Dino Head Eye
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(this.dino.x + 28, this.dino.y + 6, 6, 6);
        }

        // Render Obstacles
        this.obstacles.forEach(obs => {
            if (obs.type === 'cactus') {
                this.ctx.fillStyle = '#ef4444';
                this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            } else {
                // Flying Bird
                this.ctx.fillStyle = '#f59e0b';
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x, obs.y + obs.height / 2);
                this.ctx.lineTo(obs.x + obs.width / 2, obs.y);
                this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height / 2);
                this.ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
                this.ctx.fill();
            }
        });
    }

    stop() {
        this.isRunning = false;
        if (this.animId) cancelAnimationFrame(this.animId);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}

// Export to global scope
window.DinoRunnerGame = DinoRunnerGame;
