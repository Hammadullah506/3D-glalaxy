/**
 * 3D GALAXY PORTFOLIO ENGINE & INTERACTIVE CONTROLLER
 * Author: Hammadullah
 * Tech Stack: Three.js, WebGL, Web Audio API, Vanilla JS
 */

// Global App State
const state = {
    audioEnabled: false,
    warpActive: false,
    currentTheme: 'andromeda',
    rotationSpeedMultiplier: 1.0,
    activeSection: 'hero',
    mouseX: 0,
    mouseY: 0,
    targetMouseX: 0,
    targetMouseY: 0
};

// Galaxy Generation Parameters
const galaxyParams = {
    count: 35000,
    size: 0.045,
    radius: 14,
    branches: 4,
    spin: 1.2,
    randomness: 0.5,
    power: 3.5,
    insideColor: '#c084fc',
    outsideColor: '#38bdf8',
    coreColor: '#ffffff'
};

// Theme Color Definitions
const THEMES = {
    andromeda: {
        insideColor: '#c084fc',
        outsideColor: '#38bdf8',
        coreColor: '#ffffff',
        speed: 1.0
    },
    supernova: {
        insideColor: '#fbbf24',
        outsideColor: '#ec4899',
        coreColor: '#ffffff',
        speed: 1.3
    },
    cyber: {
        insideColor: '#38bdf8',
        outsideColor: '#6366f1',
        coreColor: '#a7f3d0',
        speed: 1.1
    },
    singularity: {
        insideColor: '#8b5cf6',
        outsideColor: '#1e1b4b',
        coreColor: '#4c1d95',
        speed: 0.8
    },
    aurora: {
        insideColor: '#34d399',
        outsideColor: '#06b6d4',
        coreColor: '#ecfdf5',
        speed: 0.9
    },
    gold: {
        insideColor: '#fde047',
        outsideColor: '#b45309',
        coreColor: '#ffffff',
        speed: 1.0
    }
};

// Camera Section choreography targets
const cameraTargets = {
    hero: { x: 0, y: 3.2, z: 7.5, rotX: -0.35, rotY: 0 },
    about: { x: 1.8, y: 1.5, z: 4.8, rotX: -0.2, rotY: 0.25 },
    projects: { x: -2.8, y: 2.2, z: 6.2, rotX: -0.28, rotY: -0.3 },
    skills: { x: 0, y: 6.8, z: 3.8, rotX: -0.9, rotY: 0 },
    contact: { x: 2.2, y: -0.8, z: 5.8, rotX: 0.1, rotY: 0.3 }
};

let currentCameraPos = { x: 0, y: 3.2, z: 7.5 };
let currentCameraRot = { x: -0.35, y: 0 };

/* ==========================================================================
   THREE.JS 3D GALAXY SCENE SETUP
   ========================================================================== */

