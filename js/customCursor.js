/**
 * ============================================================================
 * AURA ARCADE — CUSTOM DOT CURSOR ENGINE (js/customCursor.js)
 * ----------------------------------------------------------------------------
 * Features a minimalist dot cursor with lerp physics trailing.
 * Auto-hidden on mobile screens and touch devices.
 * ============================================================================
 */

class CustomCursorEngine {
    constructor() {
        this.cursor = document.getElementById('custom-cursor');
        this.follower = document.getElementById('custom-cursor-follower');

        if (!this.cursor || !this.follower) return;

        this.mousePos = { x: -100, y: -100 };
        this.followerPos = { x: -100, y: -100 };
        this.lerpAmount = 0.18;

        this.checkDevice();
        window.addEventListener('resize', () => this.checkDevice());

        if (this.isMobileOrTouch) {
            this.hideCursor();
            return;
        }

        this.init();
    }

    checkDevice() {
        this.isMobileOrTouch = 'ontouchstart' in window || 
                               navigator.maxTouchPoints > 0 || 
                               window.innerWidth <= 900 ||
                               window.matchMedia('(pointer: coarse)').matches ||
                               window.matchMedia('(hover: none)').matches;

        if (this.isMobileOrTouch) {
            this.hideCursor();
        } else {
            this.showCursor();
        }
    }

    hideCursor() {
        if (this.cursor) this.cursor.style.display = 'none';
        if (this.follower) this.follower.style.display = 'none';
        document.body.classList.remove('custom-cursor-active');
    }

    showCursor() {
        if (this.cursor) this.cursor.style.display = 'block';
        if (this.follower) this.follower.style.display = 'block';
        document.body.classList.add('custom-cursor-active');
    }

    init() {
        window.addEventListener('mousemove', (e) => {
            if (this.isMobileOrTouch) return;
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;

            this.cursor.style.left = `${this.mousePos.x}px`;
            this.cursor.style.top = `${this.mousePos.y}px`;
        });

        this.bindHoverTriggers();
        this.render();
    }

    bindHoverTriggers() {
        const interactiveElements = 'a, button, input, .prompt-pill, .game-card, .brand-logo, .touch-btn';

        document.addEventListener('mouseover', (e) => {
            if (this.isMobileOrTouch) return;
            if (e.target.closest(interactiveElements)) {
                document.body.classList.add('custom-cursor-hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (this.isMobileOrTouch) return;
            if (e.target.closest(interactiveElements)) {
                document.body.classList.remove('custom-cursor-hover');
            }
        });
    }

    render() {
        const loop = () => {
            if (!this.isMobileOrTouch) {
                this.followerPos.x += (this.mousePos.x - this.followerPos.x) * this.lerpAmount;
                this.followerPos.y += (this.mousePos.y - this.followerPos.y) * this.lerpAmount;

                this.follower.style.left = `${this.followerPos.x}px`;
                this.follower.style.top = `${this.followerPos.y}px`;
            }
            requestAnimationFrame(loop);
        };
        loop();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.customCursorEngine = new CustomCursorEngine();
});
