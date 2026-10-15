// Module xem ca dùng chung (T82: tách từ S22 ket-qua-vat)
// Cung cấp API taoXemCa(ctx, { elAnh, nhom }) cho S22, các slide that_v1..that_v6, và con_sai.

import { taoHop } from './hop.js';
import { taoDiemLidar } from './diem_lidar.js';
import { MAU_VONG } from './bieu_do.js';

export const MAU_VONG_HEX = {
  1: 0x3b82f6,
  2: 0x8b5cf6,
  3: 0xec4899,
  4: 0xf59e0b,
  5: 0x10b981,
  6: 0x0891b2
};

const thamSo = () => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
const CO_WINDOW = typeof window !== 'undefined';
const CHUP = CO_WINDOW && thamSo().has('chup');
const TINH = CHUP || (CO_WINDOW && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const veLai = ctx => { if (CHUP && ctx && ctx.canh && typeof ctx.canh.veMotLan === 'function') ctx.canh.veMotLan(); };
const veEgo = v => [v.x, -v.z, v.y];

export function xoaNhomCa(nhom) {
  if (!nhom) return;
  nhom.traverse(o => {
    if (typeof o.xoa === 'function') o.xoa();
    if (o.geometry && !(o.parent && o.parent.type === 'ArrowHelper')) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
      else o.material.dispose();
    }
  });
  nhom.clear();
}

/**
 * Khởi tạo bộ điều khiển hiển thị ca 3D + 2D.
 * @param {object} ctx Context của Three.js
 * @param {object} opts { elAnh: Element|string, nhom: THREE.Group }
 */
