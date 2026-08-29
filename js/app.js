/**
 * ============================================================================
 * AURA ARCADE — APPLICATION ENTRY POINT & EVENT ORCHESTRATOR (js/app.js)
 * ----------------------------------------------------------------------------
 * Bootstraps the application, connects game selection cards, binds keyboard
 * and mobile touch D-Pad controls, manages user login forms, and handles
 * leaderboard updates.
 * ============================================================================
 */

class ArcadeApp {
    constructor() {
        this.ui = window.uiManager;
    }

    init() {
        console.log('Initializing AURA Arcade Platform...');

        this.bindEvents();
    }

    bindEvents() {
        const ui = window.uiManager;
        if (!ui) return;

        // 1. Brand Logo Click -> Scroll to top landing hero
        if (ui.brandLogoBtn) {
            ui.brandLogoBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // 2. Day / Night Shader Theme Toggle
        if (ui.themeToggleBtn) {
            ui.themeToggleBtn.addEventListener('click', () => ui.toggleTheme());
        }

        // 3. CTA "Explore All 5 Arcade Games" Button -> Scroll to games grid
        if (ui.exploreGamesBtn) {
            ui.exploreGamesBtn.addEventListener('click', () => {
                if (ui.gamesSection) {
                    ui.gamesSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // 4. Game Cards Click -> Launch Target Game
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const gameKey = card.getAttribute('data-game');
                if (gameKey) ui.launchGame(gameKey);
            });
        });

        // 5. Quick Launch Prompt Pills Click
        document.querySelectorAll('.prompt-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const gameKey = pill.getAttribute('data-game');
                if (gameKey) ui.launchGame(gameKey);
            });
        });

        // 6. Viewport Overlay Start Action Button
        if (ui.overlayActionBtn) {
            ui.overlayActionBtn.addEventListener('click', () => ui.startGameSession());
        }

        // Tap on canvas overlay banner to start
        if (ui.gameOverlayBanner) {
            ui.gameOverlayBanner.addEventListener('click', (e) => {
                if (e.target === ui.gameOverlayBanner || e.target === ui.overlayTitle || e.target === ui.overlaySubtitle) {
                    ui.startGameSession();
                }
            });
        }

        // 7. Viewport Action Control Buttons (Fullscreen, Restart, Pause, Close)
        if (ui.gameFullscreenBtn) {
            ui.gameFullscreenBtn.addEventListener('click', () => ui.toggleFullscreen());
        }

        if (ui.gameRestartBtn) {
            ui.gameRestartBtn.addEventListener('click', () => {
                if (ui.activeGameInstance) ui.activeGameInstance.start();
            });
        }

        if (ui.gamePauseBtn) {
            ui.gamePauseBtn.addEventListener('click', () => {
                if (ui.activeGameInstance) {
                    ui.activeGameInstance.isRunning = !ui.activeGameInstance.isRunning;
                    if (ui.activeGameInstance.isRunning) {
                        ui.activeGameInstance.loop();
                    }
                }
            });
        }

        if (ui.closeGameModalBtn) {
            ui.closeGameModalBtn.addEventListener('click', () => ui.closeGameModal());
        }

        // 8. Mobile Touch Pad Controls (Left, Right, Action / Jump / Shoot)
        const simulateKey = (code, type) => {
            const event = new KeyboardEvent(type, { code: code, bubbles: true });
            window.dispatchEvent(event);
        };

        if (ui.touchLeftBtn) {
            ui.touchLeftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); simulateKey('ArrowLeft', 'keydown'); });
            ui.touchLeftBtn.addEventListener('touchend', (e) => { e.preventDefault(); simulateKey('ArrowLeft', 'keyup'); });
            ui.touchLeftBtn.addEventListener('mousedown', () => simulateKey('ArrowLeft', 'keydown'));
            ui.touchLeftBtn.addEventListener('mouseup', () => simulateKey('ArrowLeft', 'keyup'));
        }

        if (ui.touchRightBtn) {
            ui.touchRightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); simulateKey('ArrowRight', 'keydown'); });
            ui.touchRightBtn.addEventListener('touchend', (e) => { e.preventDefault(); simulateKey('ArrowRight', 'keyup'); });
            ui.touchRightBtn.addEventListener('mousedown', () => simulateKey('ArrowRight', 'keydown'));
            ui.touchRightBtn.addEventListener('mouseup', () => simulateKey('ArrowRight', 'keyup'));
        }

        if (ui.touchActionBtn) {
            ui.touchActionBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                simulateKey('Space', 'keydown');
                if (ui.activeGameInstance && typeof ui.activeGameInstance.flap === 'function') {
                    ui.activeGameInstance.flap();
                }
            });
            ui.touchActionBtn.addEventListener('touchend', (e) => { e.preventDefault(); simulateKey('Space', 'keyup'); });
            ui.touchActionBtn.addEventListener('mousedown', () => {
                simulateKey('Space', 'keydown');
                if (ui.activeGameInstance && typeof ui.activeGameInstance.flap === 'function') {
                    ui.activeGameInstance.flap();
                }
            });
            ui.touchActionBtn.addEventListener('mouseup', () => simulateKey('Space', 'keyup'));
        }

        // 9. Global Leaderboard Modal Triggers & Tab Switching
        if (ui.leaderboardBtn) {
            ui.leaderboardBtn.addEventListener('click', () => {
                ui.renderLeaderboardTable('flappy');
                if (ui.leaderboardModalOverlay) ui.leaderboardModalOverlay.classList.add('active');
            });
        }
        if (ui.closeLeaderboardModalBtn) {
            ui.closeLeaderboardModalBtn.addEventListener('click', () => {
                if (ui.leaderboardModalOverlay) ui.leaderboardModalOverlay.classList.remove('active');
            });
        }

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const gameKey = btn.getAttribute('data-tab');
                ui.renderLeaderboardTable(gameKey);
            });
        });

        // 10. User Login / Signup Auth Modal Triggers
        if (ui.userAuthBtn) {
            ui.userAuthBtn.addEventListener('click', () => {
                if (ui.authModalOverlay) ui.authModalOverlay.classList.add('active');
            });
        }
        if (ui.closeAuthModalBtn) {
            ui.closeAuthModalBtn.addEventListener('click', () => {
                if (ui.authModalOverlay) ui.authModalOverlay.classList.remove('active');
            });
        }

        if (ui.authForm) {
            ui.authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = ui.authUsernameInput.value.trim();
                if (username && window.leaderboardManager) {
                    window.leaderboardManager.saveUser(username);
                    ui.userNameLabel.textContent = username;
                    ui.updateAllBestScores();
                    if (ui.authModalOverlay) ui.authModalOverlay.classList.remove('active');
                    alert(`Welcome back, ${username}! Your high scores will now be tracked.`);
                }
            });
        }

        // 11. Developer Console Modal Triggers
        if (ui.devConsoleBtn) {
            ui.devConsoleBtn.addEventListener('click', () => {
                if (ui.devModalOverlay) ui.devModalOverlay.classList.add('active');
            });
        }
        if (ui.closeDevModalBtn) {
            ui.closeDevModalBtn.addEventListener('click', () => {
                if (ui.devModalOverlay) ui.devModalOverlay.classList.remove('active');
            });
        }
    }
}

// Bootstrap Arcade App when DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ArcadeApp();
    window.app.init();
});
