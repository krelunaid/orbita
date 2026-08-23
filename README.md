# Orbita

App **iPhone** nativa (Expo + React Native + TypeScript). Mostra una Terra interattiva e satelliti **reali**, con posizioni propagate **adesso** da TLE pubblici.

Non è un sito web. Non c’è Next.js. Non si apre da Expo Go né da un tunnel `exp.direct`.

Bundle id: `it.kreluna.orbita`  
Nome: **Orbita** · slug EAS: **orbita**

## Come la apre Andrea (il prodotto)

Orbita è un’app installata sul telefono via **TestFlight**, costruita con **EAS**.

Serve: account Expo, Apple Developer Program, Node 20+.

```bash
git clone https://github.com/krelunaid/orbita.git
cd orbita
npm install
npx eas-cli login
npx eas-cli init          # collega il progetto Expo (slug orbita) se manca extra.eas.projectId
```

Build iOS di prova (firma store, da caricare su TestFlight):

```bash
npx eas-cli build --platform ios --profile preview
```

Invio su App Store Connect / TestFlight (dal Mac di Andrea, con login Apple — non da questa VM):

```bash
npx eas-cli submit --platform ios --profile preview
```

Poi su iPhone: app **TestFlight** → Orbita.

Profilo `production` (stesso bundle, canale production):

```bash
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production
```

Questa passata **non** carica l’app sull’App Store e non fa login Apple.

`eas.json` definisce i profili iOS `preview` e `production` (distribution store / TestFlight) e un profilo `development` per un dev client. Expo Go **non** è il prodotto: SDK 57 e il client App Store spesso non coincidono, e il tunnel `exp://` / `exp.direct` non è un’installazione.

## Cosa fa

- Globo scuro sempre visibile al primo avvio (trascina / pizzico); i satelliti arrivano sopra
- Se i TLE falliscono: messaggio in italiano e pulsante **Riprova**
- Cataloghi CelesTrak: `stations`, `visual`, `weather`, `gps-ops`, `galileo`, `science`
- ISS (NORAD 25544) chiesta per prima e in testa al catalogo
- Se CelesTrak non risponde: SatNOGS DB (solo oggetti scelti, non il dump intero), poi `tle.ivanstanojevic.me`
- Niente dump Starlink, niente Space-Track
- Massimo ~280 oggetti
- Schermata Info con attribuzione e disclaimer (niente affiliazione NASA/DoD)

Interfaccia in italiano.

## Sviluppo locale (simulatore / Metro)

```bash
npm start                 # Metro
npx expo run:ios          # nativo, solo macOS — non Expo Go
```

## Script

```bash
npm start              # Metro / Expo
npm run typecheck      # TypeScript
npm run check:orbit    # scarica TLE pubblici e propaga l’ISS
```

## Dati e limiti

Fonti TLE pubbliche, in ordine: [CelesTrak](https://celestrak.org) (T.S. Kelso), [SatNOGS DB](https://db.satnogs.org), [tle.ivanstanojevic.me](https://tle.ivanstanojevic.me). Propagazione SGP4 con `satellite.js`. Coste del globo da Natural Earth 110m (dominio pubblico).

I TLE pubblici sono stime e invecchiano. Orbita **non** è affiliata, approvata o gestita da NASA, DoD, USSF, Space-Track, CelesTrak o ESA.
