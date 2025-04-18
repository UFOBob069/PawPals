'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FaList, FaMap, FaMapMarkerAlt } from 'react-icons/fa';
import BreedFilter from '@/components/BreedFilter';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { collection, query, where, getDocs, CollectionReference, DocumentData, Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types
type ResultType = 'all' | 'jobs' | 'providers';

interface SearchResult {
  id: string;
  ownerName: string;
  ownerUid: string;
  serviceType: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  rate: string;
  rateType: string;
  createdAt: string;
  isProvider?: boolean;
  services?: {
    walk: boolean;
    daycare: boolean;
    boarding: boolean;
  };
}

// Dynamically import the Map component
const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full rounded-xl overflow-hidden bg-neutral-lightest flex items-center justify-center">
      <div className="animate-pulse">Loading map...</div>
    </div>
  ),
});

const getServiceEmoji = (serviceType: string) => {
  switch (serviceType?.toLowerCase()) {
    case 'walk':
      return '🦮';
    case 'daycare':
      return '🏠';
    case 'boarding':
      return '🛏️';
    default:
      return '🐕';
  }
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    serviceType: '',
    distance: '5',
  });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | undefined>(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    return lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;
  });
  const [resultType, setResultType] = useState<ResultType>(() => {
    const type = searchParams.get('type');
    return (type === 'jobs' || type === 'providers' || type === 'all') ? type : 'all';
  });

  // Initial load of services based on URL query
  useEffect(() => {
    fetchServices({
      query: searchParams.get('q') || '',
      serviceType: filters.serviceType,
      breeds: selectedBreeds,
      location: selectedLocation,
      distance: parseInt(filters.distance),
    });
  }, [searchParams]);

  // Effect to handle filter changes
  useEffect(() => {
    fetchServices({
      query: searchQuery,
      serviceType: filters.serviceType,
      breeds: selectedBreeds,
      location: selectedLocation,
      distance: parseInt(filters.distance),
    });
  }, [resultType, filters.serviceType, filters.distance, selectedBreeds, selectedLocation]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d * 0.621371; // Convert to miles
  };

  const fetchServices = async (searchParams?: {
    query?: string;
    serviceType?: string;
    breeds?: string[];
    location?: { lat: number; lng: number } | undefined;
    distance?: number;
  }) => {
    setLoading(true);
    setError('');
    try {
      // Fetch job posts
      const jobsCollection = collection(db, 'jobs') as CollectionReference<DocumentData>;
      const jobsQuery: Query<DocumentData> = searchParams?.serviceType
        ? query(jobsCollection, where('serviceType', '==', searchParams.serviceType))
        : jobsCollection;

      const jobsSnapshot = await getDocs(jobsQuery);
      const jobResults: SearchResult[] = [];

      jobsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.location?.lat && data.location?.lng) {
          jobResults.push({
            id: doc.id,
            ownerName: data.ownerName,
            ownerUid: data.ownerUid,
            serviceType: data.serviceType,
            description: data.description,
            location: data.location,
            rate: data.rate,
            rateType: data.rateType,
            createdAt: data.createdAt,
            isProvider: false
          });
        }
      });

      // Fetch service providers
      const providersCollection = collection(db, 'users') as CollectionReference<DocumentData>;
      const providersQuery: Query<DocumentData> = query(providersCollection, where('role.host', '==', true));
      
      const providersSnapshot = await getDocs(providersQuery);
      const providerResults: SearchResult[] = [];

      providersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.location?.lat && data.location?.lng) {
          // Only include providers that offer the selected service type
          if (!searchParams?.serviceType || data.services?.[searchParams.serviceType]) {
            providerResults.push({
              id: doc.id,
              ownerName: data.name,
              ownerUid: doc.id,
              serviceType: Object.entries(data.services || {})
                .filter(([, enabled]) => enabled)
                .map(([service]) => service)
                .join(', '),
              description: data.bio || '',
              location: data.location,
              rate: data.rate || '25',
              rateType: 'hour',
              createdAt: data.createdAt || new Date().toISOString(),
              isProvider: true,
              services: data.services
            });
          }
        }
      });

      // Combine and filter results based on location if specified
      let combinedResults = [...jobResults, ...providerResults];

      if (searchParams?.location && searchParams?.distance) {
        const distance = searchParams.distance;
        combinedResults = combinedResults.filter((result) => {
          const dist = calculateDistance(
            searchParams.location!.lat,
            searchParams.location!.lng,
            result.location.lat,
            result.location.lng
          );
          return dist <= distance;
        });
      }

      setSearchResults(combinedResults);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to fetch services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchServices({
      query: searchQuery,
      serviceType: filters.serviceType,
      breeds: selectedBreeds,
      location: selectedLocation,
      distance: parseInt(filters.distance),
    });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'resultType') {
      setResultType(value as ResultType);
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary-navy">Find Dog Care Services</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
              viewMode === 'list'
                ? 'bg-primary-coral text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaList />
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
              viewMode === 'map'
                ? 'bg-primary-coral text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaMap />
            Map
          </button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-start">
          {/* Add Result Type Filter before the existing filters */}
          <select
            id="resultType"
            name="resultType"
            value={resultType}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral text-sm bg-white min-w-[140px]"
            aria-label="Filter by result type"
          >
            <option value="all">All Results</option>
            <option value="jobs">Job Posts Only</option>
            <option value="providers">Service Providers Only</option>
          </select>

          <AddressAutocomplete
            id="location-search"
            name="location"
            value={searchQuery}
            onChange={setSearchQuery}
            onSelect={(address) => {
              setSearchQuery(address.place_name);
              const newLocation = {
                lat: address.center[1],
                lng: address.center[0]
              };
              setSelectedLocation(newLocation);
              fetchServices({
                query: address.place_name,
                serviceType: filters.serviceType,
                breeds: selectedBreeds,
                location: newLocation,
                distance: parseInt(filters.distance),
              });
            }}
            placeholder="Search by location..."
            className="flex-1 px-4 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral focus:ring-opacity-20 shadow-sm text-sm"
            aria-label="Search by location"
          />

          {/* Service Type Filter */}
          <select
            id="serviceType"
            name="serviceType"
            value={filters.serviceType}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral text-sm bg-white min-w-[120px]"
            aria-label="Filter by service type"
          >
            <option value="">All Services</option>
            <option value="walk">Dog Walking</option>
            <option value="daycare">Daycare</option>
            <option value="boarding">Boarding</option>
          </select>

          {/* Distance Filter */}
          <select
            id="distance"
            name="distance"
            value={filters.distance}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral text-sm bg-white min-w-[120px]"
            aria-label="Filter by distance"
          >
            <option value="5">Within 5 miles</option>
            <option value="10">Within 10 miles</option>
            <option value="25">Within 25 miles</option>
            <option value="50">Within 50 miles</option>
          </select>

          {/* Breed Filter */}
          <div className="relative">
            <BreedFilter
              selectedBreeds={selectedBreeds}
              onBreedsChange={(breeds) => {
                setSelectedBreeds(breeds);
                fetchServices({
                  query: searchQuery,
                  serviceType: filters.serviceType,
                  breeds,
                  location: selectedLocation,
                  distance: parseInt(filters.distance),
                });
              }}
            />
          </div>
        </form>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-coral mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading services...</p>
        </div>
      ) : (
        <>
          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-primary-navy flex items-center gap-2">
                            {getServiceEmoji(result.serviceType)}
                            {result.isProvider ? 'Service Provider' : result.serviceType.charAt(0).toUpperCase() + result.serviceType.slice(1)}
                          </h3>
                          <span className="text-lg font-semibold text-primary-coral">
                            ${result.rate}/{result.rateType}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{result.ownerName}</p>
                        {result.description && (
                          <p className="text-sm text-gray-500 mb-2">{result.description}</p>
                        )}
                        {result.isProvider && result.services && (
                          <div className="text-sm text-gray-500 mb-2">
                            Services: {Object.entries(result.services)
                              .filter(([, enabled]) => enabled)
                              .map(([service]) => service.charAt(0).toUpperCase() + service.slice(1))
                              .join(', ')}
                          </div>
                        )}
                        {result.location.address && (
                          <div className="flex items-start gap-2 text-sm text-gray-500">
                            <FaMapMarkerAlt className="mt-1 flex-shrink-0" />
                            <p>{result.location.address}</p>
                          </div>
                        )}
                        <div className="mt-4">
                          <a
                            href={result.isProvider ? `/providers/${result.id}` : `/services/${result.id}`}
                            className="inline-block bg-primary-coral text-white py-2 px-4 rounded-lg 
                                     hover:bg-primary-coral/90 transition-colors duration-200 text-sm font-medium"
                          >
                            View Details
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-600">
                  {resultType === 'jobs' && 'No job posts found. Try adjusting your filters.'}
                  {resultType === 'providers' && 'No service providers found. Try adjusting your filters.'}
                  {resultType === 'all' && 'No results found. Try adjusting your filters.'}
                </div>
              )}
            </div>
          )}

          {/* Map View */}
          {viewMode === 'map' && (
            <div className="h-[calc(100vh-300px)] rounded-xl overflow-hidden shadow-sm">
              <MapComponent
                markers={searchResults
                  .filter(result => result.location && result.location.lat && result.location.lng)
                  .map(result => ({
                    id: result.id,
                    lat: result.location.lat,
                    lng: result.location.lng,
                    title: result.isProvider 
                      ? `Service Provider: ${result.ownerName}`
                      : `${result.serviceType} by ${result.ownerName}`,
                    serviceType: result.serviceType,
                    rate: result.rate,
                    rateType: result.rateType,
                    description: result.description,
                    isProvider: result.isProvider
                  }))}
                center={selectedLocation}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
} 