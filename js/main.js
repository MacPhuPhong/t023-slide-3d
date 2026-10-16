import { taoCanh } from './canh.js';
import { dungTheGioi } from './the_gioi.js';
import { SLIDES } from './slides/index.js';
import { taoBoMaySlide } from './deck.js';

import { Line2 } from '../vendor/three/addons/lines/Line2.js';
import { LineGeometry } from '../vendor/three/addons/lines/LineGeometry.js';
import { LineMaterial } from '../vendor/three/addons/lines/LineMaterial.js';
import { LineSegments2 } from '../vendor/three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from '../vendor/three/addons/lines/LineSegmentsGeometry.js';

window.THREE_LINES = { Line2, LineGeometry, LineMaterial, LineSegments2, LineSegmentsGeometry };

// Nạp dữ liệu khung thực và mô hình xe Ego vào window
await import('../data/khung_thuc.js');
await import('../data/xe_ego_mau.js');


// Tự động co giãn sân khấu 1920x1080 theo cửa sổ
function coDanSanKhau() {
  const sk = document.getElementById('san_khau');
  if (!sk) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const tile = Math.min(w / 1920, h / 1080);
  sk.style.transform = `translate(-50%, -50%) scale(${tile})`;
}

window.addEventListener('resize', coDanSanKhau);
coDanSanKhau();

const params = new URLSearchParams(window.location.search);
const chup = params.has('chup');
const debug = params.has('debug');

const container = document.getElementById('canh_3d');
const canh = taoCanh(container, { chup });

// Dựng thế giới thực tế nuScenes
const theGioi = dungTheGioi(canh);

// Bắt sự kiện đổi màu điểm
const nutMau = document.querySelectorAll('.cham_mau');
function apDungMauDiem(cheDo) {
  nutMau.forEach(b => {
    if (b.dataset.cheDo === cheDo) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });
  if (boMay && boMay.ctx && typeof boMay.ctx.toMauSlide === 'function') {
    boMay.ctx.toMauSlide(cheDo);
  } else {
    theGioi.toMau(cheDo);
  }
  if (chup) canh.veMotLan();
}

nutMau.forEach(btn => {
  btn.addEventListener('click', () => {
    const cheDo = btn.dataset.cheDo;
    apDungMauDiem(cheDo);
  });
});

// Animation xoay vòng LiDAR khi không chụp
if (!chup) {
  function capNhatVongLidar() {
    if (theGioi.ego && theGioi.ego.userData && theGioi.ego.userData.vong) {
      theGioi.ego.userData.vong.rotation.y += 0.04;
    }
    requestAnimationFrame(capNhatVongLidar);
  }
  requestAnimationFrame(capNhatVongLidar);
}

// Khởi động bộ máy slide
const boMay = taoBoMaySlide({
  canh,
  theGioi,
  slides: SLIDES,
  chup,
  debug
});

if (boMay && boMay.ctx) {
  boMay.ctx.apDungMauDiem = apDungMauDiem;
}

// Xác định slide và góc nhìn ban đầu (T33)
let startIdx = 0;
let startViewIdx = 0;
const paramS = params.get('s');
if (paramS !== null) {
  const asNum = parseInt(paramS);
  if (!isNaN(asNum) && asNum >= 0 && asNum < SLIDES.length) {
    startIdx = asNum;
  } else {
    const found = SLIDES.findIndex(s => s.id === paramS);
    if (found >= 0) startIdx = found;
  }
} else if (window.location.hash) {
  const hashId = window.location.hash.replace('#s=', '');
  const found = SLIDES.findIndex(s => s.id === hashId);
  if (found >= 0) startIdx = found;
}

const paramGn = params.get('gn');
if (paramGn !== null) {
  const gnNum = parseInt(paramGn);
  if (!isNaN(gnNum) && gnNum >= 0) {
    if (paramS === 'vong-6' || (SLIDES[startIdx] && SLIDES[startIdx].id === 'vong-6')) {
      startViewIdx = Math.max(0, gnNum - 1);
    } else {
      startViewIdx = gnNum;
    }
  }
}

window.deck = boMay;
window.canh = canh;

// Chế độ kiểm chuyển slide: ?qua=all / ?qua=tien (đi 0 → ... → N-1 rồi tới N) hoặc ?qua=lui (đi 18 → ... → N+1 rồi tới N) (K2)
const cheDoQua = params.get('qua');
if (cheDoQua === 'all' || cheDoQua === 'tien') {
  window.__dangQuaAll = true;
  for (let i = 0; i < startIdx; i++) {
    boMay.chuyenSlide(i);
    canh.veMotLan();
  }
  window.__dangQuaAll = false;
} else if (cheDoQua === 'lui') {
  window.__dangQuaAll = true;
  for (let i = SLIDES.length - 1; i > startIdx; i--) {
    boMay.chuyenSlide(i);
    canh.veMotLan();
  }
  window.__dangQuaAll = false;
}

boMay.chuyenSlide(startIdx, startViewIdx);

const paramMau = params.get('mau');
if (paramMau) {
  apDungMauDiem(paramMau);
}

if (params.has('test_mem')) {
  (async () => {
    await new Promise(r => setTimeout(r, 600));
    const g0 = canh.renderer.info.memory.geometries;
    const t0 = canh.renderer.info.memory.textures;
    for (let i = 1; i < SLIDES.length; i++) {
      boMay.chuyenSlide(i);
      await new Promise(r => setTimeout(r, 100));
    }
    boMay.chuyenSlide(0);
    await new Promise(r => setTimeout(r, 400));
    const g1 = canh.renderer.info.memory.geometries;
    const t1 = canh.renderer.info.memory.textures;
    fetch(`/__mem?g0=${g0}&t0=${t0}&g1=${g1}&t1=${t1}`).catch(() => {});
  })();
}
