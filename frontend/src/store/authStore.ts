import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'patient' | 'doctor' | 'admin';
  doctor_profile?: {
    approval_status: 'pending' | 'approved' | 'rejected';
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: 'patient' | 'doctor' | 'admin' | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  role: null,
  setUser: (user) => set({ user, isAuthenticated: !!user, role: user?.role || null }),
  logout: () => set({ user: null, isAuthenticated: false, role: null }),
}));
