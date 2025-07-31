import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiEndpoints } from '../lib/api';

export default function Tenders() {
  const [filters, setFilters] = useState({
    search: '',
    source: 'all',
    status: 'all',
    page: 1
  });

  const { data: tendersData, isLoading, error } = useQuery({
    queryKey: ['tenders', filters],
    queryFn: () => apiEndpoints.getTenders(filters).then(res => res.data),
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Tenders</h1>
        <div className="text-center py-8">Loading tenders from database...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Tenders</h1>
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          Error loading tenders: {error.message}
        </div>
      </div>
    );
  }

  const tenders = tendersData?.tenders || [];
  const pagination = tendersData?.pagination;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tenders</h1>
      
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Search tenders..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Source</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
            >
              <option value="all">All Sources</option>
              <option value="gem">GEM</option>
              <option value="non_gem">Non-GEM</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenders List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Tenders ({pagination?.total || 0})
          </h2>
          
          {tenders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tenders found. Data will be loaded from MySQL database.
            </div>
          ) : (
            <div className="space-y-4">
              {tenders.map((tender: any) => (
                <div key={tender.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{tender.title}</h3>
                      <p className="text-gray-600">{tender.organization}</p>
                      <p className="text-sm text-gray-500 mt-2">{tender.description}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                        tender.source === 'gem' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tender.source?.toUpperCase()}
                      </span>
                      <div className="mt-2">
                        <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                          tender.aiScore >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          AI Score: {tender.aiScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                    <span>Value: ₹{(tender.value / 100).toLocaleString()}</span>
                    <span>Deadline: {new Date(tender.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setFilters(prev => ({ ...prev, page }))}
                className={`px-3 py-2 text-sm rounded ${
                  page === pagination.page
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}