const canvas = document.getElementById('galaxy-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(currentCameraPos.x, currentCameraPos.y, currentCameraPos.z);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Helper: Generate circular glow star sprite texture dynamically
function createStarTexture() {
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 64;
    starCanvas.height = 64;
    const ctx = starCanvas.getContext('2d');

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(230, 240, 255, 0.85)');
    gradient.addColorStop(0.5, 'rgba(167, 139, 250, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(starCanvas);
    return texture;
}

const starTexture = createStarTexture();

// Galaxy Objects & Geometries
let galaxyGeometry = null;
let galaxyMaterial = null;
let galaxyPoints = null;

let bgStarsGeometry = null;
let bgStarsMaterial = null;
let bgStarsPoints = null;

// Core singularity glowing ring
let coreMesh = null;

function generateGalaxy() {
    // Clean up previous geometry & materials if existing
    if (galaxyPoints !== null) {
        galaxyGeometry.dispose();
        galaxyMaterial.dispose();
        scene.remove(galaxyPoints);
    }
    if (coreMesh !== null) {
        coreMesh.geometry.dispose();
        coreMesh.material.dispose();
        scene.remove(coreMesh);
    }

    const { count, size, radius, branches, spin, randomness, power, insideColor, outsideColor, coreColor } = galaxyParams;

    galaxyGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const colorInside = new THREE.Color(insideColor);
    const colorOutside = new THREE.Color(outsideColor);
    const colorCore = new THREE.Color(coreColor);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        // Radius with exponential density distribution towards core
        const r = Math.pow(Math.random(), power) * radius;

        // Branch angle
        const branchAngle = ((i % branches) / branches) * Math.PI * 2;

        // Spin angle that curves more with radius
        const spinAngle = r * spin;

        // Random dispersion
        const randomX = Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1) * randomness * (r * 0.4 + 0.1);
        const randomY = Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1) * randomness * (r * 0.25 + 0.05);
        const randomZ = Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1) * randomness * (r * 0.4 + 0.1);

        positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

        // Color interpolation: Core -> Inside -> Outside
        const mixedColor = colorInside.clone();
        if (r < radius * 0.15) {
            mixedColor.lerp(colorCore, 1 - (r / (radius * 0.15)));
        } else {
            mixedColor.lerp(colorOutside, (r / radius));
        }

        // Add subtle color noise
        mixedColor.r += (Math.random() - 0.5) * 0.05;
        mixedColor.g += (Math.random() - 0.5) * 0.05;
        mixedColor.b += (Math.random() - 0.5) * 0.05;

        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;

        // Vary particle scales
        scales[i] = (Math.random() * 0.6 + 0.7);
    }

    galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    galaxyGeometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    galaxyMaterial = new THREE.PointsMaterial({
        size: size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        map: starTexture,
        transparent: true,
        opacity: 0.92
    });

    galaxyPoints = new THREE.Points(galaxyGeometry, galaxyMaterial);
    scene.add(galaxyPoints);

    // Singularity center glowing sphere
    const coreGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
        color: colorCore,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
    });
    coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);
}

// Background Distant Starfield Generation
function generateBackgroundStars() {
    const bgCount = 4000;
    bgStarsGeometry = new THREE.BufferGeometry();
    const bgPositions = new Float32Array(bgCount * 3);
    const bgColors = new Float32Array(bgCount * 3);

    for (let i = 0; i < bgCount; i++) {
        const i3 = i * 3;
        // Distribute on large spherical field
        const r = 35 + Math.random() * 45;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);

        bgPositions[i3] = r * Math.sin(phi) * Math.cos(theta);
        bgPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        bgPositions[i3 + 2] = r * Math.cos(phi);

        const brightness = Math.random() * 0.6 + 0.4;
        bgColors[i3] = brightness * 0.9;
        bgColors[i3 + 1] = brightness * 0.95;
        bgColors[i3 + 2] = brightness * 1.0;
    }

    bgStarsGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    bgStarsGeometry.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));

    bgStarsMaterial = new THREE.PointsMaterial({
        size: 0.035,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        map: starTexture,
        transparent: true,
        opacity: 0.75
    });

    bgStarsPoints = new THREE.Points(bgStarsGeometry, bgStarsMaterial);
    scene.add(bgStarsPoints);
}

generateGalaxy();
generateBackgroundStars();

/* ==========================================================================
   ANIMATION & RENDER LOOP
   ========================================================================== */

