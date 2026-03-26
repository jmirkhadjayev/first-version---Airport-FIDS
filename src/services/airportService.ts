export interface Flight {
  flight_number: string;
  airline_name: string;
  airline_code: string;
  destination_city: string;
  scheduled_time: string;
  estimated_time: string;
  status: string;
  terminal?: string;
  stand?: string;
  cargo_weight?: number;
  mail_weight?: number;
  cargo_details?: string;
  aircraft_type?: string;
  tail_number?: string;
  actual_time?: string;
  utc_time?: string;
  destination_code?: string;
  delay_comment?: string;
  plan_opposite?: string;
  fact_opposite?: string;
  fact?: string;
  date: string;
}

export type FlightType = 'DEPARTURE' | 'ARRIVAL';

const API_BASE_URL = 'https://bot.uzairports.com/api/awery/v2';
const KEY_TOKEN = 'lDLh3Wdawi7SLNtUn4iMA4QZn5SopdIZ';

const AIRLINE_MAPPING: Record<string, string> = {
  'HY': 'Uzbekistan Airways',
  'UH': 'Uzbekistan Airways',
  'C6': 'Centrum Air',
  'HH': 'Qanot Sharq',
  'SU': 'Aeroflot',
  'KC': 'Air Astana',
  'TK': 'Turkish Airlines',
  'FZ': 'FlyDubai',
  'QR': 'Qatar Airways',
  'EY': 'Etihad Airways',
  'EK': 'Emirates',
  'S7': 'S7 Airlines',
  'U6': 'Ural Airlines',
  'UT': 'Utair',
  'DP': 'Pobeda',
  'J9': 'Jazeera Airways',
  'G9': 'Air Arabia',
  'XY': 'Flynas',
  'OD': 'Batik Air',
  'CZ': 'China Southern',
  'CA': 'Air China',
  'MU': 'China Eastern',
  'LO': 'LOT Polish Airlines',
  'FV': 'Rossiya Airlines',
  'J2': 'Azerbaijan Airlines',
  'KC ': 'Air Astana',
};

// Map internal codes to IATA for logos if needed
const LOGO_CODE_MAPPING: Record<string, string> = {
  'UH': 'HY', // Uzbekistan Airways
  'C6': 'C6', // Centrum Air (might not be in all databases)
  'HH': 'HH', // Qanot Sharq
};

const STATUS_MAPPING: Record<string, string> = {
  'SCH': 'Scheduled',
  'OFB': 'Departed',
  'CAN': 'Cancelled',
  'DELAYED': 'Delayed',
  'ARR': 'Arrived',
  'LND': 'Landed',
  'BOR': 'Boarding',
  'CKI': 'Check-in',
  'ONB': 'ARRIVAL',
};