export function taoXemCa(ctx, { elAnh, nhom }) {
  const T = ctx.THREE;
  const layPhanTuAnh = () => {
    if (typeof elAnh === 'function') return elAnh();
    if (typeof elAnh === 'string') return document.querySelector(elAnh);
    return elAnh;
  };

  return {
    hien(ca, tuyChon = {}) {
      if (!ca) return;
      const phanTuAnh = layPhanTuAnh();

      const vong = tuyChon.vong || new Set([5]);
      const nguon = tuyChon.nguon || 'gt';
      const sweep = !!tuyChon.sweep;
      const cheDoAnh = tuyChon.cheDoAnh || 'phong';
      const datCam = tuyChon.datCam !== false;
      const diemKhung = tuyChon.diemKhung || null;
      const muiTen = !!tuyChon.muiTen;
      const cheDoMau = tuyChon.cheDoMau || 'frustum';

      // 1. Dọn nhóm 3D cũ
      xoaNhomCa(nhom);

      const gt = ca.gt;
      const diag = Math.hypot(gt.l, gt.w, gt.h);
      const banKinh = Math.max(6.0, 1.5 * diag);

      // 2. Điểm LiDAR (từ diemKhung hoặc ca.diem)
      let diemObj = null;
      if (diemKhung) {
        diemObj = taoDiemLidar(ctx, {
          xyz: diemKhung.xyz,
          cuongDo: diemKhung.cuongDo,
          swXyz: diemKhung.swXyz,
          swK: diemKhung.swK
        }, {
          coSweep: sweep,
          vatGt: gt,
          cam: diemKhung.cam,
          bboxVao: diemKhung.bboxVao,
          banKinh
        });
        nhom.add(diemObj);
        diemObj.toMau(cheDoMau);
      } else if (ca.diem) {
        diemObj = taoDiemLidar(ctx, {
          xyz: ca.diem.kf_xyz,
          cuongDo: ca.diem.kf_i,
          swXyz: ca.diem.sw_xyz,
          swK: ca.diem.sw_k
        }, {
          coSweep: sweep,
          vatGt: gt,
          banKinh
        });
        nhom.add(diemObj);
        diemObj.toMau(cheDoMau);
      }

      // 3. Hộp GT (xanh lá 0x1f9d55)
      const hopGtObj = taoHop(ctx, gt, 'gt', { fill: true, color: 0x1f9d55 });
      nhom.add(hopGtObj);

      if (muiTen && gt.yaw !== undefined) {
        const aGt = new T.ArrowHelper(
          new T.Vector3(Math.cos(gt.yaw), 0, -Math.sin(gt.yaw)),
          ctx.S([gt.cx, gt.cy, gt.cz]),
          Math.max(2.0, gt.l * 0.75),
          0x1f9d55,
          0.45,
          0.28
        );
        aGt.line.material.depthTest = false;
        aGt.cone.material.depthTest = false;
        aGt.renderOrder = 30;
        nhom.add(aGt);
      }

      // 4. Hộp các vòng được chọn
      const cacHopHien = [gt];
      for (const k of [1, 2, 3, 4, 5, 6]) {
        if (!vong.has(k)) continue;
        const vRes = ca.vong && ca.vong[String(k)] ? ca.vong[String(k)][nguon] : null;
        if (vRes && vRes.hop) {
          cacHopHien.push(vRes.hop);
          const hopVkObj = taoHop(ctx, vRes.hop, 'de_xuat', {
            fill: false,
            color: MAU_VONG_HEX[k],
            netDut: true
          });
          nhom.add(hopVkObj);

          if (muiTen && vRes.hop.yaw !== undefined) {
            const aVk = new T.ArrowHelper(
              new T.Vector3(Math.cos(vRes.hop.yaw), 0, -Math.sin(vRes.hop.yaw)),
              ctx.S([vRes.hop.cx, vRes.hop.cy, vRes.hop.cz]),
              Math.max(2.0, vRes.hop.l * 0.75),
              MAU_VONG_HEX[k],
              0.45,
              0.28
            );
            aVk.line.material.depthTest = false;
            aVk.cone.material.depthTest = false;
            aVk.renderOrder = 30;
            nhom.add(aVk);
          }
        }
      }

      // 5. Tia từ cảm biến LiDAR (0,0,0) tới tâm GT
      const pSensor = ctx.S([0, 0, 0]);
      const pGt = ctx.S([gt.cx, gt.cy, gt.cz]);
      const lineGeo = new T.BufferGeometry().setFromPoints([pSensor, pGt]);
      const lineMat = new T.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.6 });
      const tiaSeg = new T.LineSegments(lineGeo, lineMat);
      tiaSeg.userData.hop = 'pipeline';
      nhom.add(tiaSeg);

      // 6. Camera bao trọn GT và các hộp đang hiện
      const coMax = Math.max(...cacHopHien.map(h => Math.max(h.l, h.w, h.h)));
      const xa = Math.max(10.0, 2.7 * coMax + 4.5);
      const tam = ctx.S([gt.cx, gt.cy, gt.cz]);
      const dir = new T.Vector3(0.7, 0.5, 0.7).normalize();
      const camPos = new T.Vector3().copy(tam).addScaledVector(dir, xa);

      if (datCam) ctx.tweenCamera(veEgo(camPos), veEgo(tam), TINH ? 0 : 0.8);
      veLai(ctx);

      // 7. Cập nhật ảnh camera 2D vào phanTuAnh (nếu có)
      if (phanTuAnh) {
        let viewBox = '0 0 1600 900';
        if (cheDoAnh === 'phong' && ca.bbox_gt) {
          const bb = ca.bbox_gt;
          const bw = bb[2] - bb[0];
          const bh = bb[3] - bb[1];
          const cx_2d = (bb[0] + bb[2]) / 2;
          const cy_2d = (bb[1] + bb[3]) / 2;

          let targetW = Math.max(320, bw * 2.2);
          let targetH = Math.max(180, bh * 2.2);

          if (targetW / targetH > 16 / 9) {
            targetH = targetW * (9 / 16);
          } else {
            targetW = targetH * (16 / 9);
          }

          targetW = Math.min(1600, targetW);
          targetH = targetW * (9 / 16);
          const vx = Math.max(0, Math.min(1600 - targetW, cx_2d - targetW / 2));
          const vy = Math.max(0, Math.min(900 - targetH, cy_2d - targetH / 2));
          viewBox = `${vx.toFixed(1)} ${vy.toFixed(1)} ${targetW.toFixed(1)} ${targetH.toFixed(1)}`;
        }

        let svgDoHoa = '';

        // Hộp GT 2D
        if (ca.bbox_gt) {
          const [gx1, gy1, gx2, gy2] = ca.bbox_gt;
          svgDoHoa += `<rect x="${gx1}" y="${gy1}" width="${gx2 - gx1}" height="${gy2 - gy1}" fill="none" stroke="#1f9d55" stroke-width="3.5" />`;
        }

        // Hộp GT 3D chiếu (12 đoạn nối 8 đỉnh goc2d_gt)
        if (ca.goc2d_gt && ca.goc2d_gt.length === 8) {
          const p = ca.goc2d_gt;
          const doanGt = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7]
          ];
          for (const [i1, i2] of doanGt) {
            svgDoHoa += `<line x1="${p[i1][0]}" y1="${p[i1][1]}" x2="${p[i2][0]}" y2="${p[i2][1]}" stroke="#1f9d55" stroke-width="1.8" />`;
          }
        }

        // Khung YOLO đầu vào (nếu chọn nguồn yolo)
        if (nguon === 'yolo') {
          const vResYolo = ca.vong && ca.vong['1'] ? ca.vong['1'].yolo : null;
          if (vResYolo && vResYolo.bbox_vao) {
            const [yx1, yy1, yx2, yy2] = vResYolo.bbox_vao;
            svgDoHoa += `<rect x="${yx1}" y="${yy1}" width="${yx2 - yx1}" height="${yy2 - yy1}" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="6,4" />`;
          }
        }

        // Các vòng Vk được tích chọn
        for (const k of [1, 2, 3, 4, 5, 6]) {
          if (!vong.has(k)) continue;
          const vRes = ca.vong && ca.vong[String(k)] ? ca.vong[String(k)][nguon] : null;
          if (!vRes) continue;

          const mauK = MAU_VONG[k];

          // Khung 2D bao hop2d
          if (vRes.hop2d) {
            const [hx1, hy1, hx2, hy2] = vRes.hop2d;
            svgDoHoa += `<rect x="${hx1}" y="${hy1}" width="${hx2 - hx1}" height="${hy2 - hy1}" fill="none" stroke="${mauK}" stroke-width="1.6" />`;
          }

          // 12 cạnh hình chiếu hộp 3D (goc2d)
          if (vRes.goc2d && vRes.goc2d.length === 8) {
            const p = vRes.goc2d;
            const doanVk = [
              [0, 1], [1, 2], [2, 3], [3, 0],
              [4, 5], [5, 6], [6, 7], [7, 4],
              [0, 4], [1, 5], [2, 6], [3, 7]
            ];
            for (const [i1, i2] of doanVk) {
              svgDoHoa += `<line x1="${p[i1][0]}" y1="${p[i1][1]}" x2="${p[i2][0]}" y2="${p[i2][1]}" stroke="${mauK}" stroke-width="2.2" stroke-dasharray="6,4" />`;
            }
          }
        }

        const anhSrc = ca.anh || '';
        phanTuAnh.innerHTML = `
          <div class="kq_vat_nut_che_do">
            <button class="kq_nut_nho${cheDoAnh === 'phong' ? ' active' : ''}" data-che-do="phong">Phóng vật</button>
            <button class="kq_nut_nho${cheDoAnh === 'ca' ? ' active' : ''}" data-che-do="ca">Cả ảnh</button>
          </div>
          <svg class="kq_vat_svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">
            <image href="${anhSrc}" x="0" y="0" width="1600" height="900" />
            ${svgDoHoa}
          </svg>
        `;
      }

      return diemObj;
    },

    xoa() {
      xoaNhomCa(nhom);
      const el = layPhanTuAnh();
      if (el) el.innerHTML = '';
    }
  };
}
