import raw from './worldCountries.json'

// Generated from Natural Earth's 110m country boundaries (via the world-atlas +
// topojson-client npm packages, converted once offline — see git history for the
// generation script). Coordinates are GeoJSON order: [longitude, latitude].
export interface WorldCountry {
  name: string
  type: 'Polygon' | 'MultiPolygon'
  /** Polygon: rings[][lng,lat]. MultiPolygon: polygons[rings][lng,lat]. */
  coordinates: number[][][] | number[][][][]
}

export const WORLD_COUNTRIES = raw as WorldCountry[]

/** Case-insensitive lookup so callers don't need to match Natural Earth's exact naming. */
export function findCountry(name: string): WorldCountry | undefined {
  const needle = name.trim().toLowerCase()
  return WORLD_COUNTRIES.find((c) => c.name.toLowerCase() === needle)
}

/** Every polygon ring for a country, regardless of Polygon vs MultiPolygon. */
export function countryRings(country: WorldCountry): number[][][] {
  return country.type === 'Polygon'
    ? (country.coordinates as number[][][])
    : (country.coordinates as number[][][][]).flat()
}
