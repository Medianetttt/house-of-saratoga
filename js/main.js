/* House of Saratoga — comportamento del sito (nessuna dipendenza). */
(function () {
  "use strict";

  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EVENTS = window.HOS_EVENTS || [];
  var CONFIG = window.HOS_CONFIG || {};

  /* ---------- Domande frequenti: fisarmonica con altezza animata, una risposta aperta alla volta ---------- */
  (function () {
    var items = $$(".qa");
    if (!items.length || !items[0].animate) return;
    var DURATION = reduceMotion ? 0 : 380;
    var EASE = "cubic-bezier(.2, .7, .2, 1)";

    function run(el, from, to, onEnd) {
      if (el._anim) el._anim.cancel();
      el.style.overflow = "hidden";
      var a = el.animate({ height: [from + "px", to + "px"] }, { duration: DURATION, easing: EASE });
      el._anim = a;
      var ended = false;
      function end() {
        if (ended || el._anim !== a) return;
        ended = true;
        el._anim = null;
        el.style.overflow = "";
        if (onEnd) onEnd();
        try { a.cancel(); } catch (e) {}
      }
      // Rete di sicurezza: se il browser sospende le animazioni (scheda in background) l'evento di fine non arriva mai,
      // quindi lo stato si chiude con un timer, senza aspettare i fotogrammi.
      setTimeout(end, DURATION + 120);
      a.onfinish = end;
    }

    function openItem(el) {
      var from = el.offsetHeight;
      el.open = true;
      el.classList.add("is-open");
      run(el, from, el.scrollHeight);
      var p = $("p", el);
      if (p && !reduceMotion) p.animate({ opacity: [0, 1], transform: ["translateY(-6px)", "none"] }, { duration: DURATION, delay: 60, easing: EASE, fill: "backwards" });
    }

    function closeItem(el) {
      var from = el.offsetHeight;
      el.classList.remove("is-open");
      run(el, from, $("summary", el).offsetHeight, function () { el.open = false; });
    }

    items.forEach(function (el) {
      $("summary", el).addEventListener("click", function (e) {
        e.preventDefault();
        if (el.classList.contains("is-open")) { closeItem(el); return; }
        items.forEach(function (o) { if (o !== el && o.classList.contains("is-open")) closeItem(o); });
        openItem(el);
      });
    });
  })();

  /* ---------- Gallery: filtri, "mostra tutte", ingrandimento ---------- */
  (function () {
    var data = window.HOS_GALLERY;
    var grid = $("#gal");
    if (!data || !grid) return;
    var SETS = data.sets, PHOTOS = data.photos;
    var filtersEl = $("#gal-filters");
    var thumb = $("#gal-thumb"), countEl2 = $("#gal-count");
    var btnPrev = $('[data-gal="prev"]'), btnNext = $('[data-gal="next"]');
    var lb = $("#lightbox"), lbImg = $("#lb-img"), lbCap = $("#lb-cap");
    var active = "all", current = 0, list = PHOTOS;

    function label(p) { return SETS[p.set] || ""; }
    function filtered() { return active === "all" ? PHOTOS : PHOTOS.filter(function (p) { return p.set === active; }); }

    function renderFilters() {
      var keys = Object.keys(SETS).filter(function (k) { return PHOTOS.some(function (p) { return p.set === k; }); });
      var chips = [["all", "Tutte", PHOTOS.length]].concat(keys.map(function (k) {
        return [k, SETS[k], PHOTOS.filter(function (p) { return p.set === k; }).length];
      }));
      filtersEl.innerHTML = chips.map(function (c) {
        return '<button type="button" class="chip" data-gfilter="' + esc(c[0]) + '" aria-pressed="' + (c[0] === active) + '">' + esc(c[1]) + " <small>" + c[2] + "</small></button>";
      }).join("");
    }

    function renderGrid() {
      list = filtered();
      grid.innerHTML = list.map(function (p, i) {
        return '<button type="button" class="gal__item" data-i="' + i + '" aria-label="Ingrandisci foto ' + (i + 1) + " di " + list.length + " · " + esc(label(p)) + '">' +
          '<img src="assets/gallery/grid/' + p.id + '.jpg" width="' + p.w + '" height="' + p.h + '" alt="Foto della serata ' + esc(label(p)) + '" loading="lazy" decoding="async">' +
          '<span class="gal__tag">' + esc(label(p)) + "</span></button>";
      }).join("");
      grid.scrollLeft = 0;
      countEl2.textContent = list.length + (list.length === 1 ? " foto" : " foto");
      updateStrip();
    }

    /* Barra di avanzamento e frecce della striscia */
    function updateStrip() {
      var sw = grid.scrollWidth, cw = grid.clientWidth, max = sw - cw;
      var w = sw ? Math.min(100, (cw / sw) * 100) : 100;
      thumb.style.width = w.toFixed(1) + "%";
      thumb.style.left = (max > 0 ? (grid.scrollLeft / max) * (100 - w) : 0).toFixed(1) + "%";
      btnPrev.disabled = grid.scrollLeft <= 4;
      btnNext.disabled = max <= 4 || grid.scrollLeft >= max - 4;
    }
    grid.addEventListener("scroll", function () { requestAnimationFrame(updateStrip); }, { passive: true });
    window.addEventListener("resize", updateStrip);
    function step(dir) {
      var it = $(".gal__item", grid);
      var d = it ? it.getBoundingClientRect().width + 14 : 300;
      grid.scrollBy({ left: dir * d * 2, behavior: reduceMotion ? "auto" : "smooth" });
    }
    btnPrev.addEventListener("click", function () { step(-1); });
    btnNext.addEventListener("click", function () { step(1); });

    filtersEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-gfilter]");
      if (!b) return;
      active = b.getAttribute("data-gfilter");
      $$(".chip", filtersEl).forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
      renderGrid();
    });
    grid.addEventListener("click", function (e) {
      var b = e.target.closest("[data-i]");
      if (b) openAt(+b.getAttribute("data-i"));
    });

    /* Ingrandimento */
    function show(i) {
      current = (i + list.length) % list.length;
      var p = list[current];
      lbImg.classList.add("is-loading");
      lbImg.onload = function () { lbImg.classList.remove("is-loading"); };
      lbImg.src = "assets/gallery/full/" + p.id + ".jpg";
      lbImg.alt = "Foto della serata " + label(p);
      lbCap.innerHTML = "<b>" + esc(label(p)) + "</b>" + (current + 1) + " / " + list.length;
      [1, -1].forEach(function (d) { var n = list[(current + d + list.length) % list.length]; new Image().src = "assets/gallery/full/" + n.id + ".jpg"; });
    }
    function openAt(i) {
      show(i);
      if (!lb.open) lb.showModal();
      document.body.classList.add("is-locked");
    }
    function closeLb() { if (lb.open) lb.close(); document.body.classList.remove("is-locked"); }
    lb.addEventListener("close", function () { document.body.classList.remove("is-locked"); });
    lb.addEventListener("click", function (e) {
      var b = e.target.closest("[data-lb]");
      if (b) { var a = b.getAttribute("data-lb"); if (a === "close") closeLb(); else show(current + (a === "next" ? 1 : -1)); return; }
      if (e.target === lb || e.target.classList.contains("lightbox__fig")) closeLb(); // clic sullo sfondo
    });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); show(current + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); show(current - 1); }
    });
    var x0 = null;
    lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    }, { passive: true });

    renderFilters();
    renderGrid();
  })();

  /* ---------- Header: sfondo dopo lo scroll ---------- */
  var header = $(".site-header");
  function onScroll() { header.classList.toggle("is-solid", window.scrollY > 24); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  var burger = $(".burger");
  var menu = $("#menu");
  function setMenu(open, returnFocus) {
    var was = menu.classList.contains("is-open");
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
    menu.classList.toggle("is-open", open);
    doc.body.classList.toggle("is-locked", open);
    doc.body.classList.toggle("menu-open", open);
    if (open) menu.hidden = false;
    // Con il menu aperto il resto della pagina non è raggiungibile né con Tab né con il lettore di schermo.
    ["main", "footer"].forEach(function (s) { var el = $(s); if (el) el.inert = open; });
    if (open && !was) setTimeout(function () { var f = $("a", menu); if (f) f.focus({ preventScroll: true }); }, 80);
    if (!open && was && returnFocus) burger.focus({ preventScroll: true });
  }
  burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true", true); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("is-open")) setMenu(false, true); });
  window.matchMedia("(min-width: 1100px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });

  /* ---------- Video dell'hero ---------- */
  (function () {
    var v = $(".hero__video");
    if (!v) return;
    var conn = navigator.connection || {};
    if (reduceMotion || conn.saveData) return;            // resta il poster fermo, nessun download del video
    // Il video parte subito, senza aspettare l'osservatore (che scatta solo a pagina disegnata) e senza
    // essere nascosto: alcuni browser (Safari, risparmio energetico) non avviano i video invisibili.
    v.muted = true; v.defaultMuted = true; v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    v.preload = "auto";
    var onScreen = true, userPaused = false;
    var pauseBtn = $(".hero__pause");
    try { userPaused = sessionStorage.getItem("hosVideoPaused") === "1"; } catch (e) {}
    function play() {
      if (!onScreen || userPaused || document.hidden || !v.paused) return;
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }
    // Pulsante pausa/riproduci (movimento che parte da solo e dura più di 5 secondi: va sempre potuto fermare). La scelta vale per la visita.
    function setUserPaused(p) {
      userPaused = p;
      try { sessionStorage.setItem("hosVideoPaused", p ? "1" : "0"); } catch (e) {}
      if (pauseBtn) {
        pauseBtn.setAttribute("aria-pressed", String(p));
        pauseBtn.setAttribute("aria-label", p ? "Riproduci il video di sfondo" : "Metti in pausa il video di sfondo");
        pauseBtn.classList.toggle("is-paused", p);
      }
      if (p) v.pause(); else play();
    }
    if (pauseBtn) {
      pauseBtn.hidden = false;
      setUserPaused(userPaused);
      pauseBtn.addEventListener("click", function () { setUserPaused(!userPaused); });
    }
    ["loadeddata", "canplay"].forEach(function (n) { v.addEventListener(n, play); });
    // Se il browser blocca l'avvio automatico (es. risparmio energetico), riprova al primo gesto.
    var gestures = ["pointerdown", "keydown", "touchstart", "wheel", "scroll"];
    function retry() { play(); }
    gestures.forEach(function (n) { window.addEventListener(n, retry, { passive: true }); });
    v.addEventListener("playing", function () {
      gestures.forEach(function (n) { window.removeEventListener(n, retry); });
    });
    doc.addEventListener("visibilitychange", function () { if (document.hidden) v.pause(); else play(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {        // si ferma fuori schermo: meno batteria e CPU
        entries.forEach(function (e) { onScreen = e.isIntersecting; if (onScreen) play(); else v.pause(); });
      }, { threshold: 0.05 }).observe(v.closest(".hero"));
    }
    play();
  })();

  /* ---------- Reveal allo scroll ---------- */
  function observeReveal() {
    var items = $$(".reveal:not(.is-in)");
    if (!("IntersectionObserver" in window) || reduceMotion) { items.forEach(function (el) { el.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Voce di menu attiva ---------- */
  (function () {
    var links = $$(".nav a");
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = map[en.target.id];
        if (a && en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("is-active"); l.removeAttribute("aria-current"); });
          a.classList.add("is-active");
          a.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var s = doc.getElementById(id); if (s) io.observe(s); });
  })();

  /* ---------- Hero: il sigillo si dissolve piano allo scroll ---------- */
  (function () {
    var seal = $(".hero__seal");
    if (!seal || reduceMotion) return;
    var ticking = false;
    function update() {
      var y = Math.min(window.scrollY, window.innerHeight);
      var p = y / window.innerHeight;
      seal.style.transform = "translateY(" + (y * 0.12).toFixed(1) + "px) scale(" + (1 - p * 0.06).toFixed(3) + ")";
      seal.style.opacity = String(Math.max(0, 1 - p * 1.1).toFixed(3));
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  })();

  /* ---------- Testi: niente parole sole all'ultima riga ---------- */
  // Lega con spazi non separabili le ultime tre parole di ogni testo (la riga finale ne ha sempre almeno tre).
  // Si ferma a un <br>; ogni elemento si tratta una volta sola, quindi si può richiamare dopo ogni render.
  var TIDY_SEL = "main p, main h1, main h2, main h3, main h4, main summary, main li, main dd, main blockquote footer, .footer p, .modal p";
  function tidyText(root) {
    $$(TIDY_SEL, root || doc).forEach(function (el) {
      if (el.dataset.nb || el.classList.contains("eyebrow") || el.closest(".chips, .btn, .err")) return;
      if (el.querySelector("p, li, div, h1, h2, h3, h4, ul, ol, dl, article, details")) return;   // il testo lo tratta l'elemento interno
      el.dataset.nb = "1";
      var it = doc.createNodeIterator(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), nodes = [], n;
      while ((n = it.nextNode())) {
        if (n.nodeType === 1) { if (n.tagName === "BR") nodes = []; continue; }
        if (n.nodeValue.trim()) nodes.push(n);
      }
      var left = 2, NB = " ";
      for (var i = nodes.length - 1; i >= 0 && left > 0; i--) {
        var chars = nodes[i].nodeValue.split(""), end = chars.length;
        if (i < nodes.length - 1 && chars[end - 1] === " ") { chars[end - 1] = NB; left--; }   // spazio tra due nodi
        while (end > 0 && /\s/.test(chars[end - 1])) end--;
        for (var k = end - 1; k > 0 && left > 0; k--) { if (chars[k] === " ") { chars[k] = NB; left--; } }
        if (left > 0 && chars[0] === " " && i > 0) { chars[0] = NB; left--; }
        nodes[i].nodeValue = chars.join("");
      }
    });
  }

  /* ---------- Ammissione: la barra di separazione cresce con lo scroll ---------- */
  // Ogni passo ha sopra una linea che si riempie (--f da 0 a 1) man mano che si scorre; i passi raggiunti si accendono.
  // Con i passi affiancati (desktop) la barra corre in sequenza da uno al successivo; in colonna (mobile) ogni passo si riempie quando arriva.
  // Con «movimento ridotto» resta tutto pieno e fermo.
  (function () {
    var box = $(".steps"), steps = $$(".steps .step");
    if (!box || !steps.length || reduceMotion) return;
    var ticking = false;
    function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
    function update() {
      ticking = false;
      var vh = window.innerHeight, n = steps.length;
      var row = n > 1 && steps[0].offsetTop === steps[1].offsetTop;
      var p = row ? clamp((vh * 0.92 - box.getBoundingClientRect().top) / (vh * 0.5)) : 0;
      steps.forEach(function (s, i) {
        var f = row ? clamp(p * n - i) : clamp((vh * 0.9 - s.getBoundingClientRect().top) / (vh * 0.32));
        s.style.setProperty("--f", f.toFixed(3));
        s.classList.toggle("is-on", f > 0.02);
        s.classList.toggle("is-full", f >= 0.999);
      });
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", req);
    box.classList.add("is-live");
    update();
  })();

  /* ---------- Incontri ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // Data a blocchi ("12–14 / giu 2027") se esiste, altrimenti il testo libero dell'incontro.
  var MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  function parseDay(str) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function dateBlock(ev) {
    var a = parseDay(ev.start), b = parseDay(ev.end);
    // Data in arrivo: cifre finte sfocate (non rappresentano nessuna data) e scritta nitida sotto.
    if (!a && ev.blurDate) {
      return '<span class="sr-only">' + esc(ev.when) + "</span>" +
        '<div class="ev__soon" aria-hidden="true"><span class="ev__blur"><span class="ev__day">88</span><span class="ev__mon">XXX</span></span>' +
        "<small>" + esc(ev.when) + "</small></div>";
    }
    if (!a) return '<div class="ev__tba"><i>' + esc(ev.when) + "</i><small>Calendario</small></div>";
    var day = String(a.getDate());
    var mon = MONTHS[a.getMonth()];
    if (b && b > a) {
      day = a.getDate() + "–" + b.getDate();
      if (b.getMonth() !== a.getMonth()) mon = MONTHS[a.getMonth()] + " / " + MONTHS[b.getMonth()];
    }
    return '<span class="ev__day">' + day + '</span><span class="ev__mon">' + mon + "<br>" + a.getFullYear() + "</span>";
  }

  // Un incontro passato (ultimo giorno prima di oggi) non compare più: né nel calendario né in evidenza.
  var TODAY = (function () { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); })();
  function isPast(ev) { var d = parseDay(ev.end) || parseDay(ev.start); return !!d && d < TODAY; }

  // Ordine: prima le date certe (dalla più vicina), poi quelle da definire.
  var SORTED = EVENTS.filter(function (e) { return !isPast(e); }).map(function (e, i) { return { e: e, i: i }; }).sort(function (x, y) {
    var dx = parseDay(x.e.start), dy = parseDay(y.e.start);
    if (dx && dy) return dx - dy;
    if (dx) return -1;
    if (dy) return 1;
    return x.i - y.i;
  }).map(function (o) { return o.e; });

  /* ---------- Evento in evidenza (sotto l'hero) ---------- */
  var MONTHS_FULL = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  var WEEKDAYS = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  function countdown(a) {
    var n = Math.round((a - TODAY) / 86400000);
    if (n === 0) return "oggi";
    if (n === 1) return "domani";
    return n > 1 && n <= 45 ? "tra " + n + " giorni" : "";
  }
  function renderFeatured() {
    var sec = $("#evento"), box = $("#event-hl"), chip = $(".hero__next");
    var ev = SORTED[0];
    if (!sec || !box || !ev) return;
    var a = parseDay(ev.start), b = parseDay(ev.end);
    var open = ev.status !== "interest";
    var cd = a ? countdown(a) : "";
    var day = a ? String(a.getDate()) : "", mon = "", dow = "";
    if (a) {
      mon = MONTHS_FULL[a.getMonth()] + " " + a.getFullYear();
      dow = WEEKDAYS[a.getDay()];
      if (b && b > a) { day = a.getDate() + "–" + b.getDate(); mon = MONTHS_FULL[b.getMonth()] + " " + b.getFullYear(); dow = ""; }
    }
    var meta = [["Dove", ev.where]];
    if (ev.time) meta.push(["Ore", ev.time]);
    if (ev.price) meta.push(["Quota", ev.price]);
    if (ev.seats) meta.push(["Posti", ev.seats + " posti"]);
    box.innerHTML =
      '<div class="event-hl__main">' +
        '<p class="eyebrow eyebrow--dark"><span class="event-hl__dot" aria-hidden="true"></span>Prossimo evento' + (cd ? ' <span class="event-hl__cd">' + esc(cd) + "</span>" : "") + "</p>" +
        '<h2 class="display display--xl event-hl__title" id="evento-title">' + esc(ev.title) + "</h2>" +
        '<p class="event-hl__type">' + esc(ev.type) + "</p>" +
        '<div class="event-hl__date">' + (a
          ? '<span class="event-hl__day">' + day + '</span><span class="event-hl__when"><b>' + esc(mon) + "</b>" + (dow ? "<i>" + esc(dow) + (ev.time ? ", ore " + esc(ev.time) : "") + "</i>" : "") + "</span>"
          : '<span class="event-hl__tba">' + esc(ev.when) + "</span>") + "</div>" +
      "</div>" +
      '<div class="event-hl__side">' +
        '<p class="event-hl__blurb">' + esc(ev.blurb) + "</p>" +
        '<dl class="event-hl__meta">' + meta.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") + "</dl>" +
        (ev.sponsors ? '<p class="event-hl__sponsors"><span>Main sponsor</span> ' + esc(ev.sponsors) + "</p>" : "") +
        '<div class="event-hl__actions"><button class="btn btn--forest btn--lg" type="button" data-open-form="event" data-event="' + esc(ev.id) + '">' + (open ? "Richiedi un posto" : "Segnala interesse") + "</button>" +
        '<a class="event-hl__link" href="#calendario">Tutti gli incontri <span aria-hidden="true">→</span></a></div>' +
      "</div>";
    sec.hidden = false;
    tidyText(box);
    if (chip) {
      chip.innerHTML = '<span class="hero__next-dot" aria-hidden="true"></span><span class="hero__next-k">Prossimo evento</span><span class="hero__next-t">' + esc(ev.title) +
        (a ? " · " + a.getDate() + " " + MONTHS[a.getMonth()] : "") + ' <span aria-hidden="true">→</span></span>';
      chip.hidden = false;
    }
  }
  renderFeatured();

  var activeFilter = "all";
  var filtersEl = $("#event-filters");
  var countEl = $("#event-count");
  var listEl = $("#events-grid");

  function renderFilters() {
    var types = [];
    SORTED.forEach(function (e) { if (types.indexOf(e.type) < 0) types.push(e.type); });
    if (types.length < 2) { filtersEl.hidden = true; return; }
    var chips = [{ key: "all", label: "Tutti", n: SORTED.length }].concat(types.map(function (t) {
      return { key: t, label: t, n: SORTED.filter(function (e) { return e.type === t; }).length };
    }));
    filtersEl.innerHTML = chips.map(function (c) {
      return '<button type="button" class="chip" data-filter="' + esc(c.key) + '" aria-pressed="' + (c.key === activeFilter) + '">' + esc(c.label) + " <small>" + c.n + "</small></button>";
    }).join("");
  }

  function renderEvents() {
    var items = SORTED.filter(function (e) { return activeFilter === "all" || e.type === activeFilter; });
    var allSoon = items.length && items.every(function (e) { return e.blurDate; });
    countEl.textContent = allSoon ? "Data in arrivo" : (items.length === 1 ? "1 incontro" : items.length + " incontri");

    if (!items.length) {
      listEl.innerHTML = '<div class="agenda__empty"><p>' +
        (EVENTS.length ? "Nessun incontro in questo formato, per ora." : "Il prossimo incontro sarà annunciato a chi ha richiesto un invito.") +
        '</p><button class="btn btn--ghost btn--sm" type="button" data-open-form="invite">Richiedi un invito</button></div>';
      return;
    }
    listEl.innerHTML = items.map(function (ev, i) {
      var open = ev.status !== "interest";
      var meta = [["Dove", ev.where]];
      if (ev.time) meta.push(["Ore", ev.time]);
      if (ev.price) meta.push(["Quota", ev.price]);
      if (ev.seats) meta.push(["Posti", ev.seats + " posti"]);   // senza numero comunicato la riga non compare
      return (
        '<article class="ev" style="--i:' + i + '">' +
          '<div class="ev__date">' + dateBlock(ev) + "</div>" +
          '<div class="ev__main">' +
            '<div class="ev__top"><span class="ev__type">' + esc(ev.type) + "</span>" +
            '<span class="pill' + (open ? " pill--open" : "") + '">' + (open ? "Su richiesta" : "Prossimamente") + "</span></div>" +
            '<h4 class="ev__title">' + esc(ev.title) + "</h4>" +
            '<p class="ev__blurb">' + esc(ev.blurb) + "</p>" +
            (ev.sponsors ? '<p class="ev__sponsors"><span>Main sponsor</span> ' + esc(ev.sponsors) + "</p>" : "") +
          "</div>" +
          '<dl class="ev__meta">' +
            meta.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") +
          "</dl>" +
          '<div class="ev__action"><button class="btn ' + (open ? "btn--sage" : "btn--ghost") + ' btn--sm" type="button" data-open-form="event" data-event="' + esc(ev.id) + '">' + (open ? "Richiedi un posto" : "Segnala interesse") + "</button></div>" +
        "</article>"
      );
    }).join("");
    tidyText(listEl);
  }

  filtersEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-filter]");
    if (!b) return;
    activeFilter = b.getAttribute("data-filter");
    $$(".chip", filtersEl).forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
    renderEvents();
  });

  renderFilters();
  renderEvents();
  tidyText();
  observeReveal();

  /* ---------- Modal + form ---------- */
  var modal = $("#request-modal");
  var form = $("#request-form");
  var selEvent = $("#f-event");
  var chip = $("#event-chip");
  var submitBtn = $("#submit-btn");
  var formError = $("#form-error");
  var done = $("#modal-done");
  var lastTrigger = null;
  var openedAt = 0;                   // quando si è aperto il modulo (anti-bot: nessun umano lo compila in meno di 3 secondi)

  // Opzioni del select "Incontro": nessuno + ogni incontro.
  selEvent.innerHTML =
    '<option value="">Nessun incontro in particolare</option>' +
    SORTED.map(function (ev) { return '<option value="' + esc(ev.id) + '">' + esc(ev.title) + "</option>"; }).join("");

  function eventById(id) { return EVENTS.filter(function (e) { return e.id === id; })[0]; }

  function syncEventUI() {
    var ev = eventById(selEvent.value);
    var isInterest = ev && ev.status === "interest";
    $("#modal-eyebrow").textContent = ev ? (isInterest ? "Segnala interesse" : "Richiesta di partecipazione") : "Richiesta di invito";
    $("#modal-title").textContent = ev ? ev.title : "Presentati.";
    $("#modal-intro").textContent = ev
      ? (isInterest
          ? "Questo incontro non è ancora aperto. Lascia i tuoi dati: ti scriveremo quando sarà il momento."
          : "Il posto non è garantito: ogni richiesta viene valutata personalmente, anche per comporre un gruppo equilibrato.")
      : "Non cerchiamo un curriculum perfetto. Ci interessa sapere chi sei.";
    if (ev) {
      chip.hidden = false;
      chip.textContent = [ev.when, ev.where].join(" · ");
    } else {
      chip.hidden = true;
    }
  }
  selEvent.addEventListener("change", syncEventUI);

  function openModal(eventId, trigger) {
    lastTrigger = trigger || null;
    modal.classList.remove("is-done");
    done.hidden = true;
    form.hidden = false;
    clearErrors();
    selEvent.value = eventId && eventById(eventId) ? eventId : "";
    syncEventUI();
    if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
    doc.body.classList.add("is-locked");
    modal.scrollTop = 0;
    openedAt = Date.now();
    // Col mouse il cursore va subito sul primo campo; sul telefono no, per non aprire la tastiera a sorpresa.
    if (window.matchMedia("(pointer: fine)").matches && form.elements.firstName) form.elements.firstName.focus({ preventScroll: true });
  }
  // Pulizia alla chiusura: sblocca lo scroll e riporta il fuoco al pulsante che ha aperto il modulo.
  // Si fa subito (non solo sull'evento "close", che il browser può ritardare) e vale anche per Esc, che passa dall'evento.
  function afterClose() {
    doc.body.classList.remove("is-locked");
    if (lastTrigger && doc.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
  }
  function closeModal() { if (modal.open) { modal.close(); afterClose(); } }
  modal.addEventListener("close", afterClose);
  // Click sul fondo scuro = chiudi
  modal.addEventListener("mousedown", function (e) {
    if (e.target === modal) closeModal();
  });

  doc.addEventListener("click", function (e) {
    var t = e.target.closest("[data-open-form]");
    if (t) {
      e.preventDefault();
      setMenu(false);
      openModal(t.getAttribute("data-event"), t);
      return;
    }
    if (e.target.closest("[data-close]")) closeModal();
  });

  /* Validazione */
  // Instagram obbligatorio: accetta @nomeprofilo, nomeprofilo o il link al profilo. Restituisce l'handle senza @, o "".
  function igHandle(v) {
    v = (v || "").trim();
    var u = v.match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})\/?(?:[?#].*)?$/i);
    if (u) { var reserved = /^(p|reel|reels|explore|stories|accounts|tv)$/i; return reserved.test(u[1]) ? "" : u[1]; }
    var h = v.replace(/^@/, "");
    return /^[A-Za-z0-9._]{1,30}$/.test(h) ? h : "";
  }
  var rules = {
    firstName: function (v) { return v.trim() ? "" : "Inserisci il tuo nome."; },
    lastName: function (v) { return v.trim() ? "" : "Inserisci il tuo cognome."; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Inserisci un indirizzo email valido."; },
    role: function (v) { return v.trim() ? "" : "Raccontaci di cosa ti occupi."; },
    instagram: function (v) { return igHandle(v) ? "" : "Inserisci @nomeprofilo o il link."; },
    note: function (v) { return v.trim().length >= 20 ? "" : "Scrivi almeno due righe: ci aiuta a conoscerti."; },
    consent: function (v, el) { return el.checked ? "" : "Per procedere serve il tuo consenso."; },
  };
  function setError(name, msg) {
    var p = $('[data-err="' + name + '"]', form);
    var field = p && p.closest(".field");
    if (p) p.textContent = msg;
    if (field) field.classList.toggle("has-error", !!msg);
    var input = form.elements[name];
    if (p && !p.id) p.id = "err-" + name;
    if (input) {
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      if (p) { if (msg) input.setAttribute("aria-describedby", p.id); else input.removeAttribute("aria-describedby"); }
    }
  }
  function clearErrors() {
    Object.keys(rules).forEach(function (n) { setError(n, ""); });
    formError.textContent = "";
    submitBtn.disabled = false;
    submitBtn.textContent = "Invia la richiesta";
  }
  function validate() {
    var firstBad = null;
    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      var msg = rules[name](el.value || "", el);
      setError(name, msg);
      if (msg && !firstBad) firstBad = el;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }
  Object.keys(rules).forEach(function (name) {
    var el = form.elements[name];
    el.addEventListener("blur", function () { if (el.value || el.type === "checkbox") setError(name, rules[name](el.value || "", el)); });
    el.addEventListener("input", function () { if (el.closest(".has-error")) setError(name, rules[name](el.value || "", el)); });
    el.addEventListener("change", function () { if (el.closest(".has-error")) setError(name, rules[name](el.value || "", el)); });
  });

  // Pulizia lato browser (il server deve comunque ripetere la validazione): toglie i caratteri di controllo e taglia alla lunghezza massima.
  function clean(v, max) {
    var t = String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
    t = t.split(String.fromCharCode(8232)).join(" ").split(String.fromCharCode(8233)).join(" ");   // separatori di riga/paragrafo Unicode
    return t.trim().slice(0, max);
  }
  function collect() {
    var fd = new FormData(form);
    var ev = eventById(clean(fd.get("event"), 80));
    return {
      kind: ev ? (ev.status === "interest" ? "event-interest" : "event-request") : "invite-request",
      eventId: ev ? ev.id : null,
      eventTitle: ev ? ev.title : null,
      firstName: clean(fd.get("firstName"), 60),
      lastName: clean(fd.get("lastName"), 60),
      email: clean(fd.get("email"), 120),
      phone: clean(fd.get("phone"), 30),
      role: clean(fd.get("role"), 120),
      instagram: "@" + igHandle(fd.get("instagram")),
      referral: clean(fd.get("referral"), 100),
      note: clean(fd.get("note"), 800),
      consent: true,
      language: doc.documentElement.lang,
      submittedAt: new Date().toISOString(),
      page: location.href,
    };
  }

  function showDone(demo) {
    var ev = eventById(selEvent.value);
    form.reset();                      // dopo l'invio i dati non restano nel modulo (computer condivisi)
    form.hidden = true;
    modal.classList.add("is-done");
    done.hidden = false;
    $("#demo-note").hidden = !demo;
    $("#done-title").textContent = ev && ev.status === "interest" ? "Interesse registrato." : "Richiesta ricevuta.";
    modal.scrollTop = 0;
    $("#done-title").focus({ preventScroll: true });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    formError.textContent = "";
    if (submitBtn.disabled) return;                    // invio già in corso: niente doppi invii
    if (!validate()) return;
    // Anti-bot: campo trappola compilato, oppure modulo inviato in meno di 3 secondi dall'apertura.
    // Al bot si risponde come se fosse andato tutto bene, senza inviare nulla.
    if (form.elements.website.value || Date.now() - openedAt < 3000) { showDone(!CONFIG.endpoint); return; }

    var payload = collect();
    submitBtn.disabled = true;
    submitBtn.textContent = "Invio in corso…";
    function fail(msg) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Invia la richiesta";
      formError.textContent = msg || "Non siamo riusciti a inviare la richiesta. Riprova tra un momento.";
    }

    // Modalità demo: nessun endpoint configurato → niente lascia il browser (e nessun dato finisce in console).
    if (!CONFIG.endpoint) {
      setTimeout(function () { showDone(true); }, 600);
      return;
    }
    // L'endpoint deve essere https (o un percorso dello stesso sito, o localhost per le prove): mai dati personali in chiaro.
    if (!/^(https:\/\/|\/(?!\/)|http:\/\/(localhost|127\.0\.0\.1)[:\/])/i.test(CONFIG.endpoint)) { fail("Il servizio di invio non è configurato correttamente."); return; }

    var ctrl = "AbortController" in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
    fetch(CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "omit",            // niente cookie né credenziali
      cache: "no-store",
      referrerPolicy: "no-referrer",
      redirect: "error",              // un reindirizzamento non deve portare i dati altrove
      signal: ctrl ? ctrl.signal : undefined,
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      showDone(false);
    }).catch(function () { fail(); }).then(function () { clearTimeout(timer); });
  });
})();
