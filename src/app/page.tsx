'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery && selectedLocation) {
      const params = new URLSearchParams({
        q: searchQuery,
        lat: selectedLocation.lat.toString(),
        lng: selectedLocation.lng.toString()
      });
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full bg-primary-yellow">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold text-primary-navy mb-6">
            Find Your Dog's Perfect Paw Pal
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Connect with trusted local hosts for walks, daycare, and vacation sitting
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="flex gap-2">
              <AddressAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                onSelect={(address) => {
                  setSearchQuery(address.place_name);
                  setSelectedLocation({
                    lat: address.center[1],
                    lng: address.center[0]
                  });
                }}
                placeholder="Enter your location"
                className="flex-1 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-coral"
              />
              <button 
                type="submit"
                className="bg-primary-coral text-white px-6 py-4 rounded-lg hover:bg-opacity-90 transition flex items-center gap-2"
              >
                <span>Search</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <h3 className="text-xl font-semibold text-primary-navy mb-4">Trusted Community</h3>
              <p className="text-gray-600">Connect with verified local dog lovers</p>
            </div>
            <div className="text-center p-6">
              <h3 className="text-xl font-semibold text-primary-navy mb-4">Flexible Care</h3>
              <p className="text-gray-600">Find the perfect match for your dog's needs</p>
            </div>
            <div className="text-center p-6">
              <h3 className="text-xl font-semibold text-primary-navy mb-4">No Fees</h3>
              <p className="text-gray-600">Direct connections, no middleman fees</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Only show if user is not logged in */}
      {!user && (
        <section className="w-full bg-primary-navy py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to Find a Paw Pal?</h2>
            <div className="flex gap-4 justify-center">
              <Link href="/signup" className="bg-primary-coral text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition">
                Sign Up
              </Link>
              <Link href="/login" className="bg-white text-primary-navy px-8 py-3 rounded-lg hover:bg-opacity-90 transition">
                Log In
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
