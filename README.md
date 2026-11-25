# FCIA - FSC HAG 2026-2027

Webapp tĩnh (HTML + CSS + JS, không có bước build) hiển thị báo cáo giảng dạy
hàng tuần FCIA — dạy học đảo ngược tích hợp AI Chatbot trên EduNext — của giáo
viên Trường TH, THCS & THPT FPT Hậu Giang, năm học 2026–2027.

- Mở trang là thấy ngay mục **Cần theo dõi** và báo cáo đầy đủ của **tuần liền
  kề trước đó** (mặc định Tuần 11, 16–20/11/2026, vì Tuần 12 đang mở nhập liệu).
- Lọc báo cáo theo giáo viên, môn, lớp, campus, mô hình LHĐN/FSAL, cờ cần chú
  ý; tìm kiếm toàn văn; bấm một dòng để xem đầy đủ 24 cột.
- Dữ liệu: 12 tuần (Tuần 01–12), 248 dòng báo cáo, trích từ các file “Báo cáo
  FCIA Tuần 01–12” trên Google Drive FCIA 2627 ngày 25/11/2026.
- Nút “Mở file Tuần 12” dẫn tới file Google Sheets tuần hiện tại để giáo viên
  nhập liệu (quyền nhập liệu qua link chia sẻ).

## Cấu trúc

```
FCIA2627/
├── index.html            # Shell: hero (logo FPT + tiêu đề 3 màu), bộ chọn tuần,
│                         # Cần theo dõi, KPI, bộ lọc, bảng báo cáo, biểu đồ, footer
├── assets/
│   ├── css/style.css     # Toàn bộ CSS
│   └── js/app.js         # Logic: chọn tuần mặc định, lọc, bảng, biểu đồ, dialog
├── data/
│   ├── weeks.js          # var WEEKS = [...] — dữ liệu báo cáo (giữ nguyên)
│   └── logo.js           # window.FPT_LOGO — logo FPT Education dạng base64 (text)
├── tools/
│   └── split.py          # Tách file export 1 file của artifact thành cấu trúc này
├── vercel.json           # Site tĩnh, không có bước build
└── README.md
```

Ảnh logo giữ dạng chuỗi base64 trong file text (`data/logo.js`), không có file
nhị phân trong repo (quy ước đẩy GitHub của dự án: chỉ file UTF-8).

## Deploy lên Vercel

1. Import repo này trên Vercel (Add New → Project → chọn repo `FCIA2627`).
2. Framework Preset: **Other** (không chọn framework nào).
3. Build Command: để trống; Output Directory: để trống (thư mục gốc).
4. Deploy. Vercel cấp link `*.vercel.app`; có thể gắn tên miền riêng sau.

Chạy local: mở trực tiếp `index.html` bằng trình duyệt (webapp không dùng
`fetch()` nên chạy được cả với `file://`), hoặc `python3 -m http.server 8000`.

## Cập nhật dữ liệu

1. Sửa nội dung trên không gian FCIA trong Muse (artifact
   `khong-gian-fcia-loc-bao-cao`) — đó là nguồn sự thật duy nhất.
2. Export bản mới nhất của artifact ra file HTML.
3. Chạy lại script tách module:
   ```bash
   python3 tools/split.py <file-export.html> <thư-mục-repo>
   ```
4. Kiểm chứng local (`node --check` các file JS, render thử bằng jsdom:
   tuần mặc định là tuần liền kề trước, mục Cần theo dõi đứng đầu) rồi đẩy
   lên GitHub (mỗi file < 3,5 MiB, mỗi lần đẩy ≤ ~3,5 MiB).
