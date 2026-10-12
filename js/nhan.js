// Bộ quản lý nhãn 3D thông minh cho slide_3d (T14)
// Gồm lõi xếp chỗ thuần (xepNhan) và lớp DOM quản lý vòng đời nhãn (taoQuanLyNhan)

/**
 * Hàm thuần xếp chỗ nhãn (không phụ thuộc DOM, không phụ thuộc THREE, chạy được trong Node)
 * @param {Array<{id: string, x: number, y: number, w: number, h: number, uu_tien: number}>} muc - Danh sách nhãn cần xếp
 * @param {{x0: number, y0: number, x1: number, y1: number}} vung - Vùng hợp lệ trên sân khấu
 * @param {{khoang?: number, dem?: number, toiDa?: number, cam?: Array<{x0: number, y0: number, x1: number, y1: number}>}} tuyChon
 * @returns {Map<string, {hien: boolean, x: number, y: number, huong: string|null}>}
 */
export function xepNhan(muc, vung, { khoang = 26, dem = 6, toiDa = 6, cam = [] } = {}) {
  const tra = new Map();
  if (!vung || !Array.isArray(muc)) {
    if (Array.isArray(muc)) {
      for (const m of muc) tra.set(m.id, { hien: false, x: 0, y: 0, huong: null });
    }
    return tra;
  }

  // 1. Phân loại nhãn có điểm neo trong vùng vs ngoài vùng
  const trongVung = [];
  for (const m of muc) {
    if (m.x >= vung.x0 && m.x <= vung.x1 && m.y >= vung.y0 && m.y <= vung.y1) {
      trongVung.push(m);
    } else {
      tra.set(m.id, { hien: false, x: 0, y: 0, huong: null });
    }
  }

  // 2. Sắp xếp theo ưu tiên: 1 = cao nhất (ưu tiên số nhỏ trước), sau đó theo y tăng dần
  const sorted = trongVung.slice().sort((a, b) => (a.uu_tien - b.uu_tien) || (a.y - b.y));

  const daDat = [];
  // 8 hướng thử quanh điểm neo: Đông-Bắc, Tây-Bắc, Đông-Nam, Tây-Nam, Bắc, Nam, Đông, Tây
  const huongs = ['DB', 'TB', 'DN', 'TN', 'B', 'N', 'D', 'T'];

  for (const m of sorted) {
    if (daDat.length >= toiDa) {
      tra.set(m.id, { hien: false, x: 0, y: 0, huong: null });
      continue;
    }

    let daTimThay = false;

    for (const h of huongs) {
      let lx = 0, ly = 0;
      if (h === 'DB') {
        lx = m.x + khoang;
        ly = m.y - khoang - m.h;
      } else if (h === 'TB') {
        lx = m.x - khoang - m.w;
        ly = m.y - khoang - m.h;
      } else if (h === 'DN') {
        lx = m.x + khoang;
        ly = m.y + khoang;
      } else if (h === 'TN') {
        lx = m.x - khoang - m.w;
        ly = m.y + khoang;
      } else if (h === 'B') {
        lx = m.x - m.w / 2;
        ly = m.y - khoang - m.h;
      } else if (h === 'N') {
        lx = m.x - m.w / 2;
        ly = m.y + khoang;
      } else if (h === 'D') {
        lx = m.x + khoang;
        ly = m.y - m.h / 2;
      } else if (h === 'T') {
        lx = m.x - khoang - m.w;
        ly = m.y - m.h / 2;
      }

      // Hộp bao kèm đệm dem px
      const rx0 = lx - dem;
      const ry0 = ly - dem;
      const rx1 = lx + m.w + dem;
      const ry1 = ly + m.h + dem;

      // Kiểm tra nằm trọn trong vung
      if (rx0 < vung.x0 || ry0 < vung.y0 || rx1 > vung.x1 || ry1 > vung.y1) {
        continue;
      }

      // Kiểm tra không đè vùng cấm
      let trungCam = false;
      for (const c of cam) {
        if (!(rx1 <= c.x0 || rx0 >= c.x1 || ry1 <= c.y0 || ry0 >= c.y1)) {
          trungCam = true;
          break;
        }
      }
      if (trungCam) continue;

      // Kiểm tra không giao nhãn đã đặt
      let trungDaDat = false;
      for (const d of daDat) {
        if (!(rx1 <= d.x0 || rx0 >= d.x1 || ry1 <= d.y0 || ry0 >= d.y1)) {
          trungDaDat = true;
          break;
        }
      }
      if (trungDaDat) continue;

      // Hợp lệ: đặt nhãn tại đây
      daDat.push({ id: m.id, x: lx, y: ly, w: m.w, h: m.h, x0: rx0, y0: ry0, x1: rx1, y1: ry1 });
      tra.set(m.id, { hien: true, x: lx, y: ly, huong: h });
      daTimThay = true;
      break;
    }

    if (!daTimThay) {
      tra.set(m.id, { hien: false, x: 0, y: 0, huong: null });
    }
  }

  return tra;
}

