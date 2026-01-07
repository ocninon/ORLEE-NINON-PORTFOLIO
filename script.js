/* --- OCN VISUAL CORE --- */

let zIndex = 100;

// 1. BOOT SEQUENCE & CLOCK
// 1. BOOT SEQUENCE & CLOCK
window.onload = () => {
    // Clock
    setInterval(() => {
        const now = new Date();
        const timeEl = document.getElementById('sys-time');
        if (timeEl) timeEl.innerText = now.toLocaleTimeString([], { hour12: false });
    }, 1000);

    const boot = document.getElementById('boot-screen');
    if (boot) {
        setTimeout(() => {
            boot.style.opacity = '0';
            setTimeout(() => {
                boot.style.display = 'none';
                initParticles();
                setActiveNav();
            }, 800);
        }, 1500);
    } else {
        // No boot screen (subpages), init immediately
        initParticles();
        setActiveNav();
    }
};

// 1a. ACTIVE NAVIGATION STATE
function setActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-btn');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage ||
            (currentPage === '' && href === 'index.html') ||
            (currentPage === 'index.html' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// 2. DATA REVEAL ENGINE (Robust Reveal with Markdown support)
let consoleTimers = {}; // Store { consoleId: { timeout, interval } }
let searchStates = {}; // { consoleId: { currentIdx, matches } }

function revealData(consoleId, dataId, triggerEl) {
    const consoleEl = document.getElementById(consoleId);
    // In V3, the scrolling container is the consoleEl itself or its parent .data-stream
    // The previous .console-box logic is replaced by the viewport handling
    const dataEl = document.getElementById(dataId);
    if (!dataEl) return;

    const isHtml = dataEl.hasAttribute('data-html');
    let contentHTML = "";

    if (isHtml) {
        contentHTML = dataEl.innerHTML;
    } else {
        let rawText = dataEl.textContent || "";
        rawText = rawText.split('\n').map(l => l.replace(/^\s+/, "")).join('\n').trim();

        if (typeof marked !== 'undefined') {
            const md = (typeof marked.parse === 'function') ? marked.parse : (typeof marked === 'function' ? marked : null);
            if (md) {
                contentHTML = (md === marked.parse) ? marked.parse(rawText, { gfm: true, breaks: false }) : md(rawText, { gfm: true, breaks: false });
            }
        }
        if (!contentHTML) {
            contentHTML = rawText.replace(/\n/g, '<br>');
        }
    }

    if (consoleTimers[consoleId]) {
        clearTimeout(consoleTimers[consoleId].timeout);
        clearInterval(consoleTimers[consoleId].interval);
    }
    consoleTimers[consoleId] = { timeout: null, interval: null };

    // Update Sidebar Active State
    const siblings = triggerEl.parentElement.children;
    for (let s of siblings) {
        s.classList.remove('active');
    }
    triggerEl.classList.add('active');

    // Reset Content
    consoleEl.innerHTML = "<span style='color:var(--neon-cyan); opacity:0.5;'>[INITIATING_DECRYPTION]...</span>";
    consoleEl.scrollTop = 0; // Scroll to top

    // Clear Search State
    consoleEl.dataset.originalHtml = "";
    if (searchStates[consoleId]) {
        searchStates[consoleId] = { currentIdx: -1, matches: [] };
    }

    consoleTimers[consoleId].timeout = setTimeout(() => {
        // Render Content
        consoleEl.innerHTML = contentHTML;

        if (isHtml) return;

        // TYPING EFFECT (Text Only) - V3 Optimization
        const getAllTextNodes = (node) => {
            const textNodes = [];
            const walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
            let textNode;
            while (textNode = walk.nextNode()) {
                if (textNode.textContent.trim()) textNodes.push(textNode);
            }
            return textNodes;
        };
        const textNodes = getAllTextNodes(consoleEl);
        const originalTexts = textNodes.map(node => node.textContent);
        textNodes.forEach(node => node.textContent = '');

        let currentNodeIndex = 0;
        let currentCharIndex = 0;

        consoleTimers[consoleId].interval = setInterval(() => {
            if (currentNodeIndex >= textNodes.length) {
                clearInterval(consoleTimers[consoleId].interval);
                return;
            }
            const currentNode = textNodes[currentNodeIndex];
            const fullText = originalTexts[currentNodeIndex];

            if (currentCharIndex < fullText.length) {
                currentNode.textContent = fullText.substring(0, currentCharIndex + 1);
                currentCharIndex++;
            } else {
                currentNodeIndex++;
                currentCharIndex = 0;
            }
        }, 2); // Faster typing for modern feel
    }, 200);
}





// 4. BACKGROUND PARTICLES
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    draw() {
        ctx.fillStyle = '#00f2ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    for (let i = 0; i < 40; i++) particles.push(new Particle());
    animateParticles();
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        for (let j = i; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            if (Math.sqrt(dx * dx + dy * dy) < 100) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(0,242,255,0.1)';
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});



function handleSearchInput(winId, consoleId, query) {
    const consoleEl = document.getElementById(consoleId);
    const countEl = document.getElementById(`search-count-${winId}`);

    if (!query || query.length < 2) {
        clearHighlights(consoleEl);
        if (countEl) countEl.innerText = "";
        searchStates[consoleId] = { currentIdx: -1, matches: [] };
        return;
    }

    if (!consoleEl.dataset.originalHtml || consoleEl.dataset.originalHtml === "") {
        consoleEl.dataset.originalHtml = consoleEl.innerHTML;
    }

    const content = consoleEl.dataset.originalHtml;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

    // Simple highlight
    const highlighted = content.replace(regex, '<span class="search-highlight">$1</span>');
    consoleEl.innerHTML = highlighted;

    const matches = consoleEl.querySelectorAll('.search-highlight');
    searchStates[consoleId] = { currentIdx: 0, matches: Array.from(matches), winId: winId };

    if (matches.length > 0) {
        updateActiveHighlight(consoleId);
    } else {
        if (countEl) countEl.innerText = "0/0";
    }
}

function updateActiveHighlight(consoleId) {
    const state = searchStates[consoleId];
    if (!state || !state.matches || !state.matches.length) return;

    state.matches.forEach((el, i) => {
        el.classList.toggle('active-highlight', i === state.currentIdx);
    });

    const countEl = document.getElementById(`search-count-${state.winId}`);
    if (countEl) {
        countEl.innerText = `${state.currentIdx + 1}/${state.matches.length}`;
    }

    const active = state.matches[state.currentIdx];
    if (active) {
        active.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function navigateSearch(winId, consoleId, direction) {
    const state = searchStates[consoleId];
    if (!state || !state.matches || !state.matches.length) return;

    state.currentIdx += direction;
    if (state.currentIdx >= state.matches.length) state.currentIdx = 0;
    if (state.currentIdx < 0) state.currentIdx = state.matches.length - 1;

    updateActiveHighlight(consoleId);
}

function clearHighlights(consoleEl) {
    if (consoleEl.dataset.originalHtml) {
        consoleEl.innerHTML = consoleEl.dataset.originalHtml;
    }
}

// 5. UPLINK SYSTEM
function transmitUplink() {
    const btn = document.querySelector('.btn-activate');
    const form = document.querySelector('.tech-form');
    const panelBody = form.closest('.panel-content');
    const originalContent = panelBody.innerHTML;

    btn.innerText = "ENCRYPTING...";
    btn.style.opacity = "0.5";
    btn.disabled = true;

    setTimeout(() => {
        panelBody.innerHTML = `
            <div class="uplink-terminal" style="font-size:11px; font-family:var(--font-mono); color:#888;">
                <p>> INITIATING_SECURE_HANDSHAKE...</p>
                <p>> ENCRYPTING_PAYLOAD: AES-256...</p>
                <p>> ESTABLISHING_TEMPORAL_BRIDGE...</p>
                <p>> ROUTING_THRU_OCN_NODE_12...</p>
                <p style="color:var(--cyan); transition: 1s;">> STATUS: TRANSMISSION_COMPLETE</p>
                <p>> PACKET_ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                <br>
                <button class="win-btn" onclick="resetUplink()" style="width:100%; height:35px; background:rgba(0,242,255,0.1); border:1px solid var(--cyan); color:#fff; cursor:pointer;">RESET_CHANNEL</button>
            </div>
        `;
        // Store original content for reset
        panelBody.dataset.original = originalContent;
        panelBody.scrollTop = 0;
    }, 1500);
}


// 6. GALLERY LIGHTBOX & MAGNIFIER
function openLightbox(src) {
    const modal = document.getElementById('lightbox-modal');
    const imgInfo = document.getElementById('lightbox-img');
    const lens = document.getElementById('magnifier-lens');

    if (!modal || !imgInfo) return;

    imgInfo.src = src;
    modal.classList.add('active'); // Use class for flex display

    // Setup Magnifier
    imgInfo.onload = () => {
        lens.style.backgroundImage = `url('${src}')`;
        // Recalculate size if needed or just use consistent sizing
    };

    // Add mouse move listener
    const wrapper = document.querySelector('.lightbox-content-wrapper');
    wrapper.addEventListener('mousemove', handleMagnifier);
    wrapper.addEventListener('mouseenter', () => lens.style.display = 'block');
    wrapper.addEventListener('mouseleave', () => lens.style.display = 'none');
}

function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) modal.classList.remove('active');
}

function handleMagnifier(e) {
    const lens = document.getElementById('magnifier-lens');
    const img = document.getElementById('lightbox-img');

    if (!lens || !img) return;

    const bounds = img.getBoundingClientRect();

    // Calculate cursor position relative to the image
    let x = e.clientX - bounds.left;
    let y = e.clientY - bounds.top;

    // Prevent lens from going out of bounds (Visual only, logic handles bg pos)
    // Actually, let's just track the cursor directly but clip calculation?
    // Better: Check if cursor is strictly within image bounds
    if (x < 0 || x > bounds.width || y < 0 || y > bounds.height) {
        lens.style.display = 'none';
        return;
    } else {
        lens.style.display = 'block';
    }

    // Lens Position (Centered on cursor)
    lens.style.left = (x - lens.offsetWidth / 2) + 'px';
    lens.style.top = (y - lens.offsetHeight / 2) + 'px';

    /* ZOOM CALCULATION (3x Magnifiction) */
    /* 
       The backgroun-size needs to be (Image Width * Zoom) x (Image Height * Zoom).
       The background-position needs to shift in opposite direction to show the zoomed area.
    */
    const zoomLevel = 2.5;

    lens.style.backgroundSize = (bounds.width * zoomLevel) + "px " + (bounds.height * zoomLevel) + "px";

    // Calculate offset
    // - (x * zoom) + (lensW / 2)  -- Standard formula adjusted for lens centering
    const bgX = -(x * zoomLevel) + (lens.offsetWidth / 2);
    const bgY = -(y * zoomLevel) + (lens.offsetHeight / 2);

    lens.style.backgroundPosition = bgX + "px " + bgY + "px";
}

// Close on outside click
window.onclick = function (event) {
    const modal = document.getElementById('lightbox-modal');
    if (event.target === modal) {
        closeLightbox();
    }
}
