import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  createdAt: number
}

interface UserState {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  signIn: (userData: Omit<User, 'id' | 'createdAt'>) => void
  signOut: () => void
  updateUser: (updates: Partial<User>) => void
  setLoading: (loading: boolean) => void
}

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  
  // Actions
  signIn: (userData) => {
    const user: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    }
    
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    })
    
    // Store in localStorage for persistence
    localStorage.setItem('blank_space_user', JSON.stringify(user))
  },
  
  signOut: () => {
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
    
    // Clear from localStorage
    localStorage.removeItem('blank_space_user')
  },
  
  updateUser: (updates) => {
    const { user } = get()
    if (!user) return
    
    const updatedUser = { ...user, ...updates }
    set({ user: updatedUser })
    
    // Update localStorage
    localStorage.setItem('blank_space_user', JSON.stringify(updatedUser))
  },
  
  setLoading: (loading) => {
    set({ isLoading: loading })
  },
}))

// Initialize user from localStorage on app start
export const initializeUserFromStorage = () => {
  try {
    const storedUser = localStorage.getItem('blank_space_user')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      useUserStore.getState().signIn({
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      })
    }
  } catch (error) {
    console.error('Error loading user from storage:', error)
    localStorage.removeItem('blank_space_user')
  }
}