const BANG_MAU = {
  thuong: '#1f5fc4',
  gt: '#e5484d',
  cum: '#1f9d55',
  minh_hoa: '#c98200',
  so: '#1f5fc4',
  ego: '#c98200',
  lidar: '#1f5fc4',
  cam: '#7c3aed'
};

/**
 * Lớp DOM quản lý vòng đời và vẽ nhãn 3D trên sân khấu
 */
export function taoQuanLyNhan({ khung, camera, S, layVung }) {
  const W = 1920, H = 1080;

  const SVG_NS = ['http', '://www.w3.org/2000/svg'].join('');

  // 1. Tạo container chứa nhãn và SVG vẽ đường dẫn
  let lopNhan = khung.querySelector('#lop_nhan');
  if (!lopNhan) {
    lopNhan = document.createElement('div');
    lopNhan.id = 'lop_nhan';
    khung.appendChild(lopNhan);
  }

  let svgNhan = lopNhan.querySelector('#svg_nhan');
  if (!svgNhan) {
    svgNhan = document.createElementNS(SVG_NS, 'svg');
    svgNhan.id = 'svg_nhan';
    svgNhan.setAttribute('viewBox', `0 0 ${W} ${H}`);
    lopNhan.appendChild(svgNhan);
  }

  const danhSachNhan = new Map(); // id -> nhanObj
  let currentSlideId = null;
  let lastCamKey = '';
  let autoId = 1;

  function them(slideId, { html, neo, uu_tien = 2, kieu = 'thuong' } = {}) {
    const id = 'nhan_' + (autoId++);
    const el = document.createElement('div');
    el.className = `nhan3d nhan3d--${kieu}`;
    el.dataset.slide = slideId;
    el.innerHTML = html || '';
    el.style.display = 'none';
    el.style.opacity = '0';
    lopNhan.appendChild(el);

    const obj = {
      id,
      slideId,
      el,
      html,
      neo: neo ? [...neo] : [0, 0, 0],
      uu_tien,
      kieu,
      an: false,
      w: 0,
      h: 0,
      dirty: true
    };

    danhSachNhan.set(id, obj);

    const handle = {
      id,
      datHtml(newHtml) {
        if (obj.html !== newHtml) {
          obj.html = newHtml;
          obj.el.innerHTML = newHtml;
          obj.dirty = true;
        }
      },
      datNeo(newNeo) {
        obj.neo = [...newNeo];
      },
      an() {
        obj.an = true;
        obj.el.style.display = 'none';
      },
      hien() {
        obj.an = false;
      },
      // gỡ hẳn nhãn (slide đổi trạng thái tại chỗ, không chuyển slide)
      xoa() {
        if (obj.el && obj.el.parentNode) obj.el.remove();
        danhSachNhan.delete(id);
      }
    };

    return handle;
  }

  function xoaSlide(slideId) {
    for (const [id, obj] of danhSachNhan.entries()) {
      if (obj.slideId === slideId) {
        if (obj.el && obj.el.parentNode) {
          obj.el.remove();
        }
        danhSachNhan.delete(id);
      }
    }
    // Xoá đường dẫn SVG tương ứng
    const paths = svgNhan.querySelectorAll(`[data-slide="${slideId}"]`);
    paths.forEach(p => p.remove());
  }

  function xoaHet() {
    for (const [id, obj] of danhSachNhan.entries()) {
      if (obj.el && obj.el.parentNode) {
        obj.el.remove();
      }
    }
    danhSachNhan.clear();
    while (svgNhan.firstChild) {
      svgNhan.removeChild(svgNhan.firstChild);
    }
  }

  function datSlideHienTai(sId) {
    currentSlideId = sId;
  }

  function layVungCam() {
    const camBoxes = [];
    const inset = document.getElementById('s6_inset');
    if (inset && inset.offsetParent) {
      const r = inset.getBoundingClientRect();
      const k = khung.getBoundingClientRect();
      const scaleX = W / (k.width || W);
      const scaleY = H / (k.height || H);
      camBoxes.push({
        x0: (r.left - k.left) * scaleX - 10,
        y0: (r.top - k.top) * scaleY - 10,
        x1: (r.right - k.left) * scaleX + 10,
        y1: (r.bottom - k.top) * scaleY + 10
      });
    }
    return camBoxes;
  }

  function capNhat() {
    if (!camera || !S) return;

    const vung = (typeof layVung === 'function') ? layVung() : { x0: 880, y0: 96, x1: 1904, y1: 1000 };
    const camBoxes = layVungCam();

    // 1. Thu thập các nhãn của slide hiện tại và chiếu toạ độ neo ra màn hình
    const muc = [];
    const chieuMap = new Map();

    for (const [id, obj] of danhSachNhan.entries()) {
      if (obj.an) {
        obj.el.style.display = 'none';
        continue;
      }
      if (currentSlideId && obj.slideId !== currentSlideId) {
        obj.el.style.display = 'none';
        continue;
      }

      // Chiếu toạ độ neo
      const v3 = S(obj.neo);
      v3.project(camera);

      // Điểm nằm sau camera hoặc ngoài clipping
      if (v3.z < -1.0 || v3.z > 1.0) {
        obj.el.style.display = 'none';
        continue;
      }

      const scrX = (v3.x * 0.5 + 0.5) * W;
      const scrY = (-v3.y * 0.5 + 0.5) * H;

      // Đo kích thước DOM nếu chưa có hoặc dirty
      if (obj.dirty || obj.w === 0 || obj.h === 0) {
        obj.el.style.display = 'block';
        obj.el.style.visibility = 'hidden';
        obj.w = obj.el.offsetWidth || 140;
        obj.h = obj.el.offsetHeight || 34;
        obj.el.style.visibility = '';
        obj.dirty = false;
      }

      muc.push({
        id: obj.id,
        x: scrX,
        y: scrY,
        w: obj.w,
        h: obj.h,
        uu_tien: obj.uu_tien
      });

      chieuMap.set(obj.id, { scrX, scrY });
    }

    // 2. Chạy thuật toán xếp chỗ thuần (S3 he-truc cho phép tối đa 12 nhãn: 9 trục + 3 hệ)
    const toiDaNhan = (currentSlideId === 'he-truc') ? 12 : 6;
    const ketQuaXep = xepNhan(muc, vung, { khoang: 24, dem: 4, toiDa: toiDaNhan, cam: camBoxes });

    // 3. Cập nhật DOM và SVG
    while (svgNhan.firstChild) {
      svgNhan.removeChild(svgNhan.firstChild);
    }

    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isChup = window.location.search.includes('chup=1');

    for (const m of muc) {
      const obj = danhSachNhan.get(m.id);
      if (!obj) continue;
      const res = ketQuaXep.get(m.id);
      const chieu = chieuMap.get(m.id);

      if (res && res.hien && chieu) {
        obj.el.style.display = 'block';
        obj.el.style.transform = `translate(${res.x}px, ${res.y}px)`;
        if (reducedMotion || isChup) {
          obj.el.style.transition = 'none'; // ảnh chụp không bắt được nhãn đang hiện dần
          obj.el.style.opacity = '1';
        } else {
          obj.el.style.opacity = '1';
        }

        // Vẽ đường dẫn SVG từ điểm neo (chieu.scrX, chieu.scrY) tới cạnh nhãn
        const mau = BANG_MAU[obj.kieu] || '#1f5fc4';
        const lx = res.x, ly = res.y, lw = obj.w, lh = obj.h;
        // Điểm gần nhất trên hộp chữ nhật nhãn
        const cx = Math.max(lx, Math.min(chieu.scrX, lx + lw));
        const cy = Math.max(ly, Math.min(chieu.scrY, ly + lh));

        // Chấm tròn 5px tại điểm neo
        const dot = document.createElementNS(SVG_NS, 'circle');
        dot.setAttribute('cx', String(chieu.scrX));
        dot.setAttribute('cy', String(chieu.scrY));
        dot.setAttribute('r', '2.5');
        dot.setAttribute('fill', mau);
        dot.setAttribute('data-slide', obj.slideId);
        svgNhan.appendChild(dot);

        // Đường thẳng nối điểm neo tới mép nhãn
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', String(chieu.scrX));
        line.setAttribute('y1', String(chieu.scrY));
        line.setAttribute('x2', String(cx));
        line.setAttribute('y2', String(cy));
        line.setAttribute('stroke', mau);
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-opacity', '0.8');
        line.setAttribute('data-slide', obj.slideId);
        svgNhan.appendChild(line);
      } else {
        obj.el.style.display = 'none';
      }
    }
  }

  function thongKe() {
    const vung = (typeof layVung === 'function') ? layVung() : { x0: 880, y0: 96, x1: 1904, y1: 1000 };
    let tong = 0;
    let hien = 0;
    let khacSlide = 0;
    let ngoaiVung = 0;
    const danhSachHien = [];

    // Kiểm tra trực tiếp các phần tử trong DOM
    const allEls = lopNhan.querySelectorAll('.nhan3d');
    tong = allEls.length;

    allEls.forEach(el => {
      const sId = el.dataset.slide;
      if (currentSlideId && sId !== currentSlideId) {
        khacSlide++;
      }
      if (el.style.display !== 'none') {
        hien++;
        // Đọc toạ độ translate
        const m = el.style.transform.match(/translate\(([^p]+)px,\s*([^p]+)px\)/);
        if (m) {
          const x = parseFloat(m[1]);
          const y = parseFloat(m[2]);
          const w = el.offsetWidth || 140;
          const h = el.offsetHeight || 34;
          if (x < vung.x0 || y < vung.y0 || x + w > vung.x1 || y + h > vung.y1) {
            ngoaiVung++;
          }
          danhSachHien.push({ x0: x, y0: y, x1: x + w, y1: y + h });
        }
      }
    });

    // Tính số cặp nhãn giao nhau
    let chong = 0;
    for (let i = 0; i < danhSachHien.length; i++) {
      for (let j = i + 1; j < danhSachHien.length; j++) {
        const a = danhSachHien[i];
        const b = danhSachHien[j];
        if (!(a.x1 <= b.x0 || a.x0 >= b.x1 || a.y1 <= b.y0 || a.y0 >= b.y1)) {
          chong++;
        }
      }
    }

    return {
      tong,
      hien,
      khacSlide,
      chong,
      ngoaiVung
    };
  }

  return {
    them,
    xoaSlide,
    xoaHet,
    capNhat,
    thongKe,
    datSlideHienTai
  };
}
