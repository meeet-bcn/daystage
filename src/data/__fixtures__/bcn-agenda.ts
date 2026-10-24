// Actividades reales de la Agenda Cultural de Barcelona (recortadas), para los tests.
// Licencia CC BY 4.0 · Ajuntament de Barcelona.

import type { BcnRawEvent } from '@/data/bcn-agenda';

export const loveless: BcnRawEvent = {
  register_id: 99400789341,
  name: 'Festival de shoegaze "Loveless"',
  body: "<p>Shoegaze és més una forma diferent i personal d'entendre la música.</p><p>Bandes que participen:</p><ul><li>Slow Crush</li><li>Bum Motion Club</li><li>Pale Blue Eyes</li><li>Dharmacide</li><li>Salvana</li><li>Golden Bug</li><li>Revendless</li></ul>",
  start_date: '2026-10-24T12:00:00+02:00',
  end_date: '2026-10-24T12:00:00+02:00',
  classifications_data: [
    {
      name: 'Concerts',
      full_path: 'Tipologia AG >> Concerts',
    },
    {
      name: 'Música electrònica,  techno, dance',
      full_path: 'Especialitats AG >> Música >> Música electrònica,  techno, dance',
    },
    {
      name: 'Rock',
      full_path: 'Especialitats AG >> Música >> Rock',
    },
    {
      name: 'Actes a la Muntanya de Montjuic ',
      full_path:
        'Gestió BI >> Gestió Muntanya de Montjuïc (gestió interna) >> Actes a la Muntanya de Montjuic ',
    },
  ],
  addresses: [
    {
      place: 'Sala Upload *Poble Espanyol',
      address_name: 'Av Francesc Ferrer Guàrdia',
      start_street_number: 13,
      zip_code: '08038',
      town: 'BARCELONA',
      location_4326: {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'Point',
            coordinates: [41.36914809976752, 2.1467430809493484],
          },
        ],
      },
    },
  ],
  image_data: {
    image:
      'https://estatics-nasia.dtibcn.cat/nasia-pro/media/2026-10-24-agenda-loveless.90252d35b.jpg',
  },
  timetable: {
    html: '<table class="timetable-table"><tr class="timetable-header"><th class="weekdays">Dies</th><th class="hours">Hores</th><th class="prices">Preus</th></tr><tr><td class="timetable-day" rowspan=1><div>Dissabte</div></td><td class="timetable-hour" rowspan=1><div>a les 19.30&nbsp;h</div></td><td class="timetable-price" rowspan=1><div>Entrada general: 43.57 €</div></td></tr></table>',
  },
  tickets_data: [
    {
      name: 'Pagament',
    },
  ],
  values: [
    {
      attribute_name: "Web venda d'entrades",
      url_value: 'https://sala-upload.com/ca/conciertos/loveless-shoegaze-festival/',
    },
  ],
};

export const rosenwinkel: BcnRawEvent = {
  register_id: 99400782431,
  name: 'Concert "Kurt Rosenwinkel"',
  body: '<p class="ql-align-justify">El guitarrista Kurt Rosenwinkel és, sens dubte, un dels herois del jazz actual i un dels músics més influents i admirats de l\'escena. El seu setè disc com a líder,&nbsp;<em>The Remedy,</em>el va enregistrar en directe a una de les catedrals del jazz, el Village Vanguard d',
  start_date: '2026-11-05T03:00:00+01:00',
  end_date: '2026-11-05T03:00:00+01:00',
  classifications_data: [
    {
      name: 'Concerts',
      full_path: 'Tipologia AG >> Concerts',
    },
    {
      name: 'Jazz, Blues',
      full_path: 'Especialitats AG >> Música >> Jazz, Blues',
    },
    {
      name: 'Festival Internacional de Jazz de Barcelona',
      full_path:
        'Marcs i cicles AG >> Cicles de música >> Música pop, rock, jazz, electrònica >> Festival Internacional de Jazz de Barcelona',
    },
    {
      name: 'Activitats per al públic en general',
      full_path: 'Col·lectius AG >> Activitats per al públic en general',
    },
    {
      name: 'Música',
      full_path: 'Agenda 500 >> Música',
    },
  ],
  addresses: [
    {
      place: 'Fundació Conservatori del Liceu',
      address_name: 'Carrer Nou de la Rambla',
      start_street_number: 82,
      zip_code: '08001',
      town: 'Barcelona',
      location_4326: {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'Point',
            coordinates: [41.37604422263008, 2.1710122007221413],
          },
        ],
      },
    },
  ],
  image_data: {
    image: 'https://estatics-nasia.dtibcn.cat/nasia-pro/media/1500x850-19143111.31b4b1b4b.jpg',
  },
  timetable: {
    html: '<table class="timetable-table"><tr class="timetable-header"><th class="weekdays">Dies</th><th class="hours">Hores</th><th class="prices">Preus</th></tr><tr><td class="timetable-day" rowspan=1><div>Dijous</div></td><td class="timetable-hour" rowspan=1><div>a les 20.30&nbsp;h</div></td><td class="timetable-price" rowspan=1><div>Entrada general: 38 €       <p style="margin:0">(+ despeses de gestió)</p></div></td></tr></table>',
  },
  tickets_data: [
    {
      name: 'Pagament',
    },
  ],
  values: [
    {
      attribute_name: "Web venda d'entrades",
      url_value: 'https://www.jazz.barcelona',
    },
  ],
};

