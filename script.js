import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 5;

const canvas = document.getElementById('galaxy-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const particleCount = 6000;
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

const color1 = new THREE.Color('#a78bfa'); // purple
const color2 = new THREE.Color('#ffffff'); // white

for (let i = 0; i < particleCount; i++) {
    const radius = Math.random() * 25;
    const spinAngle = radius * 0.3;
    const branchAngle = ((i % 3) / 3) * Math.PI * 2;

    const randomX = (Math.random() - 0.5) * 2;
    const randomY = (Math.random() - 0.5) * 2;
    const randomZ = (Math.random() - 0.5) * 2;

    const x = Math.cos(branchAngle + spinAngle) * radius + randomX;
    const y = randomY * 0.5;
    const z = Math.sin(branchAngle + spinAngle) * radius + randomZ;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const mixedColor = color1.clone().lerp(color2, Math.random());
    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const galaxy = new THREE.Points(geometry, material);
scene.add(galaxy);

function animate() {
    requestAnimationFrame(animate);
    galaxy.rotation.y += 0.0008;
    renderer.render(scene, camera)
    for (let i = 0; i < particleCount; i++) {
        const index = i * 3;
        const x = positions[index];
        const z = positions[index + 2];
        const radius = Math.sqrt(x * x + z * z);
        const spinAngle = radius * 0.3;
        const branchAngle = ((i % 3) / 3) * Math.PI * 2;
}};

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    requestAnimationFrame(animate);
});
