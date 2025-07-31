import React from 'react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <Link 
          href="/dashboard" 
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}