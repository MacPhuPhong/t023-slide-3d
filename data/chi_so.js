// Bảng chỉ số đánh giá và QA/QC (theo §5.4 PLAN.md)
// null = chưa đo; sửa một dòng tại đây sẽ tự động cập nhật trên slide S17/S18.
import { VONG_THAT } from './vong_that.js';

export const CHI_SO = {
  cap_nhat: '2026-10-16',
  muc_tieu_chung: [
    'Giảm ≥ 30 % giây/cuboid so với gán tay',
    'Xe trong 35 m, khung đáp án: IoU 3D trung vị ≥ 0,5',
    'Tỉ lệ lật ≤ 15 %'
  ],
  nhom: [
    {
      id: 'chinh_xac',
      ten: 'Độ chính xác hộp (tập chấm scene-0103, 0916)',
      muc: [
        { id: 'iou_xe_0_20', ten: 'IoU 3D trung vị xe con 0–20 m', gia_tri: null, don_vi: '', muc_tieu: '≥ 0,5', so_sanh: '>=', trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'iou_xe_20_35', ten: 'IoU 3D trung vị xe con 20–35 m', gia_tri: null, don_vi: '', muc_tieu: '≥ 0,5', so_sanh: '>=', trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'iou_xe_35_50', ten: 'IoU 3D trung vị xe con 35–50 m', gia_tri: null, don_vi: '', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'iou_nguoi', ten: 'IoU 3D trung vị người lớn', gia_tri: null, don_vi: '', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'iou_bev', ten: 'IoU BEV trung vị', gia_tri: null, don_vi: '', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'sai_so_tam', ten: 'Sai số tâm trung vị', gia_tri: null, don_vi: 'm', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'tập chấm cuối', nguon: '' },
        { id: 'e180_tv', ten: 'e₁₈₀ trung vị', gia_tri: null, don_vi: '°', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'ti_le_lat', ten: 'Tỉ lệ lật', gia_tri: null, don_vi: '%', muc_tieu: '≤ 15 %', so_sanh: '<=', trang_thai: 'chua_do', du_kien: 'tập chấm cuối', nguon: '' },
        { id: 'ti_le_dung_hop', ten: 'Tỉ lệ dựng được hộp (gồm hộp dự phòng C1b)', gia_tri: null, don_vi: '%', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'tập chấm cuối', nguon: '' },
        { id: 'iou_gt_2d', ten: 'Khung 2D đáp án: IoU 3D trung vị', gia_tri: null, don_vi: '', muc_tieu: '≥ 0,5', so_sanh: '>=', trang_thai: 'chua_do', du_kien: 'tập chấm cuối', nguon: '' },
        { id: 'iou_yolo_2d', ten: 'Khung 2D YOLO: IoU 3D trung vị', gia_tri: null, don_vi: '', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'tập chấm cuối', nguon: '' }
      ]
    },
    {
      id: 'nang_suat',
      ten: 'Năng suất người gán (5 người)',
      muc: [
        { id: 's_tay_p50', ten: 'Giây/cuboid gán tay (p50)', gia_tri: null, don_vi: 's', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 's_tay_p95', ten: 'Giây/cuboid gán tay (p95)', gia_tri: null, don_vi: 's', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 's_tool_p50', ten: 'Giây/cuboid có công cụ (p50)', gia_tri: null, don_vi: 's', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 's_tool_p95', ten: 'Giây/cuboid có công cụ (p95)', gia_tri: null, don_vi: 's', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'ti_so_r', ten: 'Tỉ số trung bình hình học r̄', gia_tri: null, don_vi: '', muc_tieu: '≤ 0,70', so_sanh: '<=', trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'ci_95_r', ten: 'Khoảng tin cậy 95 % của r̄', gia_tri: null, don_vi: '', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'ti_le_sua', ten: 'Tỉ lệ hộp người phải sửa', gia_tri: null, don_vi: '%', muc_tieu: '', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' }
      ]
    },
    {
      id: 'qc',
      ten: 'QC dữ liệu và hệ thống',
      muc: [
        { id: 'p_chieu_nus', ten: 'Phép chiếu so nuscenes-devkit', gia_tri: null, don_vi: 'px', muc_tieu: '≤ 2 px', so_sanh: '<=', trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'dong_thuan_2nguoi', ten: 'Đồng thuận hai người trên cùng vật', gia_tri: null, don_vi: 'IoU', muc_tieu: '≥ 0,845', so_sanh: '>=', trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'cvat_roundtrip', ten: 'Lưu/đọc lại CVAT với tài khoản thật', gia_tri: null, don_vi: '', muc_tieu: 'Khớp', so_sanh: null, trang_thai: 'chua_do', du_kien: 'sau 16/10', nguon: '' },
        { id: 'bo_test_td', ten: 'Bộ test tự động', gia_tri: 'unittest 213/213 · pytest 86/86 · Node 318/321', don_vi: '', muc_tieu: 'Pass hết', so_sanh: null, trang_thai: 'da_do', du_kien: '', nguon: 'CHOT §1 (15/10)' },
        { id: 'cvat_euler_order', ten: 'Thống nhất thứ tự xoay CVAT RxRyRz vs tool RzRyRx', gia_tri: null, don_vi: '', muc_tieu: 'Thống nhất', so_sanh: null, trang_thai: 'dang_do', du_kien: '12/10', nguon: '' }
      ]
    },
    {
      id: 'thang_v',
      ten: 'Thang cải tiến V1 → V6 (% đạt, 5 bộ, khung GT)',
      muc: [
        { id: 'thang_v1', ten: 'V1: Frustum Studio gốc', gia_tri: VONG_THAT.vong['1'].dat_pct.nam_bo.gt, don_vi: '%', muc_tieu: '', so_sanh: null, trang_thai: 'da_do', du_kien: '', nguon: 'vong_that.js' },
        { id: 'thang_v2', ten: 'V2: kích thước mẫu + ngưỡng điểm theo cự ly', gia_tri: VONG_THAT.vong['2'].dat_pct.nam_bo.gt, don_vi: '%', muc_tieu: '', so_sanh: null, trang_thai: 'da_do', du_kien: '', nguon: 'vong_that.js' },
        { id: 'thang_v3', ten: 'V3: đảo trục 90° + hộp dự phòng', gia_tri: VONG_THAT.vong['3'].dat_pct.nam_bo.gt, don_vi: '%', muc_tieu: '', so_sanh: null, trang_thai: 'da_do', du_kien: '', nguon: 'vong_that.js' },
        { id: 'thang_v4', ten: 'V4: fit chữ L closeness', gia_tri: VONG_THAT.vong['4'].dat_pct.nam_bo.gt, don_vi: '%', muc_tieu: '', so_sanh: null, trang_thai: 'da_do', du_kien: '', nguon: 'vong_that.js' },
        { id: 'thang_v5', ten: 'V5: cực tiểu năng lượng + logistic 13 đặc trưng', gia_tri: VONG_THAT.vong['5'].dat_pct.nam_bo.gt, don_vi: '%', muc_tieu: '', so_sanh: null, trang_thai: 'da_do', du_kien: '', nguon: 'vong_that.js' },
        { id: 'thang_v6', ten: 'V6: lưới mặt đất v3a', gia_tri: VONG_THAT.vong['6'].dat_pct.nam_bo.gt, don_vi: '%', muc_tieu: '', so_sanh: null, trang_thai: 'da_do', du_kien: '', nguon: 'vong_that.js' }
      ]
    }
  ]
};
