'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaMapMarkerAlt, FaCalendar, FaClock, FaDollarSign, FaUser } from 'react-icons/fa';
import dynamic from 'next/dynamic';
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

interface ServiceDetails {
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
  status: string;
  photoUrl?: string;
  startDate: string;
  endDate: string;
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

export default function ServiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ownerPhoto, setOwnerPhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!params.id) return;

      try {
        const serviceDoc = await getDoc(doc(db, 'jobs', params.id as string));
        
        if (!serviceDoc.exists()) {
          setError('Service not found');
          return;
        }

        const data = serviceDoc.data() as Omit<ServiceDetails, 'id'>;
        setService({
          id: serviceDoc.id,
          ...data
        });

        // Fetch owner's profile photo
        if (data.ownerUid) {
          const ownerDoc = await getDoc(doc(db, 'users', data.ownerUid));
          if (ownerDoc.exists()) {
            const ownerData = ownerDoc.data();
            setOwnerPhoto(ownerData.photoUrl || null);
          }
        }
      } catch (err) {
        console.error('Error fetching service details:', err);
        setError('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-coral mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error || 'Service not found'}
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 text-primary-coral hover:text-primary-coral/80"
        >
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 text-primary-coral hover:text-primary-coral/80 flex items-center gap-2"
      >
        ← Back to search
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              {ownerPhoto ? (
                <Image
                  src={ownerPhoto}
                  alt={service.ownerName}
                  fill
                  className="rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                  <FaUser className="text-gray-400 text-2xl" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-navy flex items-center gap-2 mb-2">
                {getServiceEmoji(service.serviceType)}
                {service.serviceType.charAt(0).toUpperCase() + service.serviceType.slice(1)}
              </h1>
              <p className="text-lg text-gray-600">by {service.ownerName}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-coral">
              ${service.rate}
              <span className="text-lg text-gray-500">/{service.rateType}</span>
            </div>
          </div>
        </div>

        {service.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-primary-navy mb-2">Description</h2>
            <p className="text-gray-600">{service.description}</p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-primary-navy mb-2">Service Dates</h2>
          <div className="flex items-center gap-3 text-gray-600">
            <FaCalendar className="flex-shrink-0 text-primary-coral text-lg" />
            <div>
              <p className="mb-1">
                <span className="font-medium">From:</span> {new Date(service.startDate).toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric'
                })}
              </p>
              <p>
                <span className="font-medium">To:</span> {new Date(service.endDate).toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {service.location && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-primary-navy mb-2">Location</h2>
            <div className="flex items-start gap-2 text-gray-600">
              <FaMapMarkerAlt className="mt-1 flex-shrink-0" />
              <p>Location will be shared after connecting</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <a
            href={`/chat/${service.ownerUid}`}
            className="block w-full text-center bg-primary-coral text-white py-3 px-4 rounded-lg 
                     hover:bg-primary-coral/90 transition-colors duration-200 font-medium"
          >
            Contact Service Provider
          </a>
        </div>

        {service.location && (
          <div className="h-[300px] w-full rounded-lg overflow-hidden">
            <MapComponent
              markers={[{
                id: service.id,
                position: {
                  lat: service.location.lat,
                  lng: service.location.lng
                },
                title: `${service.serviceType} by ${service.ownerName}`,
                serviceType: service.serviceType,
                rate: service.rate,
                rateType: service.rateType,
                description: service.description
              }]}
              center={{
                lat: service.location.lat,
                lng: service.location.lng
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 