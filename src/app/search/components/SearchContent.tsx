'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FaList, FaMap, FaMapMarkerAlt, FaFilter, FaChevronDown, FaChevronUp, FaSortAmountDown, FaSortAmountUp, FaUser, FaCalendar, FaStar } from 'react-icons/fa';
import BreedFilter from '@/components/BreedFilter';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { collection, query, where, getDocs, CollectionReference, DocumentData, Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

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
  breeds?: string[];
  photoUrl?: string;
  startDate?: string;
  endDate?: string;
  rating?: number;
  totalReviews?: number;
}

type SortOrder = 'none' | 'highToLow' | 'lowToHigh';

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
    case 'dropIn':
      return '🏃';
    case 'training':
      return '🎓';
    case 'houseSitting':
      return '🏡';
    default:
      return '🐕';
  }
};

export default function SearchContent() {
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
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');

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

  const getZoomForDistance = (distance: number) => {
    // Approximate zoom levels for different distances
    if (distance <= 5) return 12;
    if (distance <= 10) return 11;
    if (distance <= 25) return 10;
    return 9;
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
      let jobsQuery: Query<DocumentData> = jobsCollection;
      
      if (searchParams?.serviceType) {
        jobsQuery = query(jobsQuery, where('serviceType', '==', searchParams.serviceType));
      }
      
      if (searchParams?.breeds && searchParams.breeds.length > 0) {
        jobsQuery = query(jobsQuery, where('breeds', 'array-contains-any', searchParams.breeds));
      }

      const jobsSnapshot = await getDocs(jobsQuery);
      const jobResults: SearchResult[] = [];

      // Get all unique owner IDs
      const ownerIds = Array.from(new Set(
        jobsSnapshot.docs
          .map(doc => doc.data().ownerUid)
          .filter(Boolean)
      ));

      // Fetch owner profiles in batches of 10
      const ownerProfiles = new Map<string, { photoUrl?: string }>();
      for (let i = 0; i < ownerIds.length; i += 10) {
        const batch = ownerIds.slice(i, i + 10);
        const ownersQuery = query(collection(db, 'users'), where('__name__', 'in', batch));
        const ownersSnapshot = await getDocs(ownersQuery);
        ownersSnapshot.forEach(doc => {
          ownerProfiles.set(doc.id, doc.data());
        });
      }

      jobsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.location?.lat && data.location?.lng) {
          const ownerProfile = ownerProfiles.get(data.ownerUid);
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
            breeds: data.breeds || [],
            isProvider: false,
            photoUrl: ownerProfile?.photoUrl,
            startDate: data.startDate,
            endDate: data.endDate
          });
        }
      });

      // Fetch service providers
      const providersCollection = collection(db, 'users') as CollectionReference<DocumentData>;
      let providersQuery: Query<DocumentData> = query(providersCollection, where('role.host', '==', true));
      
      if (searchParams?.breeds && searchParams.breeds.length > 0) {
        providersQuery = query(providersQuery, where('acceptedBreeds', 'array-contains-any', searchParams.breeds));
      }
      
      const providersSnapshot = await getDocs(providersQuery);
      const providerResults: SearchResult[] = [];

      // First, collect all provider data and create review fetch promises
      const providerPromises = providersSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        if (data.location?.lat && data.location?.lng) {
          // Only include providers that offer the selected service type
          if (!searchParams?.serviceType || data.services?.[searchParams.serviceType]) {
            const reviewsQuery = query(
              collection(db, 'reviews'),
              where('providerId', '==', doc.id)
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);
            const reviews = reviewsSnapshot.docs.map(doc => doc.data());
            const rating = reviews.length > 0 
              ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
              : 0;

            return {
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
              breeds: data.acceptedBreeds || [],
              isProvider: true,
              services: data.services,
              photoUrl: data.photoUrl,
              rating,
              totalReviews: reviews.length
            };
          }
        }
        return null;
      });

      // Wait for all provider data to be processed
      const resolvedProviders = await Promise.all(providerPromises);
      
      // Filter out null values and add to results
      providerResults.push(...resolvedProviders.filter((provider): provider is SearchResult => provider !== null));

      // Filter results based on type
      let combinedResults = 
        resultType === 'jobs' ? jobResults :
        resultType === 'providers' ? providerResults :
        [...jobResults, ...providerResults];

      // Filter by location if specified
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
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to fetch services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add sorting function
  const getSortedResults = (results: SearchResult[]) => {
    if (sortOrder === 'none') return results;
    
    return [...results].sort((a, b) => {
      const priceA = parseFloat(a.rate);
      const priceB = parseFloat(b.rate);
      
      if (sortOrder === 'highToLow') {
        return priceB - priceA;
      } else {
        return priceA - priceB;
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <span className="font-medium text-gray-700">Filters</span>
            </div>
            {isFiltersVisible ? (
              <FaChevronUp className="text-gray-500" />
            ) : (
              <FaChevronDown className="text-gray-500" />
            )}
          </button>
        </div>

        {/* Search Filters */}
        <div className={`bg-white rounded-lg shadow-sm p-6 mb-6 lg:block ${isFiltersVisible ? 'block' : 'hidden'}`}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Breeds
              </label>
              <BreedFilter
                selectedBreeds={selectedBreeds}
                onBreedsChange={setSelectedBreeds}
                className="w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type
              </label>
              <select
                value={filters.serviceType}
                onChange={(e) => setFilters(prev => ({ ...prev, serviceType: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Services</option>
                <option value="walk">Dog Walking</option>
                <option value="daycare">Daycare</option>
                <option value="boarding">Boarding</option>
                <option value="dropIn">Drop-in Visit</option>
                <option value="training">Training</option>
                <option value="houseSitting">House Sitting</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distance (miles)
              </label>
              <select
                value={filters.distance}
                onChange={(e) => setFilters(prev => ({ ...prev, distance: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-coral focus:border-transparent"
              >
                <option value="5">Within 5 miles</option>
                <option value="10">Within 10 miles</option>
                <option value="25">Within 25 miles</option>
                <option value="50">Within 50 miles</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <AddressAutocomplete
                onSelect={(address) => setSelectedLocation({
                  lat: address.center[1],
                  lng: address.center[0]
                })}
                value={searchQuery || ''}
                onChange={(value) => setSearchQuery(value)}
                placeholder="Enter location..."
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-coral focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Show
              </label>
              <select
                value={resultType}
                onChange={(e) => setResultType(e.target.value as ResultType)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-coral focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="jobs">Job Posts</option>
                <option value="providers">Service Providers</option>
              </select>
            </div>
          </div>
        </div>

        {/* View Toggle and Sort */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            {searchResults.length} Results
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortOrder(sortOrder === 'highToLow' ? 'lowToHigh' : 'highToLow')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
              >
                {sortOrder === 'highToLow' ? (
                  <>
                    <FaSortAmountDown className="text-gray-500" />
                    <span>Price: High to Low</span>
                  </>
                ) : (
                  <>
                    <FaSortAmountUp className="text-gray-500" />
                    <span>Price: Low to High</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list'
                    ? 'bg-primary-coral text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FaList className="text-xl" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-lg ${
                  viewMode === 'map'
                    ? 'bg-primary-coral text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FaMap className="text-xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Results View */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse">Loading results...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms</p>
          </div>
        ) : viewMode === 'map' ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <MapComponent
              markers={searchResults.map(result => ({
                id: result.id,
                position: {
                  lat: result.location.lat,
                  lng: result.location.lng
                },
                title: `${getServiceEmoji(result.serviceType)} ${result.ownerName}`,
                serviceType: result.serviceType,
                description: result.description,
                rate: result.rate,
                rateType: result.rateType,
                isProvider: result.isProvider,
                detailsUrl: result.isProvider ? `/providers/${result.id}` : `/services/${result.id}`
              }))}
              center={selectedLocation || 
                (searchResults.length > 0 
                  ? { 
                      lat: searchResults[0].location.lat, 
                      lng: searchResults[0].location.lng 
                    } 
                  : { lat: 40.7128, lng: -74.0060 })}
              zoom={selectedLocation 
                ? getZoomForDistance(parseInt(filters.distance)) 
                : searchResults.length > 0 ? 10 : 8}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getSortedResults(searchResults).map((result) => (
              <div key={result.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        {result.photoUrl ? (
                          <Image
                            src={result.photoUrl}
                            alt={result.ownerName}
                            fill
                            className="rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                            <FaUser className="text-gray-400 text-xl" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getServiceEmoji(result.serviceType)} {result.ownerName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {result.isProvider ? 'Service Provider' : `Job Post - ${result.serviceType.charAt(0).toUpperCase() + result.serviceType.slice(1).replace(/([A-Z])/g, ' $1')}`}
                        </p>
                        {result.isProvider && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={i < Math.round(result.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}
                                  size={14}
                                />
                              ))}
                            </div>
                            {result.totalReviews > 0 && (
                              <span className="text-sm text-gray-500">
                                ({result.totalReviews})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-medium text-primary-coral">
                        ${result.rate}/{result.rateType}
                      </p>
                    </div>
                  </div>
                  {!result.isProvider && result.startDate && result.endDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <FaCalendar className="flex-shrink-0 text-primary-coral" />
                      <div>
                        <p>From {new Date(result.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to {new Date(result.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                  )}
                  <p className="mt-2 text-gray-600 line-clamp-3">{result.description}</p>
                  <div className="mt-4">
                    <a
                      href={result.isProvider ? `/providers/${result.id}` : `/services/${result.id}`}
                      className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-coral hover:bg-primary-coral/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-coral"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 