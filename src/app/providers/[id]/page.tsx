'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaMapMarkerAlt, FaDog, FaStar, FaStarHalf, FaUser } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import ReviewForm from '@/components/ReviewForm';
import Image from 'next/image';

// Dynamically import MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
      <div className="animate-pulse">Loading map...</div>
    </div>
  ),
});

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerName: string;
  reviewerPhoto?: string;
  serviceType: string;
}

interface ProviderDetails {
  id: string;
  name: string;
  bio: string;
  services: {
    walk: boolean;
    daycare: boolean;
    boarding: boolean;
  };
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  rate: string;
  breedsPreferred: string[];
  photoUrl?: string;
  rating?: number;
  totalReviews?: number;
}

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

// Add a helper function to format the date
const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  
  // Handle Firestore Timestamp
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleDateString();
  }
  
  // Handle string dates
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString();
};

export default function ProviderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [selectedService, setSelectedService] = useState('');

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalf key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaStar key={i} className="text-gray-300" />);
      }
    }

    return stars;
  };

  useEffect(() => {
    const fetchProviderDetails = async () => {
      if (!params.id) return;

      try {
        const providerDoc = await getDoc(doc(db, 'users', params.id as string));
        
        if (!providerDoc.exists()) {
          setError('Provider not found');
          return;
        }

        const data = providerDoc.data();
        setProvider({
          id: providerDoc.id,
          name: data.name || '',
          bio: data.bio || '',
          services: data.services || {
            walk: false,
            daycare: false,
            boarding: false,
          },
          location: data.location || {
            lat: 0,
            lng: 0,
          },
          rate: data.rate || '25',
          breedsPreferred: data.breedsPreferred || [],
          photoUrl: data.photoUrl,
        });

        // Fetch reviews
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('providerId', '==', params.id)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          };
        }) as Review[];
        
        setReviews(reviewsData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));

        // Calculate average rating
        if (reviewsData.length > 0) {
          const avgRating = reviewsData.reduce((acc, review) => acc + review.rating, 0) / reviewsData.length;
          setAverageRating(avgRating);
        }
      } catch (err) {
        console.error('Error fetching provider details:', err);
        setError('Failed to load provider details');
      } finally {
        setLoading(false);
      }
    };

    fetchProviderDetails();
  }, [params.id]);

  const handleReviewSuccess = () => {
    setIsWritingReview(false);
    // Refresh the reviews
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-navy mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading provider details...</p>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error || 'Provider not found'}
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 text-primary-navy hover:text-primary-navy/80"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const activeServices = Object.entries(provider.services)
    .filter(([, isActive]) => isActive)
    .map(([service]) => service);

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 text-primary-navy hover:text-primary-navy/80 flex items-center gap-2"
      >
        ← Back to search
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative w-24 h-24 flex-shrink-0">
            {provider.photoUrl ? (
              <Image
                src={provider.photoUrl}
                alt={provider.name}
                fill
                className="rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                <FaUser className="text-gray-400 text-3xl" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{provider.name}</h1>
            <p className="text-gray-600 mt-1">Service Provider</p>
            {provider.rating && (
              <div className="flex items-center mt-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < provider.rating ? 'text-yellow-400' : 'text-gray-300'} />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  ({provider.totalReviews} {provider.totalReviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {activeServices.map((service) => (
            <span
              key={service}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-navy/10 text-primary-navy"
            >
              {getServiceEmoji(service)} {service.charAt(0).toUpperCase() + service.slice(1)}
            </span>
          ))}
        </div>
        <p className="text-xl font-semibold text-primary-coral">
          ${provider.rate}/hour
        </p>

        {provider.bio && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-primary-navy mb-2">About Me</h2>
            <p className="text-gray-600">{provider.bio}</p>
          </div>
        )}

        {provider.breedsPreferred.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-primary-navy mb-2">Preferred Breeds</h2>
            <div className="flex flex-wrap gap-2">
              {provider.breedsPreferred.map((breed) => (
                <span
                  key={breed}
                  className="inline-block px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                >
                  {breed}
                </span>
              ))}
            </div>
          </div>
        )}

        {provider.location?.address && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-primary-navy mb-2">Location</h2>
            <div className="flex items-start gap-2 text-gray-600">
              <FaMapMarkerAlt className="mt-1 flex-shrink-0" />
              <p>{provider.location.address}</p>
            </div>
          </div>
        )}

        {provider.location?.lat && provider.location?.lng && (
          <div className="h-[300px] w-full rounded-lg overflow-hidden mb-6">
            <MapComponent
              markers={[{
                id: provider.id,
                position: {
                  lat: provider.location.lat,
                  lng: provider.location.lng
                },
                title: provider.name,
                description: provider.bio,
                rate: provider.rate,
                rateType: 'hour',
                serviceType: activeServices[0]?.charAt(0).toUpperCase() + activeServices[0]?.slice(1) || '',
                isProvider: true
              }]}
              center={{
                lat: provider.location.lat,
                lng: provider.location.lng
              }}
              zoom={13}
            />
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Reviews</h2>
            {user && !isWritingReview && user.uid !== params.id && (
              <button
                onClick={() => setIsWritingReview(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-coral hover:bg-primary-coral/90"
              >
                Write a Review
              </button>
            )}
          </div>

          {isWritingReview && (
            <div className="mb-6 border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Write Your Review</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select a service</option>
                  {activeServices.map((service) => (
                    <option key={service} value={service}>
                      {service.charAt(0).toUpperCase() + service.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <ReviewForm
                providerId={params.id as string}
                serviceType={selectedService}
                onSuccess={handleReviewSuccess}
                onCancel={() => setIsWritingReview(false)}
              />
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-gray-600">No reviews yet.</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {review.reviewerPhoto ? (
                        <img
                          src={review.reviewerPhoto}
                          alt={review.reviewerName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <FaDog className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium text-gray-900">{review.reviewerName}</h3>
                          <span className="mx-2 text-gray-300">•</span>
                          <span className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <div className="flex">
                            {renderStars(review.rating)}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {review.serviceType.charAt(0).toUpperCase() + review.serviceType.slice(1)}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-600">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <a
            href={`/chat/${provider.id}`}
            className="block w-full text-center bg-primary-navy text-white py-3 px-4 rounded-lg 
                     hover:bg-primary-navy/90 transition-colors duration-200 font-medium"
          >
            Contact Provider
          </a>
        </div>
      </div>
    </div>
  );
} 