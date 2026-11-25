(function () {
        "use strict";
  /* Logo FPT Education: đọc từ data/logo.js (giữ dạng text, không file nhị phân). */
  (function () {
    var _logo = document.querySelector(".brand-logo");
    if (_logo && window.FPT_LOGO) _logo.src = window.FPT_LOGO;
  })();


        function parseDMY(s) {
          if (!s) return null;
          var p = s.split("/");
          return new Date(+p[2], +p[1] - 1, +p[0]);
        }
        function fmtPct(x) {
          return (Math.round(x * 10) / 10).toString().replace(".", ",") + "%";
        }
        function isBlankish(v) {
          if (v === null || v === undefined) return true;
          var s = String(v).trim().toLowerCase();
          return s === "" || s === "không" || s === "không có" || s === "ko" || s === "-";
        }
        function num(v) { return (typeof v === "number" && isFinite(v)) ? v : null; }

        function rowFlags(r) {
          var f = [];
          if (!isBlankish(r.lyDo)) f.push({ k: "lyDo", label: "HS chưa hoàn thành", cls: "red" });
          if (!isBlankish(r.hsLuuY)) f.push({ k: "luuY", label: "HS cần lưu ý", cls: "amber" });
          if (!isBlankish(r.suCo)) f.push({ k: "suCo", label: "Sự cố kỹ thuật", cls: "blue" });
          return f;
        }

        /* ---------- Default week: the week right before the current one, so the
           dashboard opens on the latest complete (full) weekly report ---------- */
        var today = new Date(); today.setHours(0, 0, 0, 0);
        function defaultWeek() {
          var cur = null;
          WEEKS.forEach(function (w) {
            var a = parseDMY(w.tu), b = parseDMY(w.den);
            if (a && b && today >= a && today <= b) cur = w;
          });
          var withData = WEEKS.filter(function (w) { return w.rows.length > 0; })
            .sort(function (x, y) { return x.tuan - y.tuan; });
          if (cur) {
            var prev = withData.filter(function (w) { return w.tuan < cur.tuan; });
            if (prev.length) return prev[prev.length - 1].tuan;
            return cur.tuan;
          }
          if (withData.length) return withData[withData.length - 1].tuan;
          return WEEKS[WEEKS.length - 1].tuan;
        }
        var state = { week: null, gv: "", mon: "", lop: "", campus: "", model: "", flag: "", q: "" };
        state.week = defaultWeek();

        var $ = function (id) { return document.getElementById(id); };
        var els = {
          pills: $("weekPills"), hint: $("weekHint"), kpis: $("kpis"),
          fGv: $("fGv"), fMon: $("fMon"), fLop: $("fLop"), fCampus: $("fCampus"),
          fModel: $("fModel"), fFlag: $("fFlag"), fQ: $("fQ"),
          count: $("resultCount"), tableTitle: $("tableTitle"), tableWrap: $("tableWrap"),
          watchWrap: $("watchWrap"), watchCount: $("watchCount"),
          backdrop: $("dialogBackdrop"), dTitle: $("dialogTitle"), dSub: $("dialogSub"), dBody: $("dialogBody")
        };

        function weekObj() {
          for (var i = 0; i < WEEKS.length; i++) if (WEEKS[i].tuan === state.week) return WEEKS[i];
          return WEEKS[WEEKS.length - 1];
        }

        /* ---------- Week pills (newest first) ---------- */
        function renderPills() {
          var html = "";
          var sorted = WEEKS.slice().sort(function (a, b) { return b.tuan - a.tuan; });
          sorted.forEach(function (w) {
            var a = parseDMY(w.tu), b = parseDMY(w.den);
            var isNow = a && b && today >= a && today <= b;
            var n = w.rows.length;
            html += '<button type="button" role="tab" class="week-pill' + (w.tuan === state.week ? " active" : "") +
              '" data-week="' + w.tuan + '" aria-selected="' + (w.tuan === state.week) + '">' +
              '<span class="w-name"><span class="dot' + (n === 0 ? " empty" : "") + '"></span>Tuần ' +
              (w.tuan < 10 ? "0" : "") + w.tuan +
              (isNow ? ' <span class="badge-now">Tuần này</span>' : "") + "</span>" +
              '<span class="w-dates">' + (w.tu || "") + " – " + (w.den || "") + "</span><br>" +
              '<span class="w-rows">' + (n === 0 ? "Chưa có dữ liệu" : n + " dòng báo cáo") + "</span></button>";
          });
          els.pills.innerHTML = html;
          var pills = els.pills.querySelectorAll(".week-pill");
          for (var i = 0; i < pills.length; i++) {
            pills[i].addEventListener("click", function () {
              state.week = +this.getAttribute("data-week");
              resetFilters();
              renderAll();
            });
          }
          var w = weekObj();
          var a = parseDMY(w.tu), b = parseDMY(w.den);
          var isNow = a && b && today >= a && today <= b;
          els.hint.textContent = isNow
            ? "Đang xem tuần hiện tại — tuần này đang nhập liệu nên số liệu chưa đầy đủ."
            : "Chọn tuần khác ở trên.";
        }

        /* ---------- Filter options from current week ---------- */
        function uniqSorted(rows, key) {
          var seen = {}, out = [];
          rows.forEach(function (r) {
            var v = r[key];
            if (v !== null && v !== undefined && String(v).trim() !== "" && !seen[v]) { seen[v] = 1; out.push(v); }
          });
          return out.sort(function (x, y) { return String(x).localeCompare(String(y), "vi"); });
        }
        function fillSelect(sel, values, allLabel, keep) {
          var cur = keep ? sel.value : "";
          var html = '<option value="">' + allLabel + "</option>";
          values.forEach(function (v) { html += '<option value="' + esc(v) + '">' + esc(v) + "</option>"; });
          sel.innerHTML = html;
          sel.value = values.indexOf(cur) >= 0 ? cur : "";
          return sel.value;
        }
        function renderFilterOptions() {
          var rows = weekObj().rows;
          state.gv = fillSelect(els.fGv, uniqSorted(rows, "gv"), "Tất cả giáo viên", true);
          state.mon = fillSelect(els.fMon, uniqSorted(rows, "mon"), "Tất cả môn học", true);
          state.lop = fillSelect(els.fLop, uniqSorted(rows, "lop"), "Tất cả lớp", true);
          state.campus = fillSelect(els.fCampus, uniqSorted(rows, "campus"), "Tất cả campus", true);
        }
        function resetFilters() {
          state.gv = state.mon = state.lop = state.campus = state.model = state.flag = state.q = "";
          els.fModel.value = ""; els.fFlag.value = ""; els.fQ.value = "";
        }

        function esc(v) {
          return String(v === null || v === undefined ? "" : v)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        }

        function filteredRows() {
          var q = state.q.trim().toLowerCase();
          return weekObj().rows.filter(function (r) {
            if (state.gv && r.gv !== state.gv) return false;
            if (state.mon && r.mon !== state.mon) return false;
            if (state.lop && r.lop !== state.lop) return false;
            if (state.campus && r.campus !== state.campus) return false;
            if (state.model && r.moHinh !== state.model) return false;
            if (state.flag) {
              var ks = rowFlags(r).map(function (f) { return f.k; });
              if (ks.indexOf(state.flag) < 0) return false;
            }
            if (q) {
              var hay = [r.gv, r.mon, r.lop, r.noiDung, r.khoKhan, r.deXuat, r.congCu, r.suCo, r.hsLuuY, r.tinhHuong, r.lyDo]
                .join(" ").toLowerCase();
              if (hay.indexOf(q) < 0) return false;
            }
            return true;
          });
        }

        /* ---------- KPIs ---------- */
        function renderKpis(rows) {
          var gvs = {}, tietKH = 0, tietDay = 0, hsHT = 0, siSo = 0, hlSum = 0, hlN = 0, luuY = 0;
          rows.forEach(function (r) {
            gvs[r.gv] = 1;
            if (num(r.tietKH) !== null) tietKH += r.tietKH;
            if (num(r.tietDay) !== null) tietDay += r.tietDay;
            if (num(r.hsHT) !== null && num(r.siSo) !== null) { hsHT += r.hsHT; siSo += r.siSo; }
            if (num(r.haiLong) !== null) { hlSum += r.haiLong; hlN++; }
            if (!isBlankish(r.hsLuuY)) luuY++;
          });
          var tietPct = tietKH > 0 ? tietDay / tietKH * 100 : null;
          var hsPct = siSo > 0 ? hsHT / siSo * 100 : null;
          var cards = [
            { label: "Dòng báo cáo", value: rows.length, sub: "trong phạm vi đang lọc" },
            { label: "Giáo viên", value: Object.keys(gvs).length, sub: "đã có báo cáo" },
            { label: "Tiết thực dạy / KHDH", value: tietDay + " / " + tietKH, sub: tietPct !== null ? "đạt " + fmtPct(tietPct) + " kế hoạch" : "chưa có số liệu" },
            { label: "HS hoàn thành", value: hsPct !== null ? fmtPct(hsPct) : "—", sub: hsHT + " / " + siSo + " học sinh" },
            { label: "Hài lòng TB", value: hlN ? (Math.round(hlSum / hlN * 100) / 100).toString().replace(".", ",") + " / 5" : "—", sub: hlN + " dòng có đánh giá" },
            { label: "Ca HS cần lưu ý", value: luuY, sub: luuY ? "xem khung Cần theo dõi" : "không có ca nào", warn: luuY > 0 }
          ];
          els.kpis.innerHTML = cards.map(function (c) {
            return '<div class="kpi' + (c.warn ? " warn" : "") + '"><div class="k-label">' + c.label +
              '</div><div class="k-value">' + c.value + '</div><div class="k-sub">' + c.sub + "</div></div>";
          }).join("");
        }

        /* ---------- Table ---------- */
        function renderTable(rows) {
          var w = weekObj();
          els.tableTitle.textContent = "Báo cáo Tuần " + (w.tuan < 10 ? "0" : "") + w.tuan + " · " + (w.tu || "") + " – " + (w.den || "");
          if (w.rows.length === 0) {
            els.tableWrap.innerHTML = '<div class="empty-state"><div class="big">Tuần ' + w.tuan +
              ' đang mở nhập liệu</div><p>File báo cáo tuần này đã có trên Drive và đang chờ giáo viên nhập số liệu ' +
              '(thứ 2 ' + (w.tu || "") + ' – thứ 6 ' + (w.den || "") + '). Khi có dữ liệu, tuần này sẽ hiện đầy đủ như các tuần trước.</p>' +
              '<a class="btn primary" href="https://docs.google.com/spreadsheets/d/18emcHAiewA4SuS7F8tWdawiISLPAR4E-/edit?usp=drivesdk&amp;ouid=115290489030694063954&amp;rtpof=true&amp;sd=true" target="_blank" rel="noopener">Mở file Tuần 12 để nhập liệu</a></div>';
            return;
          }
          if (rows.length === 0) {
            els.tableWrap.innerHTML = '<div class="empty-state"><div class="big">Không có dòng nào khớp bộ lọc</div>' +
              '<p>Thử bỏ bớt điều kiện lọc hoặc xóa từ khóa tìm kiếm.</p></div>';
            return;
          }
          var html = '<div class="table-scroll"><table class="report"><thead><tr>' +
            "<th>STT</th><th>Giáo viên</th><th>Môn · Lớp</th><th>Tiết KH / Thực dạy</th>" +
            "<th>HS hoàn thành</th><th>Hài lòng</th><th>Mô hình</th><th>Nội dung triển khai</th><th>Cần chú ý</th>" +
            "</tr></thead><tbody>";
          rows.forEach(function (r, i) {
            var idx = weekObj().rows.indexOf(r);
            var kh = num(r.tietKH), td = num(r.tietDay);
            var tietTxt = (kh !== null ? kh : "—") + " / " + (td !== null ? td : "—");
            var hs = num(r.hsHT), ss = num(r.siSo);
            var hsHtml = "—";
            if (hs !== null && ss !== null && ss > 0) {
              var p = hs / ss * 100;
              var cls = p >= 90 ? "" : (p >= 75 ? "mid" : "low");
              hsHtml = "<b>" + fmtPct(p) + "</b> <span class='cell-sub'>(" + hs + "/" + ss + ")</span>" +
                '<div class="pct-bar"><i class="' + cls + '" style="width:' + Math.min(100, p) + '%"></i></div>';
            }
            var flags = rowFlags(r).map(function (f) {
              return '<span class="flag ' + f.cls + '">' + f.label + "</span>";
            }).join("");
            html += '<tr data-idx="' + idx + '" tabindex="0" role="button" aria-label="Xem chi tiết dòng báo cáo của ' + esc(r.gv) + '">' +
              '<td data-label="STT" class="no-label">' + (i + 1) + "</td>" +
              '<td data-label="Giáo viên"><span class="gv-name">' + esc(r.gv) + '</span><div class="cell-sub">' + esc(r.campus || "") + "</div></td>" +
              '<td data-label="Môn · Lớp">' + esc(r.mon || "—") + '<div class="cell-sub">Lớp ' + esc(r.lop || "—") + "</div></td>" +
              '<td data-label="Tiết KH / Thực dạy">' + tietTxt + "</td>" +
              '<td data-label="HS hoàn thành">' + hsHtml + "</td>" +
              '<td data-label="Hài lòng">' + (num(r.haiLong) !== null ? r.haiLong + " / 5" : "—") + "</td>" +
              '<td data-label="Mô hình"><span class="model-tag' + (r.moHinh === "LHĐN" ? " lhdn" : "") + '">' + esc(r.moHinh || "—") + "</span></td>" +
              '<td data-label="Nội dung triển khai" class="content-cell"><span>' + esc(r.noiDung || "—") + "</span></td>" +
              '<td data-label="Cần chú ý"><div class="flags">' + (flags || '<span class="cell-sub">—</span>') + "</div></td>" +
              "</tr>";
          });
          html += "</tbody></table></div>";
          els.tableWrap.innerHTML = html;
          var trs = els.tableWrap.querySelectorAll("tbody tr");
          for (var i = 0; i < trs.length; i++) {
            trs[i].addEventListener("click", function () { openDetail(+this.getAttribute("data-idx")); });
            trs[i].addEventListener("keydown", function (e) {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(+this.getAttribute("data-idx")); }
            });
          }
        }

        /* ---------- Watch list ---------- */
        function renderWatch(rows) {
          var items = [];
          rows.forEach(function (r) {
            var parts = [];
            if (!isBlankish(r.hsLuuY)) parts.push("<b>HS cần lưu ý:</b> " + esc(r.hsLuuY));
            if (!isBlankish(r.lyDo)) parts.push("<b>Lý do HS chưa hoàn thành:</b> " + esc(r.lyDo));
            if (!isBlankish(r.tinhHuong)) parts.push("<b>Tình huống đặc biệt:</b> " + esc(r.tinhHuong));
            if (parts.length) items.push({ r: r, parts: parts, idx: weekObj().rows.indexOf(r) });
          });
          els.watchCount.textContent = items.length ? items.length + " mục" : "";
          if (!items.length) {
            els.watchWrap.innerHTML = '<div class="watch-empty">Không có HS cần lưu ý, lý do chưa hoàn thành hay tình huống đặc biệt trong phạm vi đang lọc.</div>';
            return;
          }
          var html = '<ul class="watch-list">';
          items.forEach(function (it) {
            html += '<li data-idx="' + it.idx + '"><div class="w-top"><b>' + esc(it.r.gv) + "</b><span>" +
              esc(it.r.mon || "") + " · Lớp " + esc(it.r.lop || "") + '</span></div><div class="w-text">' +
              it.parts.join("<br>") + "</div></li>";
          });
          html += "</ul>";
          els.watchWrap.innerHTML = html;
          var lis = els.watchWrap.querySelectorAll("li");
          for (var i = 0; i < lis.length; i++) {
            lis[i].addEventListener("click", function () { openDetail(+this.getAttribute("data-idx")); });
          }
        }

        /* ---------- Detail dialog ---------- */
        var FIELDS = [
          ["gv", "Giáo viên"], ["mon", "Môn học"], ["lop", "Lớp"], ["campus", "Campus"],
          ["siSo", "Sỉ số"], ["hsHT", "Số HS hoàn thành"],
          ["tietKH", "Số tiết KHDH"], ["tietDay", "Số tiết thực dạy"],
          ["moHinh", "Mô hình FCIA"], ["haiLong", "Mức độ hài lòng chung (1–5)"],
          ["noiDung", "Nội dung chuyên môn đã triển khai", 1],
          ["khoKhan", "Khó khăn chuyên môn", 1], ["deXuat", "Đề xuất hỗ trợ chuyên môn", 1],
          ["congCu", "Công cụ / nền tảng AI đã dùng", 1], ["suCo", "Sự cố kỹ thuật gặp phải", 1],
          ["anhHuong", "Mức độ ảnh hưởng KT"],
          ["hsLuuY", "Tên HS / nhóm HS cần lưu ý", 1], ["tinhHuong", "Tình huống đặc biệt", 1],
          ["uuTien", "Mức độ ưu tiên"], ["trangThai", "Trạng thái xử lý"],
          ["lyDo", "Lý do HS chưa hoàn thành", 1]
        ];
        function openDetail(idx) {
          var r = weekObj().rows[idx];
          if (!r) return;
          var w = weekObj();
          els.dTitle.textContent = r.gv + (r.mon ? " — " + r.mon : "");
          els.dSub.textContent = "Tuần " + w.tuan + " (" + (w.tu || "") + " – " + (w.den || "") + ") · Lớp " + (r.lop || "—") + " · " + (r.campus || "");
          var kh = num(r.tietKH), td = num(r.tietDay), hs = num(r.hsHT), ss = num(r.siSo);
          var extra = "";
          if (kh && td !== null) extra += '<div class="d-item"><div class="d-label">Tỷ lệ hoàn thành tiết dạy</div><div class="d-value">' + fmtPct(td / kh * 100) + "</div></div>";
          if (hs !== null && ss) extra += '<div class="d-item"><div class="d-label">Tỷ lệ HS hoàn thành</div><div class="d-value">' + fmtPct(hs / ss * 100) + "</div></div>";
          els.dBody.innerHTML = FIELDS.map(function (f) {
            var v = r[f[0]];
            var missing = v === null || v === undefined || String(v).trim() === "";
            return '<div class="d-item' + (f[2] ? " full" : "") + '"><div class="d-label">' + f[1] +
              '</div><div class="d-value' + (missing ? " missing" : "") + '">' + (missing ? "Để trống (bình thường)" : esc(v)) + "</div></div>";
          }).join("") + extra;
          els.backdrop.classList.add("open");
          $("dialogClose").focus();
        }
        function closeDetail() { els.backdrop.classList.remove("open"); }
        $("dialogClose").addEventListener("click", closeDetail);
        els.backdrop.addEventListener("click", function (e) { if (e.target === els.backdrop) closeDetail(); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDetail(); });

        /* ---------- Trend chart (SVG, from real data) ---------- */
        function renderChart() {
          var data = WEEKS.filter(function (w) { return w.rows.length > 0; }).map(function (w) {
            var hs = 0, ss = 0;
            w.rows.forEach(function (r) {
              if (num(r.hsHT) !== null && num(r.siSo) !== null) { hs += r.hsHT; ss += r.siSo; }
            });
            return { tuan: w.tuan, n: w.rows.length, pct: ss > 0 ? hs / ss * 100 : null };
          });
          if (!data.length) { $("chartWrap").innerHTML = ""; return; }
          var W = 720, H = 260, padL = 54, padR = 14, padT = 22, padB = 34;
          var iw = W - padL - padR, ih = H - padT - padB;
          var maxN = Math.max.apply(null, data.map(function (d) { return d.n; }));
          maxN = Math.ceil(maxN / 10) * 10;
          var step = iw / data.length, bw = Math.min(44, step * 0.52);
          var x = function (i) { return padL + step * i + step / 2; };
          var yN = function (v) { return padT + ih - (v / maxN) * ih; };
          var yP = function (v) { return padT + ih - (v / 100) * ih; };
          var s = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" aria-label="Biểu đồ số dòng báo cáo và tỷ lệ HS hoàn thành theo tuần" style="display:block">';
          // gridlines for % (0,25,50,75,100)
          [0, 25, 50, 75, 100].forEach(function (g) {
            var yy = yP(g);
            s += '<line x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy + '" stroke="var(--line)" stroke-width="1"/>' +
              '<text x="' + (padL - 6) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="11" fill="var(--ink-soft)">' + g + "%</text>";
          });
          var pts = [];
          data.forEach(function (d, i) {
            var bx = x(i) - bw / 2, by = yN(d.n);
            s += '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + (padT + ih - by) + '" rx="4" fill="var(--blue)" opacity="0.85"><title>Tuần ' + d.tuan + ": " + d.n + " dòng</title></rect>";
            s += '<text x="' + x(i) + '" y="' + (by - 5) + '" text-anchor="middle" font-size="11.5" font-weight="600" fill="var(--ink)">' + d.n + "</text>";
            s += '<text x="' + x(i) + '" y="' + (H - 12) + '" text-anchor="middle" font-size="11.5" fill="var(--ink-soft)">T' + (d.tuan < 10 ? "0" : "") + d.tuan + "</text>";
            if (d.pct !== null) pts.push({ x: x(i), y: yP(d.pct), v: d.pct, t: d.tuan });
          });
          if (pts.length > 1) {
            s += '<polyline fill="none" stroke="var(--orange)" stroke-width="2.5" points="' +
              pts.map(function (p) { return p.x + "," + p.y; }).join(" ") + '"/>';
          }
          pts.forEach(function (p) {
            s += '<circle cx="' + p.x + '" cy="' + p.y + '" r="4" fill="var(--orange)"><title>Tuần ' + p.t + ": HS hoàn thành " + fmtPct(p.v) + "</title></circle>" +
              '<text x="' + p.x + '" y="' + (p.y - 9) + '" text-anchor="middle" font-size="11" font-weight="600" fill="var(--orange)">' + fmtPct(p.v) + "</text>";
          });
          s += "</svg>";
          $("chartWrap").innerHTML = s;
        }

        /* ---------- Wiring ---------- */
        function renderAll() {
          renderPills();
          renderFilterOptions();
          var rows = filteredRows();
          var w = weekObj();
          els.count.innerHTML = "Đang hiển thị <strong>" + rows.length + "</strong> / " + w.rows.length +
            " dòng của <strong>Tuần " + (w.tuan < 10 ? "0" : "") + w.tuan + "</strong>" +
            (state.gv || state.mon || state.lop || state.campus || state.model || state.flag || state.q ? " (đã áp bộ lọc)" : "") + ".";
          renderKpis(rows);
          renderTable(rows);
          renderWatch(rows);
        }
        els.fGv.addEventListener("change", function () { state.gv = this.value; renderAllKeepPills(); });
        els.fMon.addEventListener("change", function () { state.mon = this.value; renderAllKeepPills(); });
        els.fLop.addEventListener("change", function () { state.lop = this.value; renderAllKeepPills(); });
        els.fCampus.addEventListener("change", function () { state.campus = this.value; renderAllKeepPills(); });
        els.fModel.addEventListener("change", function () { state.model = this.value; renderAllKeepPills(); });
        els.fFlag.addEventListener("change", function () { state.flag = this.value; renderAllKeepPills(); });
        var qTimer = null;
        els.fQ.addEventListener("input", function () {
          var v = this.value;
          clearTimeout(qTimer);
          qTimer = setTimeout(function () { state.q = v; renderAllKeepPills(); }, 180);
        });
        $("btnReset").addEventListener("click", function () { resetFilters(); renderAll(); });
        function renderAllKeepPills() {
          var rows = filteredRows();
          var w = weekObj();
          els.count.innerHTML = "Đang hiển thị <strong>" + rows.length + "</strong> / " + w.rows.length +
            " dòng của <strong>Tuần " + (w.tuan < 10 ? "0" : "") + w.tuan + "</strong>" +
            (state.gv || state.mon || state.lop || state.campus || state.model || state.flag || state.q ? " (đã áp bộ lọc)" : "") + ".";
          renderKpis(rows);
          renderTable(rows);
          renderWatch(rows);
        }

        renderAll();
        renderChart();
      })();
