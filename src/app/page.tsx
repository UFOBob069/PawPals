'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useAuth } from '@/lib/auth';
import { FaPaw, FaHeart, FaCalendarAlt, FaShieldAlt, FaMapMarkerAlt, FaStar, FaHandshake, FaSearch, FaComments, FaCalendarCheck } from 'react-icons/fa';
import Image from 'next/image';

const FEATURED_PHOTOS = [
  { url: '/images/dog1.jpg', alt: 'Happy dog playing in the park' },
  { url: '/images/dog2.jpg', alt: 'Dog with their caregiver' },
  { url: '/images/dog3.jpg', alt: 'Dog enjoying daycare' },
  { url: '/images/dog4.jpg', alt: 'Dog on a walk' },
];

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    role: 'Dog Owner',
    content: 'Found an amazing walker for my energetic Lab. The service has been fantastic!',
    image: '/images/testimonial1.jpg',
  },
  {
    name: 'Mike R.',
    role: 'Pet Care Provider',
    content: 'Love connecting with local pet owners and their furry friends!',
    image: '/images/testimonial2.jpg',
  },
  {
    name: 'Emily L.',
    role: 'Dog Owner',
    content: "The perfect solution for finding reliable pet care while I'm at work.",
    image: '/images/testimonial3.jpg',
  },
];

const SERVICES = [
  {
    icon: <FaPaw className="text-4xl text-primary-coral" />,
    title: 'Dog Walking',
    description: 'Regular exercise and outdoor adventures',
    price: 'Flexible scheduling options available',
  },
  {
    icon: <FaHeart className="text-4xl text-primary-coral" />,
    title: 'Daycare',
    description: 'Supervised play and socialization',
    price: 'Full and half-day options',
  },
  {
    icon: <FaCalendarAlt className="text-4xl text-primary-coral" />,
    title: 'Boarding',
    description: 'Overnight care in a loving home',
    price: 'Custom packages to fit your needs',
  },
];

