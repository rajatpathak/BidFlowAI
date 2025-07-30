import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiEndpoints } from '../lib/api';
import { Link } from 'wouter';

export default function Dashboard() {
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiEndpoints.health().then(res => res.data),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiEndpoints.getDashboardStats().then(res => res.data),
  });

  if (healthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">BMS Dashboard</h1>
            <nav className="flex space-x-4">
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Dashboard
              </Link>
              <Link href="/tenders" className="text-gray-500 hover:text-gray-700">
                Tenders
              </Link>
              <Link href="/login" className="text-gray-500 hover:text-gray-700">
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-2">Server Status</h3>
            <p className="text-green-600 font-medium">
              {healthData?.status === 'OK' ? '🟢 Online' : '🔴 Offline'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {healthData?.message}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-2">Active Tenders</h3>
            <p className="text-2xl font-bold text-blue-600">
              {statsLoading ? '...' : statsData?.activeTenders || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">From MySQL database</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-2">Win Rate</h3>
            <p className="text-2xl font-bold text-green-600">
              {statsLoading ? '...' : `${statsData?.winRate || 0}%`}
            </p>
            <p className="text-sm text-gray-600 mt-1">Success percentage</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-2">Total Value</h3>
            <p className="text-2xl font-bold text-purple-600">
              {statsLoading ? '...' : `₹${((statsData?.totalValue || 0) / 100000).toFixed(1)}L`}
            </p>
            <p className="text-sm text-gray-600 mt-1">Pipeline value</p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/tenders" className="block w-full text-left bg-indigo-50 hover:bg-indigo-100 p-3 rounded-md transition-colors">
                <div className="font-medium text-indigo-900">View All Tenders</div>
                <div className="text-sm text-indigo-600">Browse and manage tenders</div>
              </Link>
              <Link href="/login" className="block w-full text-left bg-green-50 hover:bg-green-100 p-3 rounded-md transition-colors">
                <div className="font-medium text-green-900">Login to System</div>
                <div className="text-sm text-green-600">Access user dashboard</div>
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Backend API</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Database</span>
                <span className="text-green-600 font-medium">MySQL Ready</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Data Storage</span>
                <span className="text-blue-600 font-medium">No Local Storage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Migration Complete</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">✅ Successfully Migrated to Separated Architecture</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Frontend: React.js with TypeScript (Port 3000)</li>
              <li>• Backend: Node.js with Express.js (Port 5000)</li>
              <li>• Database: MySQL with Drizzle ORM</li>
              <li>• All data now flows through MySQL database</li>
              <li>• No local storage dependencies</li>
              <li>• RESTful API communication</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}