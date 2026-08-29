/**
 * ============================================================================
 * AURA ARCADE — SPACE INVADERS GAME ENGINE (js/games/spaceInvaders.js)
 * ----------------------------------------------------------------------------
 * Features:
 * - Player spaceship laser shooting array management
 * - Alien wave matrix formation movement & direction drops
 * - Enemy bomb drops & player lives system
 * - Web Audio sound FX integration
 * ============================================================================
 */

class SpaceInvadersGame {
    constructor(canvas, onScoreUpdate, onGameOver) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScoreUpdate = onScoreUpdate;
        this.onGameOver = onGameOver;

        this.width = canvas.width;
        this.height = canvas.height;

        // Player Spaceship Properties
        this.player = {
            x: this.width / 2 - 20,
            y: this.height - 50,
            width: 40,
            height: 24,
            speed: 6,
            lives: 3
        };

        // Bullet Arrays
        this.bullets = [];
        this.enemyBullets = [];
        this.shootCooldown = 0;

        // Alien Matrix System
        this.aliens = [];
        this.alienCols = 8;
        this.alienRows = 4;
        this.alienWidth = 32;
        this.alienHeight = 24;
        this.alienDir = 1; // 1 = right, -1 = left
        this.alienSpeed = 1.2;

        this.isRunning = false;
        this.isGameOver = false;
        this.score = 0;
        this.animId = null;

        this.keys = {};
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    start() {
        this.player.x = this.width / 2 - 20;
        this.player.lives = 3;

        this.bullets = [];
        this.enemyBullets = [];
        this.shootCooldown = 0;
        this.score = 0;

        this.isRunning = true;
        this.isGameOver = false;

        this.onScoreUpdate(this.score);
        this.initAliens();

        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        this.loop();
    }

    initAliens() {
        this.aliens = [];
        const startX = 60;
        const startY = 50;

        for (let r = 0; r < this.alienRows; r++) {
            for (let c = 0; c < this.alienCols; c++) {
                this.aliens.push({
                    x: startX + c * (this.alienWidth + 24),
                    y: startY + r * (this.alienHeight + 18),
                    width: this.alienWidth,
                    height: this.alienHeight,
                    alive: true,
                    type: r === 0 ? 'top' : (r < 3 ? 'mid' : 'bot')
                });
            }
        }
    }

    handleKeyDown(e) {
        this.keys[e.code] = true;
        if (e.code === 'Space') {
            e.preventDefault();
            this.shoot();
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    shoot() {
        if (this.shootCooldown <= 0 && this.isRunning && !this.isGameOver) {
            this.bullets.push({
                x: this.player.x + this.player.width / 2 - 2,
                y: this.player.y,
                width: 4,
                height: 12,
                speed: 8
            });
            this.shootCooldown = 15;
            if (window.audioEngine) window.audioEngine.playShoot();
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
        if (this.shootCooldown > 0) this.shootCooldown--;

        // Move Player Spaceship (A/D or Left/Right)
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x = Math.max(10, this.player.x - this.player.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x = Math.min(this.width - this.player.width - 10, this.player.x + this.player.speed);
        }

        // Move Player Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.y -= b.speed;

            // Check Bullet-Alien Collision
            for (let a of this.aliens) {
                if (a.alive && b.x < a.x + a.width && b.x + b.width > a.x && b.y < a.y + a.height && b.y + b.height > a.y) {
                    a.alive = false;
                    this.bullets.splice(i, 1);
                    this.score += 20;
                    this.onScoreUpdate(this.score);
                    if (window.audioEngine) window.audioEngine.playHit();
                    break;
                }
            }

            if (b && b.y + b.height < 0) {
                this.bullets.splice(i, 1);
            }
        }

        // Move Aliens Matrix
        let edgeHit = false;
        const livingAliens = this.aliens.filter(a => a.alive);

        if (livingAliens.length === 0) {
            // Respawn wave & increase speed
            this.alienSpeed += 0.4;
            this.initAliens();
            return;
        }

        livingAliens.forEach(a => {
            a.x += this.alienDir * this.alienSpeed;
            if (a.x <= 15 || a.x + a.width >= this.width - 15) {
                edgeHit = true;
            }
        });

        if (edgeHit) {
            this.alienDir *= -1;
            livingAliens.forEach(a => {
                a.y += 14;
                if (a.y + a.height >= this.player.y) {
                    this.triggerGameOver();
                }
            });
        }

        // Random Alien Bomb Drops
        if (Math.random() < 0.02 && livingAliens.length > 0) {
            const shooter = livingAliens[Math.floor(Math.random() * livingAliens.length)];
            this.enemyBullets.push({
                x: shooter.x + shooter.width / 2 - 2,
                y: shooter.y + shooter.height,
                width: 4,
                height: 10,
                speed: 4.5
            });
        }

        // Move Enemy Bullets & Check Player Collision
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const eb = this.enemyBullets[i];
            eb.y += eb.speed;

            if (
                eb.x < this.player.x + this.player.width &&
                eb.x + eb.width > this.player.x &&
                eb.y < this.player.y + this.player.height &&
                eb.y + eb.height > this.player.y
            ) {
                this.enemyBullets.splice(i, 1);
                this.player.lives--;
                if (window.audioEngine) window.audioEngine.playHit();

                if (this.player.lives <= 0) {
                    this.triggerGameOver();
                    return;
                }
            } else if (eb.y > this.height) {
                this.enemyBullets.splice(i, 1);
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
        // Clear Deep Space Canvas
        this.ctx.fillStyle = '#060810';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Render Background Stars
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 30; i++) {
            const x = (i * 37) % this.width;
            const y = (i * 59) % this.height;
            this.ctx.fillRect(x, y, 2, 2);
        }

        // Render Player Ship (Emerald Vector)
        this.ctx.fillStyle = '#10b981';
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y);
        this.ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
        this.ctx.fill();

        // Render Player Lives HUD
        for (let l = 0; l < this.player.lives; l++) {
            this.ctx.fillStyle = '#10b981';
            this.ctx.fillRect(20 + l * 20, 20, 14, 10);
        }

        // Render Player Bullets (Cyan Lasers)
        this.ctx.fillStyle = '#38bdf8';
        this.bullets.forEach(b => {
            this.ctx.fillRect(b.x, b.y, b.width, b.height);
        });

        // Render Enemy Bullets (Red Missiles)
        this.ctx.fillStyle = '#ef4444';
        this.enemyBullets.forEach(eb => {
            this.ctx.fillRect(eb.x, eb.y, eb.width, eb.height);
        });

        // Render Aliens Matrix
        this.aliens.forEach(a => {
            if (!a.alive) return;

            if (a.type === 'top') this.ctx.fillStyle = '#f59e0b';
            else if (a.type === 'mid') this.ctx.fillStyle = '#a855f7';
            else this.ctx.fillStyle = '#ec4899';

            this.ctx.fillRect(a.x, a.y, a.width, a.height);

            // Alien Eyes
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(a.x + 6, a.y + 6, 4, 4);
            this.ctx.fillRect(a.x + a.width - 10, a.y + 6, 4, 4);
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
window.SpaceInvadersGame = SpaceInvadersGame;
