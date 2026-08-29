/**
 * ============================================================================
 * AURA ARCADE — PONG 2D TABLE TENNIS ENGINE (js/games/pongGame.js)
 * ----------------------------------------------------------------------------
 * Features:
 * - Ball velocity reflection & bounce angle calculation
 * - AI opponent paddle tracking physics
 * - 1-Player vs AI & 2-Player local support
 * - Web Audio sound FX integration
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
        this.paddleHeight = 90;

        // Player 1 Paddle (Left)
        this.p1 = {
            x: 20,
            y: this.height / 2 - this.paddleHeight / 2,
            score: 0,
            vy: 0
        };

        // Player 2 / AI Paddle (Right)
        this.p2 = {
            x: this.width - 20 - this.paddleWidth,
            y: this.height / 2 - this.paddleHeight / 2,
            score: 0,
            vy: 0
        };

        // Ball Properties
        this.ball = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 8,
            vx: 5,
            vy: 3,
            speed: 6
        };

        this.isAi = true;
        this.paddleSpeed = 7;

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
        this.ball.speed = 6;
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

    loop() {
        if (!this.isRunning) return;

        this.update();
        this.render();

        if (!this.isGameOver) {
            this.animId = requestAnimationFrame(() => this.loop());
        }
    }

    update() {
        // Player 1 Paddle Movement (W/S or Up/Down)
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.p1.y = Math.max(0, this.p1.y - this.paddleSpeed);
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.p1.y = Math.min(this.height - this.paddleHeight, this.p1.y + this.paddleSpeed);
        }

        // Player 2 or AI Opponent Movement
        if (this.isAi) {
            // Smooth AI tracking logic
            const targetY = this.ball.y - this.paddleHeight / 2;
            this.p2.y += (targetY - this.p2.y) * 0.08;
            this.p2.y = Math.max(0, Math.min(this.height - this.paddleHeight, this.p2.y));
        }

        // Move Ball
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        // Top & Bottom Wall Bounce
        if (this.ball.y - this.ball.radius <= 0 || this.ball.y + this.ball.radius >= this.height) {
            this.ball.vy *= -1;
            if (window.audioEngine) window.audioEngine.playBounce();
        }

        // Player 1 Paddle Collision (Left)
        if (this.ball.vx < 0) {
            if (
                this.ball.x - this.ball.radius <= this.p1.x + this.paddleWidth &&
                this.ball.x + this.ball.radius >= this.p1.x &&
                this.ball.y >= this.p1.y &&
                this.ball.y <= this.p1.y + this.paddleHeight
            ) {
                this.ball.vx *= -1.08; // Accelerate ball slightly
                if (window.audioEngine) window.audioEngine.playBounce();
            }
        }

        // Player 2 Paddle Collision (Right)
        if (this.ball.vx > 0) {
            if (
                this.ball.x + this.ball.radius >= this.p2.x &&
                this.ball.x - this.ball.radius <= this.p2.x + this.paddleWidth &&
                this.ball.y >= this.p2.y &&
                this.ball.y <= this.p2.y + this.paddleHeight
            ) {
                this.ball.vx *= -1.08;
                if (window.audioEngine) window.audioEngine.playBounce();
            }
        }

        // Left Goal (Player 2 Scores)
        if (this.ball.x - this.ball.radius <= 0) {
            this.p2.score++;
            if (window.audioEngine) window.audioEngine.playHit();
            if (this.p2.score >= 5) {
                this.triggerGameOver(false);
            } else {
                this.resetBall(1);
            }
        }

        // Right Goal (Player 1 Scores)
        if (this.ball.x + this.ball.radius >= this.width) {
            this.p1.score++;
            this.onScoreUpdate(this.p1.score);
            if (window.audioEngine) window.audioEngine.playScore();
            if (this.p1.score >= 5) {
                this.triggerGameOver(true);
            } else {
                this.resetBall(-1);
            }
        }
    }

    triggerGameOver(playerWon) {
        this.isGameOver = true;
        this.isRunning = false;
        if (window.audioEngine) window.audioEngine.playGameOver();
        this.onGameOver(this.p1.score);
    }

    render() {
        // Clear Canvas
        this.ctx.fillStyle = '#090d16';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Render Center Net Line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([12, 12]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Render Score Header Text
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.font = 'bold 64px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.p1.score, this.width / 4, 90);
        this.ctx.fillText(this.p2.score, (this.width / 4) * 3, 90);

        // Render Paddles
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillRect(this.p1.x, this.p1.y, this.paddleWidth, this.paddleHeight);

        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillRect(this.p2.x, this.p2.y, this.paddleWidth, this.paddleHeight);

        // Render Ball
        this.ctx.fillStyle = '#ffffff';
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

// Export to global scope
window.PongGame = PongGame;
