import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@/components/AuthProvider'
import { AirplaneCursor } from '@/components/landing/AirplaneCursor'

function App() {
  return (
    <AuthProvider>
      <AirplaneCursor />
      <Outlet />
    </AuthProvider>
  )
}

export default App
