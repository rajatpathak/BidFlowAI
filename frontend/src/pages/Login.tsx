import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { apiEndpoints } from '../lib/api';

export default function Login() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiEndpoints.login(formData);
      
      if (response.data.success) {
        // Store user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setLocation('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithDemo = (username: string, password: string) => {
    setFormData({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-4xl w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to BMS
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Bid Management System - Separated Architecture
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Login Form */}
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>

          {/* Demo Accounts */}
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Demo Accounts</h3>
            <p className="text-sm text-gray-600 mb-6">
              Sample users created in MySQL database:
            </p>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">Administrator</h4>
                    <p className="text-sm text-gray-500">Full system access</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                      admin / admin123
                    </code>
                  </div>
                  <button
                    onClick={() => loginWithDemo('admin', 'admin123')}
                    className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700"
                  >
                    Use
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">Finance Manager</h4>
                    <p className="text-sm text-gray-500">Financial operations</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                      finance / finance123
                    </code>
                  </div>
                  <button
                    onClick={() => loginWithDemo('finance', 'finance123')}
                    className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700"
                  >
                    Use
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">Senior Bidder</h4>
                    <p className="text-sm text-gray-500">Bid management</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                      bidder / bidder123
                    </code>
                  </div>
                  <button
                    onClick={() => loginWithDemo('bidder', 'bidder123')}
                    className="bg-purple-600 text-white px-3 py-1 text-sm rounded hover:bg-purple-700"
                  >
                    Use
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">System Features</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• MySQL database with sample data</li>
                <li>• RESTful API endpoints</li>
                <li>• No local storage dependencies</li>
                <li>• Separated frontend/backend architecture</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}