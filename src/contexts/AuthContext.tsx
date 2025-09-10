'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { StaffUser } from '../types';
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: StaffUser | null;
  loading: boolean;
  login: (role: 'worker' | 'admin' | 'owner', pin: string) => Promise<boolean>;
  logout: () => void;
  checkPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Replace mock users with Supabase-backed PIN login

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('staff_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('staff_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (role: 'worker' | 'admin' | 'owner', pin: string): Promise<boolean> => {
    try {
      if (!supabase) return false
      const { data, error } = await supabase
        .from('staff_users')
        .select('*')
        .eq('role', role)
        .eq('pin', pin)
        .eq('is_active', true)
        .limit(1)
      if (error) return false
      const match = data?.[0]
      if (!match) return false
      const normalized: StaffUser = {
        id: match.id,
        email: match.email,
        username: match.username,
        firstName: match.first_name,
        lastName: match.last_name,
        role: match.role,
        department: match.department || undefined,
        phone: match.phone || undefined,
        isActive: match.is_active,
        createdAt: match.created_at,
        updatedAt: match.updated_at,
        createdBy: match.created_by || 'system',
        lastLogin: match.last_login || undefined,
      }
      setUser(normalized)
      localStorage.setItem('staff_user', JSON.stringify(normalized))
      return true
    } catch {
      return false
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('staff_user');
  };

  const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Owner has all permissions
    if (user.role === 'owner') return true;
    
    // Admin permissions
    if (user.role === 'admin') {
      return ![
        'deleteStaff',
        'manageOwners',
        'systemSettings'
      ].includes(permission);
    }
    
    // Worker permissions (limited)
    if (user.role === 'worker') {
      return [
        'viewReservations',
        'createReservations',
        'viewOrders',
        'createOrders',
        'viewOwnData'
      ].includes(permission);
    }
    
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
