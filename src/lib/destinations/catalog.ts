/**
 * Curated destinations Voyagent can suggest when the traveller leaves the
 * country and/or state blank. Each entry is a state, province or region,
 * tagged with the vibes it suits and the months it is usually at its best.
 *
 * This list is the candidate set for destination suggestions: the model may
 * only pick from it, the same way it may only pick stops from Places results.
 */
export type CatalogVibe = "beach" | "mountains";

export interface CatalogDestination {
  /** Stable slug, e.g. "in-goa". */
  id: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  countryName: string;
  state: string;
  vibes: CatalogVibe[];
  /** Months (1-12) that are usually the best time to go. */
  bestMonths: number[];
  highlights: string;
}

const ALL_YEAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const DESTINATION_CATALOG: readonly CatalogDestination[] = [
  // India
  { id: "in-goa", country: "IN", countryName: "India", state: "Goa", vibes: ["beach"], bestMonths: [11, 12, 1, 2, 3], highlights: "Beach shacks, night markets and parties in the north, quiet coves in the south" },
  { id: "in-himachal-pradesh", country: "IN", countryName: "India", state: "Himachal Pradesh", vibes: ["mountains"], bestMonths: [3, 4, 5, 6, 9, 10], highlights: "Treks around Manali, Kasol and Spiti, Himalayan villages and cafes" },
  { id: "in-uttarakhand", country: "IN", countryName: "India", state: "Uttarakhand", vibes: ["mountains"], bestMonths: [3, 4, 5, 9, 10, 11], highlights: "Valley of Flowers, Kedarkantha and Rishikesh" },
  { id: "in-kerala", country: "IN", countryName: "India", state: "Kerala", vibes: ["beach", "mountains"], bestMonths: [10, 11, 12, 1, 2, 3], highlights: "Varkala cliffs and beaches, Munnar tea hills, backwaters" },
  { id: "in-andaman-nicobar", country: "IN", countryName: "India", state: "Andaman and Nicobar Islands", vibes: ["beach"], bestMonths: [11, 12, 1, 2, 3, 4], highlights: "Havelock beaches, diving and snorkelling" },
  { id: "in-sikkim", country: "IN", countryName: "India", state: "Sikkim", vibes: ["mountains"], bestMonths: [3, 4, 5, 10, 11], highlights: "Goecha La trek, monasteries and Kanchenjunga views" },
  // Thailand
  { id: "th-phuket", country: "TH", countryName: "Thailand", state: "Phuket", vibes: ["beach"], bestMonths: [11, 12, 1, 2, 3, 4], highlights: "Patong nightlife, island hopping and calm southern beaches" },
  { id: "th-surat-thani", country: "TH", countryName: "Thailand", state: "Surat Thani (Koh Phangan, Koh Samui)", vibes: ["beach"], bestMonths: [1, 2, 3, 4, 5, 6, 7, 8], highlights: "Full Moon Party, beach bars and jungle waterfalls" },
  { id: "th-chiang-mai", country: "TH", countryName: "Thailand", state: "Chiang Mai", vibes: ["mountains"], bestMonths: [11, 12, 1, 2], highlights: "Doi Inthanon and jungle treks, hill villages, night bazaars" },
  // Indonesia
  { id: "id-bali", country: "ID", countryName: "Indonesia", state: "Bali", vibes: ["beach", "mountains"], bestMonths: [4, 5, 6, 7, 8, 9, 10], highlights: "Canggu and Uluwatu beach clubs, Mount Batur sunrise trek" },
  { id: "id-west-nusa-tenggara", country: "ID", countryName: "Indonesia", state: "West Nusa Tenggara (Lombok, Gili Islands)", vibes: ["beach", "mountains"], bestMonths: [5, 6, 7, 8, 9], highlights: "Gili island parties and Mount Rinjani trek" },
  // Nepal
  { id: "np-gandaki", country: "NP", countryName: "Nepal", state: "Gandaki (Pokhara, Annapurna)", vibes: ["mountains"], bestMonths: [3, 4, 5, 10, 11], highlights: "Annapurna Circuit and Poon Hill treks from lakeside Pokhara" },
  { id: "np-koshi", country: "NP", countryName: "Nepal", state: "Koshi (Everest region)", vibes: ["mountains"], bestMonths: [3, 4, 5, 10, 11], highlights: "Everest Base Camp and Gokyo Lakes treks" },
  // Spain
  { id: "es-balearic-islands", country: "ES", countryName: "Spain", state: "Balearic Islands (Ibiza, Mallorca)", vibes: ["beach", "mountains"], bestMonths: [5, 6, 7, 8, 9], highlights: "Ibiza clubs and coves, Mallorca's Serra de Tramuntana hikes" },
  { id: "es-andalusia", country: "ES", countryName: "Spain", state: "Andalusia", vibes: ["beach", "mountains"], bestMonths: [4, 5, 6, 9, 10], highlights: "Costa del Sol beaches and Sierra Nevada trails" },
  // Greece
  { id: "gr-south-aegean", country: "GR", countryName: "Greece", state: "South Aegean (Mykonos, Ios, Santorini)", vibes: ["beach"], bestMonths: [5, 6, 7, 8, 9], highlights: "Island beach clubs, sunsets and ferry hopping" },
  { id: "gr-crete", country: "GR", countryName: "Greece", state: "Crete", vibes: ["beach", "mountains"], bestMonths: [5, 6, 9, 10], highlights: "Samaria Gorge hike and pink-sand beaches" },
  // Italy
  { id: "it-trentino-alto-adige", country: "IT", countryName: "Italy", state: "Trentino-Alto Adige (Dolomites)", vibes: ["mountains"], bestMonths: [6, 7, 8, 9], highlights: "Dolomites hut-to-hut treks and Tre Cime" },
  { id: "it-sardinia", country: "IT", countryName: "Italy", state: "Sardinia", vibes: ["beach", "mountains"], bestMonths: [5, 6, 7, 8, 9], highlights: "Costa Smeralda beach clubs and Supramonte gorge hikes" },
  // Portugal
  { id: "pt-algarve", country: "PT", countryName: "Portugal", state: "Algarve", vibes: ["beach"], bestMonths: [5, 6, 7, 8, 9, 10], highlights: "Cliff-backed beaches, Lagos nightlife and coastal walks" },
  { id: "pt-madeira", country: "PT", countryName: "Portugal", state: "Madeira", vibes: ["beach", "mountains"], bestMonths: ALL_YEAR, highlights: "Levada walks, Pico Ruivo summit and sea pools" },
  // Croatia
  { id: "hr-split-dalmatia", country: "HR", countryName: "Croatia", state: "Split-Dalmatia", vibes: ["beach"], bestMonths: [6, 7, 8, 9], highlights: "Hvar parties, island sailing and Old Town Split" },
  // Switzerland
  { id: "ch-valais", country: "CH", countryName: "Switzerland", state: "Valais", vibes: ["mountains"], bestMonths: [6, 7, 8, 9], highlights: "Zermatt and the Matterhorn, Tour du Mont Blanc stages" },
  // United States
  { id: "us-hawaii", country: "US", countryName: "United States", state: "Hawaii", vibes: ["beach", "mountains"], bestMonths: [4, 5, 6, 9, 10], highlights: "Waikiki and Maui beaches, Haleakala and Kalalau trails" },
  { id: "us-florida", country: "US", countryName: "United States", state: "Florida", vibes: ["beach"], bestMonths: [3, 4, 5, 11, 12], highlights: "Miami Beach nightlife and the Keys" },
  { id: "us-colorado", country: "US", countryName: "United States", state: "Colorado", vibes: ["mountains"], bestMonths: [6, 7, 8, 9], highlights: "Fourteeners, Rocky Mountain National Park and mountain towns" },
  { id: "us-california", country: "US", countryName: "United States", state: "California", vibes: ["beach", "mountains"], bestMonths: [5, 6, 7, 8, 9, 10], highlights: "Southern California beaches and Yosemite trails" },
  // Mexico
  { id: "mx-quintana-roo", country: "MX", countryName: "Mexico", state: "Quintana Roo", vibes: ["beach"], bestMonths: [12, 1, 2, 3, 4], highlights: "Tulum and Playa del Carmen beach clubs, cenotes" },
  // Peru
  { id: "pe-cusco", country: "PE", countryName: "Peru", state: "Cusco", vibes: ["mountains"], bestMonths: [5, 6, 7, 8, 9], highlights: "Inca Trail to Machu Picchu, Rainbow Mountain" },
  // Philippines
  { id: "ph-palawan", country: "PH", countryName: "Philippines", state: "Palawan", vibes: ["beach"], bestMonths: [12, 1, 2, 3, 4, 5], highlights: "El Nido lagoons and island-hopping parties" },
  // Vietnam
  { id: "vn-lao-cai", country: "VN", countryName: "Vietnam", state: "Lao Cai (Sapa)", vibes: ["mountains"], bestMonths: [3, 4, 5, 9, 10, 11], highlights: "Rice-terrace treks and Fansipan" },
  // Sri Lanka
  { id: "lk-southern", country: "LK", countryName: "Sri Lanka", state: "Southern Province", vibes: ["beach"], bestMonths: [12, 1, 2, 3, 4], highlights: "Mirissa and Unawatuna beaches, surf towns" },
  { id: "lk-central", country: "LK", countryName: "Sri Lanka", state: "Central Province", vibes: ["mountains"], bestMonths: [1, 2, 3, 4], highlights: "Ella hikes, Adam's Peak and tea country" },
  // Tanzania
  { id: "tz-zanzibar", country: "TZ", countryName: "Tanzania", state: "Zanzibar", vibes: ["beach"], bestMonths: [6, 7, 8, 9, 10, 12, 1, 2], highlights: "Nungwi beach parties and Stone Town" },
  { id: "tz-kilimanjaro", country: "TZ", countryName: "Tanzania", state: "Kilimanjaro", vibes: ["mountains"], bestMonths: [1, 2, 6, 7, 8, 9, 10], highlights: "Kilimanjaro summit routes" },
  // Australia
  { id: "au-queensland", country: "AU", countryName: "Australia", state: "Queensland", vibes: ["beach", "mountains"], bestMonths: [5, 6, 7, 8, 9, 10], highlights: "Gold Coast and Whitsundays, rainforest hikes" },
  // New Zealand
  { id: "nz-otago", country: "NZ", countryName: "New Zealand", state: "Otago", vibes: ["mountains"], bestMonths: [12, 1, 2, 3], highlights: "Queenstown adventure, Routeburn Track" },
  // Brazil
  { id: "br-rio-de-janeiro", country: "BR", countryName: "Brazil", state: "Rio de Janeiro", vibes: ["beach", "mountains"], bestMonths: [4, 5, 6, 7, 8, 9, 10], highlights: "Copacabana and Ipanema nightlife, Pedra da Gávea and Tijuca hikes" },
];

export function findCatalogEntry(id: string): CatalogDestination | undefined {
  return DESTINATION_CATALOG.find((d) => d.id === id);
}