export const free: BcnRawEvent = {
  register_id: 99400786047,
  name: 'Concert "The Middle Way"',
  body: "<p>Banda grunge de composicions pròpies amb un so potent i melòdic que sempre aposta per l'equilibri. Les se· ves influències beuen tant del rock dels anys 90, com de les arrels més essencials del gènere.</p>",
  start_date: '2026-12-04T03:00:00+01:00',
  end_date: '2026-12-04T03:00:00+01:00',
  classifications_data: [
    {
      name: 'Concerts',
      full_path: 'Tipologia AG >> Concerts',
    },
    {
      name: 'Música',
      full_path: 'Especialitats AG >> Música',
    },
    {
      name: 'Activitats als Centres Cívics ',
      full_path: 'Marcs i cicles AG >> Altres marcs i cicles >> Activitats als Centres Cívics ',
    },
    {
      name: 'Activitats per al públic en general',
      full_path: 'Col·lectius AG >> Activitats per al públic en general',
    },
  ],
  addresses: [
    {
      place: "Bucs d'Assaig",
      address_name: 'C Sicília',
      start_street_number: 321,
      zip_code: '08025',
      town: 'BARCELONA',
      location_4326: {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'Point',
            coordinates: [41.4055915184838, 2.168051265900818],
          },
        ],
      },
    },
  ],
  image_data: null,
  timetable: {
    html: '<table class="timetable-table"><tr class="timetable-header"><th class="weekdays">Dies</th><th class="hours">Hores</th><th class="prices">Preus</th><th class="description">Observacions</th></tr><tr><td class="timetable-day" rowspan=1><div>Divendres</div></td><td class="timetable-hour" rowspan=1><div>a les 21.00&nbsp;h</div></td><td class="timetable-price" rowspan=1><div>Entrada Gratuïta</div></td><td class="timetable-description" rowspan=1><div><p style="margin:0">Amb reserva prèvia.</p><p style="margin:0">Places limitades.</p></div></td></tr></table>',
  },
  tickets_data: [
    {
      name: 'Lliure',
    },
    {
      name: 'Reservada',
    },
  ],
  values: [
    {
      attribute_name: 'Web inscripcions',
      url_value: 'https://cursoslasedeta.inscripcionscc.com',
    },
    {
      attribute_name: 'Web',
      url_value: 'https://ajuntament.barcelona.cat/ccivics/lasedeta',
    },
  ],
};

