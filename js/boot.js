/*
 * House of Saratoga — avvio. Si esegue subito, prima del disegno della pagina (per questo è un file a parte
 * e non uno script dentro l'HTML: la politica di sicurezza non ammette script in linea).
 */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");

  // Anti-clickjacking. L'hosting non permette di impostare X-Frame-Options né frame-ancestors, quindi se la
  // pagina viene incorniciata da un altro sito la si nasconde e si tenta di uscire dalla cornice.
  try {
    if (window.top !== window.self) {
      root.style.display = "none";
      window.top.location = window.self.location;
    }
  } catch (e) {
    root.style.display = "none";
  }
})();
