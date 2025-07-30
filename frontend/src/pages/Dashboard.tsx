import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiEndpoints } from '../lib/api';

export default function Dashboard() {
  const { data: healthData, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiEndpoints.health().then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">BMS Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-2">Server Status</h3>
          <p className="text-green-600 font-medium">
            {healthData?.status === 'OK' ? 'Online' : 'Offline'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {healthData?.message}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-2">Active Tenders</h3>
          <p className="text-2xl font-bold text-blue-600">-</p>
          <p className="text-sm text-gray-600 mt-1">Loading from database...</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-2">Win Rate</h3>
          <p className="text-2xl font-bold text-green-600">-</p>
          <p className="text-sm text-gray-600 mt-1">Loading from database...</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-2">Total Value</h3>
          <p className="text-2xl font-bold text-purple-600">-</p>
          <p className="text-sm text-gray-600 mt-1">Loading from database...</p>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <p className="text-gray-600">
          Connected to backend API. All data will be loaded from MySQL database.
        </p>
      </div>
    </div>
  );
}