/* ================================================================
   NexaForce v2 — three-bg.js
   Shared Three.js background scene
   ================================================================ */

'use strict';

function initThreeJS(canvasId, opacity) {
  if (canvasId === undefined) canvasId = 'bg-canvas';
  if (opacity  === undefined) opacity  = 1.0;

  if (typeof THREE === 'undefined') return null;

  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.position.z = 55;

  // ── Coloured Star Field ──────────────────────────────────────
  const starCount = 7000;
  const positions = new Float32Array(starCount * 3);
  const colors    = new Float32Array(starCount * 3);

  const palette = [
    [0.49, 0.23, 0.93],  // purple
    [0.02, 0.71, 0.83],  // cyan
    [0.93, 0.28, 0.60],  // pink
    [1.00, 1.00, 1.00],  // white
  ];

  for (let i = 0; i < starCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 500;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 500;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 500;
    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3]     = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      size:           0.4,
      sizeAttenuation: true,
      vertexColors:   true,
      transparent:    true,
      opacity:        0.75 * opacity,
    })
  );
  scene.add(stars);

  // ── Torus Knot ──────────────────────────────────────────────
  const tkGeo = new THREE.TorusKnotGeometry(18, 5, 128, 16);
  const tkMat = new THREE.MeshBasicMaterial({
    color: 0x7c3aed, wireframe: true, transparent: true, opacity: 0.12 * opacity,
  });
  const torusKnot = new THREE.Mesh(tkGeo, tkMat);
  torusKnot.position.set(40, -10, -60);
  scene.add(torusKnot);

  // ── Icosahedron ─────────────────────────────────────────────
  const icoGeo = new THREE.IcosahedronGeometry(10, 1);
  const icoMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.14 * opacity,
  });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  ico.position.set(-45, 20, -50);
  scene.add(ico);

  // ── Octahedron ──────────────────────────────────────────────
  const octGeo = new THREE.OctahedronGeometry(7, 0);
  const octMat = new THREE.MeshBasicMaterial({
    color: 0xec4899, wireframe: true, transparent: true, opacity: 0.10 * opacity,
  });
  const oct = new THREE.Mesh(octGeo, octMat);
  oct.position.set(0, 30, -40);
  scene.add(oct);

  // ── Mouse Parallax ───────────────────────────────────────────
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ── Animate ──────────────────────────────────────────────────
  const clock = new THREE.Clock();
  let animId;

  (function animate() {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    stars.rotation.y = t * 0.008;
    stars.rotation.x = t * 0.004;

    torusKnot.rotation.x = t * 0.08;
    torusKnot.rotation.y = t * 0.06;

    ico.rotation.x = t * 0.12;
    ico.rotation.y = t * 0.09;

    oct.rotation.x = t * 0.15;
    oct.rotation.z = t * 0.10;

    camera.position.x += (mouseX * 4  - camera.position.x) * 0.04;
    camera.position.y += (-mouseY * 3 - camera.position.y) * 0.04;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  })();

  // ── Resize ───────────────────────────────────────────────────
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    scene,
    camera,
    renderer,
    dispose: function () {
      cancelAnimationFrame(animId);
      renderer.dispose();
    },
  };
}
