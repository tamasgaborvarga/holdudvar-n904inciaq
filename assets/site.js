/* ============================================================
   HOLDUDVAR VENDÉGHÁZ — shared behaviour
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Language ---------- */
  var STORE = "holdudvar_lang";
  function getLang() {
    try { return localStorage.getItem(STORE) || "hu"; } catch (e) { return "hu"; }
  }
  function setLang(lang) {
    document.documentElement.setAttribute("data-lang", lang);
    document.documentElement.setAttribute("lang", lang);
    try { localStorage.setItem(STORE, lang); } catch (e) {}
    document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang-btn") === lang ? "true" : "false");
    });
    // A gomb a CÉLNYELVET mutatja (magyar oldalon "EN"), így egyértelmű, mi történik kattintásra
    var target = lang === "hu" ? "en" : "hu";
    document.querySelectorAll("[data-lang-toggle]").forEach(function (t) {
      t.textContent = target.toUpperCase();
      t.setAttribute("lang", target);
      t.setAttribute("aria-label", target === "en" ? "Switch to English" : "Váltás magyar nyelvre");
    });
    // A JS-ből létrehozott vezérlők feliratai is kövessék a nyelvet
    document.querySelectorAll("[data-i18n-label]").forEach(function (el) {
      var pair = el.getAttribute("data-i18n-label").split("|");
      el.setAttribute("aria-label", lang === "en" ? pair[1] : pair[0]);
    });
  }
  function t(hu, en) {
    return document.documentElement.getAttribute("data-lang") === "en" ? en : hu;
  }
  // apply immediately to avoid flash
  document.documentElement.setAttribute("data-lang", getLang());
  document.documentElement.setAttribute("lang", getLang());

  document.addEventListener("DOMContentLoaded", function () {
    setLang(getLang());
    document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.getAttribute("data-lang-btn")); });
    });
    document.querySelectorAll("[data-lang-toggle]").forEach(function (t) {
      t.addEventListener("click", function () {
        setLang(document.documentElement.getAttribute("data-lang") === "hu" ? "en" : "hu");
      });
    });

    /* ---------- Sticky / over-hero nav ---------- */
    var nav = document.querySelector(".nav");
    var overHero = nav && nav.hasAttribute("data-over-hero");
    function onScroll() {
      if (!nav) return;
      var scrolled = window.scrollY > 40;
      if (overHero) {
        nav.classList.toggle("nav--over", !scrolled);
        nav.classList.toggle("nav--solid", scrolled);
      } else {
        nav.classList.add("nav--solid");
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ---------- Mobile menu ---------- */
    var burger = document.querySelector(".burger");
    var menu = document.querySelector(".mobile-menu");
    function closeMenu() {
      if (!menu || !menu.classList.contains("open")) return;
      menu.classList.remove("open");
      menu.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (burger) { burger.setAttribute("aria-expanded", "false"); burger.focus(); }
    }
    function openMenu() {
      if (!menu) return;
      menu.classList.add("open");
      menu.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (burger) burger.setAttribute("aria-expanded", "true");
      var first = menu.querySelector("a, button");
      if (first) first.focus();
    }
    if (burger && menu) {
      burger.addEventListener("click", openMenu);
      menu.querySelectorAll("[data-close], a").forEach(function (el) {
        el.addEventListener("click", closeMenu);
      });
      // Escape zárja, és a fókusz ne szökjön ki a nyitott menüből
      document.addEventListener("keydown", function (e) {
        if (!menu.classList.contains("open")) return;
        if (e.key === "Escape") { e.preventDefault(); closeMenu(); return; }
        if (e.key !== "Tab") return;
        var f = menu.querySelectorAll("a, button");
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    }
    // language buttons inside mobile menu already wired by [data-lang-btn]

    /* ---------- Reveal on scroll ---------- */
    var reveals = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && reveals.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach(function (r) { io.observe(r); });
    } else {
      reveals.forEach(function (r) { r.classList.add("in"); });
    }

    /* ---------- Lightbox (gallery) ---------- */
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
    if (items.length) {
      var lb = document.createElement("div");
      lb.className = "lightbox";
      lb.setAttribute("role", "dialog");
      lb.setAttribute("aria-modal", "true");
      lb.innerHTML =
        '<button class="lightbox__close" type="button" data-i18n-label="Bezárás|Close">✕</button>' +
        '<button class="lightbox__nav lightbox__nav--prev" type="button" data-i18n-label="Előző kép|Previous image">‹</button>' +
        '<button class="lightbox__nav lightbox__nav--next" type="button" data-i18n-label="Következő kép|Next image">›</button>' +
        '<div class="lightbox__stage"><img class="lightbox__img" alt="" decoding="async"><span class="lightbox__caption"></span></div>';
      document.body.appendChild(lb);
      var stageImg = lb.querySelector(".lightbox__img");
      var cap = lb.querySelector(".lightbox__caption");
      var closeBtn = lb.querySelector(".lightbox__close");
      var idx = 0;
      var lastFocus = null;
      function show(i) {
        idx = (i + items.length) % items.length;
        var el = items[idx];
        var label = el.getAttribute("data-label") || "";
        var full = el.getAttribute("data-full") || (el.querySelector("img") && el.querySelector("img").src) || "";
        stageImg.src = full;
        stageImg.alt = label;
        cap.textContent = (idx + 1) + " / " + items.length + (label ? "  ·  " + label : "");
        lb.setAttribute("aria-label", label || t("Képnagyító", "Image viewer"));
      }
      function open(i) {
        lastFocus = document.activeElement;
        show(i);
        lb.classList.add("open");
        document.body.style.overflow = "hidden";
        closeBtn.focus();
      }
      function close() {
        lb.classList.remove("open");
        document.body.style.overflow = "";
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }
      // A galéria-elemek <div>-ek: gombbá tesszük őket, hogy billentyűzettel is elérhetők legyenek
      items.forEach(function (el, i) {
        el.style.cursor = "pointer";
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
        if (!el.getAttribute("role")) el.setAttribute("role", "button");
        var lbl = el.getAttribute("data-label");
        if (lbl && !el.getAttribute("aria-label")) el.setAttribute("aria-label", lbl + " — nagy nézet");
        el.addEventListener("click", function () { open(i); });
        el.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); open(i); }
        });
      });
      closeBtn.addEventListener("click", close);
      lb.querySelector(".lightbox__nav--prev").addEventListener("click", function () { show(idx - 1); });
      lb.querySelector(".lightbox__nav--next").addEventListener("click", function () { show(idx + 1); });
      lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lightbox__stage")) close(); });
      document.addEventListener("keydown", function (e) {
        if (!lb.classList.contains("open")) return;
        if (e.key === "Escape") { close(); return; }
        if (e.key === "ArrowLeft") { show(idx - 1); return; }
        if (e.key === "ArrowRight") { show(idx + 1); return; }
        if (e.key !== "Tab") return;
        var f = lb.querySelectorAll("button");
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    }

    /* ---------- Hero parallax (home) ---------- */
    var px = document.querySelector(".ph--parallax");
    if (px && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var heroEl = px.closest(".page-hero");
      var pxTicking = false;
      function pxUpdate() {
        var h = heroEl ? heroEl.offsetHeight : window.innerHeight;
        var y = Math.min(window.scrollY, h);
        px.style.transform = "translate3d(0," + (y * 0.22) + "px,0)";
        pxTicking = false;
      }
      window.addEventListener("scroll", function () {
        if (!pxTicking) { window.requestAnimationFrame(pxUpdate); pxTicking = true; }
      }, { passive: true });
      pxUpdate();
    }

    // A többi IIFE (to-top, galéria-pöttyök) is DOMContentLoaded-re épít; egy rAF után
    // már léteznek, ekkor kapják meg a nyelvhelyes aria-label-t.
    requestAnimationFrame(function () { setLang(getLang()); });

    /* ---------- Booking form ----------
       Web3Forms AJAX, ha a WEB3FORMS_KEY ki van töltve (https://web3forms.com —
       ingyenes, e-mailre továbbít). Üres kulcs esetén előre kitöltött mailto:
       nyílik a vendég levelezőjében. Így mindig van valódi továbbítás. */
    var WEB3FORMS_KEY = ""; // <- ide jön a Web3Forms access key
    var BOOKING_EMAIL = "holdudvartiszato@gmail.com";
    var form = document.querySelector("[data-booking-form]");
    if (form) {
      /* Dátumlogika: múltbeli érkezés nem választható, és a távozás nem lehet
         korábbi az érkezésnél — a natív mezők min attribútumaival. */
      var fromEl = form.querySelector('[name="from"]');
      var toEl = form.querySelector('[name="to"]');
      if (fromEl && toEl) {
        var _d = new Date();
        var todayISO = _d.getFullYear() + "-" + ("0" + (_d.getMonth() + 1)).slice(-2) + "-" + ("0" + _d.getDate()).slice(-2);
        fromEl.min = todayISO;
        toEl.min = todayISO;
        fromEl.addEventListener("change", function () {
          toEl.min = fromEl.value || todayISO;
          if (toEl.value && toEl.value < toEl.min) toEl.value = toEl.min;
        });
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var btn = form.querySelector("button[type=submit]");
        var ok = form.querySelector("[data-form-ok]");
        var mailNote = form.querySelector("[data-form-mail]");
        var errNote = form.querySelector("[data-form-err]");
        [ok, mailNote, errNote].forEach(function (n) { if (n) n.style.display = "none"; });

        function val(n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ""; }
        function lockFields() {
          form.querySelectorAll("input, textarea, select, button").forEach(function (el) {
            if (el.type !== "button") el.setAttribute("disabled", "disabled");
          });
        }
        function buildMailto() {
          var en = document.documentElement.getAttribute("data-lang") === "en";
          var subj = (en ? "Booking enquiry – " : "Foglalási érdeklődés – ") + (val("name") || "Holdudvar");
          var body = [
            (en ? "Name" : "Név") + ": " + val("name"),
            "E-mail: " + val("email"),
            (en ? "Guests" : "Vendégek száma") + ": " + (val("guests") || "-"),
            (en ? "Arrival" : "Érkezés") + ": " + (val("from") || "-"),
            (en ? "Departure" : "Távozás") + ": " + (val("to") || "-"),
            "",
            (en ? "Message" : "Üzenet") + ":",
            val("message")
          ].join("\n");
          return "mailto:" + BOOKING_EMAIL + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
        }
        function viaMailto() {
          window.location.href = buildMailto();
          if (mailNote) mailNote.style.display = "block";
        }

        // honeypot: ha be van pipálva, bot — csendben "sikeresnek" mutatjuk
        var hp = form.querySelector('[name="botcheck"]');
        if (hp && hp.checked) { if (ok) ok.style.display = "block"; lockFields(); return; }

        if (WEB3FORMS_KEY) {
          if (btn) btn.setAttribute("disabled", "disabled");
          var data = new FormData(form);
          data.append("access_key", WEB3FORMS_KEY);
          data.append("subject", "Foglalási érdeklődés – Holdudvar (" + (val("name") || "") + ")");
          data.append("from_name", "Holdudvar weboldal");
          fetch("https://api.web3forms.com/submit", { method: "POST", body: data })
            .then(function (r) { return r.json(); })
            .then(function (j) {
              if (j && j.success) { if (ok) ok.style.display = "block"; lockFields(); }
              else { if (btn) btn.removeAttribute("disabled"); if (errNote) errNote.style.display = "block"; }
            })
            .catch(function () { if (btn) btn.removeAttribute("disabled"); viaMailto(); });
        } else {
          viaMailto();
        }
      });
    }
  });
})();

