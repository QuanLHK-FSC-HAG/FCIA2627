#!/usr/bin/env python3
"""Tách file export 1 file của không gian FCIA (artifact khong-gian-fcia-loc-bao-cao)
thành webapp tĩnh modular cho repo FCIA2627.

Cấu trúc đích:
    index.html            # shell: hero, bộ chọn tuần, Cần theo dõi, KPI, bảng, biểu đồ
    assets/css/style.css  # toàn bộ CSS từ khối <style>
    assets/js/app.js      # logic app (IIFE), gắn logo từ window.FPT_LOGO
    data/weeks.js         # var WEEKS = [...] (giữ nguyên dữ liệu)
    data/logo.js          # window.FPT_LOGO = "data:image/png;base64,..."
    vercel.json           # site tĩnh, không bước build
    README.md

Quy ước (theo skill thoc-fschag-webapp):
- Mọi file là UTF-8 text, không file nhị phân (github push-files chỉ đẩy UTF-8).
- Mỗi file < 3,5 MiB; mỗi lần đẩy GitHub <= ~3,5 MiB.
- Sửa nội dung trên artifact trước, rồi export lại + chạy script này.

Cách dùng:
    python3 tools/split.py <file-export.html> <thư-mục-repo>
"""
import re
import sys
from pathlib import Path

LOGO_HOOK = """
  /* Logo FPT Education: đọc từ data/logo.js (giữ dạng text, không file nhị phân). */
  (function () {
    var _logo = document.querySelector(".brand-logo");
    if (_logo && window.FPT_LOGO) _logo.src = window.FPT_LOGO;
  })();
"""


def split(export_path: Path, out_dir: Path) -> dict:
    s = export_path.read_text(encoding="utf-8")

    # 1. CSS
    m = re.search(r"<style>(.*?)</style>", s, flags=re.S)
    if not m:
        raise SystemExit("Không tìm thấy khối <style> trong file export")
    css = m.group(1).strip() + "\n"

    # 2. Hai khối script: [0] var WEEKS, [1] logic app
    scripts = re.findall(r"<script>(.*?)</script>", s, flags=re.S)
    if len(scripts) != 2:
        raise SystemExit(f"Cần đúng 2 khối <script>, tìm thấy {len(scripts)}")
    weeks_js = scripts[0].strip() + "\n"
    if not weeks_js.startswith("var WEEKS"):
        raise SystemExit("Script 0 không phải var WEEKS")
    app_js = scripts[1].strip() + "\n"
    if '"use strict"' not in app_js:
        raise SystemExit("Script 1 không phải logic app (thiếu 'use strict')")

    # Gắn logo: chèn hook ngay sau "use strict";
    app_js = app_js.replace('"use strict";', '"use strict";' + LOGO_HOOK, 1)

    # 3. Logo base64 từ <img class="brand-logo">
    m = re.search(r'<img class="brand-logo" src="(data:image/png;base64,[A-Za-z0-9+/=]+)"', s)
    if not m:
        raise SystemExit("Không tìm thấy <img class=\"brand-logo\"> với src base64")
    logo_js = 'window.FPT_LOGO = "' + m.group(1) + '";\n'

    # 4. Head: giữ meta/title/font, thay <style> bằng link CSS
    head = s[s.find("<head>"):s.find("</head>")]
    head = re.sub(r"<style>.*?</style>", "", head, flags=re.S)
    # Lưu ý: lát cắt head không chứa </head> nên nối link CSS + </head> ở cuối.
    head = (
        head.rstrip()
        + '\n    <link rel="stylesheet" href="assets/css/style.css" />\n  </head>'
    )

    # 5. Body: bỏ src base64 của logo, thay 2 khối script bằng 3 thẻ <script src>
    body = s[s.find("<body"):s.find("</body>")]
    body = re.sub(
        r'<img class="brand-logo" src="data:image/png;base64,[A-Za-z0-9+/=]+"',
        '<img class="brand-logo"',
        body,
    )
    body = re.sub(r"<script>.*?</script>", "", body, flags=re.S)
    # Lưu ý: lát cắt body không chứa </body> nên nối thẻ script + </body> ở cuối.
    body = (
        body.rstrip()
        + "\n\n    <script src=\"data/weeks.js\"></script>\n"
        + '    <script src="data/logo.js"></script>\n'
        + '    <script src="assets/js/app.js"></script>\n'
        + "  </body>"
    )

    index_html = "<!doctype html>\n<html lang=\"vi\">\n" + head + "\n" + body + "\n</html>\n"

    files = {
        "index.html": index_html,
        "assets/css/style.css": css,
        "assets/js/app.js": app_js,
        "data/weeks.js": weeks_js,
        "data/logo.js": logo_js,
    }
    for rel, content in files.items():
        p = out_dir / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
    return {rel: len(c.encode("utf-8")) for rel, c in files.items()}


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Cách dùng: python3 tools/split.py <file-export.html> <thư-mục-repo>")
        sys.exit(1)
    sizes = split(Path(sys.argv[1]), Path(sys.argv[2]))
    for rel, size in sizes.items():
        print(f"{rel}: {size} byte ({size/1024:.1f} KiB)")
