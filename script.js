/* --- OCN VISUAL CORE --- */

let zIndex = 100;

// 1. BOOT SEQUENCE & CLOCK
window.onload = () => {
    setInterval(() => {
        const now = new Date();
        document.getElementById('sys-time').innerText = now.toLocaleTimeString([], { hour12: false });
    }, 1000);

    setTimeout(() => {
        const boot = document.getElementById('boot-screen');
        boot.style.opacity = '0';
        setTimeout(() => {
            boot.style.display = 'none';
            initParticles();
            toggleWindow('win-landing');
        }, 800);
    }, 1500);
};

// 2. DATA REVEAL ENGINE (Robust Reveal with Markdown support)
let consoleTimers = {}; // Store { consoleId: { timeout, interval } }
let searchStates = {}; // { consoleId: { currentIdx, matches } }

function revealData(consoleId, dataId, triggerEl) {
    const consoleEl = document.getElementById(consoleId);
    const consoleBox = consoleEl.closest('.console-box');
    const dataEl = document.getElementById(dataId);
    if (!dataEl) return;

    // Use textContent - innerText returns flattened text for hidden elements
    let rawText = dataEl.textContent || "";
    // Clean indentation while preserving newlines
    rawText = rawText.split('\n').map(l => l.replace(/^\s+/, "")).join('\n').trim();

    let markdownHTML = "";
    if (typeof marked !== 'undefined') {
        const md = (typeof marked.parse === 'function') ? marked.parse : (typeof marked === 'function' ? marked : null);
        if (md) {
            markdownHTML = (md === marked.parse) ? marked.parse(rawText, { gfm: true, breaks: true }) : md(rawText, { gfm: true, breaks: true });
        }
    }

    // Fallback if marked is missing or fails
    if (!markdownHTML) {
        markdownHTML = rawText.replace(/\n/g, '<br>');
    }

    if (consoleTimers[consoleId]) {
        clearTimeout(consoleTimers[consoleId].timeout);
        clearInterval(consoleTimers[consoleId].interval);
    }
    consoleTimers[consoleId] = { timeout: null, interval: null };

    const siblings = triggerEl.parentElement.children;
    for (let s of siblings) s.classList.remove('selected');
    triggerEl.classList.add('selected');

    consoleBox.classList.remove('active');
    consoleEl.innerHTML = "<span style='color:var(--cyan); opacity:0.5;'>[INITIATING_DECRYPTION]...</span>";
    consoleEl.dataset.originalHtml = ""; // Clear search backup
    if (searchStates[consoleId]) {
        if (searchStates[consoleId].winId) {
            const countEl = document.getElementById(`search-count-${searchStates[consoleId].winId}`);
            if (countEl) countEl.innerText = "";
        }
        searchStates[consoleId] = { currentIdx: -1, matches: [] };
    }

    consoleTimers[consoleId].timeout = setTimeout(() => {
        consoleBox.classList.add('active');
        consoleEl.innerHTML = "";
        let i = 0;
        consoleTimers[consoleId].interval = setInterval(() => {
            if (i >= markdownHTML.length) {
                clearInterval(consoleTimers[consoleId].interval);
                return;
            }
            if (markdownHTML[i] === '<') {
                const tagEnd = markdownHTML.indexOf('>', i);
                if (tagEnd !== -1) {
                    consoleEl.innerHTML += markdownHTML.substring(i, tagEnd + 1);
                    i = tagEnd + 1;
                } else {
                    consoleEl.innerHTML += markdownHTML[i++];
                }
            } else if (markdownHTML[i] === '&') {
                const entityEnd = markdownHTML.indexOf(';', i);
                if (entityEnd !== -1 && entityEnd - i < 10) {
                    consoleEl.innerHTML += markdownHTML.substring(i, entityEnd + 1);
                    i = entityEnd + 1;
                } else {
                    consoleEl.innerHTML += markdownHTML[i++];
                }
            } else {
                consoleEl.innerHTML += markdownHTML[i++];
            }
            consoleBox.scrollTop = consoleBox.scrollHeight;
        }, 3);
    }, 300);
}

// 3. WINDOW MANAGER
function toggleWindow(id) {
    const win = document.getElementById(id);
    const allWindows = document.querySelectorAll('.window');

    if (win.classList.contains('active')) {
        win.classList.remove('active');
    } else {
        // Fade others and bring this to focus
        allWindows.forEach(w => w.classList.add('faded'));
        win.classList.remove('faded');
        win.classList.add('active');
        win.style.zIndex = ++zIndex;

        // Prevent Overlap (Smart Positioning if spawned nearby)
        smartPosition(win);
    }
}

function smartPosition(win) {
    const others = Array.from(document.querySelectorAll('.window.active')).filter(w => w !== win);
    let rect = win.getBoundingClientRect();

    others.forEach(other => {
        let oRect = other.getBoundingClientRect();
        // Check for intersection
        if (!(rect.right < oRect.left || rect.left > oRect.right || rect.bottom < oRect.top || rect.top > oRect.bottom)) {
            // Overlapping! Nudge the new one by 30px
            win.style.left = (rect.left + 30) + 'px';
            win.style.top = (rect.top + 30) + 'px';
        }
    });
}

document.querySelectorAll('.window').forEach(win => {
    const header = win.querySelector('.win-header');
    win.addEventListener('mousedown', () => {
        document.querySelectorAll('.window').forEach(w => w.classList.add('faded'));
        win.classList.remove('faded');
        win.style.zIndex = ++zIndex;
    });

    header.onmousedown = function (e) {
        if (e.target.closest('.win-controls')) return; // Don't drag from buttons
        e.preventDefault();
        let shiftX = e.clientX - win.getBoundingClientRect().left;
        let shiftY = e.clientY - win.getBoundingClientRect().top;

        function onMouseMove(event) {
            win.style.left = event.pageX - shiftX + 'px';
            win.style.top = event.pageY - shiftY + 'px';
        }

        document.addEventListener('mousemove', onMouseMove);

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mouseup', onMouseUp);
    };
});

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

// 5. RESIZE & SEARCH SYSTEM
function initResize(e, id) {
    e.preventDefault();
    const win = document.getElementById(id);
    const startWidth = win.offsetWidth;
    const startHeight = win.offsetHeight;
    const startX = e.clientX;
    const startY = e.clientY;

    function onMouseMove(event) {
        win.style.width = startWidth + event.clientX - startX + 'px';
        win.style.height = startHeight + event.clientY - startY + 'px';
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function toggleSearch(winId) {
    const searchBar = document.getElementById(`search-${winId}`);
    searchBar.classList.toggle('active');
    if (searchBar.classList.contains('active')) {
        searchBar.querySelector('input').focus();
    }
}

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

// 6. UPLINK SYSTEM
function transmitUplink() {
    const btn = document.querySelector('.btn-activate');
    const form = document.querySelector('.tech-form');
    const winBody = form.closest('.win-body');
    const originalContent = winBody.innerHTML;

    btn.innerText = "ENCRYPTING...";
    btn.style.opacity = "0.5";
    btn.disabled = true;

    setTimeout(() => {
        winBody.innerHTML = `
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
        winBody.dataset.original = originalContent;
        winBody.scrollTop = 0;
    }, 1500);
}

function resetUplink() {
    const winBody = document.querySelector('#win-comm .win-body');
    if (winBody.dataset.original) {
        winBody.innerHTML = winBody.dataset.original;
    }
}