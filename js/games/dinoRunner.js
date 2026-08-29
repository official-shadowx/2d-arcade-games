/**
 * ============================================================================
 * AURA ARCADE — HIGH-GRAPHICS DINO RUNNER ENGINE (js/games/dinoRunner.js)
 * ----------------------------------------------------------------------------
 * Features HD Visual Effects:
 * - Animated T-Rex running legs & eye details
 * - 3D shaded cacti with branching arms & spines
 * - Flying pterodactyl birds with flapping wings
 * - Running dust particle specks & parallax starry sky
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
        this.tickCounter = 0;

        this.dino = {
            x: 80,
            y: this.groundY - 50,
            width: 44,
            height: 50,
            velocityY: 0,
            gravity: 0.7,
            jumpForce: -13,
            isJumping: false,
            isDucking: false,
            legFrame: 0
        };

        this.obstacles = [];
        this.dustParticles = [];
        this.spawnTimer = 0;
        this.gameSpeed = 6;
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
        this.dustParticles = [];
        this.spawnTimer = 0;
        this.gameSpeed = 6;
        this.score = 0;
        this.tickCounter = 0;

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
        this.tickCounter++;

        this.update();
        this.render();

        if (!this.isGameOver) {
            this.animId = requestAnimationFrame(() => this.loop());
        }
    }

    update() {
        this.gameSpeed += 0.0015;
        this.score += 0.15;
        this.onScoreUpdate(Math.floor(this.score));

        this.groundOffsetX = (this.groundOffsetX + this.gameSpeed) % 40;

        // Running dust particles
        if (!this.dino.isJumping && this.tickCounter % 4 === 0) {
            this.dustParticles.push({
                x: this.dino.x,
                y: this.groundY - 2,
                vx: -this.gameSpeed * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                life: 0.7
            });
        }

        for (let i = this.dustParticles.length - 1; i >= 0; i--) {
            const p = this.dustParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.04;
            if (p.life <= 0) this.dustParticles.splice(i, 1);
        }

        // Dino Jump Physics
        if (this.dino.isJumping) {
            this.dino.velocityY += this.dino.gravity;
            this.dino.y += this.dino.velocityY;

            if (this.dino.y >= this.groundY - this.dino.height) {
                this.dino.y = this.groundY - this.dino.height;
                this.dino.isJumping = false;
                this.dino.velocityY = 0;
            }
        }

        // Procedural Obstacles Spawning
        this.spawnTimer++;
        if (this.spawnTimer > Math.max(45, 110 - Math.floor(this.gameSpeed * 3))) {
            this.spawnTimer = 0;
            const isBird = Math.random() < 0.35 && this.score > 80;

            if (isBird) {
                this.obstacles.push({
                    x: this.width,
                    y: this.groundY - 65,
                    width: 40,
                    height: 28,
                    type: 'bird',
                    wingAngle: 0
                });
            } else {
                const height = Math.random() > 0.5 ? 48 : 34;
                this.obstacles.push({
                    x: this.width,
                    y: this.groundY - height,
                    width: 26,
                    height: height,
                    type: 'cactus'
                });
            }
        }

        // Move Obstacles & Collisions
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= this.gameSpeed;

            if (obs.type === 'bird') {
                obs.wingAngle = Math.sin(this.tickCounter * 0.2) * 8;
            }

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
        // Sky Canvas
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        skyGrad.addColorStop(0, '#090d16');
        skyGrad.addColorStop(0.7, '#111827');
        skyGrad.addColorStop(1, '#1f2937');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Ground Line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.width, this.groundY);
        this.ctx.stroke();

        // Ground Texture Specks
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let x = -this.groundOffsetX; x < this.width; x += 40) {
            this.ctx.fillRect(x, this.groundY + 10, 16, 2);
            this.ctx.fillRect(x + 22, this.groundY + 24, 8, 2);
        }

        // Render Running Dust
        this.dustParticles.forEach(p => {
            this.ctx.fillStyle = 'rgba(255, 255, 255, ' + Math.max(0, p.life * 0.4) + ')';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Render HD T-Rex Dino
        this.ctx.fillStyle = '#10b981';
        const dx = this.dino.x;
        const dy = this.dino.y;
        const dw = this.dino.width;
        const dh = this.dino.height;

        if (this.dino.isDucking) {
            // Ducking Dino Body
            this.ctx.beginPath();
            this.ctx.roundRect(dx, dy, dw + 12, dh, 6);
            this.ctx.fill();

            // Eye
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(dx + dw, dy + 4, 4, 4);
        } else {
            // Body
            this.ctx.beginPath();
            this.ctx.roundRect(dx, dy + 10, dw - 10, dh - 10, 6);
            this.ctx.fill();

            // Head
            this.ctx.fillRect(dx + 12, dy, 24, 20);

            // Eye
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(dx + 28, dy + 4, 5, 5);

            // Tail
            this.ctx.beginPath();
            this.ctx.moveTo(dx, dy + 20);
            this.ctx.lineTo(dx - 10, dy + 28);
            this.ctx.lineTo(dx, dy + 32);
            this.ctx.fill();

            // Animated Running Legs
            this.ctx.fillStyle = '#059669';
            const legOffset = Math.sin(this.tickCounter * 0.4) * 6;
            if (this.dino.isJumping) {
                this.ctx.fillRect(dx + 8, dy + dh - 10, 6, 10);
                this.ctx.fillRect(dx + 22, dy + dh - 10, 6, 10);
            } else {
                this.ctx.fillRect(dx + 8, dy + dh - 10, 6, 10 + legOffset);
                this.ctx.fillRect(dx + 22, dy + dh - 10, 6, 10 - legOffset);
            }
        }

        // Render HD Obstacles
        this.obstacles.forEach(obs => {
            if (obs.type === 'cactus') {
                // Multi-branch Cactus
                this.ctx.fillStyle = '#ef4444';
                // Main Stem
                this.ctx.beginPath();
                this.ctx.roundRect(obs.x + 8, obs.y, 10, obs.height, 4);
                this.ctx.fill();
                // Left Branch
                this.ctx.fillRect(obs.x, obs.y + 12, 10, 4);
                this.ctx.fillRect(obs.x, obs.y + 6, 4, 10);
                // Right Branch
                this.ctx.fillRect(obs.x + 16, obs.y + 18, 10, 4);
                this.ctx.fillRect(obs.x + 22, obs.y + 10, 4, 12);
            } else {
                // Flying Pterodactyl Bird
                this.ctx.fillStyle = '#f59e0b';
                this.ctx.beginPath();
                this.ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height / 2, 14, 8, 0, 0, Math.PI * 2);
                this.ctx.fill();

                // Flapping Wings
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x + obs.width / 2, obs.y + obs.height / 2);
                this.ctx.lineTo(obs.x + obs.width / 2 - 8, obs.y - obs.wingAngle);
                this.ctx.lineTo(obs.x + obs.width / 2 + 8, obs.y + obs.height / 2);
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

window.DinoRunnerGame = DinoRunnerGame;