const CITY_MAPPING: Record<string, string> = {
  'SSH': 'Sharm El Sheikh',
  'OQN': 'Zarafshan',
  'FRU': 'Bishkek',
  'TBS': 'Tbilisi',
  'NVI': 'Navoi',
  'TMJ': 'Termez',
  'BHK': 'Bukhara',
  'PAR': 'Paris',
  'ALA': 'Almaty',
  'MOW': 'Moscow',
  'UGC': 'Urgench',
  'LON': 'London',
  'DXB': 'Dubai',
  'RBZ': 'Muynak',
  'SIA': 'Xi\'an',
  'JED': 'Jeddah',
  'BAK': 'Baku',
  'TLV': 'Tel Aviv',
  'OVB': 'Novosibirsk',
  'TZX': 'Trabzon',
  'NMA': 'Namangan',
  'IST': 'Istanbul',
  'SZX': 'Shenzhen',
  'CGO': 'Zhengzhou',
  'URC': 'Urumqi',
  'CAN': 'Guangzhou',
  'ROM': 'Rome',
  'KZN': 'Kazan',
  'GOJ': 'Nizhny Novgorod',
  'SKD': 'Samarkand',
  'LED': 'Saint Petersburg',
  'SGC': 'Surgut',
  'NCU': 'Nukus',
  'SVX': 'Yekaterinburg',
  'MED': 'Medina',
  'URA': 'Uralsk',
  'HKG': 'Hong Kong',
  'NQZ': 'Astana',
  'SEL': 'Seoul',
  'BJS': 'Beijing',
  'VCA': 'Can Tho',
  'HKT': 'Phuket',
  'KJA': 'Krasnoyarsk',
  'NJC': 'Nizhnevartovsk',
  'KWI': 'Kuwait',
  'MSQ': 'Minsk',
  'EVN': 'Yerevan',
  'ESB': 'Ankara',
  'DAC': 'Dhaka',
  'KSQ': 'Karshi',
  'KRR': 'Krasnodar',
  'DYU': 'Dushanbe',
  'AZN': 'Andizhan',
  'DEL': 'Delhi',
  'LHE': 'Lahore',
  'RIX': 'Riga',
  'VVO': 'Vladivostok',
  'DWC': 'Dubai (DWC)',
  'IYO': 'SRS',
  'BKK': 'Bangkok',
  'THR': 'Tehran',
  'TFU': 'Chengdu',
  'FEG': 'Fergana',
  'MRV': 'Mineralnye Vody',
  'KUL': 'Kuala Lumpur',
  'ZIA': 'Zhukovsky',
  'WAW': 'Warsaw',
  'AER': 'Sochi',
  'OMN': 'Oman',
};

export async function fetchFlights(type: FlightType = 'DEPARTURE'): Promise<Flight[]> {
  const url = `${API_BASE_URL}?key_token=${KEY_TOKEN}&airport_code=TAS&flight_type=${type}&is_paxservice=0&is_local=0`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const rawFlights = data.flights || [];

    return rawFlights.map((f: any) => {
      const airlineCode = f.aircompany?.trim();
      const cityCode = f.city_code || f.airport;
      
      // Calculate UTC time (Tashkent is UTC+5)
      let utcTime = '--:--';
      if (f.sched) {
        try {
          const date = new Date(f.sched);
          const utcDate = new Date(date.getTime() - (5 * 60 * 60 * 1000));
          utcTime = utcDate.toISOString().split('T')[1].substring(0, 5);
        } catch (e) {
          console.error('Error parsing date:', e);
        }
      }

      return {
        flight_number: `${airlineCode} ${f.flightnumber}`,
        airline_name: AIRLINE_MAPPING[airlineCode] || airlineCode,
        airline_code: LOGO_CODE_MAPPING[airlineCode] || airlineCode,
        destination_city: CITY_MAPPING[cityCode] || cityCode,
        destination_code: cityCode,
        scheduled_time: f.sched ? f.sched.split('T')[1].substring(0, 5) : '--:--',
        estimated_time: f.estimated ? f.estimated.split('T')[1].substring(0, 5) : 
                        (f.plan ? f.plan.split('T')[1].substring(0, 5) : ''),
        actual_time: f.actual ? f.actual.split('T')[1].substring(0, 5) : '',
        utc_time: utcTime,
        status: STATUS_MAPPING[f.flight_status] || f.flight_status || 'Scheduled',
        terminal: f.terminal,
        stand: f.stand,
        cargo_weight: f.cargo_weight,
        mail_weight: f.mail_weight,
        cargo_details: f.cargo_weight ? `${f.cargo_weight} kg Cargo ${f.mail_weight ? `+ ${f.mail_weight} kg Mail` : ''}` : 'No cargo data',
        aircraft_type: f.aircraft_type || f.aircraft,
        tail_number: f.tail_number || f.registration,
        delay_comment: f.delay_comment || '',
        plan_opposite: f.plan_opposite ? f.plan_opposite.split('T')[1].substring(0, 5) : '',
        fact_opposite: f.fact_opposite ? f.fact_opposite.split('T')[1].substring(0, 5) : '',
        fact: f.fact ? f.fact.split('T')[1].substring(0, 5) : '',
        date: f.sched ? f.sched.split('T')[0] : '',
      };
    });
  } catch (error) {
    console.error('Error fetching flights:', error);
    return [];
  }
}
