'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authAPI } from '../utils/api';
import { useAuthStore } from '../utils/store';

export default function Auth() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
  });

  // Only run on client - check auth once
  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/chat');
    }
  }, []);

  // Don't render anything until client-side to avoid hydration mismatch
  if (!isClient) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const response = await authAPI.login({
          email: formData.email,
          password: formData.password,
        });
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setAuth(token, user.id, user.username, user.displayName, user.avatar, user.bio);
        router.push('/chat');
      } else {
        const response = await authAPI.register(formData);
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setAuth(token, user.id, user.username, user.displayName, user.avatar, user.bio);
        router.push('/chat');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-black flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-secondary/50 backdrop-blur-sm border border-primary/20 rounded-lg p-8 shadow-2xl">
          <h1 className="text-4xl font-bold text-primary mb-2 text-center">YapIt</h1>
          <p className="text-gray-400 text-center mb-8">Real-time Messaging Platform</p>

          <h2 className="text-2xl font-bold mb-6 text-center">
            {isLogin ? 'Welcome Back' : 'Join YapIt'}
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary text-white"
              />
            )}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary text-white"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary text-white"
            />

            {!isLogin && (
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary text-white"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