const clock = new THREE.Clock();
let baseRotationSpeed = 0.0006;
let currentRotationSpeed = baseRotationSpeed;
let targetFOV = 60;

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Rotation with warp speed and HUD speed multiplier
    const targetSpeed = (state.warpActive ? 0.015 : baseRotationSpeed) * state.rotationSpeedMultiplier;
    currentRotationSpeed = THREE.MathUtils.lerp(currentRotationSpeed, targetSpeed, 0.05);

    if (galaxyPoints) {
        galaxyPoints.rotation.y += currentRotationSpeed;
        // Subtle vertical wobble
        galaxyPoints.rotation.z = Math.sin(elapsedTime * 0.2) * 0.04;
    }

    if (bgStarsPoints) {
        bgStarsPoints.rotation.y += currentRotationSpeed * 0.2;
    }

    if (coreMesh) {
        const pulse = 1 + Math.sin(elapsedTime * 3) * 0.12;
        coreMesh.scale.set(pulse, pulse, pulse);
    }

    // Smooth Mouse Parallax
    state.mouseX = THREE.MathUtils.lerp(state.mouseX, state.targetMouseX, 0.05);
    state.mouseY = THREE.MathUtils.lerp(state.mouseY, state.targetMouseY, 0.05);

    // Smooth Camera Choreography to Active Section
    const target = cameraTargets[state.activeSection] || cameraTargets.hero;
    currentCameraPos.x = THREE.MathUtils.lerp(currentCameraPos.x, target.x + state.mouseX * 0.8, 0.04);
    currentCameraPos.y = THREE.MathUtils.lerp(currentCameraPos.y, target.y + state.mouseY * 0.8, 0.04);
    currentCameraPos.z = THREE.MathUtils.lerp(currentCameraPos.z, target.z, 0.04);

    camera.position.set(currentCameraPos.x, currentCameraPos.y, currentCameraPos.z);
    camera.lookAt(state.mouseX * 0.3, state.mouseY * 0.3, 0);

    // Warp FOV kick
    const fovGoal = state.warpActive ? 85 : 60;
    targetFOV = THREE.MathUtils.lerp(targetFOV, fovGoal, 0.08);
    if (Math.abs(camera.fov - targetFOV) > 0.1) {
        camera.fov = targetFOV;
        camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
}

animate();

/* ==========================================================================
   EVENT LISTENERS & WINDOW RESIZE
   ========================================================================== */

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener('mousemove', (e) => {
    state.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    state.targetMouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
});

// Device Orientation for Mobile Gyro Parallax
window.addEventListener('deviceorientation', (e) => {
    if (e.gamma !== null && e.beta !== null) {
        state.targetMouseX = (e.gamma / 45);
        state.targetMouseY = (e.beta / 45);
    }
});

// Touch Parallax Support
window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        const touch = e.touches[0];
        state.targetMouseX = (touch.clientX / window.innerWidth - 0.5) * 2;
        state.targetMouseY = -(touch.clientY / window.innerHeight - 0.5) * 2;
    }
}, { passive: true });

/* ==========================================================================
   SECTION INTERSECTION OBSERVER & ACTIVE NAV
   ========================================================================== */

const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');
const mainNav = document.getElementById('main-nav');

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('id');
            state.activeSection = sectionId;

            // Update Nav Active class
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href === `#${sectionId}`) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
    });
}, {
    threshold: 0.35
});

sections.forEach(sec => sectionObserver.observe(sec));

// Navbar Scrolled Glass State
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        mainNav.classList.add('scrolled');
    } else {
        mainNav.classList.remove('scrolled');
    }
});

/* ==========================================================================
   DYNAMIC TYPEWRITER EFFECT (HERO)
   ========================================================================== */

const typewriterEl = document.getElementById('typewriter-text');
const roles = [
    'Creative 3D Web Developer',
    'Full-Stack Software Engineer',
    'Three.js & WebGL Craftsman',
    'Interactive UI/UX Specialist',
    'React & Modern JavaScript Engineer'
];

let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeSpeed = 90;

function typeWriter() {
    const currentRole = roles[roleIndex];

    if (isDeleting) {
        typewriterEl.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 40;
    } else {
        typewriterEl.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
        typeSpeed = 90;
    }

    if (!isDeleting && charIndex === currentRole.length) {
        isDeleting = true;
        typeSpeed = 1800; // Pause at end of text
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        typeSpeed = 400;
    }

    setTimeout(typeWriter, typeSpeed);
}

if (typewriterEl) {
    setTimeout(typeWriter, 800);
}

/* ==========================================================================
   PROJECTS CATEGORY FILTER
   ========================================================================== */

