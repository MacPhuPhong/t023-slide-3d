import * as THREE from '../vendor/three/three.module.js';
import { RoomEnvironment } from '../vendor/three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from '../vendor/three/addons/controls/OrbitControls.js';
import { taoQuanLyNhan } from './nhan.js';

// Hàm đổi toạ độ: hệ xe nuScenes (x trước, y trái, z lên) sang Three.js (x sang, y lên, z tới)
export const S = ([x, y, z]) => new THREE.Vector3(x, z, -y);

export function taoCanh(container, { chup = false } = {}) {
  const W = 1920, H = 1080;

  // Renderer WebGL
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: !!chup });
  renderer.setPixelRatio(chup ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W, H);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Lọc vật tiền cảnh sát camera (< 8m), che thanh trên, hoặc chiếm > 6% diện tích vùng 3D (T16)
  function locVatTienCanh() {
    const nhomVat = scene.getObjectByName('nhom_vat_the');
    if (!nhomVat) return;
    const camPos = camera.position;
    const vung3D_x0 = 0.45 * W;
    const vung3D_x1 = W;
    const vung3D_y0 = 96;
    const vung3D_y1 = H;
    const dienTichVung3D = (vung3D_x1 - vung3D_x0) * (vung3D_y1 - vung3D_y0);

    nhomVat.children.forEach(obj => {
      if (obj.userData && obj.userData.viDu) {
        obj.visible = true;
        return;
      }
      const dist = obj.position.distanceTo(camPos);
      if (dist < 8.0) {
        obj.visible = false;
        return;
      }

      const a = obj.userData && obj.userData.ann;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      let biSauCam = false;

      if (a && a.l && a.w && a.h) {
        const hl = a.l / 2, hw = a.w / 2, hh = a.h / 2;
        const cosY = Math.cos(a.yaw || 0), sinY = Math.sin(a.yaw || 0);
        for (const dx of [-hl, hl]) {
          for (const dy of [-hw, hw]) {
            for (const dz of [-hh, hh]) {
              const px = a.c[0] + dx * cosY - dy * sinY;
              const py = a.c[1] + dx * sinY + dy * cosY;
              const pz = a.c[2] + dz;
              const v = S([px, py, pz]);
              if (v.distanceTo(camPos) < 8.0) {
                obj.visible = false;
                return;
              }
              v.project(camera);
              if (v.z < -1.0 || v.z > 1.0) {
                biSauCam = true;
              }
              const sx = (v.x * 0.5 + 0.5) * W;
              const sy = (-v.y * 0.5 + 0.5) * H;
              if (sx < minX) minX = sx;
              if (sx > maxX) maxX = sx;
              if (sy < minY) minY = sy;
              if (sy > maxY) maxY = sy;
            }
          }
        }
      } else {
        const topPos = obj.position.clone();
        topPos.y += 1.8;
        topPos.project(camera);
        const scrY = (-topPos.y * 0.5 + 0.5) * H;
        const scrX = (topPos.x * 0.5 + 0.5) * W;
        if (scrY < 96 && scrX >= 0 && scrX <= W) {
          obj.visible = false;
          return;
        }
        minX = scrX - 30; maxX = scrX + 30;
        minY = scrY; maxY = scrY + 60;
      }

      if (biSauCam && dist < 16.0) {
        obj.visible = false;
        return;
      }

      // Ẩn người đồ chơi tiền cảnh / trung cảnh gần camera (< 25m) hoặc vật chiếm chiều cao màn hình lớn (> 220px) trong cự ly gần (< 16m) (T16)
      if (a && a.loai && a.loai.startsWith('human.') && dist < 25.0) {
        obj.visible = false;
        return;
      }
      if (maxY - minY > 220 && dist < 16.0) {
        obj.visible = false;
        return;
      }

      if (minY < 96 && maxX >= vung3D_x0 && minX <= vung3D_x1 && dist < 22.0) {
        obj.visible = false;
        return;
      }

      const ix0 = Math.max(minX, vung3D_x0);
      const ix1 = Math.min(maxX, vung3D_x1);
      const iy0 = Math.max(minY, vung3D_y0);
      const iy1 = Math.min(maxY, vung3D_y1);

      if (ix1 > ix0 && iy1 > iy0) {
        const giao = (ix1 - ix0) * (iy1 - iy0);
        if (giao / dienTichVung3D > 0.06) {
          obj.visible = false;
          return;
        }
      }

      obj.visible = true;
    });
  }

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe3e5e8);
  scene.fog = new THREE.Fog(0xe3e5e8, 20, 110);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;

  // Ánh sáng
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb8bcc4, 0.6);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-6, 14, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 80;
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  // Mặt đất
  const groundGeo = new THREE.PlaneGeometry(260, 260);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xe3e5e8, roughness: 1.0 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.name = 'mat_dat_nen';
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  // Camera
  const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 300);
  camera.setViewOffset(W, H, -0.17 * W, 0, W, H);
  camera.position.set(7.5, 5.5, 9.5);
  camera.lookAt(0, 0.6, -1);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 0.6, -1);

  // Quản lý tween camera
  let tween = null;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tweenCamera(posEgo, nhinEgo, duration = 1.2) {
    const targetPos = S(posEgo);
    const targetLook = S(nhinEgo);

    if (chup || reducedMotion || duration <= 0) {
      camera.position.copy(targetPos);
      controls.target.copy(targetLook);
      controls.update();
      tween = null;
      return;
    }

    const startPos = camera.position.clone();
    const startLook = controls.target.clone();
    const startTime = performance.now();
    const durMs = duration * 1000;

    tween = {
      update(now) {
        const elapsed = now - startTime;
        let t = Math.min(1, elapsed / durMs);
        // Easing cubic in-out
        t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        camera.position.lerpVectors(startPos, targetPos, t);
        controls.target.lerpVectors(startLook, targetLook, t);
        controls.update();

        if (elapsed >= durMs) {
          camera.position.copy(targetPos);
          controls.target.copy(targetLook);
          controls.update();
          tween = null;
        }
      }
    };
  }

  // Khởi tạo bộ quản lý nhãn 3D thông minh
  const quanLyNhan = taoQuanLyNhan({
    khung: container,
    camera,
    S,
    layVung: () => ({ x0: W * 0.45 + 16, y0: 96, x1: W - 16, y1: H - 80 })
  });

  function veMotLan() {
    controls.update();
    locVatTienCanh();
    renderer.render(scene, camera);
    quanLyNhan.capNhat();
  }

  function chepSangAnh() {
    const cu = container.querySelector('#anh_chup_webgl');
    if (cu) cu.remove();
    const img = document.createElement('img');
    img.id = 'anh_chup_webgl';
    img.src = renderer.domElement.toDataURL('image/png');
    img.style.position = 'absolute';
    img.style.inset = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.pointerEvents = 'none';
    img.style.zIndex = '4';
    container.appendChild(img);
  }

  // Vòng lặp render (tắt khi ở chế độ chup)
  let dangChay = !chup;
  function vongLap(now) {
    if (!dangChay) return;
    if (tween) tween.update(now);
    else controls.update();
    locVatTienCanh();
    renderer.render(scene, camera);
    quanLyNhan.capNhat();
    requestAnimationFrame(vongLap);
  }

  if (dangChay) {
    requestAnimationFrame(vongLap);
  }

  return {
    renderer,
    scene,
    camera,
    controls,
    quanLyNhan,
    S,
    tweenCamera,
    locVatTienCanh,
    veMotLan,
    chepSangAnh,
    dung() { dangChay = false; },
    chay() { if (!dangChay) { dangChay = true; requestAnimationFrame(vongLap); } }
  };
}
