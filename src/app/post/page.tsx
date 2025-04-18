'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaPlus, FaMapMarkerAlt } from 'react-icons/fa';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import Link from 'next/link';

// Define breed options to match the filter
const BREED_OPTIONS = {
  sizes: [
    'Tiny (under 5 lbs)',
    'Small (5-20 lbs)',
    'Medium (21-50 lbs)',
    'Large (51-90 lbs)',
    'Extra Large (90+ lbs)'
  ],
  smallBreeds: [
    'Dachshund',
    'French Bulldog',
    'Pug',
    'Yorkshire Terrier',
    'Chihuahua',
    'Shih Tzu'
  ],
  mediumBreeds: [
    'Border Collie',
    'Bulldog',
    'Beagle',
    'Cocker Spaniel',
    'Australian Shepherd',
    'Corgi'
  ],
  largeBreeds: [
    'German Shepherd',
    'Golden Retriever',
    'Labrador Retriever',
    'Husky',
    'Doberman',
    'Rottweiler'
  ]
};

const MAPBOX_API_KEY = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface Location {
  address: string;
  lat: number;
  lng: number;
}

interface DogDetails {
  breed: string;
  size: string;
  specialNeeds: string;
}

interface Requirements {
  experienceRequired: boolean;
  transportationRequired: boolean;
  homeTypePreference: string;
}

interface FormData {
  serviceType: string;
  startDate: string;
  endDate: string;
  recurring: boolean;
  description: string;
  location: Location;
  dogDetails: DogDetails;
  rate: string;
  rateType: string;
  requirements: Requirements;
}

