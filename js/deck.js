import * as THREE from '../vendor/three/three.module.js';
import { SO, so } from '../data/so_lieu.js';
import { CHI_SO } from '../data/chi_so.js';

export function nhomMenu(muc) {
  if (!muc || typeof muc !== 'string') return null;
  const phan = muc.split(' · ')[0].trim();
  if (phan === 'Bài toán') return 'bai_toan';
  if (phan === 'Toán từng bước') return 'toan';
  if (phan === 'Các vòng cải tiến' || phan === 'Kết quả đánh giá' || phan === 'Đánh giá') return 'danh_gia';
  if (phan === 'Lộ trình') return 'lo_trinh';
  return null;
}

export function taoBoMaySlide({ canh, theGioi, slides, chup = false, debug = false }) {
  let chiSoHienTai = -1;
  let danhSachLop = [];
  let dongHo = new THREE.Clock();

  // Khởi tạo các phần tử DOM
  const elMuc = document.getElementById('slide_muc');
  const elTieuDe = document.getElementById('slide_tieu_de');
  const elY = document.getElementById('slide_y');
  const elCongThuc = document.getElementById('slide_cong_thuc');
  const elChips = document.getElementById('slide_chips');
  const elMl = document.getElementById('slide_ml');
  const elGocNhin = document.getElementById('slide_goc_nhin');
  const elChiSo = document.getElementById('chi_so_slide');
  const elTienTrinh = document.getElementById('tien_trinh_vien_thuoc');
  const elGiaoDien = document.getElementById('giao_dien');

  // Khởi tạo thanh chấm tiến trình
  if (elTienTrinh) {
    elTienTrinh.innerHTML = '';
    slides.forEach((s, idx) => {
      const cham = document.createElement('div');
      cham.className = 'cham_tien_trinh';
      cham.title = `${idx + 1}. ${s.tieu_de}`;
      cham.addEventListener('click', () => chuyenSlide(idx));
      elTienTrinh.appendChild(cham);
    });
  }

  // Khởi tạo các liên kết nhóm ở thanh trên
  const navLinks = {
    bai_toan: document.getElementById('nav_bai_toan'),
    toan: document.getElementById('nav_toan'),
    danh_gia: document.getElementById('nav_danh_gia'),
    lo_trinh: document.getElementById('nav_lo_trinh')
  };

  if (navLinks.bai_toan) navLinks.bai_toan.addEventListener('click', () => chuyenSlideTheoId('mo-dau'));
  if (navLinks.toan) navLinks.toan.addEventListener('click', () => chuyenSlideTheoId('he-truc'));
  if (navLinks.danh_gia) navLinks.danh_gia.addEventListener('click', () => chuyenSlideTheoId('luong-chinh'));
  if (navLinks.lo_trinh) navLinks.lo_trinh.addEventListener('click', () => chuyenSlideTheoId('hien-trang'));

  const btnN101B = document.getElementById('btn_n101b');
  if (btnN101B) btnN101B.addEventListener('click', () => chuyenSlideTheoId('de-bai'));

  function capNhatThanhDieuHuong(idx) {
    Object.values(navLinks).forEach(a => a && a.classList.remove('active'));
    const slide = slides[idx];
    const nhom = slide ? nhomMenu(slide.muc) : null;
    if (nhom && navLinks[nhom]) navLinks[nhom].classList.add('active');

    if (elTienTrinh) {
      const chams = elTienTrinh.querySelectorAll('.cham_tien_trinh');
      chams.forEach((c, i) => {
        if (i === idx) c.classList.add('active');
        else c.classList.remove('active');
      });
    }

    if (elChiSo) {
      elChiSo.textContent = `${idx + 1} / ${slides.length}`;
    }
  }

  function taoLop() {
    const g = new THREE.Group();
    g.name = `lop_slide_${chiSoHienTai}`;
    canh.scene.add(g);
    danhSachLop.push(g);
    return g;
  }

  function donDepLop() {
    for (const g of danhSachLop) {
      canh.scene.remove(g);
      g.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
          else o.material.dispose();
        }
      });
    }
    danhSachLop = [];
  }

  const ctx = {
    THREE,
    scene: canh.scene,
    camera: canh.camera,
    canh,
    theGioi,
    SO,
    so,
    CHI_SO,
    chiSo: CHI_SO,
    S: canh.S,
    lop: taoLop,
    tweenCamera: (pos, look, dur) => canh.tweenCamera(pos, look, dur),
    taoNhan: (html, posEgo, opts = {}) => {
      const uu_tien = (opts && typeof opts === 'object' && opts.uu_tien !== undefined) ? opts.uu_tien : 2;
      const kieu = (opts && typeof opts === 'object' && opts.kieu !== undefined) ? opts.kieu : (typeof opts === 'string' ? opts : 'thuong');
      const slideId = (chiSoHienTai >= 0 && chiSoHienTai < slides.length) ? slides[chiSoHienTai].id : 'chung';
      const handle = canh.quanLyNhan.them(slideId, {
        html,
        neo: posEgo,
        uu_tien,
        kieu
      });
      const dummy = new THREE.Object3D();
      dummy.name = handle.id;
      const { id, ...methods } = handle;
      Object.assign(dummy, methods);
      return dummy;
    }
  };

  function chuyenSlide(index, viewIndex = 0) {
    if (index < 0 || index >= slides.length) return;
    if (index === chiSoHienTai && viewIndex === 0) return;

    // Thoát slide cũ
    if (chiSoHienTai >= 0 && chiSoHienTai < slides.length) {
      const slideCu = slides[chiSoHienTai];
      if (typeof slideCu.ra === 'function') {
        try { slideCu.ra(ctx); } catch (e) { console.error('Lỗi ra slide:', e); }
      }
      if (canh.quanLyNhan) {
        canh.quanLyNhan.xoaSlide(slideCu.id);
      }
    }

    donDepLop();
    chiSoHienTai = index;
    const slide = slides[index];
    if (canh.quanLyNhan) {
      canh.quanLyNhan.datSlideHienTai(slide.id);
    }

    // Cập nhật DOM
    if (elMuc) elMuc.textContent = slide.muc || '';
    if (elTieuDe) {
      elTieuDe.textContent = slide.tieu_de || '';
      if (slide.id === 'mo-dau') {
        elTieuDe.className = 'tieu_de_hero';
      } else {
        elTieuDe.className = 'tieu_de_slide';
      }
    }
    if (elY) elY.innerHTML = slide.y || '';

    // Render KaTeX
    if (elCongThuc) {
      if (slide.cong_thuc && slide.cong_thuc.length > 0) {
        elCongThuc.style.display = 'flex';
        elCongThuc.innerHTML = '';
        for (const tex of slide.cong_thuc) {
          const div = document.createElement('div');
          if (window.katex) {
            try {
              window.katex.render(tex, div, { throwOnError: false, strict: 'ignore', displayMode: true });
            } catch (err) {
              div.textContent = tex;
            }
          } else {
            div.textContent = tex;
          }
          elCongThuc.appendChild(div);
        }
      } else {
        elCongThuc.style.display = 'none';
      }
    }

    // Chip số liệu
    if (elChips) {
      elChips.innerHTML = '';
      if (slide.so && slide.so.length > 0) {
        slide.so.forEach(k => {
          const item = SO[k];
          if (item) {
            const chip = document.createElement('div');
            chip.className = 'chip';
            chip.title = `Nguồn: ${item.nguon}`;
            chip.innerHTML = `
              <span class="chip_gia_tri">${item.hien}</span>
              ${item.dv ? `<span class="chip_dv">${item.dv}</span>` : ''}
              <span class="chip_huy_hieu nhan-${item.nhan}">${item.nhan}${item.nhan === 'G' ? ' · minh hoạ' : ''}</span>
            `;
            elChips.appendChild(chip);
          }
        });
      }
    }

    // Ô ML
    if (elMl) {
      if (slide.ml && slide.ml.trim()) {
        elMl.style.display = 'block';
        elMl.innerHTML = `<strong>Góc nhìn học máy:</strong> ${slide.ml}`;
      } else {
        elMl.style.display = 'none';
      }
    }

    // Các góc nhìn camera
    if (elGocNhin) {
      elGocNhin.innerHTML = '';
      if (slide.goc_nhin && slide.goc_nhin.length > 0) {
        slide.goc_nhin.forEach((v, idx) => {
          const btn = document.createElement('button');
          btn.className = `nut_goc_nhin ${idx === viewIndex ? 'active' : ''}`;
          btn.textContent = `${idx + 1}. ${v.ten}`;
          btn.addEventListener('click', () => {
            elGocNhin.querySelectorAll('.nut_goc_nhin').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            canh.tweenCamera(v.cam, v.nhin, 1.2);
            if (typeof slide.doiGocNhin === 'function') {
              slide.doiGocNhin(ctx, idx);
            }
          });
          elGocNhin.appendChild(btn);
        });

        const v0 = slide.goc_nhin[viewIndex] || slide.goc_nhin[0];
        canh.tweenCamera(v0.cam, v0.nhin, chup ? 0 : 1.2);
      }
    }

    capNhatThanhDieuHuong(index);

    // Đặt lại trạng thái thế giới mặc định trước mọi slide (K1, T29, T33)
    function datLaiTheGioi() {
      if (!ctx.theGioi) return;
      if (typeof ctx.theGioi.datVungDiem === 'function') {
        ctx.theGioi.datVungDiem(slide.vung_diem || 'tap_trung');
      }
      if (ctx.theGioi.nhomVat && ctx.theGioi.nhomVat.children) {
        ctx.theGioi.nhomVat.children.forEach(obj => {
          obj.visible = true;
        });
      }
      if (ctx.theGioi.ego) {
        ctx.theGioi.ego.visible = true;
        ctx.theGioi.ego.traverse(m => {
          if (m.isMesh && m.material) {
            const mats = Array.isArray(m.material) ? m.material : [m.material];
            mats.forEach(mat => {
              if (mat.userData && mat.userData.__goc) {
                mat.transparent = mat.userData.__goc.transparent;
                mat.opacity = mat.userData.__goc.opacity;
                mat.depthWrite = mat.userData.__goc.depthWrite;
                delete mat.userData.__goc;
              } else {
                mat.transparent = false;
                mat.opacity = 1.0;
                mat.depthWrite = true;
              }
            });
          }
        });
      }
      if (ctx.theGioi.diem) {
        ctx.theGioi.diem.visible = true;
        if (ctx.theGioi.diem.material) {
          ctx.theGioi.diem.material.size = 0.08;
          ctx.theGioi.diem.material.transparent = false;
          ctx.theGioi.diem.material.opacity = 1.0;
          ctx.theGioi.diem.material.color.setHex(0xffffff);
          ctx.theGioi.diem.material.vertexColors = true;
          ctx.theGioi.diem.material.needsUpdate = true;
        }
        if (typeof ctx.theGioi.toMau === 'function') {
          ctx.theGioi.toMau('do_cao');
        }
      }
      if (canh.scene && canh.scene.fog) {
        canh.scene.fog.near = 20;
        canh.scene.fog.far = 110;
        canh.scene.fog.color.setHex(0xe3e5e8);
      }
    }
    datLaiTheGioi();

    // Vào slide mới
    if (typeof slide.vao === 'function') {
      try { slide.vao(ctx); } catch (e) { console.error('Lỗi vao slide:', e); }
    }

    // Cập nhật góc nhìn theo viewIndex nếu slide có hỗ trợ doiGocNhin
    if (typeof slide.doiGocNhin === 'function') {
      try { slide.doiGocNhin(ctx, viewIndex); } catch (e) {}
    }

    // Đồng bộ URL hash
    if (!chup) {
      history.replaceState(null, '', `#s=${slide.id}`);
    }

    if (debug) {
      console.log(`[Debug Slide ${index}] Geometries:`, canh.renderer.info.memory.geometries, 'Textures:', canh.renderer.info.memory.textures);
    }

    // Chế độ chụp ảnh: render và lưu
    if (chup && !window.__dangQuaAll) {
      canh.veMotLan();
      canh.chepSangAnh();

      // Kiểm tra tràn cột trái (F2)
      const cotTrai = document.getElementById('cot_trai');
      // Tràn dọc cột trái, hoặc công thức KaTeX vượt mép phải thẻ chứa nó (bị cắt chữ)
      const tranNgang = cotTrai ? [...cotTrai.querySelectorAll('.katex .base')].some(b => {
        const khung = b.closest('.katex-display') || b.closest('.the_cong_thuc') || b.closest('.katex').parentElement;
        return b.getBoundingClientRect().right > khung.getBoundingClientRect().right + 1;
      }) : false;
      const isTran = cotTrai ? (cotTrai.scrollHeight > cotTrai.clientHeight + 2 || tranNgang ? '1' : '0') : '0';
      document.body.dataset.tran = isTran;

      // Thống kê nhãn 3D (T15)
      const tk = canh.quanLyNhan ? canh.quanLyNhan.thongKe() : { khacSlide: 0, chong: 0, ngoaiVung: 0, hien: 0 };
      document.body.dataset.nhan_khac = String(tk.khacSlide);
      document.body.dataset.nhan_chong = String(tk.chong);
      document.body.dataset.nhan_ngoai = String(tk.ngoaiVung);
      document.body.dataset.nhan_hien = String(tk.hien);

      // Thống kê vật hiện và điểm hiện (T29)
      let vatHien = 0;
      canh.scene.traverse(o => {
        if (o.isMesh && o.userData && o.userData.ann) {
          vatHien++;
        }
      });
      let diemHien = 0;
      if (ctx.theGioi && ctx.theGioi.diem && ctx.theGioi.diem.geometry) {
        const pArr = ctx.theGioi.diem.geometry.attributes.position.array;
        for (let i = 1; i < pArr.length; i += 3) {
          if (pArr[i] > -500) diemHien++;
        }
      }
      document.body.dataset.vat_hien = String(vatHien);
      document.body.dataset.diem_hien = String(diemHien);

      // Xác định bounding box và kiểm tra vật thể trong scene theo slide.vat_chinh (G2, K3)
      let b = null;
      let vatVisible = true;
      const vatChinh = slide.vat_chinh || 'none';

      if (vatChinh === 'ego') {
        const kieuEgo = ctx.theGioi?.ego?.userData?.kieu;
        if (kieuEgo === 'zoe') {
          b = { cx: 1.385, cy: 0, cz: 0.78, l: 4.08, w: 1.73, h: 1.56, yaw: 0 };
        } else if (kieuEgo === 'vfe34') {
          b = { cx: 1.41, cy: 0, cz: 0.806, l: 4.300, w: 1.793, h: 1.613, yaw: 0 };
        } else {
          const hop = (typeof window !== 'undefined' && window.XE_MAU) ? window.XE_MAU.hop : null;
          if (hop) {
            b = { cx: hop.cx, cy: 0, cz: hop.h / 2, l: hop.l, w: hop.w, h: hop.h, yaw: 0 };
          } else {
            b = { cx: 1.317, cy: 0, cz: 0.806, l: 4.288, w: 1.975, h: 1.613, yaw: 0 };
          }
        }
        if (ctx.theGioi && ctx.theGioi.ego && !ctx.theGioi.ego.visible) {
          vatVisible = false;
        }
      } else if (vatChinh === 'vd') {
        if (ctx.theGioi && ctx.theGioi.toan) {
          b = ctx.theGioi.toan.box || ctx.theGioi.toan.gt;
        }
        if (ctx.theGioi && ctx.theGioi.nhomVat) {
          const xeVd = ctx.theGioi.nhomVat.children.find(c => c.userData && c.userData.viDu);
          if (!xeVd || !xeVd.visible) {
            vatVisible = false;
          }
        } else {
          vatVisible = false;
        }
      }

      let phu = 0.0;
      let thay = 1;
      const W = 1920, H = 1080;

      if (b) {
        const hl = b.l / 2, hw = b.w / 2, hh = b.h / 2;
        const cosY = Math.cos(b.yaw || 0), sinY = Math.sin(b.yaw || 0);
        const dx = [-hl, hl], dy = [-hw, hw], dz = [-hh, hh];
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        for (const x of dx) {
          for (const y of dy) {
            for (const z of dz) {
              const px = b.cx + x * cosY - y * sinY;
              const py = b.cy + x * sinY + y * cosY;
              const pz = b.cz + z;
              const v3 = canh.S([px, py, pz]);
              v3.project(canh.camera);
              const scrX = (v3.x * 0.5 + 0.5) * W;
              const scrY = (-v3.y * 0.5 + 0.5) * H;
              if (scrX < minX) minX = scrX;
              if (scrX > maxX) maxX = scrX;
              if (scrY < minY) minY = scrY;
              if (scrY > maxY) maxY = scrY;
            }
          }
        }

        const cMinX = Math.max(0, Math.min(W, minX));
        const cMaxX = Math.max(0, Math.min(W, maxX));
        const cMinY = Math.max(0, Math.min(H, minY));
        const cMaxY = Math.max(0, Math.min(H, maxY));
        phu = (Math.max(0, cMaxX - cMinX) * Math.max(0, cMaxY - cMinY)) / (W * H);

        // Kiểm tra vật chính nằm trong vùng 3D và thấy rõ (G2, K3, T32)
        const minXLimit = (slide.id === 'mo-dau') ? 0.35 * W : (slide.id === 'pinhole' ? 0.15 * W : 0.40 * W);
        const maxYLimit = (slide.id === 'pinhole') ? (H + 20) : (H - 20);
        const trongVung3D = (minX >= minXLimit) && (maxX <= W - 20) && (minY >= 20) && (maxY <= maxYLimit);
        const nguongPhu = (slide.id === 'de-bai') ? 0.005 : 0.03;
        thay = (vatVisible && trongVung3D && phu >= nguongPhu) ? 1 : 0;
      } else {
        thay = (vatChinh === 'none') ? 1 : 0;
        phu = 0.0;
      }

      document.body.dataset.phu = phu.toFixed(4);
      document.body.dataset.thay = String(thay);

      // Tính cỡ chữ nhỏ nhất chu_min (T35) trong cột trái, thanh dưới, và nhãn 3D (bỏ qua KaTeX)
      let chuMin = Infinity;
      const vungKiemTra = ['#cot_trai', '#thanh_duoi', '#lop_nhan'];
      let minElInfo = '';
      for (const sel of vungKiemTra) {
        const goc = document.querySelector(sel);
        if (!goc) continue;
        const cacPhanTu = [goc, ...goc.querySelectorAll('*')];
        for (const el of cacPhanTu) {
          if (el.closest('.katex') || el.closest('.katex-display') || el.classList.contains('katex') || el.classList.contains('katex-display')) {
            continue;
          }
          const cs = window.getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') {
            continue;
          }
          let coChu = false;
          for (const n of el.childNodes) {
            if (n.nodeType === Node.TEXT_NODE && n.nodeValue.trim().length > 0) {
              coChu = true;
              break;
            }
          }
          if (el.tagName === 'BUTTON') {
            if (el.innerText && el.innerText.trim().length > 0) coChu = true;
          } else if (el.tagName === 'INPUT') {
            const nonTextTypes = ['range', 'checkbox', 'radio', 'hidden', 'color'];
            if (!nonTextTypes.includes(el.type) && el.value && el.value.trim().length > 0) {
              coChu = true;
            }
          }
          if (coChu) {
            const fs = parseFloat(cs.fontSize);
            if (!isNaN(fs) && fs > 0 && fs < chuMin) {
              chuMin = fs;
              minElInfo = `${el.tagName}.${el.className}#${el.id}[${el.textContent.trim().slice(0, 20)}]`;
            }
          }
          const csAfter = window.getComputedStyle(el, '::after');
          if (csAfter && csAfter.content && csAfter.content !== 'none' && csAfter.content !== '""' && csAfter.content !== "''") {
            const fsAfter = parseFloat(csAfter.fontSize);
            if (!isNaN(fsAfter) && fsAfter > 0 && fsAfter < chuMin) {
              chuMin = fsAfter;
              minElInfo = `${el.tagName}::after[${csAfter.content}]`;
            }
          }
        }
      }
      if (chuMin === Infinity) chuMin = 18.0;
      document.body.dataset.chu_min = chuMin.toFixed(1);

      // Đo kiểm tra vai hộp và độ lệch hộp GT bao trọn xe ví dụ (T38)
      let hopKhongVai = 0;
      let hopGtLechCm = 0;
      const lopSlide = canh.lopHienTai;
      if (lopSlide) {
        const cacHop = [];
        lopSlide.traverse(obj => {
          if (obj.isGroup && (obj.userData.hop || obj.children.some(c => c.isLineSegments && c.geometry && c.geometry.type === 'EdgesGeometry'))) {
            if (!obj.userData.hop) {
              hopKhongVai++;
            } else {
              cacHop.push(obj);
            }
          }
        });

        const cacHopGt = cacHop.filter(h => h.userData.hop === 'gt');
        if (cacHopGt.length > 0 && ctx.theGioi && ctx.theGioi.nhomVat) {
          const xeVd = ctx.theGioi.nhomVat.children.find(c => c.userData && c.userData.viDu);
          if (xeVd) {
            xeVd.updateWorldMatrix(true, true);
            for (const hop of cacHopGt) {
              hop.updateWorldMatrix(true, true);
              const invHopMat = new ctx.THREE.Matrix4().copy(hop.matrixWorld).invert();
              const boxData = hop.userData.box;
              const hl = boxData ? boxData.l / 2 : 2.365;
              const hh = boxData ? boxData.h / 2 : 0.77;
              const hw = boxData ? boxData.w / 2 : 0.955;

              let maxLech = 0;
              const v = new ctx.THREE.Vector3();
              xeVd.traverse(mesh => {
                if (mesh.isMesh && mesh.geometry && mesh.geometry.attributes && mesh.geometry.attributes.position) {
                  mesh.updateWorldMatrix(true, false);
                  const meshToHop = new ctx.THREE.Matrix4().multiplyMatrices(invHopMat, mesh.matrixWorld);
                  const pos = mesh.geometry.attributes.position;
                  for (let i = 0; i < pos.count; i++) {
                    v.fromBufferAttribute(pos, i);
                    v.applyMatrix4(meshToHop);
                    const dx = Math.max(0, Math.abs(v.x) - hl);
                    const dy = Math.max(0, Math.abs(v.y) - hh);
                    const dz = Math.max(0, Math.abs(v.z) - hw);
                    const lech = Math.max(dx, dy, dz);
                    if (lech > maxLech) maxLech = lech;
                  }
                }
              });
              const lechCm = maxLech * 100;
              if (lechCm > hopGtLechCm) hopGtLechCm = lechCm;
            }
          }
        }
      }

      try {
        const sh = cotTrai ? cotTrai.scrollHeight : 0;
        const ch = cotTrai ? cotTrai.clientHeight : 0;
        const tn = tranNgang ? 1 : 0;
        fetch(`/__meta?id=${slide.id}&tran=${isTran}&sh=${sh}&ch=${ch}&tn=${tn}&phu=${phu.toFixed(4)}&thay=${thay}&nhan_khac=${tk.khacSlide}&nhan_chong=${tk.chong}&nhan_ngoai=${tk.ngoaiVung}&nhan_hien=${tk.hien}&nhan_tong=${tk.tong}&vat_hien=${vatHien}&diem_hien=${diemHien}&chu_min=${chuMin.toFixed(1)}&hop_khong_vai=${hopKhongVai}&hop_gt_lech_cm=${hopGtLechCm.toFixed(1)}&el=${encodeURIComponent(minElInfo)}`).catch(() => {});
      } catch (e) {}

      document.body.dataset.xong = '1';
    }
  }

  function chuyenSlideTheoId(id) {
    const idx = slides.findIndex(s => s.id === id);
    if (idx >= 0) chuyenSlide(idx);
  }

  // Điều khiển phím
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      chuyenSlide(Math.min(slides.length - 1, chiSoHienTai + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      chuyenSlide(Math.max(0, chiSoHienTai - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      chuyenSlide(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      chuyenSlide(slides.length - 1);
    } else if (e.key >= '1' && e.key <= '9') {
      const vIdx = parseInt(e.key) - 1;
      const slide = slides[chiSoHienTai];
      if (slide && slide.goc_nhin && slide.goc_nhin[vIdx]) {
        const btns = elGocNhin.querySelectorAll('.nut_goc_nhin');
        if (btns[vIdx]) btns[vIdx].click();
      }
    } else if (e.key === 'r' || e.key === 'R') {
      // Reset view
      const slide = slides[chiSoHienTai];
      if (slide && slide.goc_nhin && slide.goc_nhin[0]) {
        const v = slide.goc_nhin[0];
        canh.tweenCamera(v.cam, v.nhin, 1.2);
      }
    } else if (e.key === 'j' || e.key === 'J') {
      chuyenSlide(Math.min(slides.length - 1, chiSoHienTai + 1));
    } else if (e.key === 'k' || e.key === 'K') {
      chuyenSlide(Math.max(0, chiSoHienTai - 1));
    } else if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } else if (e.key === 'h' || e.key === 'H') {
      if (elGiaoDien) {
        elGiaoDien.style.visibility = (elGiaoDien.style.visibility === 'hidden') ? 'visible' : 'hidden';
      }
    }
  });

  // Hỗ trợ cờ ?fps=1
  const hienFps = new URLSearchParams(window.location.search).get('fps') === '1';
  let elBadgeFps = null;
  if (hienFps) {
    elBadgeFps = document.createElement('div');
    elBadgeFps.id = 'badge_fps';
    elBadgeFps.style.cssText = 'position:fixed; bottom:16px; left:16px; background:rgba(20,23,28,0.85); color:#4ade80; padding:4px 10px; border-radius:8px; font-family:monospace; font-size:15px; font-weight:700; z-index:9999; pointer-events:none; border:1px solid rgba(255,255,255,0.1); box-shadow:0 4px 12px rgba(0,0,0,0.2);';
    elBadgeFps.textContent = 'FPS: --';
    document.body.appendChild(elBadgeFps);
  }
  let frameCount = 0;
  let lastFpsTime = performance.now();

  // Vòng lặp animation per-frame cho slide
  if (!chup) {
    function vongLapDeck() {
      const dt = dongHo.getDelta();

      if (hienFps && elBadgeFps) {
        frameCount++;
        const now = performance.now();
        if (now - lastFpsTime >= 500) {
          const fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
          elBadgeFps.textContent = `FPS: ${fps}`;
          frameCount = 0;
          lastFpsTime = now;
        }
      }

      if (chiSoHienTai >= 0 && chiSoHienTai < slides.length) {
        const slide = slides[chiSoHienTai];
        if (typeof slide.khung === 'function') {
          try { slide.khung(ctx, dt); } catch (e) {}
        }
      }
      requestAnimationFrame(vongLapDeck);
    }
    requestAnimationFrame(vongLapDeck);
  }

  return {
    chuyenSlide,
    chuyenSlideTheoId,
    layChiSoHienTai: () => chiSoHienTai,
    ctx
  };
}
