'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../lib/toast';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [role, setRole] = useState<'worker' | 'admin' | 'owner'>('worker');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(role, pin);
      
      if (success) {
        toast.success('Welcome to the Staff Portal!');
      } else {
        toast.error('Invalid credentials. Please try again.');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pinDisabled = pin.trim().length === 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-staff-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-staff-50 to-blue-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-staff-100">
              <Lock className="h-6 w-6 text-staff-600" />
            </div>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Staff Portal</h2>
            <p className="mt-2 text-gray-600">Port San Antonio Resort</p>
          </div>

          {/* Security Note */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2"><Shield className="h-4 w-4"/> Secure Login</h3>
            <div className="text-xs text-blue-700">Select your role and enter your personal PIN.</div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="input"
              >
                <option value="worker">Worker</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                Personal PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter your PIN"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || pinDisabled}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>© 2024 Port San Antonio Resort</p>
            <p>Staff Portal v1.0 - Secure & Professional</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
