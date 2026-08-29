/**
 * ============================================================================
 * AURA ARCADE — SIMPLIFIED & BALANCED SPACE INVADERS (js/games/spaceInvaders.js)
 * ----------------------------------------------------------------------------
 * Fixes:
 * - Reduced alien fleet count (12 aliens: 2 rows x 6 cols) for clear spacial visibility
 * - Relaxed marching speed (0.6px/frame)
 * - Clear bottom player cannon with 4 destructible shields & fast laser cannons
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

        // Player Cannon at Bottom Center
        this.player = {
            x: this.width / 2 - 24,
            y: this.height - 54,
            width: 48,
            height: 28,
            speed: 7.0,
            lives: 3
        };

        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.bunkers = [];
        this.shootCooldown = 0;

        // Simplified Alien Fleet (2 rows x 6 cols = 12 total aliens)
        this.aliens = [];
        this.alienCols = 6;
        this.alienRows = 2;
        this.alienWidth = 40;
        this.alienHeight = 28;
        this.alienDir = 1;
        this.alienSpeed = 0.6; // Relaxed marching speed

        this.isRunning = false;
        this.isGameOver = false;
        this.score = 0;
        this.animId = null;

        this.keys = {};
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    start() {
        this.player.x = this.width / 2 - 24;
        this.player.y = this.height - 54;
        this.player.lives = 3;

        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.shootCooldown = 0;
        this.alienSpeed = 0.6;
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
        const spacingX = 40;
        const totalAlienWidth = this.alienCols * this.alienWidth + (this.alienCols - 1) * spacingX;
        const startX = (this.width - totalAlienWidth) / 2;
        const startY = 50;

        for (let r = 0; r < this.alienRows; r++) {
            for (let c = 0; c < this.alienCols; c++) {
                this.aliens.push({
                    x: startX + c * (this.alienWidth + spacingX),
                    y: startY + r * (this.alienHeight + 24),
                    width: this.alienWidth,
                    height: this.alienHeight,
                    alive: true,
                    type: r === 0 ? 'top' : 'bot'
                });
            }
        }
    }

    initBunkers() {
        this.bunkers = [];
        const numBunkers = 4;
        const bunkerWidth = 64;
        const bunkerHeight = 24;
        const spacing = (this.width - numBunkers * bunkerWidth) / (numBunkers + 1);
        const y = this.height - 120;

        for (let i = 0; i < numBunkers; i++) {
            this.bunkers.push({
                x: spacing + i * (bunkerWidth + spacing),
                y: y,
                width: bunkerWidth,
                height: bunkerHeight,
                hp: 12
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
                height: 16,
                speed: 10.0 // Fast laser speed
            });
            this.shootCooldown = 12;
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

        // Player Movement (A/D or Left/Right Arrow)
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x = Math.max(10, this.player.x - this.player.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x = Math.min(this.width - this.player.width - 10, this.player.x + this.player.speed);
        }

        // Auto Shooting if spacebar is held down
        if (this.keys['Space']) {
            this.shoot();
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

            // Bunker Hit
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

            // Alien Hit
            for (let a of this.aliens) {
                if (a.alive && b.x < a.x + a.width && b.x + b.width > a.x && b.y < a.y + a.height && b.y + b.height > a.y) {
                    a.alive = false;
                    this.bullets.splice(i, 1);
                    this.score += 50;
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

        // March Alien Fleet
        let edgeHit = false;
        const livingAliens = this.aliens.filter(a => a.alive);

        if (livingAliens.length === 0) {
            // Wave Cleared! Respawn next wave with speed boost
            this.alienSpeed += 0.3;
            this.initAliens();
            return;
        }

        livingAliens.forEach(a => {
            a.x += this.alienDir * this.alienSpeed;
            if (a.x <= 20 || a.x + a.width >= this.width - 20) {
                edgeHit = true;
            }
        });

        if (edgeHit) {
            this.alienDir *= -1;
            livingAliens.forEach(a => {
                a.y += 16;
                if (a.y + a.height >= this.player.y) {
                    this.triggerGameOver();
                }
            });
        }

        // Alien Bomb Drops
        if (Math.random() < 0.015 && livingAliens.length > 0) {
            const shooter = livingAliens[Math.floor(Math.random() * livingAliens.length)];
            this.enemyBullets.push({
                x: shooter.x + shooter.width / 2 - 2,
                y: shooter.y + shooter.height,
                width: 4,
                height: 12,
                speed: 4.0
            });
        }

        // Move Enemy Missiles Downward
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const eb = this.enemyBullets[i];
            eb.y += eb.speed;

            // Bunker Hit
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

            // Player Hit
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

        // Starfield
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 35; i++) {
            const x = (i * 37) % this.width;
            const y = (i * 59) % this.height;
            this.ctx.fillRect(x, y, 2, 2);
        }

        // On-Screen Control Guide Header
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.font = '12px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CONTROLS: LEFT / RIGHT ARROWS (or A/D) TO MOVE  |  SPACEBAR TO SHOOT', this.width / 2, 20);

        // Destructible Bunkers / Shields
        this.bunkers.forEach(bk => {
            if (bk.hp <= 0) return;
            const alpha = bk.hp / 12;
            this.ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.roundRect(bk.x, bk.y, bk.width, bk.height, 4);
            this.ctx.fill();
        });

        // Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = Math.max(0, p.life);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;

        // Player Spaceship Cannon
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

        // Lives HUD Icons
        for (let l = 0; l < this.player.lives; l++) {
            this.ctx.fillStyle = '#10b981';
            this.ctx.beginPath();
            this.ctx.moveTo(24 + l * 22, 35);
            this.ctx.lineTo(34 + l * 22, 45);
            this.ctx.lineTo(14 + l * 22, 45);
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

        // HD Aliens
        const legFrame = Math.sin(this.tickCounter * 0.15) > 0;

        this.aliens.forEach(a => {
            if (!a.alive) return;

            this.ctx.fillStyle = a.type === 'top' ? '#f59e0b' : '#a855f7';

            this.ctx.beginPath();
            this.ctx.roundRect(a.x, a.y, a.width, a.height - 4, 4);
            this.ctx.fill();

            // Eyes
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(a.x + 8, a.y + 6, 5, 5);
            this.ctx.fillRect(a.x + a.width - 13, a.y + 6, 5, 5);

            // Legs
            this.ctx.fillStyle = a.type === 'top' ? '#f59e0b' : '#a855f7';
            if (legFrame) {
                this.ctx.fillRect(a.x + 6, a.y + a.height - 4, 5, 6);
                this.ctx.fillRect(a.x + a.width - 11, a.y + a.height - 4, 5, 6);
            } else {
                this.ctx.fillRect(a.x + 10, a.y + a.height - 4, 5, 6);
                this.ctx.fillRect(a.x + a.width - 15, a.y + a.height - 4, 5, 6);
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
