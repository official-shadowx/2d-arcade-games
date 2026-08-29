/**
 * ============================================================================
 * AURA ARCADE — LEADERBOARD & USER AUTH MANAGER (js/leaderboard.js)
 * ----------------------------------------------------------------------------
 * Handles user account login/signup and persistent high score tracking
 * via LocalStorage across all 5 games (Flappy Bird, Snake, Dino, Pong, Space).
 * ============================================================================
 */

class LeaderboardManager {
    constructor() {
        this.STORAGE_KEY_USER = 'aura_arcade_user';
        this.STORAGE_KEY_SCORES = 'aura_arcade_scores';

        this.currentUser = this.loadUser();
        this.scores = this.loadScores();
    }

    loadUser() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY_USER);
            return saved ? JSON.parse(saved) : { username: 'Player1', loggedIn: false };
        } catch (e) {
            return { username: 'Player1', loggedIn: false };
        }
    }

    saveUser(username) {
        this.currentUser = { username: username || 'Player1', loggedIn: true };
        try {
            localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(this.currentUser));
        } catch (e) {
            console.error('Failed to save user:', e);
        }
    }

    loadScores() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY_SCORES);
            return saved ? JSON.parse(saved) : {
                flappy: [{ player: 'SHADOW X', score: 45, date: '2026-08-29' }],
                snake: [{ player: 'SHADOW X', score: 280, date: '2026-08-29' }],
                dino: [{ player: 'SHADOW X', score: 850, date: '2026-08-29' }],
                pong: [{ player: 'SHADOW X', score: 5, date: '2026-08-29' }],
                space: [{ player: 'SHADOW X', score: 1400, date: '2026-08-29' }]
            };
        } catch (e) {
            return {
                flappy: [],
                snake: [],
                dino: [],
                pong: [],
                space: []
            };
        }
    }

    /**
     * Submit new game score
     * @param {string} gameKey - 'flappy', 'snake', 'dino', 'pong', 'space'
     * @param {number} score - High score achieved
     */
    submitScore(gameKey, score) {
        if (!score || score <= 0) return;
        if (!this.scores[gameKey]) this.scores[gameKey] = [];

        const playerName = this.currentUser.username || 'Player1';
        const dateStr = new Date().toISOString().slice(0, 10);

        // Check if player already has a score entry
        const existingIdx = this.scores[gameKey].findIndex(e => e.player === playerName);
        if (existingIdx >= 0) {
            if (score > this.scores[gameKey][existingIdx].score) {
                this.scores[gameKey][existingIdx].score = score;
                this.scores[gameKey][existingIdx].date = dateStr;
            }
        } else {
            this.scores[gameKey].push({
                player: playerName,
                score: score,
                date: dateStr
            });
        }

        // Sort descending
        this.scores[gameKey].sort((a, b) => b.score - a.score);

        try {
            localStorage.setItem(this.STORAGE_KEY_SCORES, JSON.stringify(this.scores));
        } catch (e) {
            console.error('Failed to save scores:', e);
        }
    }

    /**
     * Get highest personal score for a game
     * @param {string} gameKey - 'flappy', 'snake', 'dino', 'pong', 'space'
     */
    getPersonalBest(gameKey) {
        if (!this.scores[gameKey]) return 0;
        const playerName = this.currentUser.username || 'Player1';
        const found = this.scores[gameKey].find(e => e.player === playerName);
        if (found) return found.score;

        // Fallback to highest in list
        return this.scores[gameKey][0] ? this.scores[gameKey][0].score : 0;
    }

    /**
     * Get top leaderboard list for a game
     * @param {string} gameKey - 'flappy', 'snake', 'dino', 'pong', 'space'
     */
    getLeaderboard(gameKey) {
        return this.scores[gameKey] || [];
    }
}

// Export singleton instance to global scope
window.leaderboardManager = new LeaderboardManager();
