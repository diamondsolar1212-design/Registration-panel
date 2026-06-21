'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  name: string
  email: string
  phone?: string
  role: 'user' | 'admin'
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  _hydrated: boolean
  accessToken: string | null
  login: (user: AuthUser, accessToken?: string) => void
  logout: () => void
  updateUser: (data: Partial<AuthUser>) => void
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      _hydrated: false,
      accessToken: null,
      login: (user: AuthUser, accessToken?: string) =>
        set({
          user,
          isAuthenticated: true,
          isAdmin: user.role === 'admin',
          accessToken: accessToken || null,
        }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          accessToken: null,
        }),
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'diamond-solar-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)
