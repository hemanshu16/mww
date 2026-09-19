import { Outlet } from 'react-router-dom'
import { AirplaneCursor } from '@/components/landing/AirplaneCursor'

function App() {
  return (
    <>
      <AirplaneCursor />
      <Outlet />
    </>
  )
}

export default App
