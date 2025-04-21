'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FaList, FaMap, FaMapMarkerAlt, FaFilter, FaChevronDown, FaChevronUp, FaSortAmountDown, FaSortAmountUp, FaUser, FaCalendar, FaStar } from 'react-icons/fa';
import BreedFilter from '@/components/BreedFilter';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

// Types
type ResultType = 'all' | 'jobs' | 'providers';

interface Service {
  id: string;
  name: string;
  bio?: string;
  services?: {
    [key: string]: boolean;
  };
  acceptedBreeds?: string[];
  location?: {
    lat: number;
    lng: number;
  };
  photoUrl?: string;
  rating?: number;
  totalReviews?: number;
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    serviceType: '',
    distance: '5',
  });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [resultType, setResultType] = useState<ResultType>(() => {
    const type = searchParams.get('type');
    return (type === 'jobs' || type === 'providers' || type === 'all') ? type : 'all';
  });
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');

  // Function to get current location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Use Mapbox Geocoding API to get the address
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
            );
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
              const placeName = data.features[0].place_name;
              setSearchQuery(placeName);
              setSelectedLocation({ lat: latitude, lng: longitude });
            }
          } catch (error) {
            console.error('Error getting address:', error);
            setError('Could not get your location details');
          } finally {
            setIsGettingLocation(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Could not get your location');
          setIsGettingLocation(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
    }
  }, []);

  // Get current location on component mount
  useEffect(() => {
    // Only get current location if no location is provided in URL params
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const address = searchParams.get('address');

    if (lat && lng && address) {
      setSelectedLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
      setSearchQuery(address);
      setIsGettingLocation(false);
    } else {
      getCurrentLocation();
    }
  }, [searchParams, getCurrentLocation]);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      // Query for service providers
      const servicesQuery = query(collection(db, 'users'), where('role.host', '==', true));
      const servicesSnapshot = await getDocs(servicesQuery);
      const servicesData = await Promise.all(servicesSnapshot.docs.map(async doc => {
        const serviceData = doc.data();
        
        // Fetch reviews for this provider
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('providerId', '==', doc.id)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviews = reviewsSnapshot.docs.map(reviewDoc => ({
          id: reviewDoc.id,
          ...reviewDoc.data()
        })) as Array<{ id: string; rating: number; [key: string]: any }>;
        
        // Calculate average rating
        const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
        
        return {
          id: doc.id,
          ...serviceData,
          rating: averageRating,
          totalReviews: reviews.length,
          reviews
        };
      })) as Service[];

      // Query for job posts
      const jobsQuery = query(collection(db, 'jobs'));
      const jobsSnapshot = await getDocs(jobsQuery);
      const jobsData = await Promise.all(jobsSnapshot.docs.map(async jobDoc => {
        const jobData = jobDoc.data();
        
        // Fetch the owner's profile to get their photo
        if (jobData.ownerUid) {
          const ownerDoc = await getDoc(doc(db, 'users', jobData.ownerUid));
          const ownerData = ownerDoc.data();
          return {
            id: jobDoc.id,
            ...jobData,
            photoUrl: ownerData?.photoUrl
          };
        }
        return {
          id: jobDoc.id,
          ...jobData
        };
      })) as SearchResult[];

      // Filter services based on search criteria
      const filteredServices = servicesData.filter(service => {
        // Service type filter
        if (filters.serviceType && !service.services?.[filters.serviceType]) {
          return false;
        }

        // Breed filter
        if (selectedBreeds.length > 0) {
          if (!service.acceptedBreeds || !service.acceptedBreeds.some(breed => selectedBreeds.includes(breed))) {
            return false;
          }
        }

        // Location filter
        if (selectedLocation && service.location) {
          const distance = calculateDistance(
            selectedLocation.lat,
            selectedLocation.lng,
            service.location.lat,
            service.location.lng
          );
          if (distance > (Number(filters.distance) || 10)) {
            return false;
          }
        }

        return true;
      });

      // Filter jobs based on search criteria
      const filteredJobs = jobsData.filter(job => {
        // Service type filter
        if (filters.serviceType && job.serviceType !== filters.serviceType) {
          return false;
        }

        // Breed filter
        if (selectedBreeds.length > 0) {
          if (!job.breeds || !job.breeds.some(breed => selectedBreeds.includes(breed))) {
            return false;
          }
        }

        // Location filter
        if (selectedLocation && job.location) {
          const distance = calculateDistance(
            selectedLocation.lat,
            selectedLocation.lng,
            job.location.lat,
            job.location.lng
          );
          if (distance > (Number(filters.distance) || 10)) {
            return false;
          }
        }

        return true;
      });

      // Combine and format results
      const searchResults: SearchResult[] = [
        ...filteredServices.map(service => ({
          id: service.id,
          ownerName: service.name,
          ownerUid: service.id,
          serviceType: Object.entries(service.services || {})
            .filter(([, enabled]) => enabled)
            .map(([service]) => service)
            .join(', '),
          description: service.bio || '',
          location: service.location || { lat: 0, lng: 0 },
          rate: '25',
          rateType: 'hour',
          createdAt: new Date().toISOString(),
          breeds: service.acceptedBreeds || [],
          isProvider: true,
          photoUrl: service.photoUrl,
          rating: service.rating,
          totalReviews: service.totalReviews,
          reviews: service.reviews
        })),
        ...filteredJobs.map(job => ({
          ...job,
          isProvider: false,
          photoUrl: job.photoUrl
        }))
      ];

      // Filter based on result type
      const finalResults = resultType === 'all' 
        ? searchResults 
        : searchResults.filter(result => result.isProvider === (resultType === 'providers'));

      setSearchResults(finalResults);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [filters.serviceType, filters.distance, selectedBreeds, selectedLocation, resultType]);

  useEffect(() => {
    if (selectedLocation) {
      fetchServices();
    }
  }, [selectedLocation, fetchServices]);

  useEffect(() => {
    if (searchQuery) {
      fetchServices();
    }
  }, [searchQuery, fetchServices]);

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

  const handleSearchParamsChange = useCallback((prev: URLSearchParams): SearchParams => {
    const params: SearchParams = {};
    const serviceType = prev.get('serviceType');
    const distance = prev.get('distance');
    const lat = prev.get('lat');
    const lng = prev.get('lng');
    const resultType = prev.get('resultType');
    const sortOrder = prev.get('sortOrder');

    if (serviceType) params.serviceType = serviceType;
    if (distance) params.distance = distance;
    if (lat) params.lat = lat;
    if (lng) params.lng = lng;
    if (resultType && ['all', 'jobs', 'providers'].includes(resultType)) {
      params.resultType = resultType as ResultType;
    }
    if (sortOrder && ['none', 'highToLow', 'lowToHigh'].includes(sortOrder)) {
      params.sortOrder = sortOrder as SortOrder;
    }
    return params;
  }, []);

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
                onChange={setSelectedBreeds}
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
              <div className="relative">
                <AddressAutocomplete
                  onSelect={(address) => {
                    setSelectedLocation({
                      lat: address.center[1],
                      lng: address.center[0]
                    });
                    setSearchQuery(address.place_name);
                  }}
                  value={searchQuery}
                  onChange={(value) => setSearchQuery(value)}
                  placeholder={isGettingLocation ? "Getting your location..." : "Enter location..."}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-coral focus:border-transparent"
                />
                {isGettingLocation && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-coral"></div>
                  </div>
                )}
              </div>
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
            {selectedLocation && (
              <div className="text-sm text-gray-500 mb-4">
                Searching within {filters.distance} miles of {searchQuery}
              </div>
            )}
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