/**
 * ============================================================================
 * AURA ARCADE — REDESIGNED SPACE INVADERS ENGINE (js/games/spaceInvaders.js)
 * ----------------------------------------------------------------------------
 * Features & Architecture:
 * - Player Fighter Cannon placed firmly at bottom center
 * - Destructible Defense Shields / Bunkers for strategic cover
 * - Marching alien matrix (Top, Mid, Bot) stepping down on edge hit
 * - Player upward cyan lasers & alien downward red missiles
 * - Wave progression & score HUD
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
        this.tickCounter = 0;

        // Player Spaceship at bottom center
        this.player = {
            x: this.width / 2 - 22,
            y: this.height - 54,
            width: 44,
            height: 26,
            speed: 6.5,
            lives: 3
        };

        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.bunkers = []; // Destructible Shields
        this.shootCooldown = 0;

        this.aliens = [];
        this.alienCols = 8;
        this.alienRows = 4;
        this.alienWidth = 34;
        this.alienHeight = 24;
        this.alienDir = 1;
        this.alienSpeed = 1.0; // Smooth marching speed

        this.isRunning = false;
        this.isGameOver = false;
        this.score = 0;
        this.animId = null;

        this.keys = {};
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    start() {
        this.player.x = this.width / 2 - 22;
        this.player.y = this.height - 54;
        this.player.lives = 3;

        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.shootCooldown = 0;
        this.alienSpeed = 1.0;
        this.score = 0;
        this.tickCounter = 0;

        this.isRunning = true;
        this.isGameOver = false;

        this.onScoreUpdate(this.score);
        this.initAliens();
        this.initBunkers();

        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        this.loop();
    }

    initAliens() {
        this.aliens = [];
        const startX = 70;
        const startY = 40;

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

    initBunkers() {
        this.bunkers = [];
        const numBunkers = 4;
        const bunkerWidth = 60;
        const bunkerHeight = 24;
        const spacing = (this.width - numBunkers * bunkerWidth) / (numBunkers + 1);
        const y = this.height - 120;

        for (let i = 0; i < numBunkers; i++) {
            this.bunkers.push({
                x: spacing + i * (bunkerWidth + spacing),
                y: y,
                width: bunkerWidth,
                height: bunkerHeight,
                hp: 12 // Health points before destruction
            });
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
                height: 14,
                speed: 8.5
            });
            this.shootCooldown = 14;
            if (window.audioEngine) window.audioEngine.playShoot();
        }
    }

    spawnExplosion(x, y, color) {
        for (let i = 0; i < 14; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: color
            });
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
        if (this.shootCooldown > 0) this.shootCooldown--;

        // Player Cannon Movement
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x = Math.max(10, this.player.x - this.player.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x = Math.min(this.width - this.player.width - 10, this.player.x + this.player.speed);
        }

        // Thruster flame particles
        if (this.tickCounter % 2 === 0) {
            this.particles.push({
                x: this.player.x + this.player.width / 2 + (Math.random() * 8 - 4),
                y: this.player.y + this.player.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: Math.random() * 2 + 1,
                life: 0.6,
                color: '#38bdf8'
            });
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Move Player Upward Lasers
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.y -= b.speed;

            // Check Bunker Collision
            let hitBunker = false;
            for (let bk of this.bunkers) {
                if (bk.hp > 0 && b.x < bk.x + bk.width && b.x + b.width > bk.x && b.y < bk.y + bk.height && b.y + b.height > bk.y) {
                    bk.hp--;
                    hitBunker = true;
                    this.bullets.splice(i, 1);
                    break;
                }
            }
            if (hitBunker) continue;

            // Check Alien Collision
            for (let a of this.aliens) {
                if (a.alive && b.x < a.x + a.width && b.x + b.width > a.x && b.y < a.y + a.height && b.y + b.height > a.y) {
                    a.alive = false;
                    this.bullets.splice(i, 1);
                    this.score += 20;
                    this.onScoreUpdate(this.score);
                    this.spawnExplosion(a.x + a.width / 2, a.y + a.height / 2, a.type === 'top' ? '#f59e0b' : '#a855f7');
                    if (window.audioEngine) window.audioEngine.playHit();
                    break;
                }
            }

            if (b && b.y + b.height < 0) {
                this.bullets.splice(i, 1);
            }
        }

        // March Alien Matrix
        let edgeHit = false;
        const livingAliens = this.aliens.filter(a => a.alive);

        if (livingAliens.length === 0) {
            // Wave cleared! Respawn wave & increase speed
            this.alienSpeed += 0.35;
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
                a.y += 12;
                if (a.y + a.height >= this.player.y) {
                    this.triggerGameOver();
                }
            });
        }

        // Alien Bomb Drops
        if (Math.random() < 0.02 && livingAliens.length > 0) {
            const shooter = livingAliens[Math.floor(Math.random() * livingAliens.length)];
            this.enemyBullets.push({
                x: shooter.x + shooter.width / 2 - 2,
                y: shooter.y + shooter.height,
                width: 4,
                height: 12,
                speed: 4.2
            });
        }

        // Move Enemy Missiles Downward
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const eb = this.enemyBullets[i];
            eb.y += eb.speed;

            // Bunker Collision
            let hitBk = false;
            for (let bk of this.bunkers) {
                if (bk.hp > 0 && eb.x < bk.x + bk.width && eb.x + eb.width > bk.x && eb.y < bk.y + bk.height && eb.y + eb.height > bk.y) {
                    bk.hp--;
                    hitBk = true;
                    this.enemyBullets.splice(i, 1);
                    break;
                }
            }
            if (hitBk) continue;

            // Player Collision
            if (
                eb.x < this.player.x + this.player.width &&
                eb.x + eb.width > this.player.x &&
                eb.y < this.player.y + this.player.height &&
                eb.y + eb.height > this.player.y
            ) {
                this.enemyBullets.splice(i, 1);
                this.player.lives--;
                this.spawnExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#ef4444');
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
        // Deep Space Canvas
        this.ctx.fillStyle = '#050711';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Twinkling Starfield
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 40; i++) {
            const x = (i * 37) % this.width;
            const y = (i * 59) % this.height;
            this.ctx.fillRect(x, y, 2, 2);
        }

        // Render Destructible Bunkers / Shields
        this.bunkers.forEach(bk => {
            if (bk.hp <= 0) return;
            const alpha = bk.hp / 12;
            this.ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.roundRect(bk.x, bk.y, bk.width, bk.height, 4);
            this.ctx.fill();
        });

        // Render Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = Math.max(0, p.life);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;

        // Render Player Spaceship Cannon
        this.ctx.fillStyle = '#10b981';
        const px = this.player.x;
        const py = this.player.y;
        const pw = this.player.width;
        const ph = this.player.height;

        this.ctx.beginPath();
        this.ctx.moveTo(px + pw / 2, py);
        this.ctx.lineTo(px + pw, py + ph);
        this.ctx.lineTo(px + pw - 6, py + ph);
        this.ctx.lineTo(px + pw / 2, py + 8);
        this.ctx.lineTo(px + 6, py + ph);
        this.ctx.lineTo(px, py + ph);
        this.ctx.fill();

        // Cockpit
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.fillRect(px + pw / 2 - 3, py + 8, 6, 8);

        // Player Lives HUD
        for (let l = 0; l < this.player.lives; l++) {
            this.ctx.fillStyle = '#10b981';
            this.ctx.beginPath();
            this.ctx.moveTo(24 + l * 22, 20);
            this.ctx.lineTo(34 + l * 22, 30);
            this.ctx.lineTo(14 + l * 22, 30);
            this.ctx.fill();
        }

        // Upward Cyan Lasers
        this.ctx.fillStyle = '#38bdf8';
        this.bullets.forEach(b => {
            this.ctx.fillRect(b.x, b.y, b.width, b.height);
        });

        // Downward Red Missiles
        this.ctx.fillStyle = '#ef4444';
        this.enemyBullets.forEach(eb => {
            this.ctx.fillRect(eb.x, eb.y, eb.width, eb.height);
        });

        // HD Animated Aliens Matrix
        const legFrame = Math.sin(this.tickCounter * 0.15) > 0;

        this.aliens.forEach(a => {
            if (!a.alive) return;

            if (a.type === 'top') this.ctx.fillStyle = '#f59e0b';
            else if (a.type === 'mid') this.ctx.fillStyle = '#a855f7';
            else this.ctx.fillStyle = '#ec4899';

            this.ctx.beginPath();
            this.ctx.roundRect(a.x, a.y, a.width, a.height - 4, 4);
            this.ctx.fill();

            // Eyes
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(a.x + 6, a.y + 6, 4, 4);
            this.ctx.fillRect(a.x + a.width - 10, a.y + 6, 4, 4);

            // Animated Tentacle Legs
            if (legFrame) {
                this.ctx.fillRect(a.x + 4, a.y + a.height - 4, 4, 6);
                this.ctx.fillRect(a.x + a.width - 8, a.y + a.height - 4, 4, 6);
            } else {
                this.ctx.fillRect(a.x + 8, a.y + a.height - 4, 4, 6);
                this.ctx.fillRect(a.x + a.width - 12, a.y + a.height - 4, 4, 6);
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

window.SpaceInvadersGame = SpaceInvadersGame;
