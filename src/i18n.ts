import type { GroupId } from './types';

export const it = {
  appName: 'Orbita',
  tagline: 'Satelliti veri, adesso, intorno alla Terra',
  globo: 'Globo',
  catalogo: 'Catalogo',
  info: 'Info',
  aggiorna: 'Aggiorna',
  riprova: 'Riprova',
  caricamento: 'Scarico i TLE pubblici…',
  caricamentoIss: 'Cerco l’ISS…',
  caricamentoCatalogo: 'Aggiorno il catalogo…',
  inAttesa: 'In attesa dei TLE…',
  erroreRete:
    'Non riesco a scaricare i TLE. Controlla la rete e riprova. Nessun dato Space-Track.',
  erroreReteCorta: 'Aggiornamento TLE non riuscito.',
  erroreTimeout: 'Le fonti TLE non rispondono. Controlla la rete e premi Riprova.',
  erroreConnessione: 'Nessuna connessione. Controlla la rete e premi Riprova.',
  erroreNessunaFonte: 'Nessuna fonte TLE disponibile. Controlla la rete e premi Riprova.',
  ultimoAggiornamento: 'Aggiornato',
  cache: 'cache locale',
  stimaIss: 'ultima ISS nota',
  oggetti: 'oggetti',
  cerca: 'Cerca nome o NORAD',
  cancella: 'Cancella',
  nessuno: 'Nessun satellite in questo filtro. Riattiva un gruppo o cerca ISS.',
  nessunRisultato: 'Nessun risultato. Prova ISS, Hubble o un numero NORAD.',
  toccaPunto: 'Trascina la Terra · pizzica per lo zoom · tocca un punto',
  toccaCatalogo: 'Dal catalogo, tocca un satellite per centrarlo sul globo.',
  vaiIss: 'ISS',
  centraIss: 'Centra ISS',
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
    'I TLE arrivano da cataloghi pubblici, in quest’ordine: CelesTrak (gruppi stations, visual, weather, gps-ops, galileo, science), poi SatNOGS DB (solo oggetti scelti, non il dump intero), poi tle.ivanstanojevic.me. L’ISS (NORAD 25544) viene chiesta per prima. Non usiamo Space-Track. Non scarichiamo l’intera costellazione Starlink: il catalogo è limitato a poche centinaia di oggetti.',
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
  howToTitle: 'Come si usa',
  howToItems: [
    'Sul globo: trascina per ruotare, pizzica per lo zoom, tocca un punto per i dettagli.',
    'Nel catalogo: cerca per nome o NORAD, poi tocca una riga per centrare quel satellite.',
    'L’ISS (NORAD 25544) resta in cima e si raggiunge dal pulsante ISS anche se Stazioni è spento.',
  ],
  versione: 'Versione',
  howToOpen:
    'Orbita è un’app nativa (bundle it.kreluna.orbita). Su iPhone si apre da TestFlight dopo un build EAS, non da un sito e non da Expo Go.',
} as const;

export function groupLabel(id: GroupId): string {
  return it.gruppi[id];
}
