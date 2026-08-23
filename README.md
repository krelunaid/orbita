# Orbita

App **iPhone** in Expo + React Native + TypeScript. Mostra una Terra interattiva e satelliti **reali**, con posizioni propagate **adesso** da TLE pubblici.

Non è un sito web. Non c’è Next.js. Questa passata **non** carica l’app sull’App Store.

Bundle id: `it.kreluna.orbita`

## Cosa fa

- Globo scuro, ruotabile (trascina) e con zoom (pizzico)
- Cataloghi CelesTrak: `stations`, `visual`, `weather`, `gps-ops`, `galileo`, `science`
- Se CelesTrak non risponde: SatNOGS DB, poi `tle.ivanstanojevic.me`
- Niente dump Starlink, niente Space-Track
- Massimo ~280 oggetti
- Schermata Info con attribuzione e disclaimer (niente affiliazione NASA/DoD)

Interfaccia in italiano.

## Provala su iPhone con Expo Go

1. Sul Mac o PC clona il repo e installa le dipendenze (Node 20+):

   ```bash
   git clone https://github.com/krelunaid/orbita.git
   cd orbita
   npm install
   npx expo start
   ```

2. Sul telefono installa **Expo Go** dall’App Store. L’SDK del progetto è **Expo 57**: serve una Expo Go compatibile con SDK 57.

3. iPhone e computer sulla **stessa rete Wi‑Fi**.

4. Inquadra il QR code:
   - Fotocamera iOS → apre Expo Go
   - oppure apri Expo Go → *Scan QR code*

5. Al primo avvio l’app scarica i TLE (serve internet). Li tiene in cache circa 2 ore, come da etichetta d’uso CelesTrak.

Se il QR non apre il progetto, nel terminale premi `s` per inviare il link, oppure usa lo stesso tunnel (`npx expo start --tunnel`) se il Wi‑Fi isola i client.

Sviluppo su simulatore iOS (solo macOS): `npx expo start --ios`.

## Script

```bash
npm start              # Metro / Expo
npm run typecheck      # TypeScript
npm run check:orbit    # scarica TLE pubblici e propaga l’ISS
```

## Dati e limiti

Fonti TLE pubbliche, in ordine: [CelesTrak](https://celestrak.org) (T.S. Kelso), [SatNOGS DB](https://db.satnogs.org), [tle.ivanstanojevic.me](https://tle.ivanstanojevic.me). Propagazione SGP4 con `satellite.js`. Coste del globo da Natural Earth 110m (dominio pubblico).

I TLE pubblici sono stime e invecchiano. Orbita **non** è affiliata, approvata o gestita da NASA, DoD, USSF, Space-Track, CelesTrak o ESA.
