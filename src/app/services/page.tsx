'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ServicesPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/search');
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-coral mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to search page...</p>
      </div>
    </div>
  );
} 