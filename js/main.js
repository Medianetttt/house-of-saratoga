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
      // Rete di sicurezza: se il browser sospende le animazioni (scheda in background), lo stato si chiude lo stesso.
      setTimeout(function () { if (el._anim === a) a.finish(); }, DURATION + 120);
      a.onfinish = function () {
        if (el._anim !== a) return;
        el._anim = null;
        el.style.overflow = "";
        if (onEnd) onEnd();
      };
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

  /* ---------- Header: sfondo dopo lo scroll ---------- */
  var header = $(".site-header");
  function onScroll() { header.classList.toggle("is-solid", window.scrollY > 24); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  var burger = $(".burger");
  var menu = $("#menu");
  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
    menu.classList.toggle("is-open", open);
    doc.body.classList.toggle("is-locked", open);
    doc.body.classList.toggle("menu-open", open);
    if (open) menu.hidden = false;
  }
  burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("is-open")) setMenu(false); });
  window.matchMedia("(min-width: 1100px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });

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
    if (!a) return '<div class="ev__tba"><i>' + esc(ev.when) + "</i><small>Calendario</small></div>";
    var day = String(a.getDate());
    var mon = MONTHS[a.getMonth()];
    if (b && b > a) {
      day = a.getDate() + "–" + b.getDate();
      if (b.getMonth() !== a.getMonth()) mon = MONTHS[a.getMonth()] + " / " + MONTHS[b.getMonth()];
    }
    return '<span class="ev__day">' + day + '</span><span class="ev__mon">' + mon + "<br>" + a.getFullYear() + "</span>";
  }

  // Ordine: prima le date certe (dalla più vicina), poi quelle da definire.
  var SORTED = EVENTS.map(function (e, i) { return { e: e, i: i }; }).sort(function (x, y) {
    var dx = parseDay(x.e.start), dy = parseDay(y.e.start);
    if (dx && dy) return dx - dy;
    if (dx) return -1;
    if (dy) return 1;
    return x.i - y.i;
  }).map(function (o) { return o.e; });

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
    countEl.textContent = items.length === 1 ? "1 incontro" : items.length + " incontri";

    if (!items.length) {
      listEl.innerHTML = '<div class="agenda__empty"><p>' +
        (EVENTS.length ? "Nessun incontro in questo formato, per ora." : "Il prossimo incontro sarà annunciato a chi ha richiesto un invito.") +
        '</p><button class="btn btn--ghost btn--sm" type="button" data-open-form="invite">Richiedi un invito</button></div>';
      return;
    }
    listEl.innerHTML = items.map(function (ev, i) {
      var open = ev.status !== "interest";
      var seats = ev.seats ? ev.seats + " posti" : "Posti limitati";
      return (
        '<article class="ev" style="--i:' + i + '">' +
          '<div class="ev__date">' + dateBlock(ev) + "</div>" +
          '<div class="ev__main">' +
            '<div class="ev__top"><span class="ev__type">' + esc(ev.type) + "</span>" +
            '<span class="pill' + (open ? " pill--open" : "") + '">' + (open ? "Su richiesta" : "Prossimamente") + "</span></div>" +
            '<h4 class="ev__title">' + esc(ev.title) + "</h4>" +
            '<p class="ev__blurb">' + esc(ev.blurb) + "</p>" +
          "</div>" +
          '<dl class="ev__meta">' +
            "<div><dt>Dove</dt><dd>" + esc(ev.where) + "</dd></div>" +
            "<div><dt>Posti</dt><dd>" + esc(seats) + "</dd></div>" +
          "</dl>" +
          '<div class="ev__action"><button class="btn ' + (open ? "btn--sage" : "btn--ghost") + ' btn--sm" type="button" data-open-form="event" data-event="' + esc(ev.id) + '">' + (open ? "Richiedi un posto" : "Segnala interesse") + "</button></div>" +
        "</article>"
      );
    }).join("");
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
      : "Ogni richiesta viene letta personalmente. Più sai raccontarci con semplicità chi sei, meglio è.";
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
  }
  function closeModal() { if (modal.open) modal.close(); }
  modal.addEventListener("close", function () {
    doc.body.classList.remove("is-locked");
    if (lastTrigger && doc.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
  });
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
  var rules = {
    firstName: function (v) { return v.trim() ? "" : "Inserisci il tuo nome."; },
    lastName: function (v) { return v.trim() ? "" : "Inserisci il tuo cognome."; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Inserisci un indirizzo email valido."; },
    role: function (v) { return v.trim() ? "" : "Raccontaci di cosa ti occupi."; },
    note: function (v) { return v.trim().length >= 20 ? "" : "Scrivi almeno due righe: ci aiuta a conoscerti."; },
    consent: function (v, el) { return el.checked ? "" : "Per procedere serve il tuo consenso."; },
  };
  function setError(name, msg) {
    var p = $('[data-err="' + name + '"]', form);
    var field = p && p.closest(".field");
    if (p) p.textContent = msg;
    if (field) field.classList.toggle("has-error", !!msg);
    var input = form.elements[name];
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
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

  function collect() {
    var fd = new FormData(form);
    var ev = eventById(fd.get("event"));
    return {
      kind: ev ? (ev.status === "interest" ? "event-interest" : "event-request") : "invite-request",
      eventId: ev ? ev.id : null,
      eventTitle: ev ? ev.title : null,
      firstName: fd.get("firstName").trim(),
      lastName: fd.get("lastName").trim(),
      email: fd.get("email").trim(),
      phone: (fd.get("phone") || "").trim(),
      role: fd.get("role").trim(),
      link: (fd.get("link") || "").trim(),
      referral: (fd.get("referral") || "").trim(),
      note: fd.get("note").trim(),
      consent: true,
      language: doc.documentElement.lang,
      submittedAt: new Date().toISOString(),
      page: location.href,
    };
  }

  function showDone(demo) {
    form.hidden = true;
    modal.classList.add("is-done");
    done.hidden = false;
    $("#demo-note").hidden = !demo;
    var ev = eventById(selEvent.value);
    $("#done-title").textContent = ev && ev.status === "interest" ? "Interesse registrato." : "Richiesta ricevuta.";
    modal.scrollTop = 0;
    $("#done-title").focus({ preventScroll: true });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    formError.textContent = "";
    if (form.elements.website.value) return;          // honeypot compilato: è un bot
    if (!validate()) return;

    var payload = collect();
    submitBtn.disabled = true;
    submitBtn.textContent = "Invio in corso…";

    // Modalità demo: nessun endpoint configurato → niente lascia il browser.
    if (!CONFIG.endpoint) {
      console.info("[House of Saratoga] Modalità demo, richiesta non inviata:", payload);
      setTimeout(function () { showDone(true); }, 600);
      return;
    }

    fetch(CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      showDone(false);
    }).catch(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = "Invia la richiesta";
      formError.textContent = "Non siamo riusciti a inviare la richiesta. Riprova tra un momento.";
    });
  });
})();
