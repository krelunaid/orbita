import type { GroupId } from './types';

export const it = {
  appName: 'Orbita',
  tagline: 'Satelliti veri, adesso, intorno alla Terra',
  globo: 'Globo',
  catalogo: 'Catalogo',
  info: 'Info',
  aggiorna: 'Aggiorna',
  caricamento: 'Scarico i TLE pubblici…',
  erroreRete:
    'Non riesco a scaricare i TLE. Controlla la rete e riprova. Nessun dato Space-Track.',
  ultimoAggiornamento: 'Aggiornato',
  cache: 'cache locale',
  oggetti: 'oggetti',
  cerca: 'Cerca nome o NORAD',
  nessuno: 'Nessun satellite in questo filtro.',
  toccaPunto: 'Trascina la Terra · pizzica per lo zoom · tocca un punto',
  quota: 'Quota',
  latitudine: 'Latitudine',
  longitudine: 'Longitudine',
  velocita: 'Velocità',
  periodo: 'Periodo',
  inclinazione: 'Inclinazione',
  norad: 'NORAD',
  fonte: 'Fonte',
  gruppi: {
    stations: 'Stazioni',
    visual: 'Visibili',
    weather: 'Meteo',
    'gps-ops': 'GPS',
    galileo: 'Galileo',
    science: 'Scienza',
    altro: 'Altro',
  } satisfies Record<GroupId, string>,
  tutti: 'Tutti',
  aboutTitle: 'Cos’è Orbita',
  aboutBody:
    'Orbita è un’app iPhone: un globo interattivo e le posizioni di satelliti reali, calcolate adesso dai Two-Line Elements (TLE) pubblici. Non è un sito web.',
  aboutDati: 'Dati orbitali',
  aboutDatiBody:
    'I TLE arrivano da cataloghi pubblici, in quest’ordine: CelesTrak (gruppi stations, visual, weather, gps-ops, galileo, science), poi SatNOGS DB, poi tle.ivanstanojevic.me. Non usiamo Space-Track. Non scarichiamo l’intera costellazione Starlink: il catalogo è limitato a poche centinaia di oggetti.',
  aboutProp: 'Propagazione',
  aboutPropBody:
    'Le posizioni sono propagate all’istante corrente con il modello SGP4 (libreria satellite.js). I TLE pubblici invecchiano: quota, latitudine e longitudine sono stime, non un tracking operativo.',
  aboutAttrib: 'Attribuzione',
  aboutAttribItems: [
    'CelesTrak — T.S. Kelso, cataloghi GP pubblici (celestrak.org)',
    'SatNOGS DB — Libre Space Foundation, TLE redistribuibili (db.satnogs.org)',
    'tle.ivanstanojevic.me — API pubblica di TLE',
    'Natural Earth 110m — coste del globo (dominio pubblico)',
    'satellite.js — propagazione SGP4/SDP4',
  ],
  aboutDisclaimerTitle: 'Cosa Orbita non è',
  aboutDisclaimer:
    'Orbita non è affiliata, approvata o gestita da NASA, Dipartimento della Difesa degli Stati Uniti, USSF, Space-Track, CelesTrak, ESA o qualsiasi agenzia governativa. Non è un prodotto ufficiale e non fornisce dati militari, di difesa o di navigazione certificata.',
  aboutPrivacy: 'Privacy',
  aboutPrivacyBody:
    'L’app chiede i TLE in HTTPS alle fonti sopra. Non c’è account, non c’è analytics di terze parti in questo codice.',
  expoGoHint: 'Aprila su iPhone con Expo Go — vedi il README del repo.',
} as const;

export function groupLabel(id: GroupId): string {
  return it.gruppi[id];
}
