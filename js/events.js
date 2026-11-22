/*
 * House of Saratoga — configurazione e calendario incontri.
 *
 * Questo è l'UNICO file da toccare per cambiare gli incontri mostrati sul sito.
 * In home, sotto l'hero, va in evidenza il PRIMO incontro non passato (ordinato per data); un incontro
 * con data passata sparisce da solo, sia dall'evidenza sia dal calendario, il giorno dopo.
 *
 * Quando ci sarà il backend, `HOS_EVENTS` potrà essere sostituito da una fetch
 * verso l'API e `endpoint` puntare all'endpoint che riceve le richieste.
 *
 * Saratoga for Charity: dati dalla locandina ricevuta il 2026-11-22; data, ora e luogo (Monopoli)
 * comunicati da Giuseppe lo stesso giorno. L'anno 2026 è dedotto (non scritto nel messaggio).
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
 *  time    orario di inizio, testo libero (facoltativo)
 *  price   quota di partecipazione, testo libero (facoltativo)
 *  sponsors  sponsor principali, testo libero (facoltativo)
 *  seats   numero di posti; se null la riga «Posti» non compare
 *  blurb   2 righe di descrizione
 *  status  "request"  → "Richiedi un posto"
 *          "interest" → "Segnala interesse" (incontro non ancora aperto)
 */
window.HOS_EVENTS = [
  {
    id: "saratoga-for-charity",
    type: "Pranzo spettacolo",
    title: "Saratoga for Charity",
    start: "2026-11-29",
    end: null,
    when: "Domenica 29 novembre 2026",
    where: "Ristorante Lido Bianco, Monopoli",
    time: "13:00",
    price: "€ 90 a ospite",
    seats: null,
    blurb:
      "Pranzo spettacolo con Umberto Smaila e la sua band. Ospite d’onore Nicola Ventola, ex calciatore. Percorso gastronomico con selezione di vini in abbinamento. Il ricavato dell’asta di beneficenza sarà devoluto a due associazioni pugliesi che da anni si prendono cura dei bambini.",
    sponsors: "Pommery · I Pastini · Rivera",
    status: "request",
  },
];
