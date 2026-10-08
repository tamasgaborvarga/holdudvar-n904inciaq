/* ============================================================
   HOLDUDVAR VENDÉGHÁZ — közös viselkedés
   Nyelvváltás · fejléc · mobilmenü · feltárás · lightbox · mobil CTA-sáv ·
   ajánlatkérő űrlap · térkép · vissza a tetejére
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Nyelv ----------
     A <head> egy apró inline szkripttel már beállította a data-lang-ot (nincs villanás);
     itt a gombok állapota és a csak attribútumban élő (aria-label) feliratok frissülnek. */
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
    document.querySelectorAll("[data-i18n-label]").forEach(function (el) {
      var pair = el.getAttribute("data-i18n-label").split("|");
      el.setAttribute("aria-label", lang === "en" ? pair[1] : pair[0]);
    });
    document.dispatchEvent(new CustomEvent("holdudvar:lang", { detail: lang }));
  }
  function t(hu, en) {
    return document.documentElement.getAttribute("data-lang") === "en" ? en : hu;
  }
  document.documentElement.setAttribute("data-lang", getLang());
  document.documentElement.setAttribute("lang", getLang());

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.getAttribute("data-lang-btn")); });
    });

    /* ---------- Fejléc: a hero fölött átlátszó, görgetve tömör ---------- */
    var nav = document.querySelector(".nav");
    var overHero = nav && nav.hasAttribute("data-over-hero");
    if (overHero) {
      var navTick = false;
      var navUpdate = function () {
        var scrolled = window.scrollY > 40;
        nav.classList.toggle("nav--over", !scrolled);
        nav.classList.toggle("nav--solid", scrolled);
        navTick = false;
      };
      navUpdate();
      window.addEventListener("scroll", function () {
        if (!navTick) { navTick = true; requestAnimationFrame(navUpdate); }
      }, { passive: true });
    }

    /* ---------- Mobilmenü ---------- */
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
      // Escape zárja, és a fókusz nem szökik ki a nyitott menüből
      document.addEventListener("keydown", function (e) {
        if (!menu.classList.contains("open")) return;
        if (e.key === "Escape") { e.preventDefault(); closeMenu(); return; }
        if (e.key !== "Tab") return;
        var f = menu.querySelectorAll("a, button");
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
      // asztali szélességre váltva a nyitott menü bezárul
      window.matchMedia("(min-width: 1100px)").addEventListener("change", function (m) { if (m.matches) closeMenu(); });
    }

    /* ---------- Feltárás görgetéskor ---------- */
    var reveals = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && reveals.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      reveals.forEach(function (r) { io.observe(r); });
    } else {
      reveals.forEach(function (r) { r.classList.add("in"); });
    }

    /* ---------- Lightbox (galéria) ----------
       Billentyűzet: ←/→ lapoz, Esc zár, Tab a panelen belül marad.
       Érintés: vízszintes legyintés lapoz. A felirat az aktív nyelvet követi
       (data-label = magyar, data-label-en = angol). */
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
    if (items.length) {
      var icon = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; };
      var lb = document.createElement("div");
      lb.className = "lightbox";
      lb.setAttribute("role", "dialog");
      lb.setAttribute("aria-modal", "true");
      lb.setAttribute("aria-hidden", "true");
      lb.innerHTML =
        '<button class="lightbox__close" type="button" data-i18n-label="Bezárás|Close" aria-label="Bezárás">' + icon("M6 6l12 12M18 6 6 18") + '</button>' +
        '<button class="lightbox__nav lightbox__nav--prev" type="button" data-i18n-label="Előző kép|Previous image" aria-label="Előző kép">' + icon("M15 18l-6-6 6-6") + '</button>' +
        '<button class="lightbox__nav lightbox__nav--next" type="button" data-i18n-label="Következő kép|Next image" aria-label="Következő kép">' + icon("M9 18l6-6-6-6") + '</button>' +
        '<div class="lightbox__stage"><img class="lightbox__img" alt="" decoding="async"></div>' +
        '<p class="lightbox__caption" aria-live="polite"></p>';
      document.body.appendChild(lb);
      var stageImg = lb.querySelector(".lightbox__img");
      var cap = lb.querySelector(".lightbox__caption");
      var closeBtn = lb.querySelector(".lightbox__close");
      var idx = 0;
      var lastFocus = null;
      var labelOf = function (el) {
        var hu = el.getAttribute("data-label") || "";
        return t(hu, el.getAttribute("data-label-en") || hu);
      };
      var srcOf = function (el) {
        return el.getAttribute("data-full") || (el.querySelector("img") && el.querySelector("img").src) || "";
      };
      var show = function (i) {
        idx = (i + items.length) % items.length;
        var el = items[idx];
        var label = labelOf(el);
        var src = srcOf(el);
        if (stageImg.getAttribute("src") !== src) {
          stageImg.classList.add("is-loading");
          stageImg.onload = function () { stageImg.classList.remove("is-loading"); };
          stageImg.src = src;
        }
        stageImg.alt = label;
        cap.textContent = (idx + 1) + " / " + items.length + (label ? "  ·  " + label : "");
        lb.setAttribute("aria-label", label || t("Képnagyító", "Image viewer"));
        // a szomszédos képek előtöltése, hogy a lapozás azonnali legyen
        [idx + 1, idx - 1].forEach(function (j) { new Image().src = srcOf(items[(j + items.length) % items.length]); });
      };
      var open = function (i) {
        lastFocus = document.activeElement;
        show(i);
        lb.classList.add("open");
        lb.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        closeBtn.focus();
      };
      var close = function () {
        lb.classList.remove("open");
        lb.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      };
      // A galéria-elemek <div>-ek: gombbá tesszük őket, hogy billentyűzettel is elérhetők legyenek
      items.forEach(function (el, i) {
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
        if (!el.getAttribute("role")) el.setAttribute("role", "button");
        var hu = el.getAttribute("data-label");
        if (hu) el.setAttribute("data-i18n-label", hu + " — nagy nézet|" + (el.getAttribute("data-label-en") || hu) + " — enlarge");
        el.addEventListener("click", function () { open(i); });
        el.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); open(i); }
        });
      });
      closeBtn.addEventListener("click", close);
      lb.querySelector(".lightbox__nav--prev").addEventListener("click", function () { show(idx - 1); });
      lb.querySelector(".lightbox__nav--next").addEventListener("click", function () { show(idx + 1); });
      lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lightbox__stage")) close(); });
      var tx = null, ty = null;
      lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
      lb.addEventListener("touchend", function (e) {
        if (tx === null) return;
        var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) show(idx + (dx < 0 ? 1 : -1));
        tx = ty = null;
      }, { passive: true });
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
      document.addEventListener("holdudvar:lang", function () { if (lb.classList.contains("open")) show(idx); });
    }

    /* ---------- Mobil CTA-sáv (alul) ----------
       Telefonon mindig kéznél az Ajánlatkérés és a hívás. A kezdőlapon csak akkor jelenik
       meg, amikor a hero saját gombjai már kigördültek; az ajánlatkérő oldalon nincs rá szükség. */
    if (!document.querySelector("[data-booking-form]")) {
      var bar = document.createElement("div");
      var ctaHref = (document.querySelector(".nav__cta") || { getAttribute: function () { return "foglalas.html"; } }).getAttribute("href");
      bar.className = "cta-bar";
      bar.innerHTML =
        '<a class="cta-bar__tel" href="tel:+36202589544" data-i18n-label="Hívás: +36 20 258 9544|Call +36 20 258 9544" aria-label="Hívás: +36 20 258 9544">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.98.36 1.94.7 2.86a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.22-1.22a2 2 0 0 1 2.11-.45c.92.34 1.88.57 2.86.7A2 2 0 0 1 22 16.92z"/></svg></a>' +
        '<a class="btn" href="' + ctaHref + '"><span data-lang-hu>Ajánlatkérés</span><span data-lang-en>Request a quote</span> <span class="ar" aria-hidden="true">→</span></a>';
      document.body.appendChild(bar);
      document.body.classList.add("has-cta-bar");
      var heroCta = document.querySelector("[data-hero-cta]");
      if (heroCta && "IntersectionObserver" in window) {
        new IntersectionObserver(function (en) {
          bar.classList.toggle("show", !en[0].isIntersecting && en[0].boundingClientRect.top < 0);
        }).observe(heroCta);
      } else {
        bar.classList.add("show");
      }
    }

    /* ---------- Vissza a tetejére (asztali nézet) ---------- */
    var toTop = document.createElement("button");
    toTop.type = "button";
    toTop.className = "to-top";
    toTop.setAttribute("data-i18n-label", "Vissza a tetejére|Back to top");
    toTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>';
    toTop.addEventListener("click", function () { window.scrollTo({ top: 0 }); });
    document.body.appendChild(toTop);
    var topTick = false;
    window.addEventListener("scroll", function () {
      if (topTick) return;
      topTick = true;
      requestAnimationFrame(function () { toTop.classList.toggle("show", window.scrollY > 900); topTick = false; });
    }, { passive: true });

    /* ---------- Kattintásra betöltő Google Térkép (nincs 3rd-party süti kattintás előtt) ---------- */
    var mapBox = document.querySelector("[data-map-consent]");
    var mapBtn = mapBox && mapBox.querySelector("[data-map-load]");
    if (mapBtn) {
      mapBtn.addEventListener("click", function () {
        var src = mapBox.getAttribute("data-map-src");
        if (!src) return;
        var iframe = document.createElement("iframe");
        iframe.setAttribute("title", mapBox.getAttribute("data-map-title") || "");
        iframe.setAttribute("src", src);
        iframe.setAttribute("loading", "lazy");
        iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute("tabindex", "0");
        mapBox.replaceWith(iframe);
        iframe.focus();
      });
    }

    /* ---------- Ajánlatkérő űrlap ----------
       Web3Forms AJAX, ha a WEB3FORMS_KEY ki van töltve (https://web3forms.com —
       ingyenes, e-mailre továbbít). Üres kulcs esetén előre kitöltött mailto:
       nyílik a vendég levelezőjében. Így mindig van valódi továbbítás. */
    var WEB3FORMS_KEY = ""; // <- ide jön a Web3Forms access key
    var BOOKING_EMAIL = "holdudvartiszato@gmail.com";
    var form = document.querySelector("[data-booking-form]");
    if (form) {
      // Múltbeli érkezés nem választható, a távozás nem lehet korábbi az érkezésnél
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

    // a fent létrehozott vezérlők is megkapják a nyelvhelyes aria-label-t
    setLang(getLang());
  });
})();
