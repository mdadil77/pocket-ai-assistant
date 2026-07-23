// ---------- 3D AVATAR ENGINE (Three.js r128) ----------
let scene, camera, renderer, clock;
const characters = {};
let activeCharacter = 'robot';
const animState = { gesture: null, gestureTimer: 0 };

function initThreeStage() {
  const canvas = document.getElementById('avatar-canvas');
  const width = canvas.clientWidth || 130;
  const height = canvas.clientHeight || 160;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
  camera.position.set(0, 1.35, 6.4);
  camera.lookAt(0, 1.1, 0);

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const key = new THREE.DirectionalLight(0xfff2df, 1.15);
  key.position.set(2, 4, 3);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8899ff, 0.3);
  fill.position.set(-3, 1, -2);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0x554433, 0.6));

  characters.robot = buildRobot();
  characters.girl = buildGirl();
  characters.boy = buildBoy();

  Object.entries(characters).forEach(([name, group]) => {
    group.visible = name === activeCharacter;
    scene.add(group);
  });

  clock = new THREE.Clock();
  animate();
}

function makeLimb(radiusTop, radiusBottom, length, color, metalness = 0.1, roughness = 0.6) {
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 12);
  const mat = new THREE.MeshStandardMaterial({ color, metalness, roughness });
  return new THREE.Mesh(geo, mat);
}

function buildRobot() {
  const g = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({ color: 0xf3ead9, metalness: 0.3, roughness: 0.4 });
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a231d, metalness: 0.4, roughness: 0.35 });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x39ff8a, emissive: 0x1d8a4d, emissiveIntensity: 0.9 });

  const head = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 1.0), shellMat);
  head.position.y = 2.0;
  g.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.12), new THREE.MeshStandardMaterial({ color: 0x0c0a08 }));
  visor.position.set(0, 2.02, 0.51);
  g.add(visor);

  const eyeGeo = new THREE.SphereGeometry(0.09, 12, 12);
  const eyeL = new THREE.Mesh(eyeGeo, glowMat); eyeL.position.set(-0.22, 2.05, 0.6);
  const eyeR = new THREE.Mesh(eyeGeo, glowMat); eyeR.position.set(0.22, 2.05, 0.6);
  g.add(eyeL, eyeR);
  g.userData.eyes = [eyeL, eyeR];

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.05), glowMat);
  mouth.position.set(0, 1.86, 0.6);
  g.add(mouth);
  g.userData.mouth = mouth;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.3, 8), bodyMat);
  torso.position.y = 1.0;
  g.add(torso);

  const chestLight = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), glowMat);
  chestLight.position.set(0, 1.15, 0.62);
  g.add(chestLight);

  const armL = makeLimb(0.13, 0.13, 0.95, 0xf3ead9); armL.position.set(-0.72, 1.15, 0); armL.rotation.z = 0.25;
  const armR = makeLimb(0.13, 0.13, 0.95, 0xf3ead9); armR.position.set(0.72, 1.15, 0); armR.rotation.z = -0.25;
  g.add(armL, armR);
  g.userData.armL = armL; g.userData.armR = armR;

  const legL = makeLimb(0.16, 0.16, 0.7, 0x2a231d); legL.position.set(-0.28, 0.15, 0);
  const legR = makeLimb(0.16, 0.16, 0.7, 0x2a231d); legR.position.set(0.28, 0.15, 0);
  g.add(legL, legR);

  return g;
}

function buildGirl() {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xf3c9a3, roughness: 0.5 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x5c1f2e, roughness: 0.4 });
  const dressMat = new THREE.MeshStandardMaterial({ color: 0xc9578a, roughness: 0.55 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 20), skin);
  head.position.y = 2.05;
  g.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.56, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
  hair.position.y = 2.15;
  g.add(hair);

  const ponytail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.9, 10), hairMat);
  ponytail.position.set(0, 1.75, -0.45);
  ponytail.rotation.x = 0.5;
  g.add(ponytail);

  const eyeGeo = new THREE.SphereGeometry(0.075, 10, 10);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x241a15 });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.18, 2.08, 0.44);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.18, 2.08, 0.44);
  g.add(eyeL, eyeR);
  g.userData.eyes = [eyeL, eyeR];

  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0xb3405a }));
  mouth.position.set(0, 1.92, 0.47);
  mouth.rotation.z = Math.PI;
  g.add(mouth);
  g.userData.mouth = mouth;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 1.1, 12), dressMat);
  torso.position.y = 1.15;
  g.add(torso);

  const armL = makeLimb(0.09, 0.09, 0.85, 0xf3c9a3, 0, 0.5); armL.position.set(-0.55, 1.3, 0); armL.rotation.z = 0.3;
  const armR = makeLimb(0.09, 0.09, 0.85, 0xf3c9a3, 0, 0.5); armR.position.set(0.55, 1.3, 0); armR.rotation.z = -0.3;
  g.add(armL, armR);
  g.userData.armL = armL; g.userData.armR = armR;

  const legL = makeLimb(0.12, 0.12, 0.75, 0x3a1a22); legL.position.set(-0.22, 0.2, 0);
  const legR = makeLimb(0.12, 0.12, 0.75, 0x3a1a22); legR.position.set(0.22, 0.2, 0);
  g.add(legL, legR);

  return g;
}

