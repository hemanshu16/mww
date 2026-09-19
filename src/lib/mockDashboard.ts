// Mock data for dashboard widgets that have no backend endpoint yet
// (trends vs last month, sparklines, shipments-over-time chart).
// TODO: replace with real analytics endpoints when available.

export const MOCK_TREND = {
  draft: { value: '4.2%', direction: 'up' as const },
  booked: { value: '12.4%', direction: 'up' as const },
  cancelled: { value: '1.1%', direction: 'down' as const },
}

export const MOCK_SPARK = {
  draft: [6, 8, 7, 9, 8, 11, 10, 12],
  booked: [10, 12, 11, 14, 16, 15, 19, 22],
  cancelled: [3, 2, 3, 2, 1, 2, 1, 1],
}

export interface ChartPoint {
  label: string
  value: number
}

export const MOCK_SHIPMENTS_SERIES: ChartPoint[] = [
  { label: 'Jan', value: 42 },
  { label: 'Feb', value: 58 },
  { label: 'Mar', value: 51 },
  { label: 'Apr', value: 67 },
  { label: 'May', value: 74 },
  { label: 'Jun', value: 69 },
  { label: 'Jul', value: 88 },
  { label: 'Aug', value: 95 },
  { label: 'Sep', value: 112 },
]
