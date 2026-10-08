/* Holdudvar — foglaltsági naptár (apartmanok oszlopban, napok sorban)
   Az adat forrása egy Google Sheets tábla, "Közzététel a weben → CSV" linkkel.
   A linket a naptar.html-ben a <div class="avail" data-csv=" IDE "> attribútumba kell írni
   (vagy alább a CSV_URL_FALLBACK-be). Ekkor az oldal élőben, deploy nélkül frissül.
   Táblaformátum:  Dátum | Telihold | Félhold | Holdfény   — a foglalt cellában "X". */
(function () {
  "use strict";

  var CSV_URL_FALLBACK = ""; // ide is beírható a published CSV link, ha a data-csv üres

  var MONTHS = {
    hu: ["Január","Február","Március","Április","Május","Június","Július","Augusztus","Szeptember","Október","November","December"],
    en: ["January","February","March","April","May","June","July","August","September","October","November","December"]
  };
  // getDay(): 0 = vasárnap
  var WD = { hu: ["V","H","K","Sze","Cs","P","Szo"], en: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"] };
  var STATUS = { free: ["szabad","free"], busy: ["foglalt","booked"], past: ["elmúlt","past"] };
  var APT_NAMES = ["Telihold","Félhold","Holdfény"];
  function lang() { return document.documentElement.getAttribute("data-lang") === "en" ? "en" : "hu"; }

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.querySelector("[data-cal]");
    if (!root) return;

    var bodyEl   = root.querySelector("[data-cal-body]");
    var monthEl  = root.querySelector("[data-cal-month]");
    var statusEl = root.querySelector("[data-cal-status]");
    var prevBtn  = root.querySelector("[data-cal-prev]");
    var nextBtn  = root.querySelector("[data-cal-next]");

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayKey = keyOf(today.getFullYear(), today.getMonth() + 1, today.getDate());

    var view = { y: today.getFullYear(), m: today.getMonth() }; // m: 0-indexelt
    var sets = [{}, {}, {}];       // sets[apt]["YYYY-MM-DD"] = true
    var minYM = ym(today.getFullYear(), today.getMonth());
    var maxYM = minYM + 11;

    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function keyOf(y, m, d) { return y + "-" + pad(m) + "-" + pad(d); }
    function ym(y, m) { return y * 12 + m; }

    function parseDate(str) {
      var m = String(str).replace(/\s+/g, "").match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
      if (!m) return null;
      return m[1] + "-" + pad(+m[2]) + "-" + pad(+m[3]);
    }

    function splitLine(line) {
      return line.split(",").map(function (c) { return c.trim().replace(/^"|"$/g, ""); });
    }

    function parseCSV(text) {
      var lines = text.split(/\r?\n/).filter(function (l) { return l.trim() !== ""; });
      if (!lines.length) return null;
      var start = /d.tum|telihold/i.test(lines[0]) ? 1 : 0;
      var s = [{}, {}, {}];
      var minK = null, maxK = null;
      for (var i = start; i < lines.length; i++) {
        var cols = splitLine(lines[i]);
        var key = parseDate(cols[0]);
        if (!key) continue;
        for (var a = 0; a < 3; a++) {
          if ((cols[a + 1] || "").trim().toUpperCase() === "X") s[a][key] = true;
        }
        if (!minK || key < minK) minK = key;
        if (!maxK || key > maxK) maxK = key;
      }
      return { sets: s, minK: minK, maxK: maxK };
    }

    function recomputeBounds(maxK) {
      var lo = ym(today.getFullYear(), today.getMonth());
      var hi = lo + 11;
      if (maxK) {
        var y = +maxK.slice(0, 4), mo = +maxK.slice(5, 7) - 1;
        hi = Math.max(ym(y, mo), lo + 2);
      }
      minYM = lo; maxYM = hi;
      if (ym(view.y, view.m) < minYM) { view.y = today.getFullYear(); view.m = today.getMonth(); }
    }

    function cell(a, state) {
      var label = APT_NAMES[a] + ": " + STATUS[state][lang() === "en" ? 1 : 0];
      return '<td class="avail-cell avail-cell--' + state +
             '" role="img" aria-label="' + label + '"></td>';
    }

    function render() {
      var L = lang();
      monthEl.textContent = L === "en" ? MONTHS.en[view.m] + " " + view.y : view.y + ". " + MONTHS.hu[view.m];
      var count = new Date(view.y, view.m + 1, 0).getDate();
      var rows = "";
      for (var d = 1; d <= count; d++) {
        var dt = new Date(view.y, view.m, d);
        var dow = dt.getDay();
        var key = keyOf(view.y, view.m + 1, d);
        var past = key < todayKey;
        var isToday = key === todayKey;
        var weekend = (dow === 0 || dow === 6);
        var rowCls = "avail-row" + (past ? " avail-row--past" : "") + (weekend ? " avail-row--weekend" : "") + (isToday ? " avail-row--today" : "");
        var cells = "";
        for (var a = 0; a < 3; a++) {
          if (past) cells += cell(a, "past");
          else if (sets[a][key]) cells += cell(a, "busy");
          else cells += cell(a, "free");
        }
        rows += '<tr class="' + rowCls + '">' +
                  '<th scope="row" class="avail-date"><span class="avail-date__d">' + d + '.</span> <span class="avail-date__w">' + WD[L][dow] + '</span></th>' +
                  cells +
                '</tr>';
      }
      bodyEl.innerHTML = rows;
      var cur = ym(view.y, view.m);
      prevBtn.disabled = cur <= minYM;
      nextBtn.disabled = cur >= maxYM;
    }

    function step(delta) {
      var d = new Date(view.y, view.m + delta, 1);
      view.y = d.getFullYear(); view.m = d.getMonth();
      render();
    }

    document.querySelectorAll("[data-lang-toggle], [data-lang-btn]").forEach(function (b) {
      b.addEventListener("click", function () { setTimeout(render, 0); });
    });

    prevBtn.addEventListener("click", function () { step(-1); });
    nextBtn.addEventListener("click", function () { step(1); });

    function useDemo() {
      var y = today.getFullYear(), m = today.getMonth() + 1;
      function d(day, a) { sets[a][keyOf(y, m, day)] = true; }
      d(11, 0); d(12, 0); d(13, 0); d(18, 0); d(19, 0);
      d(4, 1); d(5, 1); d(24, 1); d(25, 1);
      d(12, 2); d(13, 2); d(26, 2);
      recomputeBounds(null);
      statusEl.innerHTML = '<span data-lang-hu>Demó adatok — az élő foglaltsághoz kösd be a Google Sheets „Közzététel a weben → CSV" linkjét.</span><span data-lang-en>Demo data — connect the published Google Sheets CSV link for live availability.</span>';
      statusEl.classList.add("cal__status--demo");
      render();
    }

    function loadCsv(url) {
      return fetch(url, { cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
        .then(function (text) {
          var p = parseCSV(text);
          if (!p || !p.minK) throw new Error("üres CSV");
          return p;
        });
    }
    function apply(p) {
      sets = p.sets;
      recomputeBounds(p.maxK);
      statusEl.textContent = "";
      statusEl.classList.remove("cal__status--demo");
      render();
    }

    function fromEmbed() {
      var e = window.__CAL;
      if (!e || !e.booked) return null;
      var s = [{}, {}, {}];
      for (var k in e.booked) {
        var v = e.booked[k];
        if (v[0]) s[0][k] = true;
        if (v[1]) s[1][k] = true;
        if (v[2]) s[2][k] = true;
      }
      return { sets: s, minK: e.min, maxK: e.max };
    }

    var primary = (root.getAttribute("data-csv") || CSV_URL_FALLBACK || "").trim();
    var fallback = (root.getAttribute("data-csv-fallback") || "").trim();

    (primary ? loadCsv(primary) : Promise.reject())
      .then(apply)
      .catch(function () {
        // az élő (Google) forrás nem elérhető → beágyazott pillanatkép (file://-en és CORS nélkül is működik)
        var p = fromEmbed();
        if (p) { apply(p); return; }
        return fallback ? loadCsv(fallback).then(apply) : Promise.reject();
      })
      .catch(useDemo);
  });
})();
