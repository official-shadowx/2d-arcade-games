/**
 * ============================================================================
 * AURA ARCADE — HIGH-GRAPHICS PONG 2D TABLE TENNIS ENGINE (js/games/pongGame.js)
 * ----------------------------------------------------------------------------
 * Features HD Visual Effects:
 * - Glowing paddles with border highlights & metallic gradients
 * - Ball motion trail particles system
 * - Impact spark particle bursts on paddle & wall bounces
 * - Neon center net & glowing high-contrast score counters
 * ============================================================================
 */

class PongGame {
    constructor(canvas, onScoreUpdate, onGameOver) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScoreUpdate = onScoreUpdate;
        this.onGameOver = onGameOver;

        this.width = canvas.width;
        this.height = canvas.height;

        this.paddleWidth = 14;
        this.paddleHeight = 94;

        this.p1 = {
            x: 24,
            y: this.height / 2 - this.paddleHeight / 2,
            score: 0
        };

        this.p2 = {
            x: this.width - 24 - this.paddleWidth,
            y: this.height / 2 - this.paddleHeight / 2,
            score: 0
        };

        this.ball = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 9,
            vx: 5,
            vy: 3,
            speed: 6.5
        };

        this.particles = [];
        this.trail = [];

        this.isAi = true;
        this.paddleSpeed = 7.5;

        this.isRunning = false;
        this.isGameOver = false;
        this.animId = null;

        this.keys = {};
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    start(isAi = true) {
        this.isAi = isAi;
        this.p1.y = this.height / 2 - this.paddleHeight / 2;
        this.p2.y = this.height / 2 - this.paddleHeight / 2;
        this.p1.score = 0;
        this.p2.score = 0;

        this.particles = [];
        this.trail = [];

        this.resetBall(1);

        this.isRunning = true;
        this.isGameOver = false;

        this.onScoreUpdate(this.p1.score);

        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        this.loop();
    }

    resetBall(direction = 1) {
        this.ball.x = this.width / 2;
        this.ball.y = this.height / 2;
        this.ball.speed = 6.5;
        const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8);
        this.ball.vx = direction * this.ball.speed * Math.cos(angle);
        this.ball.vy = this.ball.speed * Math.sin(angle);
    }

    handleKeyDown(e) {
        this.keys[e.code] = true;
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    spawnSparks(x, y, color) {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1;
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

        this.update();
        this.render();

        if (!this.isGameOver) {
            this.animId = requestAnimationFrame(() => this.loop());
        }
    }

    update() {
        // Player 1 Paddle
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.p1.y = Math.max(0, this.p1.y - this.paddleSpeed);
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.p1.y = Math.min(this.height - this.paddleHeight, this.p1.y + this.paddleSpeed);
        }

        // AI Paddle 2
        if (this.isAi) {
            const targetY = this.ball.y - this.paddleHeight / 2;
            this.p2.y += (targetY - this.p2.y) * 0.09;
            this.p2.y = Math.max(0, Math.min(this.height - this.paddleHeight, this.p2.y));
        }

        // Add Ball Motion Trail
        this.trail.push({ x: this.ball.x, y: this.ball.y, alpha: 0.8 });
        if (this.trail.length > 8) this.trail.shift();

        // Move Ball
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        // Top & Bottom Wall Bounce
        if (this.ball.y - this.ball.radius <= 0 || this.ball.y + this.ball.radius >= this.height) {
            this.ball.vy *= -1;
            this.spawnSparks(this.ball.x, this.ball.y, '#38bdf8');
            if (window.audioEngine) window.audioEngine.playBounce();
        }

        // Player 1 Paddle Impact
        if (this.ball.vx < 0) {
            if (
                this.ball.x - this.ball.radius <= this.p1.x + this.paddleWidth &&
                this.ball.x + this.ball.radius >= this.p1.x &&
                this.ball.y >= this.p1.y &&
                this.ball.y <= this.p1.y + this.paddleHeight
            ) {
                this.ball.vx *= -1.08;
                this.spawnSparks(this.p1.x + this.paddleWidth, this.ball.y, '#10b981');
                if (window.audioEngine) window.audioEngine.playBounce();
            }
        }

        // Player 2 Paddle Impact
        if (this.ball.vx > 0) {
            if (
                this.ball.x + this.ball.radius >= this.p2.x &&
                this.ball.x - this.ball.radius <= this.p2.x + this.paddleWidth &&
                this.ball.y >= this.p2.y &&
                this.ball.y <= this.p2.y + this.paddleHeight
            ) {
                this.ball.vx *= -1.08;
                this.spawnSparks(this.p2.x, this.ball.y, '#ef4444');
                if (window.audioEngine) window.audioEngine.playBounce();
            }
        }

        // Update Spark Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Left Goal (Player 2 Scores)
        if (this.ball.x - this.ball.radius <= 0) {
            this.p2.score++;
            if (window.audioEngine) window.audioEngine.playHit();
            if (this.p2.score >= 5) this.triggerGameOver(false);
            else this.resetBall(1);
        }

        // Right Goal (Player 1 Scores)
        if (this.ball.x + this.ball.radius >= this.width) {
            this.p1.score++;
            this.onScoreUpdate(this.p1.score);
            if (window.audioEngine) window.audioEngine.playScore();
            if (this.p1.score >= 5) this.triggerGameOver(true);
            else this.resetBall(-1);
        }
    }

    triggerGameOver(playerWon) {
        this.isGameOver = true;
        this.isRunning = false;
        if (window.audioEngine) window.audioEngine.playGameOver();
        this.onGameOver(this.p1.score);
    }

    render() {
        // Deep Grid Canvas
        this.ctx.fillStyle = '#060a12';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Center Net Line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([12, 12]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Score Text
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.font = 'bold 72px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.p1.score, this.width / 4, 100);
        this.ctx.fillText(this.p2.score, (this.width / 4) * 3, 100);

        // Spark Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = Math.max(0, p.life);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;

        // Ball Motion Trail
        this.trail.forEach((t, i) => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * i})`;
            this.ctx.beginPath();
            this.ctx.arc(t.x, t.y, this.ball.radius * (i / 8), 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Player 1 Paddle (Emerald)
        const p1Grad = this.ctx.createLinearGradient(this.p1.x, 0, this.p1.x + this.paddleWidth, 0);
        p1Grad.addColorStop(0, '#34d399');
        p1Grad.addColorStop(1, '#059669');
        this.ctx.fillStyle = p1Grad;
        this.ctx.beginPath();
        this.ctx.roundRect(this.p1.x, this.p1.y, this.paddleWidth, this.paddleHeight, 6);
        this.ctx.fill();

        // Player 2 Paddle (Red)
        const p2Grad = this.ctx.createLinearGradient(this.p2.x, 0, this.p2.x + this.paddleWidth, 0);
        p2Grad.addColorStop(0, '#f87171');
        p2Grad.addColorStop(1, '#dc2626');
        this.ctx.fillStyle = p2Grad;
        this.ctx.beginPath();
        this.ctx.roundRect(this.p2.x, this.p2.y, this.paddleWidth, this.paddleHeight, 6);
        this.ctx.fill();

        // Ball Glow
        const ballGrad = this.ctx.createRadialGradient(this.ball.x - 2, this.ball.y - 2, 1, this.ball.x, this.ball.y, this.ball.radius);
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.8, '#e0f2fe');
        ballGrad.addColorStop(1, '#38bdf8');
        this.ctx.fillStyle = ballGrad;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    stop() {
        this.isRunning = false;
        if (this.animId) cancelAnimationFrame(this.animId);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}

window.PongGame = PongGame;
