# 🕹️ AURA ARCADE — 2D Web Video Game Platform

![Developer Credit](https://img.shields.io/badge/Developer-SHADOW%20X-black?style=for-the-badge&logo=github)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Games Included](https://img.shields.io/badge/Arcade%20Games-5%20Playable-emerald?style=for-the-badge)

A high-performance 2D Web Arcade Gaming Platform built by **SHADOW X**. Features 5 complete playable 2D games with real-time Web Audio API sound synthesis, glassmorphism UI/UX, persistent user leaderboards, fullscreen gameplay mode, and mobile touch controls.

---

## 🎮 Included 2D Games

1. 🐤 **Flappy Bird**: Tap/Spacebar gravity physics, bird velocity dynamics, procedural gap pipes, score tracking.
2. 🐍 **Snake Classic**: Grid-based 2D matrix movement, body segment follow array, random apple food spawning, self & wall collision math.
3. 🦖 **Chrome Dino Runner**: Endless runner with jump & duck physics over procedural cacti and flying pterodactyl birds. Speed scales continuously over time.
4. 🏓 **Pong 2D Table Tennis**: Classic 2D paddle table tennis with vector ball reflection angles, AI opponent tracking logic, and 1-Player vs 2-Player modes.
5. 👾 **Space Invaders**: Player spaceship laser shooting, marching alien grid matrix, enemy bombs, lives & wave system.

---

## ✨ Key Features & Architecture

- 🔊 **Web Audio API Sound Engine (`audioEngine.js`)**: Real-time synthesized retro arcade sound effects (Jump, Shoot, Bounce, Score, Explosion, Game Over) for 100% offline reliability.
- 🎨 **Monochrome Shader Glassmorphism**: Frosted glass cards with `backdrop-filter: blur(20px)`, smooth rounded corners (`border-radius: 24px`), and Day/Night shader theme switcher.
- 🏆 **User Auth & Global Leaderboard (`leaderboard.js`)**: Account login/register system with LocalStorage persistent score tracking across all 5 games.
- 🖥️ **Fullscreen Gameplay Mode**: 1-Click `requestFullscreen()` mode for distraction-free gaming.
- 📱 **Mobile Touch Controls**: On-screen touch pad (Left, Right, Action / Jump / Shoot) automatically displayed on mobile devices with custom cursor auto-hidden.

---

## 🚀 How to Run Locally

1. Clone or download the repository:
   ```bash
   git clone https://github.com/official-shadowx/2d-arcade-games.git
   cd 2d-arcade-games
   ```
2. Open `index.html` directly in any web browser, or launch a simple local HTTP server:
   ```bash
   python -m http.server 3001
   ```
3. Open `http://localhost:3001` in your web browser.

---

## 👨‍💻 Developer & Credits

Crafted with ❤️ by **SHADOW X**.

- **GitHub**: [@official-shadowx](https://github.com/official-shadowx)
- **Project**: AURA ARCADE 2D Video Game Platform

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
