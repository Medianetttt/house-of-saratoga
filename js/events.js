/*
 * House of Saratoga — configurazione e calendario incontri.
 *
 * Questo è l'UNICO file da toccare per cambiare gli incontri mostrati sul sito.
 * Quando ci sarà il backend, `HOS_EVENTS` potrà essere sostituito da una fetch
 * verso l'API e `endpoint` puntare all'endpoint che riceve le richieste.
 *
 * ATTENZIONE — contenuti segnaposto: date e luoghi NON sono confermati.
 * I tre incontri qui sotto riflettono i formati descritti nella Company Strategy
 * v1 (cene fondative, weekend signature, marquee event), non un calendario reale.
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
 *  where   testo libero
 *  seats   numero di posti, oppure null se non comunicato
 *  blurb   2 righe di descrizione
 *  status  "request"  → "Richiedi un posto"
 *          "interest" → "Segnala interesse" (incontro non ancora aperto)
 */
window.HOS_EVENTS = [
  {
    id: "cena-fondativa",
    type: "Cena fondativa",
    title: "Cena fondativa",
    start: null,
    end: null,
    when: "Data in definizione",
    where: "Luogo comunicato agli ospiti",
    seats: null,
    blurb:
      "Una tavola, pochi ospiti scelti uno a uno. Il primo modo per conoscere la House e le persone che la stanno costruendo.",
    status: "request",
  },
  {
    id: "signature-weekend",
    type: "Signature Weekend",
    title: "Il primo Signature Weekend",
    start: null,
    end: null,
    when: "Data in definizione",
    where: "Luogo da annunciare",
    seats: 15,
    blurb:
      "Un weekend intero, quindici persone, un gruppo composto per equilibrio. Ospitalità senza attriti e tempo lasciato libero.",
    status: "request",
  },
  {
    id: "marquee-event",
    type: "Marquee Event",
    title: "Marquee Event",
    start: null,
    end: null,
    when: "Da annunciare",
    where: "Da annunciare",
    seats: null,
    blurb:
      "Un viaggio costruito attorno a un grande evento — Formula 1, tennis, regate, moda. Non è ancora aperto: segnala il tuo interesse.",
    status: "interest",
  },
];
