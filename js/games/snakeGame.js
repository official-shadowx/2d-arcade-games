/**
 * ============================================================================
 * AURA ARCADE — LARGE-GRID SNAKE CLASSIC ENGINE (js/games/snakeGame.js)
 * ----------------------------------------------------------------------------
 * Fixes & Balance Updates:
 * - Increased Grid Cell Size (32px) for bold, large snake body segments & apples
 * - Smooth control pacing (110ms tick interval)
 * ============================================================================
 */

class SnakeGame {
    constructor(canvas, onScoreUpdate, onGameOver) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScoreUpdate = onScoreUpdate;
        this.onGameOver = onGameOver;

        this.width = canvas.width;
        this.height = canvas.height;

        // Increased Grid Cell Size from 20px to 32px for larger, bold visibility
        this.gridSize = 32;
        this.cols = Math.floor(this.width / this.gridSize);
        this.rows = Math.floor(this.height / this.gridSize);

        this.isRunning = false;
        this.isGameOver = false;
        this.score = 0;

        this.snake = [];
        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.food = { x: 0, y: 0 };

        this.particles = [];
        this.gameSpeed = 110; // Relaxed tick interval for clear reaction time
        this.lastTickTime = 0;
        this.animId = null;

        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    start() {
        const startX = Math.floor(this.cols / 4);
        const startY = Math.floor(this.rows / 2);

        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.particles = [];
        this.score = 0;

        this.isRunning = true;
        this.isGameOver = false;

        this.onScoreUpdate(this.score);
        this.spawnFood();

        window.removeEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keydown', this.handleKeyDown);

        this.lastTickTime = performance.now();
        this.loop(performance.now());
    }

    setDirection(dx, dy) {
        if (dx !== 0 && this.dir.x === -dx) return;
        if (dy !== 0 && this.dir.y === -dy) return;
        this.nextDir = { x: dx, y: dy };
    }

    handleKeyDown(e) {
        switch (e.code) {
            case 'ArrowUp': case 'KeyW':
                e.preventDefault();
                this.setDirection(0, -1);
                break;
            case 'ArrowDown': case 'KeyS':
                e.preventDefault();
                this.setDirection(0, 1);
                break;
            case 'ArrowLeft': case 'KeyA':
                e.preventDefault();
                this.setDirection(-1, 0);
                break;
            case 'ArrowRight': case 'KeyD':
                e.preventDefault();
                this.setDirection(1, 0);
                break;
        }
    }

    spawnFood() {
        let valid = false;
        while (!valid) {
            this.food.x = Math.floor(Math.random() * this.cols);
            this.food.y = Math.floor(Math.random() * this.rows);
            valid = !this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y);
        }
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        const delta = currentTime - this.lastTickTime;
        if (delta >= this.gameSpeed) {
            this.update();
            this.lastTickTime = currentTime;
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        this.render();

        if (!this.isGameOver) {
            this.animId = requestAnimationFrame((time) => this.loop(time));
        }
    }

    update() {
        this.dir = { ...this.nextDir };

        const head = {
            x: this.snake[0].x + this.dir.x,
            y: this.snake[0].y + this.dir.y
        };

        // Collision Check
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows ||
            this.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            this.triggerGameOver();
            return;
        }

        this.snake.unshift(head);

        // Food Collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.onScoreUpdate(this.score);
            if (window.audioEngine) window.audioEngine.playScore();

            const px = this.food.x * this.gridSize + this.gridSize / 2;
            const py = this.food.y * this.gridSize + this.gridSize / 2;
            for (let i = 0; i < 14; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 5 + 1;
                this.particles.push({
                    x: px,
                    y: py,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1.0,
                    color: Math.random() > 0.5 ? '#ef4444' : '#f59e0b'
                });
            }

            this.spawnFood();
        } else {
            this.snake.pop();
        }
    }

    triggerGameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        if (window.audioEngine) window.audioEngine.playGameOver();
        this.onGameOver(this.score);
    }

    render() {
        // Deep Grid Background
        this.ctx.fillStyle = '#060a12';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Grid Lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        this.ctx.lineWidth = 1;
        for (let c = 0; c < this.cols; c++) {
            this.ctx.beginPath();
            this.ctx.moveTo(c * this.gridSize, 0);
            this.ctx.lineTo(c * this.gridSize, this.height);
            this.ctx.stroke();
        }
        for (let r = 0; r < this.rows; r++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, r * this.gridSize);
            this.ctx.lineTo(this.width, r * this.gridSize);
            this.ctx.stroke();
        }

        // Render Sparkle Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = Math.max(0, p.life);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;

        // Render Glowing Food Apple (Large)
        const fx = this.food.x * this.gridSize + this.gridSize / 2;
        const fy = this.food.y * this.gridSize + this.gridSize / 2;

        const appleGrad = this.ctx.createRadialGradient(fx - 3, fy - 3, 3, fx, fy, this.gridSize / 2);
        appleGrad.addColorStop(0, '#f87171');
        appleGrad.addColorStop(0.8, '#ef4444');
        appleGrad.addColorStop(1, '#b91c1c');

        this.ctx.fillStyle = appleGrad;
        this.ctx.beginPath();
        this.ctx.arc(fx, fy, this.gridSize / 2 - 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Apple Leaf
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillRect(fx - 2, fy - this.gridSize / 2 - 2, 4, 5);

        // Render Large Snake Segments
        this.snake.forEach((seg, idx) => {
            const sx = seg.x * this.gridSize;
            const sy = seg.y * this.gridSize;

            if (idx === 0) {
                // Snake Head
                this.ctx.fillStyle = '#34d399';
                this.ctx.beginPath();
                this.ctx.roundRect(sx + 2, sy + 2, this.gridSize - 4, this.gridSize - 4, 8);
                this.ctx.fill();

                // Eyes
                this.ctx.fillStyle = '#000000';
                let eye1X = sx + 8, eye1Y = sy + 8, eye2X = sx + 20, eye2Y = sy + 8;

                if (this.dir.x === 1) { eye1X = sx + 20; eye1Y = sy + 6; eye2X = sx + 20; eye2Y = sy + 20; }
                else if (this.dir.x === -1) { eye1X = sx + 6; eye1Y = sy + 6; eye2X = sx + 6; eye2Y = sy + 20; }
                else if (this.dir.y === 1) { eye1X = sx + 6; eye1Y = sy + 20; eye2X = sx + 20; eye2Y = sy + 20; }

                this.ctx.fillRect(eye1X, eye1Y, 4, 4);
                this.ctx.fillRect(eye2X, eye2Y, 4, 4);
            } else {
                // Body Segments
                const alpha = Math.max(0.4, 1 - (idx / (this.snake.length + 5)));
                this.ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.roundRect(sx + 3, sy + 3, this.gridSize - 6, this.gridSize - 6, 6);
                this.ctx.fill();
            }
        });
    }

    stop() {
        this.isRunning = false;
        if (this.animId) cancelAnimationFrame(this.animId);
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}

window.SnakeGame = SnakeGame;
