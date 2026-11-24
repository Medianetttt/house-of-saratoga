/*
 * House of Saratoga — capitoli della sezione «Dagli eventi».
 * Un banner per ogni evento già fatto, con le sue foto. Le immagini stanno in assets/gallery/grid (anteprime) e
 * assets/gallery/full (ingrandimento e banner). Per aggiungere una foto: copia i due file con lo stesso nome e
 * aggiungi una riga in `photos`; per un nuovo capitolo: aggiungi un oggetto a `chapters`.
 *
 *  title   titolo del capitolo (come scritto dal cliente)
 *  meta    riga sotto il titolo (facoltativa: solo dati confermati)
 *  cover   id della foto usata per il banner; coverPos = posizione del ritaglio ("x% y%")
 *  photos  id, larghezza e altezza dell'immagine ingrandita
 *
 * Fonte: selezione foto del cliente nella cartella Drive «HOS» → «Selezione foto chapter sito» (2026-11-23):
 * capitolo 1 «Terrazza dei tuffi» (4 file), capitolo 2 «Private affair» (9 foto), capitolo 3 «Halloween Shinigami» (9 foto).
 * Il capitolo 4 era vuoto: le 10 foto sono scelte da Claude tra le 109 della cartella «San Martino» (verificato dal libro
 * «Ambizione e serenità» di Nicolò Andreula nelle foto); da confermare con il cliente.
 * Le persone sono riconoscibili: il consenso non è verificato.
 */
window.HOS_GALLERY = {
  chapters: [
    {
      id: "c1", n: 1,
      title: "Terrace above the Adriatic",
      meta: "Polignano a Mare · Settembre 2026",
      cover: "c1-1", coverPos: "50% 40%",
      photos: [
        { id: "c1-1", w: 1200, h: 674 }, { id: "c1-2", w: 1200, h: 674 }, { id: "c1-3", w: 1200, h: 674 }, { id: "c1-4", w: 1200, h: 1556 },
      ],
    },
    {
      id: "c2", n: 2,
      title: "Private affair",
      meta: "",
      cover: "c2-1", coverPos: "50% 55%",
      photos: [
        { id: "c2-1", w: 1200, h: 800 }, { id: "c2-2", w: 1200, h: 1642 }, { id: "c2-3", w: 1200, h: 1800 }, { id: "c2-4", w: 1200, h: 1800 }, { id: "c2-5", w: 1200, h: 1800 },
        { id: "c2-6", w: 1200, h: 1800 }, { id: "c2-7", w: 1200, h: 1800 }, { id: "c2-8", w: 1200, h: 1800 }, { id: "c2-9", w: 1200, h: 1800 }, { id: "c2-10", w: 1200, h: 1800 },
      ],
    },
    {
      id: "c3", n: 3,
      title: "Shinigami — Halloween party by House of Saratoga",
      meta: "Halloween 2026",
      cover: "c3-1", coverPos: "50% 42%",
      photos: [
        { id: "c3-1", w: 1200, h: 1800 }, { id: "c3-2", w: 1200, h: 1800 }, { id: "c3-3", w: 1200, h: 1800 }, { id: "c3-4", w: 1200, h: 1800 }, { id: "c3-5", w: 1200, h: 1800 },
        { id: "c3-6", w: 1200, h: 1800 }, { id: "c3-7", w: 1200, h: 1800 }, { id: "c3-8", w: 1200, h: 1800 }, { id: "c3-9", w: 1200, h: 1800 },
      ],
    },
    {
      id: "c4", n: 4,
      title: "Autumn gathering w/ Nicolò Andreula",
      meta: "",
      cover: "c4-8", coverPos: "50% 30%",
      photos: [
        { id: "c4-1", w: 1200, h: 1800 }, { id: "c4-2", w: 1200, h: 1800 }, { id: "c4-3", w: 1200, h: 1800 }, { id: "c4-4", w: 1200, h: 1800 }, { id: "c4-5", w: 1200, h: 1800 },
        { id: "c4-6", w: 1200, h: 1800 }, { id: "c4-7", w: 1200, h: 1800 }, { id: "c4-8", w: 1200, h: 1800 }, { id: "c4-9", w: 1200, h: 1800 }, { id: "c4-10", w: 1200, h: 1800 },
      ],
    },
  ],
};
