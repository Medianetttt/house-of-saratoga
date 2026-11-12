# House of Saratoga — sito vetrina

Sito statico (HTML, CSS e JavaScript, senza build né dipendenze) per House of Saratoga, A Private Members Society.
Bozza: il form di richiesta funziona in modalità demo e non invia nulla.

## Vedere il sito in locale
Serve un piccolo server, perché i browser bloccano le maschere CSS dei loghi aprendo `index.html` direttamente:

```bash
python3 -m http.server 4173
```

Poi apri http://localhost:4173.

## Cosa modificare
- `js/events.js`: calendario degli incontri e indirizzo `endpoint` che riceverà le richieste del form (vuoto = modalità demo).
- `css/style.css`: colori, spazi e tipografia (variabili in cima al file).
- `privacy.html`: segnaposto, l'informativa va scritta prima di aprire il form.

## Da sapere
- Gli incontri nel calendario sono segnaposto: date e luoghi non sono confermati.
- Le foto in `assets/serate/` sono miniature da 640 px prese dal profilo Instagram: vanno sostituite con gli originali, con il consenso delle persone ritratte.

## Anteprima online
Questa copia pubblicata su GitHub Pages ha `noindex` in `index.html` e in `robots.txt`, perché è una bozza: va tolto al lancio.
