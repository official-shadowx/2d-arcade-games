/**
 * ============================================================================
 * AURA ARCADE — SNAKE CLASSIC GAME ENGINE (js/games/snakeGame.js)
 * ----------------------------------------------------------------------------
 * Features:
 * - Grid array segment movement & body follow logic
 * - Random food cell spawning
 * - Self-collision & wall boundary collision math
 * - Web Audio sound FX integration
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

        // Grid Cell Size
        this.gridSize = 20;
        this.cols = Math.floor(this.width / this.gridSize);
        this.rows = Math.floor(this.height / this.gridSize);

        // Game State
        this.isRunning = false;
        this.isGameOver = false;
        this.score = 0;

        // Snake Body Array
        this.snake = [];
        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };

        // Food Cell
        this.food = { x: 0, y: 0 };

        // Game loop ticker
        this.gameSpeed = 90; // Tick interval in ms
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
        // Prevent 180-degree immediate reverse
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

        // Wall Collision Check
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            this.triggerGameOver();
            return;
        }

        // Self Body Collision Check
        if (this.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            this.triggerGameOver();
            return;
        }

        // Move Snake Head
        this.snake.unshift(head);

        // Check Food Collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.onScoreUpdate(this.score);
            if (window.audioEngine) window.audioEngine.playScore();
            this.spawnFood();
        } else {
            this.snake.pop(); // Remove tail
        }
    }

    triggerGameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        if (window.audioEngine) window.audioEngine.playGameOver();
        this.onGameOver(this.score);
    }

    render() {
        // Clear Grid Canvas
        this.ctx.fillStyle = '#090d16';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Subtle Grid Lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
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

        // Render Food (Pulsing Red Apple)
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Render Snake Segments
        this.snake.forEach((seg, idx) => {
            if (idx === 0) {
                // Snake Head (Bright Emerald)
                this.ctx.fillStyle = '#10b981';
            } else {
                // Snake Body (Gradated Green)
                this.ctx.fillStyle = '#059669';
            }

            this.ctx.beginPath();
            this.ctx.roundRect(
                seg.x * this.gridSize + 1,
                seg.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2,
                4
            );
            this.ctx.fill();
        });
    }

    stop() {
        this.isRunning = false;
        if (this.animId) cancelAnimationFrame(this.animId);
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}

// Export to global scope
window.SnakeGame = SnakeGame;
