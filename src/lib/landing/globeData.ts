// Route/marker data for the interactive network globe (src/components/landing/NetworkGlobe.tsx).
// Real country boundaries live in src/data/worldCountries.ts instead. Coordinates
// here are [lat, lng] pairs. DEST are the destination markers, ORIGIN is the India hub.

export interface GlobeDestination {
  id: string
  name: string
  country: string
  region: string
  lat: number
  lng: number
  category: string
}

export const ORIGIN: { name: string; lat: number; lng: number } = { name:"India Hub", lat:22.3, lng:72.6 }

export const DEST: GlobeDestination[] = [
    {id:"dubai",       name:"Dubai",        country:"UAE",          region:"Middle East",   lat:25.20, lng:55.27,  category:"Express"},
    {id:"london",      name:"London",       country:"UK",           region:"Europe",        lat:51.51, lng:-0.13,  category:"Express"},
    {id:"newyork",     name:"New York",     country:"USA",          region:"North America", lat:40.71, lng:-74.01, category:"Express"},
    {id:"losangeles",  name:"Los Angeles",  country:"USA",          region:"North America", lat:34.05, lng:-118.24,category:"International"},
    {id:"toronto",     name:"Toronto",      country:"Canada",       region:"North America", lat:43.65, lng:-79.38, category:"International"},
    {id:"singapore",   name:"Singapore",    country:"Singapore",    region:"Asia Pacific",  lat:1.35,  lng:103.82, category:"Express"},
    {id:"hongkong",    name:"Hong Kong",    country:"Hong Kong",    region:"Asia Pacific",  lat:22.32, lng:114.17, category:"Express"},
    {id:"tokyo",       name:"Tokyo",        country:"Japan",        region:"Asia Pacific",  lat:35.68, lng:139.69, category:"International"},
    {id:"sydney",      name:"Sydney",       country:"Australia",    region:"Asia Pacific",  lat:-33.87,lng:151.21, category:"International"},
    {id:"johannesburg",name:"Johannesburg", country:"South Africa", region:"Africa",        lat:-26.20,lng:28.05,  category:"International"},
    {id:"saopaulo",    name:"São Paulo", country:"Brazil",     region:"South America",  lat:-23.55,lng:-46.63, category:"International"}
  ]

export const SERVICES: Record<string, string> = { Express:"Air · Priority", International:"Air · Sea", Import:"Import handling", Export:"Export handling" }
