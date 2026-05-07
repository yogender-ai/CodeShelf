import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, setToken } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi.me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    async login(payload) {
      const data = await authApi.login(payload)
      setToken(data.token)
      setUser(data.user)
      return data.user
    },
    async signup(payload) {
      const data = await authApi.signup(payload)
      setToken(data.token)
      setUser(data.user)
      return data.user
    },
    logout() {
      setToken(null)
      setUser(null)
    },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
