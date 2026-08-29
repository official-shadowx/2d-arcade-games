/**
 * ============================================================================
 * AURA ARCADE — UI MANAGER & GAME ORCHESTRATOR (js/uiManager.js)
 * ----------------------------------------------------------------------------
 * Controls game launch viewport modal, Fullscreen mode toggling, high scores
 * DOM updates, Day/Night theme switcher, user auth modal, and leaderboard table.
 * ============================================================================
 */

class UIManager {
    constructor() {
        this.activeGameKey = null;
        this.activeGameInstance = null;

        this.initDOM();
        this.initScrollReveal();
        this.updateAllBestScores();
    }

    initDOM() {
        // Navigation Elements
        this.brandLogoBtn = document.getElementById('brand-logo-btn');
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.themeIcon = document.getElementById('theme-icon');
        this.leaderboardBtn = document.getElementById('leaderboard-btn');
        this.userAuthBtn = document.getElementById('user-auth-btn');
        this.userNameLabel = document.getElementById('user-name-label');

        // Landing & Sections
        this.exploreGamesBtn = document.getElementById('explore-games-btn');
        this.gamesSection = document.getElementById('games-section');

        // Active Game Viewport Modal Elements
        this.gameModalOverlay = document.getElementById('game-modal-overlay');
        this.gameModalContainer = document.getElementById('game-modal-container');
        this.activeGameIcon = document.getElementById('active-game-icon');
        this.activeGameTitle = document.getElementById('active-game-title');
        this.hudScoreVal = document.getElementById('hud-score-val');
        this.hudHighVal = document.getElementById('hud-high-val');

        this.gameFullscreenBtn = document.getElementById('game-fullscreen-btn');
        this.gameRestartBtn = document.getElementById('game-restart-btn');
        this.gamePauseBtn = document.getElementById('game-pause-btn');
        this.closeGameModalBtn = document.getElementById('close-game-modal-btn');

        this.canvasWrapper = document.getElementById('canvas-wrapper');
        this.canvas = document.getElementById('game-canvas');
        this.gameOverlayBanner = document.getElementById('game-overlay-banner');
        this.overlayTitle = document.getElementById('overlay-title');
        this.overlaySubtitle = document.getElementById('overlay-subtitle');
        this.overlayActionBtn = document.getElementById('overlay-action-btn');

        // Mobile Touch Pad Buttons
        this.touchLeftBtn = document.getElementById('touch-left-btn');
        this.touchRightBtn = document.getElementById('touch-right-btn');
        this.touchActionBtn = document.getElementById('touch-action-btn');

        // Leaderboard Modal Elements
        this.leaderboardModalOverlay = document.getElementById('leaderboard-modal-overlay');
        this.closeLeaderboardModalBtn = document.getElementById('close-leaderboard-modal-btn');
        this.leaderboardTbody = document.getElementById('leaderboard-tbody');

        // Auth Modal Elements
        this.authModalOverlay = document.getElementById('auth-modal-overlay');
        this.closeAuthModalBtn = document.getElementById('close-auth-modal-btn');
        this.authForm = document.getElementById('auth-form');
        this.authUsernameInput = document.getElementById('auth-username');

        // Developer Console Modal Elements
        this.devConsoleBtn = document.getElementById('dev-console-btn');
        this.devModalOverlay = document.getElementById('dev-modal-overlay');
        this.closeDevModalBtn = document.getElementById('close-dev-modal-btn');
        this.devLogOutput = document.getElementById('dev-log-output');

        // User Auth Display update
        if (window.leaderboardManager) {
            const user = window.leaderboardManager.currentUser;
            this.userNameLabel.textContent = user.loggedIn ? user.username : 'Login / Register';
        }
    }

    initScrollReveal() {
        const options = { root: null, rootMargin: '0px', threshold: 0.1 };
        this.scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, options);

