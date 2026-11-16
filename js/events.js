/*
 * House of Saratoga — configurazione e calendario incontri.
 *
 * Questo è l'UNICO file da toccare per cambiare gli incontri mostrati sul sito.
 * Quando ci sarà il backend, `HOS_EVENTS` potrà essere sostituito da una fetch
 * verso l'API e `endpoint` puntare all'endpoint che riceve le richieste.
 *
 * ATTENZIONE — contenuto segnaposto: la data del prossimo incontro NON è confermata
 * ed è mostrata sfocata finché non viene annunciata.
 */

window.HOS_CONFIG = {
  // URL che riceve le richieste (POST, JSON). Vuoto = modalità demo: nessun dato
  // lascia il browser e il form lo dichiara nella schermata di conferma.
  endpoint: "",
};

/*
 * Campi di ogni incontro
 *  id      identificativo stabile (finisce nel payload)
 *  type    formato: "Cena fondativa" | "Signature Weekend" | "Marquee Event"
 *  title   titolo della scheda
 *  start   data di inizio "AAAA-MM-GG", oppure null se non è ancora definita
 *  end     data di fine "AAAA-MM-GG" (facoltativa: weekend e viaggi)
 *  when    testo mostrato quando la data non c'è ("Data in definizione")
 *  blurDate  true = mostra una data sfocata con la scritta "when" (incontro in arrivo)
 *  where   testo libero
 *  seats   numero di posti, oppure null se non comunicato
 *  blurb   2 righe di descrizione
 *  status  "request"  → "Richiedi un posto"
 *          "interest" → "Segnala interesse" (incontro non ancora aperto)
 */
window.HOS_EVENTS = [
  {
    id: "prossimo-incontro",
    type: "Prossimo incontro",
    title: "Il prossimo incontro",
    start: null,
    end: null,
    blurDate: true, // data sfocata: "Annunciata a breve". Per annunciarla: metti start/end e togli blurDate.
    when: "Annunciata a breve",
    where: "Da annunciare",
    seats: null,
    blurb:
      "La data sarà annunciata a breve. Segnala il tuo interesse: ti scriveremo per primi, appena l’incontro sarà aperto.",
    status: "interest",
  },
];