export default function PostJobPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    serviceType: 'daycare',
    startDate: '',
    endDate: '',
    recurring: false,
    description: '',
    location: {
      address: '',
      lat: 0,
      lng: 0,
    },
    dogDetails: {
      breed: '',
      size: '',
      specialNeeds: '',
    },
    rate: '',
    rateType: 'per_hour',
    requirements: {
      experienceRequired: false,
      transportationRequired: false,
      homeTypePreference: '',
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent('/post'));
    }
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const parentKey = parent as keyof FormData;
        const parentObj = prev[parentKey];
        
        if (typeof parentObj === 'object' && parentObj !== null) {
          return {
            ...prev,
            [parentKey]: {
              ...parentObj,
              [child]: type === 'checkbox' ? checked : value
            }
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const geocodeAddress = async (address: string) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address
        )}.json?access_token=${MAPBOX_API_KEY}&country=US`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            lat,
            lng,
          }
        }));
        return { lat, lng };
      }
      throw new Error('No results found');
    } catch (error) {
      console.error('Geocoding error:', error);
      setError('Failed to get coordinates for the address');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    // Validate dates
    const startDateTime = new Date(formData.startDate);
    const endDateTime = new Date(formData.endDate);
    const now = new Date();

    // Set time of now to the start of the current minute for fair comparison
    now.setSeconds(0, 0);

    if (startDateTime < now) {
      setError('Start date must be in the future');
      setLoading(false);
      return;
    }

    if (endDateTime <= startDateTime) {
      setError('End date must be after start date');
      setLoading(false);
      return;
    }

    try {
      // Geocode the address before submitting
      const coordinates = await geocodeAddress(formData.location.address);
      if (!coordinates) {
        setError('Failed to get coordinates for the address. Please try again.');
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'jobs'), {
        ...formData,
        location: {
          ...formData.location,
          lat: coordinates.lat,
          lng: coordinates.lng,
        },
        ownerUid: user.uid,
        ownerName: user.displayName || 'Anonymous',
        ownerEmail: user.email,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Reset form
      setFormData({
        serviceType: 'daycare',
        startDate: '',
        endDate: '',
        recurring: false,
        description: '',
        location: {
          address: '',
          lat: 0,
          lng: 0,
        },
        dogDetails: {
          breed: '',
          size: '',
          specialNeeds: '',
        },
        rate: '',
        rateType: 'per_hour',
        requirements: {
          experienceRequired: false,
          transportationRequired: false,
          homeTypePreference: '',
        }
      });
    } catch (err) {
      setError('Failed to create job posting');
      console.error('Error creating job:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format
  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  // Get array of available hours
  const getHourOptions = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      hours.push(`${hour}:00`);
    }
    return hours;
  };

  // Handle date and time changes separately
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'start' | 'end') => {
    const { value } = e.target;
    const currentTime = field === 'start' ? formData.startDate.split('T')[1] || '00:00' : formData.endDate.split('T')[1] || '00:00';
    setFormData(prev => ({
      ...prev,
      [`${field}Date`]: `${value}T${currentTime}`
    }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>, field: 'start' | 'end') => {
    const { value } = e.target;
    const currentDate = field === 'start' ? formData.startDate.split('T')[0] : formData.endDate.split('T')[0];
    if (!currentDate) {
      setError(`Please select a ${field} date first`);
      return;
    }
    setFormData(prev => ({
      ...prev,
      [`${field}Date`]: `${currentDate}T${value}`
    }));
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Sign in Required
        </h2>
        <p className="text-gray-600 mb-8">
          You need to be signed in to post a job.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent('/post')}`}
          className="inline-block bg-primary-coral text-white px-6 py-3 rounded-lg 
                   hover:bg-primary-coral/90 transition-colors duration-200 font-medium"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Get all breed options in one array
  const allBreeds = [
    ...BREED_OPTIONS.sizes,
    ...BREED_OPTIONS.smallBreeds,
    ...BREED_OPTIONS.mediumBreeds,
    ...BREED_OPTIONS.largeBreeds
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-primary-navy mb-6">Post a Job</h1>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral"
                >
                  <option value="walk">Dog Walking</option>
                  <option value="daycare">Daycare</option>
                  <option value="boarding">Boarding</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date & Time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={formData.startDate ? formData.startDate.split('T')[0] : ''}
                      onChange={(e) => handleDateChange(e, 'start')}
                      min={getMinDate()}
                      required
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral"
                    />
                    <select
                      value={formData.startDate ? formData.startDate.split('T')[1] : ''}
                      onChange={(e) => handleTimeChange(e, 'start')}
                      required
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral"
                    >
                      <option value="">Select time</option>
                      {getHourOptions().map(hour => (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Select the date and hour you'd like the service to start</p>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date & Time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={formData.endDate ? formData.endDate.split('T')[0] : ''}
                      onChange={(e) => handleDateChange(e, 'end')}
                      min={formData.startDate ? formData.startDate.split('T')[0] : getMinDate()}
                      required
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral"
                    />
                    <select
                      value={formData.endDate ? formData.endDate.split('T')[1] : ''}
                      onChange={(e) => handleTimeChange(e, 'end')}
                      required
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral"
                    >
                      <option value="">Select time</option>
                      {getHourOptions().map(hour => (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Select the date and hour you'd like the service to end</p>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <AddressAutocomplete
                  value={formData.location.address}
                  onChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        address: value
                      }
                    }));
                  }}
                  onSelect={(address) => {
                    setFormData(prev => ({
                      ...prev,
                      location: {
                        address: address.place_name,
                        lat: address.center[1],
                        lng: address.center[0]
                      }
                    }));
                  }}
                  placeholder="Enter the service location"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral"
                />
                {formData.location.lat !== 0 && formData.location.lng !== 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    Selected location: {formData.location.address}
                  </p>
                )}
              </div>

              {/* Dog Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Dog Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Breed
                    </label>
                    <select
                      name="dogDetails.breed"
                      value={formData.dogDetails.breed}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral"
                    >
                      <option value="">Select breed</option>
                      <optgroup label="Size Categories">
                        {BREED_OPTIONS.sizes.map(breed => (
                          <option key={breed} value={breed}>{breed}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Small Breeds">
                        {BREED_OPTIONS.smallBreeds.map(breed => (
                          <option key={breed} value={breed}>{breed}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Medium Breeds">
                        {BREED_OPTIONS.mediumBreeds.map(breed => (
                          <option key={breed} value={breed}>{breed}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Large Breeds">
                        {BREED_OPTIONS.largeBreeds.map(breed => (
                          <option key={breed} value={breed}>{breed}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Needs/Instructions
                  </label>
                  <textarea
                    name="dogDetails.specialNeeds"
                    value={formData.dogDetails.specialNeeds}
                    onChange={handleInputChange}
                    placeholder="Any medical conditions, behavioral notes, or special care instructions..."
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral"
                  />
                </div>
              </div>

              {/* Rate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="rate"
                      value={formData.rate}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full pl-8 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate Type
                  </label>
                  <select
                    name="rateType"
                    value={formData.rateType}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral"
                  >
                    <option value="per_hour">Per Hour</option>
                    <option value="per_day">Per Day</option>
                    <option value="fixed">Fixed Rate</option>
                  </select>
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Requirements</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="requirements.experienceRequired"
                      checked={formData.requirements.experienceRequired}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-coral focus:ring-primary-coral border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700">Experience Required</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="requirements.transportationRequired"
                      checked={formData.requirements.transportationRequired}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-coral focus:ring-primary-coral border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700">Transportation Required</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Home Type
                  </label>
                  <select
                    name="requirements.homeTypePreference"
                    value={formData.requirements.homeTypePreference}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral"
                  >
                    <option value="">No preference</option>
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                  </select>
                </div>
              </div>

              {/* Recurring */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="recurring"
                    checked={formData.recurring}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-coral focus:ring-primary-coral border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700">This is a recurring job</span>
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral"
                  placeholder="Any additional details or requirements..."
                />
              </div>

              {/* Submit Button */}
              <div className="sticky bottom-0 pt-6 bg-white">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-[#FF6B6B] hover:bg-[#ff5b5b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-coral shadow-lg"
                >
                  {loading ? (
                    'Posting...'
                  ) : (
                    <>
                      <FaPlus className="mr-2" />
                      Post Job
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 