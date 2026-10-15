import { SLIDES_BAI_TOAN } from './bai_toan.js';
import { SLIDES_HINH_HOC } from './hinh_hoc.js';
import { SLIDES_LOC_GOM } from './loc_gom.js';
import { SLIDES_HOP_HUONG } from './hop_huong.js';
import { slideLuongChinh, slideVong2, slideVong3, slideVong4, slideVong5 } from './cac_vong.js';
import { slideThatV1, slideVongThat } from './vong_that.js';
import { slideVong6 } from './vong_6.js';
import { slideConSai } from './con_sai.js';
import { SLIDES_CAI_TIEN } from './cai_tien.js';
import { SLIDES_KET_QUA } from './ket_qua.js';
import { SLIDES_DANH_GIA } from './danh_gia.js';
import { SLIDES_LO_TRINH } from './lo_trinh.js';

export const SLIDES = [
  ...SLIDES_BAI_TOAN,
  ...SLIDES_HINH_HOC,
  ...SLIDES_LOC_GOM,
  ...SLIDES_HOP_HUONG,

  // Chương Các vòng cải tiến (14 slide theo PLAN Đợt 15)
  slideLuongChinh,
  slideThatV1,
  slideVong2,
  slideVongThat(2),
  slideVong3,
  slideVongThat(3),
  slideVong4,
  slideVongThat(4),
  slideVong5,
  slideVongThat(5),
  slideVong6,
  slideVongThat(6),
  slideConSai,
  ...SLIDES_CAI_TIEN,

  ...SLIDES_KET_QUA,
  ...SLIDES_DANH_GIA,
  ...SLIDES_LO_TRINH
];
