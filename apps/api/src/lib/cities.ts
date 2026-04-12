/**
 * Static list of global capital cities and major financial hubs.
 * Merged into location autocomplete results alongside DB-stored locations.
 */
export const GLOBAL_CITIES: string[] = [
  // ── Turkey ──────────────────────────────────────────────────────────────
  "Istanbul, Turkey",
  "Ankara, Turkey",
  "Izmir, Turkey",
  "Bursa, Turkey",
  "Antalya, Turkey",
  "Adana, Turkey",
  "Gaziantep, Turkey",

  // ── Gulf & Middle East ───────────────────────────────────────────────────
  "Dubai, UAE",
  "Abu Dhabi, UAE",
  "Sharjah, UAE",
  "Riyadh, Saudi Arabia",
  "Jeddah, Saudi Arabia",
  "Doha, Qatar",
  "Kuwait City, Kuwait",
  "Manama, Bahrain",
  "Muscat, Oman",
  "Amman, Jordan",
  "Beirut, Lebanon",
  "Baghdad, Iraq",
  "Tehran, Iran",
  "Sana'a, Yemen",
  "Cairo, Egypt",
  "Alexandria, Egypt",
  "Damascus, Syria",

  // ── Europe — Financial Hubs & Capitals ───────────────────────────────────
  "London, United Kingdom",
  "Paris, France",
  "Berlin, Germany",
  "Frankfurt, Germany",
  "Munich, Germany",
  "Hamburg, Germany",
  "Amsterdam, Netherlands",
  "Zurich, Switzerland",
  "Geneva, Switzerland",
  "Bern, Switzerland",
  "Madrid, Spain",
  "Barcelona, Spain",
  "Milan, Italy",
  "Rome, Italy",
  "Vienna, Austria",
  "Brussels, Belgium",
  "Stockholm, Sweden",
  "Copenhagen, Denmark",
  "Oslo, Norway",
  "Helsinki, Finland",
  "Dublin, Ireland",
  "Lisbon, Portugal",
  "Athens, Greece",
  "Warsaw, Poland",
  "Budapest, Hungary",
  "Prague, Czech Republic",
  "Bucharest, Romania",
  "Sofia, Bulgaria",
  "Zagreb, Croatia",
  "Ljubljana, Slovenia",
  "Bratislava, Slovakia",
  "Tallinn, Estonia",
  "Riga, Latvia",
  "Vilnius, Lithuania",
  "Luxembourg City, Luxembourg",
  "Valletta, Malta",
  "Nicosia, Cyprus",
  "Reykjavik, Iceland",
  "Monaco, Monaco",
  "Kyiv, Ukraine",
  "Moscow, Russia",
  "St. Petersburg, Russia",
  "Istanbul, Turkey", // already above; deduped at runtime

  // ── Asia Pacific ─────────────────────────────────────────────────────────
  "Singapore, Singapore",
  "Hong Kong, Hong Kong",
  "Tokyo, Japan",
  "Osaka, Japan",
  "Seoul, South Korea",
  "Busan, South Korea",
  "Shanghai, China",
  "Beijing, China",
  "Shenzhen, China",
  "Guangzhou, China",
  "Hangzhou, China",
  "Mumbai, India",
  "Bangalore, India",
  "Delhi, India",
  "Hyderabad, India",
  "Chennai, India",
  "Pune, India",
  "Jakarta, Indonesia",
  "Kuala Lumpur, Malaysia",
  "Bangkok, Thailand",
  "Manila, Philippines",
  "Ho Chi Minh City, Vietnam",
  "Hanoi, Vietnam",
  "Colombo, Sri Lanka",
  "Dhaka, Bangladesh",
  "Islamabad, Pakistan",
  "Karachi, Pakistan",
  "Lahore, Pakistan",
  "Kathmandu, Nepal",
  "Yangon, Myanmar",
  "Phnom Penh, Cambodia",
  "Vientiane, Laos",
  "Ulaanbaatar, Mongolia",
  "Tashkent, Uzbekistan",
  "Almaty, Kazakhstan",
  "Astana, Kazakhstan",
  "Tbilisi, Georgia",
  "Yerevan, Armenia",
  "Baku, Azerbaijan",

  // ── Oceania ───────────────────────────────────────────────────────────────
  "Sydney, Australia",
  "Melbourne, Australia",
  "Brisbane, Australia",
  "Perth, Australia",
  "Auckland, New Zealand",
  "Wellington, New Zealand",

  // ── North America ─────────────────────────────────────────────────────────
  "New York, USA",
  "San Francisco, USA",
  "Los Angeles, USA",
  "Chicago, USA",
  "Boston, USA",
  "Seattle, USA",
  "Miami, USA",
  "Austin, USA",
  "Washington DC, USA",
  "Toronto, Canada",
  "Vancouver, Canada",
  "Montreal, Canada",
  "Calgary, Canada",
  "Ottawa, Canada",
  "Mexico City, Mexico",
  "Monterrey, Mexico",

  // ── Latin America ─────────────────────────────────────────────────────────
  "São Paulo, Brazil",
  "Rio de Janeiro, Brazil",
  "Brasília, Brazil",
  "Buenos Aires, Argentina",
  "Santiago, Chile",
  "Bogotá, Colombia",
  "Lima, Peru",
  "Caracas, Venezuela",
  "Quito, Ecuador",
  "La Paz, Bolivia",
  "Montevideo, Uruguay",
  "Asunción, Paraguay",
  "Panama City, Panama",
  "San José, Costa Rica",
  "Guatemala City, Guatemala",
  "Tegucigalpa, Honduras",
  "Managua, Nicaragua",
  "San Salvador, El Salvador",

  // ── Africa ───────────────────────────────────────────────────────────────
  "Nairobi, Kenya",
  "Lagos, Nigeria",
  "Abuja, Nigeria",
  "Johannesburg, South Africa",
  "Cape Town, South Africa",
  "Durban, South Africa",
  "Casablanca, Morocco",
  "Rabat, Morocco",
  "Tunis, Tunisia",
  "Algiers, Algeria",
  "Tripoli, Libya",
  "Addis Ababa, Ethiopia",
  "Accra, Ghana",
  "Dakar, Senegal",
  "Kinshasa, DR Congo",
  "Luanda, Angola",
  "Dar es Salaam, Tanzania",
  "Kampala, Uganda",
  "Khartoum, Sudan",
  "Maputo, Mozambique",
];

/** Deduplicated, sorted alphabetically. */
export const SORTED_GLOBAL_CITIES: string[] = [
  ...new Set(GLOBAL_CITIES),
].sort((a, b) => a.localeCompare(b));

/**
 * Merges DB locations with the global static list, deduplicates (case-insensitive),
 * filters by optional query string, and returns up to `limit` results.
 */
export function mergeWithGlobalCities(
  dbLocations: string[],
  q?: string,
  limit = 20,
): string[] {
  const lower = (s: string) => s.toLowerCase();
  const filter = q ? lower(q.trim()) : "";

  const combined = [...new Set([...dbLocations, ...SORTED_GLOBAL_CITIES])];
  const filtered = filter
    ? combined.filter((c) => lower(c).includes(filter))
    : combined;

  return filtered.slice(0, limit);
}
