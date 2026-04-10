import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  LogOut,
  User,
  Building2,
  Camera,
  Upload,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  clearToken,
  getErrorMessage,
  saveUser,
  updateProfile,
} from '@/lib/api'

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
  const [name, setName] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const decoded = decodeToken(token)

    if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
      clearToken()
      localStorage.removeItem('user')
      toast.error('Session expired', { description: 'Please log in again.' })
      navigate('/login')
      return
    }

    const stored = localStorage.getItem('user')
    if (stored) {
      const parsedUser = JSON.parse(stored)
      setUser(parsedUser)
      setName(parsedUser?.name || '')
      setAvatarPreview(parsedUser?.avatar || '')
    }
  }, [navigate])

  const initials = useMemo(() => {
    const source = user?.name || user?.email || 'U'
    return source
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [user])

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()

    if (!name.trim() && !avatarFile) {
      toast.info('Nothing to update')
      return
    }

    try {
      setSaving(true)

      const formData = new FormData()
      if (name.trim()) formData.append('name', name.trim())
      if (avatarFile) formData.append('avatar', avatarFile)

      const res = await updateProfile(formData)
      const updated = res.data?.data

      const nextUser = {
        ...user,
        name: updated?.name ?? user?.name ?? '',
        avatar: updated?.avatar ?? user?.avatar ?? '',
        email: updated?.email ?? user?.email ?? '',
        organization: updated?.organization ?? user?.organization ?? '',
      }

      setUser(nextUser)
      setName(nextUser.name || '')
      setAvatarPreview(nextUser.avatar || '')
      setAvatarFile(null)
      saveUser(nextUser)

      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Update failed', {
        description: getErrorMessage(error),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    clearToken()
    localStorage.removeItem('user')
    toast.success('Signed out successfully')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
            <p className="text-sm text-zinc-500">You&apos;re signed in</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>

        <Card className="border-zinc-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xs font-medium">
                    {initials}
                  </span>
                )}
              </div>
              {user?.name ? `Welcome, ${user.name}` : 'Welcome!'}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
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

            <p className="text-sm text-zinc-500">
              Update your name and profile photo here.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Profile picture
                </label>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full border border-zinc-200 bg-zinc-100 overflow-hidden flex items-center justify-center">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50">
                    <Upload className="w-4 h-4" />
                    Choose image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Update profile
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}