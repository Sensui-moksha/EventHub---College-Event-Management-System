import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'createdAt'> & { password: string }) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
  // Admin privilege: delete user
  deleteUser?: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed && parsed.createdAt) {
        parsed.createdAt = new Date(parsed.createdAt);
      }
      setUser(parsed);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        // Map _id to id for frontend compatibility, but keep _id for backend ops
        const user = { ...data.user };
        if (!user.id) user.id = user._id;
        if (!user._id) user._id = user.id;
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
  const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const user = { ...data.user };
        if (!user.id) user.id = user._id;
        if (!user._id) user._id = user.id;
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        return { success: true };
      }
      if (res.status === 409) {
        return { success: false, error: 'Account already exists with this email.' };
      }
      return { success: false, error: data.error || 'Registration failed.' };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Registration failed.' };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No user logged in.' };
    setLoading(true);
    try {
      const userId = user._id || user.id;
      const res = await fetch(`/api/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const updatedUser = { ...data.user };
        if (!updatedUser.id) updatedUser.id = updatedUser._id;
        if (!updatedUser._id) updatedUser._id = updatedUser.id;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true };
      }
      return { success: false, error: data.error || 'Profile update failed.' };
    } catch (error) {
      console.error('Profile update failed:', error);
      return { success: false, error: 'Profile update failed.' };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No user logged in.' };
    setLoading(true);
    try {
      const userId = user._id || user.id;
      const res = await fetch(`/api/user/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true };
      }
      return { success: false, error: data.error || 'Password change failed.' };
    } catch (error) {
      console.error('Password change failed:', error);
      return { success: false, error: 'Password change failed.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Admin privilege: delete user
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
  const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        // Optionally, remove user from local state if needed
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete user failed:', error);
      return false;
    }
  };

  const value = {
    user,
    login,
    register,
    updateProfile,
    changePassword,
    logout,
    loading,
    deleteUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};