const rotationAngles = [
  [-15, 10, -20, 15, -10, 20, -25, 30],
  [25, -20, 15, -10, 20, -15, 10, -25],
  [-10, 15, -20, 25, -15, 20, -25, 10],
  [20, -15, 10, -25, 15, -20, 25, -10]
];

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
      <section className="relative w-full bg-primary-yellow py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0">
          {[...Array(4)].map((_, row) => (
            [...Array(8)].map((_, col) => (
              <FaPaw 
                key={`${row}-${col}`} 
                className="absolute text-black/[0.15] text-2xl transform"
                style={{
                  left: `${(col * 12.5)}%`,
                  top: `${(row * 25) + (col % 2 ? 12.5 : 0)}%`,
                  transform: `rotate(${rotationAngles[row][col]}deg) scale(1.2)`,
                }}
              />
            ))
          ))}
        </div>
        <div className="container mx-auto px-4 py-24 text-center relative">
          <h1 className="text-5xl md:text-6xl font-bold text-primary-navy mb-6">
            Find Your Dog's Perfect <span className="text-primary-coral">Paw Pal</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Connect with trusted local hosts for walks, daycare, and vacation sitting
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
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
                className="bg-primary-coral text-white px-8 py-4 rounded-lg hover:bg-opacity-90 transition flex items-center gap-2 font-semibold"
              >
                <FaMapMarkerAlt />
                <span>Find Care</span>
              </button>
            </form>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-8 text-primary-navy">
            <div className="flex items-center gap-2">
              <FaShieldAlt className="text-xl" />
              <span>Verified Providers</span>
            </div>
            <div className="flex items-center gap-2">
              <FaStar className="text-xl" />
              <span>5-Star Rated</span>
            </div>
            <div className="flex items-center gap-2">
              <FaHandshake className="text-xl" />
              <span>Direct Connections</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-navy text-center mb-12">
            How <span className="text-primary-coral">PawPals</span> Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-yellow rounded-full flex items-center justify-center mx-auto mb-6">
                <FaSearch className="text-2xl text-primary-navy" />
              </div>
              <h3 className="text-xl font-semibold text-primary-navy mb-4">1. Find Care</h3>
              <p className="text-gray-600">Search for trusted local pet care providers in your area</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-yellow rounded-full flex items-center justify-center mx-auto mb-6">
                <FaComments className="text-2xl text-primary-navy" />
              </div>
              <h3 className="text-xl font-semibold text-primary-navy mb-4">2. Connect</h3>
              <p className="text-gray-600">Message providers directly to discuss your pet's needs</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-yellow rounded-full flex items-center justify-center mx-auto mb-6">
                <FaCalendarCheck className="text-2xl text-primary-navy" />
              </div>
              <h3 className="text-xl font-semibold text-primary-navy mb-4">3. Book & Pay</h3>
              <p className="text-gray-600">Schedule services and pay providers directly - no platform fees</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="w-full py-20 bg-neutral-lightest">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-navy text-center mb-12">
            Services Tailored to Your <span className="text-primary-coral">Needs</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SERVICES.map((service, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
                <div className="mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold text-primary-navy mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <p className="text-primary-coral font-semibold">{service.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Fee Comparison */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-primary-navy mb-4">
              Keep More of What You Earn
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Other platforms take up to 30% of every booking. With PawPals, you keep 100% of your earnings.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Other Platforms */}
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Other Platforms
                </h3>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-6xl font-bold text-red-500">-30%</span>
                </div>
                <p className="text-gray-600">
                  For a $100 booking, you only keep $70
                </p>
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <p className="text-red-600 font-medium">
                    Platform fees eat into your earnings
                  </p>
                </div>
              </div>

              {/* PawPals */}
              <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-primary-coral relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary-coral text-white px-4 py-1 rounded-full text-sm font-medium">
                  BEST CHOICE
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  PawPals
                </h3>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-6xl font-bold text-green-500">100%</span>
                </div>
                <p className="text-gray-600">
                  For a $100 booking, you keep all $100
                </p>
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-green-600 font-medium">
                    No hidden fees or commissions
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <Link 
                href="/signup"
                className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-md text-white bg-primary-coral hover:bg-primary-coral/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-coral"
              >
                Start Earning More Today
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-20 bg-neutral-lightest">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-navy text-center mb-12">
            What Our Community <span className="text-primary-coral">Says</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
          <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-navy">{testimonial.name}</h3>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600">{testimonial.content}</p>
                <div className="flex gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="w-full py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-navy text-center mb-12">
            Happy <span className="text-primary-coral">Paw Pals</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURED_PHOTOS.map((photo, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition">
          <Image
                  src={photo.url}
                  alt={photo.alt}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 bg-neutral-lightest">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <FaShieldAlt className="text-4xl text-primary-coral mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary-navy mb-4">Trusted Community</h3>
              <p className="text-gray-600">All providers are verified and reviewed by pet owners like you</p>
            </div>
            <div className="text-center p-6">
              <FaCalendarAlt className="text-4xl text-primary-coral mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary-navy mb-4">Flexible Care</h3>
              <p className="text-gray-600">Book recurring services or one-time care based on your needs</p>
            </div>
            <div className="text-center p-6">
              <FaHandshake className="text-4xl text-primary-coral mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary-navy mb-4">Direct Connection</h3>
              <p className="text-gray-600">Connect and coordinate directly with your chosen provider</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-primary-navy py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {user ? 'Ready to Find the Perfect Match?' : 'Join Our Growing Community'}
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {user
              ? 'Browse our network of trusted pet care providers in your area'
              : 'Connect with local pet lovers and find the perfect care for your furry friend'}
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            {user ? (
              <Link
                href="/search"
                className="bg-primary-coral text-white px-8 py-4 rounded-lg hover:bg-opacity-90 transition font-semibold inline-flex items-center justify-center gap-2"
              >
                <FaMapMarkerAlt />
                <span>Find Care Now</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="bg-primary-coral text-white px-8 py-4 rounded-lg hover:bg-opacity-90 transition font-semibold"
                >
                  Sign Up Free
                </Link>
                <Link
                  href="/login"
                  className="bg-white text-primary-navy px-8 py-4 rounded-lg hover:bg-opacity-90 transition font-semibold"
                >
                  Log In
                </Link>
              </>
            )}
          </div>
    </div>
      </section>
    </main>
  );
}