export const cycle: BcnRawEvent = {
  register_id: 99400743819,
  name: "Barcelona Districte Cultural - Cicle 'Escena': Dates",
  body: '<p>El 8 d\'octubre arrencarà el circuit amb un concert de <a href="https://www.barcelona.cat/districtecultural/ca/agenda/un-un" target="_blank" style="color: rgb(51, 122, 183);"><strong>Marta Garrett</strong></a> i l\'espectacle de circ <a href="https://www.barcelona.cat/districtecultural/ca/agenda/ba',
  start_date: '2026-10-08T12:00:00+02:00',
  end_date: '2026-12-19T12:00:00+01:00',
  classifications_data: [
    {
      name: 'Concerts',
      full_path: 'Tipologia AG >> Concerts',
    },
    {
      name: 'Espectacles',
      full_path: 'Tipologia AG >> Espectacles',
    },
    {
      name: 'Circ',
      full_path: 'Especialitats AG >> Cultura i arts >> Circ',
    },
    {
      name: 'Teatre',
      full_path: 'Especialitats AG >> Cultura i arts >> Teatre',
    },
    {
      name: 'Titelles',
      full_path: 'Especialitats AG >> Cultura i arts >> Titelles',
    },
    {
      name: 'Dansa',
      full_path: 'Especialitats AG >> Dansa, ballet i balls de saló >> Dansa',
    },
    {
      name: 'Musicals',
      full_path: 'Especialitats AG >> Música >> Musicals',
    },
    {
      name: 'Barcelona Districte Cultural',
      full_path: "Marcs i cicles AG >> Cicles d'arts escèniques >> Barcelona Districte Cultural",
    },
    {
      name: 'Activitats per a infants i per a famílies',
      full_path:
        'Col·lectius AG >> Activitats infantils (desglossar) >> Activitats per a infants i per a famílies',
    },
    {
      name: 'Activitats per al públic en general',
      full_path: 'Col·lectius AG >> Activitats per al públic en general',
    },
  ],
  addresses: [
    {
      place: 'Xarxa de Centres Cívics de Barcelona',
      address_name: null,
      start_street_number: null,
      zip_code: null,
      town: 'Barcelona',
      location_4326: null,
    },
  ],
  image_data: {
    image:
      'https://estatics-nasia.dtibcn.cat/nasia-pro/media/Escena-BcnCultura-2025-760x428.ac4cfc85b.png',
  },
  timetable: {
    html: '<table class="timetable-table"><tr class="timetable-header"><th class="weekdays">Dies</th><th class="hours">Hores</th><th class="prices">Preus</th><th class="description">Observacions</th></tr><tr><td class="timetable-day" rowspan=1><div><p style="margin:0">Consulteu programació</p></div></td><td class="timetable-hour" rowspan=1><div><p style="margin:0">Consulteu programació</p></div></td><td class="timetable-price" rowspan=1><div>Entrada Gratuïta</div></td><td class="timetable-description" rowspan=1><div><p style="margin:0">Cal inscripció prèvia</p></div></td></tr></table>',
  },
  tickets_data: [
    {
      name: 'Lliure',
    },
  ],
  values: [
    {
      attribute_name: 'Web',
      url_value: 'https://www.barcelona.cat/districtecultural/ca/escena',
    },
  ],
};

export const notConcert: BcnRawEvent = {
  register_id: 99400776339,
  name: 'Concert "Del Capricho español a la Glosa de l\'Emigrant"',
  body: "<p>A càrrec d'Albert Ferrer, musicògraf.</p>",
  start_date: '2026-11-19T12:00:00+01:00',
  end_date: '2026-11-19T12:00:00+01:00',
  classifications_data: [
    {
      name: 'Col·loquis, xerrades',
      full_path: 'Tipologia AG >> Col·loquis, xerrades',
    },
    {
      name: 'Conferències',
      full_path: 'Tipologia AG >> Conferències',
    },
    {
      name: 'Música clàssica',
      full_path: 'Especialitats AG >> Música >> Música clàssica',
    },
    {
      name: 'Cicles temàtics',
      full_path:
        "Marcs i cicles AG >> Altres marcs i cicles >> Activitats de les biblioteques de Barcelona >> Activitats del Consorci de Biblioteques de Barcelona >> L'aventura de conèixer >> Cicles temàtics",
    },
    {
      name: 'Els viatges de la paraula',
      full_path:
        "Marcs i cicles AG >> Altres marcs i cicles >> Activitats de les biblioteques de Barcelona >> Activitats del Consorci de Biblioteques de Barcelona >> L'aventura de llegir >> Els viatges de la paraula",
    },
    {
      name: 'Activitats per al públic en general',
      full_path: 'Col·lectius AG >> Activitats per al públic en general',
    },
  ],
  addresses: [
    {
      place: 'Biblioteca Nou Barris - Aurora Díaz Plaja',
      address_name: 'Plaça Major de Nou Barris',
      start_street_number: 2,
      zip_code: '080',
      town: 'Barcelona',
      location_4326: {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'Point',
            coordinates: [41.436844552510806, 2.1712296246319656],
          },
        ],
      },
    },
  ],
  image_data: null,
  timetable: {
    html: '<table class="timetable-table"><tr class="timetable-header"><th class="weekdays">Dies</th><th class="hours">Hores</th><th class="prices">Preus</th><th class="description">Observacions</th></tr><tr><td class="timetable-day" rowspan=1><div>Dijous</div></td><td class="timetable-hour" rowspan=1><div>a les 18.30&nbsp;h</div></td><td class="timetable-price" rowspan=1><div>Entrada Gratuïta</div></td><td class="timetable-description" rowspan=1><div><p style="margin:0">Aforament limitat</p></div></td></tr></table>',
  },
  tickets_data: [
    {
      name: 'Lliure',
    },
  ],
  values: [
    {
      attribute_name: 'Web',
      url_value: 'https://ajuntament.barcelona.cat/biblioteques/ca/bibnoubarris',
    },
  ],
};
