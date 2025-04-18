'use client';

import { Suspense } from 'react';
import SearchContent from './components/SearchContent';

export default function SearchPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-pulse text-lg text-gray-600">Loading search...</div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
} 