        document.querySelectorAll('.reveal-on-scroll').forEach(el => {
            this.scrollObserver.observe(el);
        });
    }

    /**
     * Update High Scores displayed on all 5 Game Cards
     */
    updateAllBestScores() {
        if (!window.leaderboardManager) return;
        const games = ['flappy', 'snake', 'dino', 'pong', 'space'];
        games.forEach(g => {
            const el = document.getElementById(`${g}-best-score`);
            if (el) {
                el.textContent = window.leaderboardManager.getPersonalBest(g);
            }
        });
    }

    /**
     * Toggle Day / Night Shader Theme
     */
    toggleTheme() {
        const isDark = document.body.classList.contains('theme-dark');
        if (isDark) {
            document.body.classList.remove('theme-dark');
            document.body.classList.add('theme-light');
            if (this.themeIcon) this.themeIcon.setAttribute('data-lucide', 'sun');
        } else {
            document.body.classList.remove('theme-light');
            document.body.classList.add('theme-dark');
            if (this.themeIcon) this.themeIcon.setAttribute('data-lucide', 'moon');
        }
        if (window.lucide) lucide.createIcons();
    }

    /**
     * Toggle Canvas Fullscreen Mode
     */
    toggleFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (this.canvasWrapper.requestFullscreen) {
                this.canvasWrapper.requestFullscreen();
            } else if (this.canvasWrapper.webkitRequestFullscreen) {
                this.canvasWrapper.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }

    /**
     * Launch Active Game Engine Modal Viewport
     * @param {string} gameKey - 'flappy', 'snake', 'dino', 'pong', 'space'
     */
    launchGame(gameKey) {
        if (this.activeGameInstance) {
            this.activeGameInstance.stop();
            this.activeGameInstance = null;
        }

        this.activeGameKey = gameKey;
        const bestScore = window.leaderboardManager.getPersonalBest(gameKey);
        this.hudHighVal.textContent = bestScore;
        this.hudScoreVal.textContent = 0;

        let title = 'Flappy Bird';
        let icon = 'bird';
        let subtitle = 'Press SPACEBAR or TAP screen to flap & jump';

        switch (gameKey) {
            case 'flappy':
                title = 'Flappy Bird';
                icon = 'bird';
                subtitle = 'Press SPACEBAR or TAP screen to jump & pass through gap pipes';
                this.activeGameInstance = new FlappyBirdGame(
                    this.canvas,
                    (score) => this.onScore(score),
                    (score) => this.onGameOver(score)
                );
                break;

            case 'snake':
                title = 'Snake Classic';
                icon = 'worm';
                subtitle = 'Use Arrow keys or WASD to control snake direction & eat food';
                this.activeGameInstance = new SnakeGame(
                    this.canvas,
                    (score) => this.onScore(score),
                    (score) => this.onGameOver(score)
                );
                break;

            case 'dino':
                title = 'Chrome Dino Runner';
                icon = 'footprints';
                subtitle = 'Press Spacebar/Up to Jump, Down arrow to Duck over cacti & birds';
                this.activeGameInstance = new DinoRunnerGame(
                    this.canvas,
                    (score) => this.onScore(score),
                    (score) => this.onGameOver(score)
                );
                break;

            case 'pong':
                title = 'Pong 2D Table Tennis';
                icon = 'swords';
                subtitle = 'Use W/S or Up/Down Arrow keys to control left paddle against AI';
                this.activeGameInstance = new PongGame(
                    this.canvas,
                    (score) => this.onScore(score),
                    (score) => this.onGameOver(score)
                );
                break;

            case 'space':
                title = 'Space Invaders';
                icon = 'rocket';
                subtitle = 'Use A/D or Arrow keys to move, Spacebar to shoot laser beams';
                this.activeGameInstance = new SpaceInvadersGame(
                    this.canvas,
                    (score) => this.onScore(score),
                    (score) => this.onGameOver(score)
                );
                break;
        }

        this.activeGameTitle.textContent = title;
        if (this.activeGameIcon) this.activeGameIcon.setAttribute('data-lucide', icon);
        if (window.lucide) lucide.createIcons();

        this.overlayTitle.textContent = `READY TO PLAY ${title.toUpperCase()}?`;
        this.overlaySubtitle.textContent = subtitle;
        this.overlayActionBtn.textContent = 'START GAME';
        this.gameOverlayBanner.classList.remove('hidden');

        this.gameModalOverlay.classList.add('active');
    }

    /**
     * Start Active Game Session
     */
    startGameSession() {
        if (!this.activeGameInstance) return;
        this.gameOverlayBanner.classList.add('hidden');
        this.activeGameInstance.start();
    }

    onScore(score) {
        this.hudScoreVal.textContent = score;
    }

    onGameOver(finalScore) {
        if (window.leaderboardManager && this.activeGameKey) {
            window.leaderboardManager.submitScore(this.activeGameKey, finalScore);
            this.updateAllBestScores();
            const best = window.leaderboardManager.getPersonalBest(this.activeGameKey);
            this.hudHighVal.textContent = best;
        }

        this.overlayTitle.textContent = 'GAME OVER!';
        this.overlaySubtitle.textContent = `Final Score: ${finalScore}`;
        this.overlayActionBtn.textContent = 'PLAY AGAIN';
        this.gameOverlayBanner.classList.remove('hidden');
    }

    closeGameModal() {
        if (this.activeGameInstance) {
            this.activeGameInstance.stop();
            this.activeGameInstance = null;
        }
        this.gameModalOverlay.classList.remove('active');
    }

    renderLeaderboardTable(gameKey = 'flappy') {
        if (!this.leaderboardTbody || !window.leaderboardManager) return;
        const list = window.leaderboardManager.getLeaderboard(gameKey);
        this.leaderboardTbody.innerHTML = '';

        if (!list || list.length === 0) {
            this.leaderboardTbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No scores recorded yet. Be the first!</td></tr>`;
            return;
        }

        list.forEach((item, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${idx + 1}</strong></td>
                <td>${item.player}</td>
                <td><strong>${item.score}</strong></td>
                <td>${item.date}</td>
            `;
            this.leaderboardTbody.appendChild(tr);
        });
    }

    appendDevLog(msg) {
        if (!this.devLogOutput) return;
        this.devLogOutput.textContent += `\n[${new Date().toLocaleTimeString()}] ${msg}`;
        this.devLogOutput.scrollTop = this.devLogOutput.scrollHeight;
    }
}

// Export singleton instance
document.addEventListener('DOMContentLoaded', () => {
    window.uiManager = new UIManager();
});