const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');

        projectCards.forEach(card => {
            const category = card.getAttribute('data-category');
            if (filter === 'all' || category === filter) {
                card.style.display = 'flex';
                card.style.animation = 'fadeInScale 0.4s ease forwards';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

/* ==========================================================================
   WEB AUDIO API SYNTHESIZER (COSMIC AMBIENT DRONE & SFX)
   ========================================================================== */

let audioCtx = null;
let masterGain = null;
let osc1 = null;
let osc2 = null;
let filterNode = null;
let lfo = null;
let lfoGain = null;

function initAudio() {
    if (audioCtx !== null) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    // Ambient Lowpass Filter
    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(280, audioCtx.currentTime);
    filterNode.Q.setValueAtTime(4.0, audioCtx.currentTime);
    filterNode.connect(masterGain);

    // Deep Sub Oscillator 1 (D2 ~ 73.4Hz)
    osc1 = audioCtx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(73.4, audioCtx.currentTime);

    // Detuned Warm Oscillator 2 (A2 ~ 110Hz detuned)
    osc2 = audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(110.5, audioCtx.currentTime);

    // LFO for breathing filter sweep
    lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, audioCtx.currentTime);

    lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(90, audioCtx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filterNode.frequency);

    osc1.connect(filterNode);
    osc2.connect(filterNode);

    osc1.start();
    osc2.start();
    lfo.start();
}

function playWarpSound() {
    if (!audioCtx || !state.audioEnabled) return;

    try {
        const sweepOsc = audioCtx.createOscillator();
        const sweepGain = audioCtx.createGain();

        sweepOsc.type = 'sawtooth';
        sweepOsc.frequency.setValueAtTime(120, audioCtx.currentTime);
        sweepOsc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 1.2);
        sweepOsc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 3.0);

        sweepGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
        sweepGain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.4);
        sweepGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.0);

        sweepOsc.connect(sweepGain);
        sweepGain.connect(masterGain);

        sweepOsc.start();
        sweepOsc.stop(audioCtx.currentTime + 3.0);
    } catch (e) {
        console.warn('Audio sweep error', e);
    }
}

const audioToggleBtn = document.getElementById('audio-toggle');
if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
        initAudio();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        state.audioEnabled = !state.audioEnabled;

        if (state.audioEnabled) {
            masterGain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 1.5);
            audioToggleBtn.classList.add('active');
            showToast('🎵 Cosmic ambient synthesizer activated');
        } else {
            masterGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
            audioToggleBtn.classList.remove('active');
            showToast('🔇 Audio muted');
        }
    });
}

/* ==========================================================================
   WARP SPEED / HYPERSPACE JUMP
   ========================================================================== */

function triggerWarpJump() {
    if (state.warpActive) return;
    state.warpActive = true;
    playWarpSound();
    showToast('⚡ HYPERSPACE JUMP INITIATED!');

    const warpBtn = document.getElementById('warp-btn');
    if (warpBtn) warpBtn.style.boxShadow = '0 0 40px #38bdf8';

    setTimeout(() => {
        state.warpActive = false;
        if (warpBtn) warpBtn.style.boxShadow = '';
    }, 3200);
}

const warpBtn = document.getElementById('warp-btn');
if (warpBtn) {
    warpBtn.addEventListener('click', triggerWarpJump);
}

const hudWarpBtn = document.getElementById('hud-warp-trigger');
if (hudWarpBtn) {
    hudWarpBtn.addEventListener('click', triggerWarpJump);
}

/* ==========================================================================
   GALAXY HUD CONTROLLER (THEMES & SLIDERS)
   ========================================================================== */

const hudToggleBtn = document.getElementById('hud-toggle');
const hudPanel = document.getElementById('hud-panel');
const hudCloseBtn = document.getElementById('hud-close');
const heroCustomGalaxyBtn = document.getElementById('hero-custom-galaxy-btn');

function toggleHud(open) {
    if (open !== undefined) {
        hudPanel.classList.toggle('open', open);
    } else {
        hudPanel.classList.toggle('open');
    }
}

if (hudToggleBtn) {
    hudToggleBtn.addEventListener('click', () => toggleHud());
}
if (hudCloseBtn) {
    hudCloseBtn.addEventListener('click', () => toggleHud(false));
}
if (heroCustomGalaxyBtn) {
    heroCustomGalaxyBtn.addEventListener('click', () => toggleHud(true));
}