function buildBoy() {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xe3ad81, roughness: 0.5 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x171310, roughness: 0.4 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x6fa3c9, roughness: 0.55 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 20), skin);
  head.position.y = 2.05;
  g.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.54, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hair.position.y = 2.2;
  g.add(hair);

  const eyeGeo = new THREE.BoxGeometry(0.16, 0.05, 0.05);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x171310 });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.18, 2.08, 0.46);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.18, 2.08, 0.46);
  g.add(eyeL, eyeR);
  g.userData.eyes = [eyeL, eyeR];

  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0x7a4a30 }));
  mouth.position.set(0, 1.9, 0.48);
  mouth.rotation.z = Math.PI;
  g.add(mouth);
  g.userData.mouth = mouth;

  // broader torso + pec bumps for a muscular silhouette
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.5, 1.15, 12), shirtMat);
  torso.position.y = 1.15;
  g.add(torso);

  const pecL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), shirtMat);
  pecL.position.set(-0.24, 1.55, 0.32); pecL.scale.set(1, 0.8, 0.6);
  const pecR = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), shirtMat);
  pecR.position.set(0.24, 1.55, 0.32); pecR.scale.set(1, 0.8, 0.6);
  g.add(pecL, pecR);

  const armL = makeLimb(0.16, 0.13, 0.9, 0xe3ad81, 0, 0.5); armL.position.set(-0.78, 1.25, 0); armL.rotation.z = 0.28;
  const armR = makeLimb(0.16, 0.13, 0.9, 0xe3ad81, 0, 0.5); armR.position.set(0.78, 1.25, 0); armR.rotation.z = -0.28;
  g.add(armL, armR);
  g.userData.armL = armL; g.userData.armR = armR;

  const legL = makeLimb(0.18, 0.18, 0.75, 0x2c211a); legL.position.set(-0.26, 0.2, 0);
  const legR = makeLimb(0.18, 0.18, 0.75, 0x2c211a); legR.position.set(0.26, 0.2, 0);
  g.add(legL, legR);

  return g;
}

function select3DAvatar(name) {
  activeCharacter = name;
  Object.entries(characters).forEach(([key, group]) => { if (group) group.visible = key === name; });
}

function play3DGesture(gesture) {
  if (!characters[activeCharacter]) return;
  animState.gesture = gesture;
  animState.gestureTimer = 0;
  if (gesture === 'kiss') spawnHeartOverlay();
}

function spawnHeartOverlay() {
  const container = document.getElementById('heart-container');
  if (!container) return;
  const heart = document.createElement('div');
  heart.className = 'floating-heart';
  heart.innerText = '💕';
  container.appendChild(heart);
  setTimeout(() => heart.remove(), 1000);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = clock.elapsedTime;
  const group = characters[activeCharacter];

  if (group) {
    // idle bob + slow sway, keeps the character feeling "alive"
    group.position.y = Math.sin(t * 1.4) * 0.05;
    group.rotation.y = Math.sin(t * 0.6) * 0.15;

    // auto-blink every ~4s
    const blinkPhase = t % 4;
    const blinkScale = blinkPhase > 3.85 ? 0.15 : 1;
    if (group.userData.eyes) group.userData.eyes.forEach(e => (e.scale.y = blinkScale));

    if (animState.gesture) {
      animState.gestureTimer += dt;
      const p = animState.gestureTimer;
      if (animState.gesture === 'wave') {
        group.userData.armR.rotation.z = -0.25 + Math.sin(p * 14) * 0.9;
        if (p > 1.1) { group.userData.armR.rotation.z = -0.25; animState.gesture = null; }
      } else if (animState.gesture === 'wink') {
        if (group.userData.eyes) group.userData.eyes[0].scale.y = 0.1;
        if (p > 0.7) animState.gesture = null;
      } else if (animState.gesture === 'kiss') {
        if (group.userData.mouth) group.userData.mouth.scale.set(0.6, 1.4, 1);
        if (p > 1.0) { if (group.userData.mouth) group.userData.mouth.scale.set(1, 1, 1); animState.gesture = null; }
      }
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  const canvas = document.getElementById('avatar-canvas');
  if (!renderer || !camera || !canvas) return;
  const width = canvas.clientWidth, height = canvas.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

window.addEventListener('DOMContentLoaded', initThreeStage);