/* Kattintásra betöltő Google Térkép (GDPR — nincs 3rd-party süti kattintás előtt) */
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var box = document.querySelector("[data-map-consent]");
    if (!box) return;
    var btn = box.querySelector("[data-map-load]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var src = box.getAttribute("data-map-src");
      var title = box.getAttribute("data-map-title") || "";
      if (!src) return;
      var iframe = document.createElement("iframe");
      iframe.setAttribute("title", title);
      iframe.setAttribute("src", src);
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
      iframe.setAttribute("allowfullscreen", "");
      box.replaceWith(iframe);
      // A gomb eltűnt a fókusz alól — adjuk át a fókuszt a betöltött térképnek
      iframe.setAttribute("tabindex", "0");
      iframe.focus();
    });
  });
})();

/* Galéria: telefonon full-bleed carousel — pötty-indikátor + scroll-szinkron */
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var galleries = document.querySelectorAll(".gallery");
    galleries.forEach(function (gal) {
      var items = gal.querySelectorAll(".gallery__item");
      if (items.length < 2) return;

      var dots = document.createElement("div");
      dots.className = "gallery-dots";
      items.forEach(function (_, i) {
        var d = document.createElement("button");
        d.type = "button";
        d.className = "gallery-dots__dot" + (i === 0 ? " is-active" : "");
        d.setAttribute("data-i18n-label", (i + 1) + ". kép|Image " + (i + 1));
        d.setAttribute("aria-label", (i + 1) + ". kép");
        d.addEventListener("click", function () {
          gal.scrollTo({ left: i * gal.clientWidth, behavior: "smooth" });
        });
        dots.appendChild(d);
      });
      gal.insertAdjacentElement("afterend", dots);

      var ticking = false;
      gal.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var idx = Math.round(gal.scrollLeft / gal.clientWidth);
          dots.querySelectorAll(".gallery-dots__dot").forEach(function (d, i) {
            d.classList.toggle("is-active", i === idx);
          });
          ticking = false;
        });
      }, { passive: true });
    });
  });
})();

/* Vissza a tetejére gomb */
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var toTop = document.createElement("button");
    toTop.type = "button";
    toTop.className = "to-top";
    toTop.setAttribute("data-i18n-label", "Vissza a tetejére|Back to top");
    toTop.setAttribute("aria-label", "Vissza a tetejére");
    toTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>';
    toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    document.body.appendChild(toTop);

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        toTop.classList.toggle("show", window.scrollY > 600);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  });
})();