// Preset Theme Switcher
const presetBtns = document.querySelectorAll('.preset-btn');
presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const themeName = btn.getAttribute('data-theme');
        const theme = THEMES[themeName];
        if (theme) {
            galaxyParams.insideColor = theme.insideColor;
            galaxyParams.outsideColor = theme.outsideColor;
            galaxyParams.coreColor = theme.coreColor;
            generateGalaxy();
            showToast(`🌀 Galaxy Preset: ${btn.textContent.trim()}`);
        }
    });
});

// Speed Slider
const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
if (speedSlider) {
    speedSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.rotationSpeedMultiplier = val;
        speedVal.textContent = `${val.toFixed(1)}x`;
    });
}

// Star Size Slider
const sizeSlider = document.getElementById('size-slider');
const sizeVal = document.getElementById('size-val');
if (sizeSlider) {
    sizeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        galaxyParams.size = val;
        if (galaxyMaterial) {
            galaxyMaterial.size = val;
            galaxyMaterial.needsUpdate = true;
        }
        sizeVal.textContent = val.toFixed(2);
    });
}

// Spiral Arms Slider
const armsSlider = document.getElementById('arms-slider');
const armsVal = document.getElementById('arms-val');
if (armsSlider) {
    armsSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        galaxyParams.branches = val;
        armsVal.textContent = val;
        generateGalaxy();
    });
}

// Reset Camera Button
const resetCameraBtn = document.getElementById('hud-reset-camera');
if (resetCameraBtn) {
    resetCameraBtn.addEventListener('click', () => {
        state.targetMouseX = 0;
        state.targetMouseY = 0;
        state.mouseX = 0;
        state.mouseY = 0;
        currentCameraPos = { x: 0, y: 3.2, z: 7.5 };
        camera.position.set(0, 3.2, 7.5);
        camera.lookAt(0, 0, 0);
        showToast('↺ Galaxy camera perspective reset');
    });
}

/* ==========================================================================
   MOBILE MENU TOGGLE
   ========================================================================== */

const mobileToggle = document.getElementById('mobile-toggle');
const navLinksContainer = document.getElementById('nav-links');

if (mobileToggle && navLinksContainer) {
    mobileToggle.addEventListener('click', () => {
        navLinksContainer.classList.toggle('open');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinksContainer.classList.remove('open');
        });
    });
}

/* ==========================================================================
   COPY EMAIL & CONTACT FORM SYSTEM
   ========================================================================== */

const copyEmailBtn = document.getElementById('copy-email-btn');
if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
        const email = 'hammadullahnasseb@gmail.com';
        navigator.clipboard.writeText(email).then(() => {
            copyEmailBtn.textContent = 'Copied! ✓';
            copyEmailBtn.style.background = '#10b981';
            copyEmailBtn.style.color = '#000';
            showToast('📋 Email copied to clipboard: ' + email);

            setTimeout(() => {
                copyEmailBtn.textContent = 'Copy';
                copyEmailBtn.style.background = '';
                copyEmailBtn.style.color = '';
            }, 2500);
        }).catch(() => {
            showToast('Email: ' + email);
        });
    });
}

const contactForm = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('form-name').value;
        const email = document.getElementById('form-email').value;
        const subject = document.getElementById('form-subject').value;
        const message = document.getElementById('form-message').value;

        if (!name || !email || !message) {
            showToast('⚠️ Please complete all required fields.');
            return;
        }

        // Animate Button state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Transmitting...</span> <span>⏳</span>';
        }

        setTimeout(() => {
            // Success response
            showToast(`🚀 Signal received! Thank you, ${name}. I will reply shortly.`);
            contactForm.reset();

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Transmitted Successfully! ✓</span>';
                setTimeout(() => {
                    submitBtn.innerHTML = '<span>Transmit Message</span> <span>🚀</span>';
                }, 3000);
            }
        }, 1200);
    });
}

/* ==========================================================================
   TOAST NOTIFICATION HELPER
   ========================================================================== */

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}
