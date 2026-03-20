import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LogOut, User, Building2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { clearToken } from '@/lib/api'

// Decode the JWT payload without a library (it's just base64)
function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    const decoded = decodeToken(token)
    // Check expiry
    if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
      clearToken()
      toast.error('Session expired', { description: 'Please log in again.' })
      navigate('/login')
      return
    }
    // Pull any user info stored after login (optional — stored alongside token)
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [navigate])

  const handleLogout = () => {
    clearToken()
    localStorage.removeItem('user')
    toast.success('Signed out successfully')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
            <p className="text-sm text-zinc-500">You're signed in</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>

        {/* Welcome card */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              {user?.name ? `Welcome, ${user.name}` : 'Welcome!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user?.email && (
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                {user.email}
              </div>
            )}
            {user?.organization && (
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                {user.organization}
              </div>
            )}
            <p className="text-sm text-zinc-500 pt-1">
              Authentication is fully working. Registration, OTP verification,
              password login and OTP login all connected to your Express backend.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
