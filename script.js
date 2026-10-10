// =============================================
// BROOMI — Main Script
// =============================================

document.addEventListener('DOMContentLoaded', function () {
    AOS.init({ once: true, offset: 100, duration: 800, easing: 'ease-out-cubic' });
    initNavbar();
    initMobileMenu();
    initHeroScrollAnimation();
});

// =============================================
// NAVBAR
// =============================================
function initNavbar() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('nav-solid', window.scrollY > 60);
    }, { passive: true });
}

// =============================================
// MOBILE MENU
// =============================================
function initMobileMenu() {
    const btn  = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    let open   = false;

    function toggle() {
        open = !open;
        menu.classList.toggle('opacity-0',          !open);
        menu.classList.toggle('pointer-events-none', !open);
        menu.classList.toggle('opacity-100',         open);
        menu.classList.toggle('pointer-events-auto', open);
        btn.innerHTML = open
            ? '<i class="fas fa-times"></i>'
            : '<i class="fas fa-bars"></i>';
        document.body.style.overflow = open ? 'hidden' : '';
    }

    btn.addEventListener('click', toggle);
    document.querySelectorAll('.mobile-link').forEach(l =>
        l.addEventListener('click', () => open && toggle())
    );
}

// =============================================
// HERO SCROLL FRAME ANIMATION
// =============================================
function initHeroScrollAnimation() {
    const canvas    = document.getElementById('hero-canvas');
    const ctx       = canvas.getContext('2d');
    const section   = document.getElementById('home');
    const loader    = document.getElementById('loader');
    const loaderBar = document.getElementById('loader-bar');
    const loaderPct = document.getElementById('loader-pct');

    const TOTAL = 240;
    const DIR   = 'hero-frames/';

    // ── Frame store ────────────────────────
    const imgs  = new Array(TOTAL).fill(null);
    let loaded  = 0;
    let rafId   = null;

    // Fractional frame positions for lerp
    let targetFrame  = 0;
    let currentFrame = 0;

    // Lerp speed: 0.06 = cinematic smoothness
    const LERP = 0.06;

    // ── Canvas sizing ──────────────────────
    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // Repaint current frame after resize
        const idx = Math.round(currentFrame);
        if (imgs[idx]) paint(imgs[idx]);
    }

    // ── Cover-fit draw ─────────────────────
    function paint(img) {
        if (!img || !img.complete || !img.naturalWidth) return;
        const cW = canvas.width,  cH = canvas.height;
        const iW = img.naturalWidth, iH = img.naturalHeight;
        const scale = Math.max(cW / iW, cH / iH);
        const dW = iW * scale,   dH = iH * scale;
        const dX = (cW - dW) / 2, dY = (cH - dH) / 2;
        ctx.clearRect(0, 0, cW, cH);
        ctx.drawImage(img, dX, dY, dW, dH);
    }

    // ── RAF render loop ────────────────────
    function loop() {
        rafId = requestAnimationFrame(loop);

        // Smooth lerp toward scroll target
        currentFrame += (targetFrame - currentFrame) * LERP;

        const idx = Math.min(Math.max(Math.round(currentFrame), 0), TOTAL - 1);

        // Use the requested frame or fallback to nearest loaded
        let img = imgs[idx];
        if (!img) {
            for (let k = idx; k >= 0; k--) {
                if (imgs[k]) { img = imgs[k]; break; }
            }
        }
        if (img) paint(img);
    }

    // ── Scroll → target frame ──────────────
    function onScroll() {
        const sTop    = section.offsetTop;
        const sHeight = section.offsetHeight;
        const scrolled = Math.max(window.scrollY - sTop, 0);
        const range    = sHeight - window.innerHeight;
        const progress = Math.min(scrolled / range, 1);

        targetFrame = progress * (TOTAL - 1);
    }

    // ── Loader progress ────────────────────
    function updateLoader() {
        const pct = Math.round((loaded / TOTAL) * 100);
        loaderBar.style.width = pct + '%';
        loaderPct.textContent = pct + '%';
    }

    // ── Hide loader & start animation ──────
    function onAllLoaded() {
        // Smooth fade out loader
        loader.classList.add('hidden');
        document.body.style.overflow = '';

        // Make sure frame 0 is painted before loop kicks
        if (imgs[0]) paint(imgs[0]);

        // Start RAF loop
        if (!rafId) loop();
    }

    // ── Preload all frames ─────────────────
    function preload() {
        // Lock scroll and show loader while loading
        document.body.style.overflow = 'hidden';

        // Fill canvas with dark color immediately — no white
        ctx.fillStyle = '#0d0805';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < TOTAL; i++) {
            const img = new Image();
            const num = String(i + 1).padStart(3, '0');
            img.src   = `${DIR}ezgif-frame-${num}.jpg`;

            img.onload = () => {
                imgs[i] = img;
                loaded++;
                updateLoader();

                // Paint frame 0 the moment it arrives (still inside loader)
                if (i === 0) {
                    resize();
                    paint(img);
                }

                if (loaded === TOTAL) onAllLoaded();
            };

            img.onerror = () => {
                loaded++;
                updateLoader();
                if (loaded === TOTAL) onAllLoaded();
            };
        }
    }

    // ── Init ───────────────────────────────
    resize();
    preload();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize,   { passive: true });
}
