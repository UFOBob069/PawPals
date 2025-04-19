'use client';

import Image from 'next/image';
import { FaPaw, FaHeart, FaMapMarkerAlt } from 'react-icons/fa';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative w-full bg-primary-yellow py-16 overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(6)].map((_, row) => (
            [...Array(8)].map((_, col) => (
              <FaPaw 
                key={`${row}-${col}`} 
                className="absolute text-black/[0.15] text-2xl transform"
                style={{
                  left: `${(col * 12.5) + (row % 2 ? 6.25 : 0)}%`,
                  top: `${(row * 20) + (col % 2 ? 10 : 0)}%`,
                  transform: `rotate(${Math.floor(Math.random() * 60) - 30}deg) scale(1.2)`,
                }}
              />
            ))
          ))}
        </div>
        <div className="container mx-auto px-4 text-center relative">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-navy mb-4">
            Our Story
          </h1>
          <p className="text-xl text-gray-700">
            Born from a Dachshund's Vision
          </p>
        </div>
      </section>

      {/* Founder Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-12 mb-12">
              <div className="w-full md:w-1/2">
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src="/images/andre.jpg"
                    alt="Andre the Long-haired Dachshund"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl font-bold text-primary-navy mb-6">
                  Meet Andre <FaPaw className="inline-block text-primary-coral ml-2" />
                </h2>
                <p className="text-gray-600 mb-4">
                  Hi there! I'm Andre, a long-haired dachshund with a big heart and an even bigger vision. 
                  Based in the vibrant city of Austin, Texas, I noticed something during my daily adventures: 
                  many of my furry friends needed reliable care when their humans were away.
                </p>
                <p className="text-gray-600 mb-4">
                  One day, while being cared for by a wonderful sitter myself, I had an idea: 
                  why not create a platform where dogs like me could find trusted friends to look after them? 
                  And just like that, PawPals was born!
                </p>
                <div className="flex items-center text-primary-coral gap-2 mb-6">
                  <FaMapMarkerAlt />
                  <span className="font-medium">Based in Austin, Texas</span>
                </div>
              </div>
            </div>

            {/* Mission */}
            <div className="bg-gray-50 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-primary-navy mb-6 text-center">
                Our Mission <FaHeart className="inline-block text-primary-coral ml-2" />
              </h2>
              <p className="text-gray-600 text-center max-w-2xl mx-auto">
                At PawPals, we believe every dog deserves to feel loved and cared for, even when their 
                humans are away. We're building a community of passionate pet lovers who treat every 
                dog as their own, creating tail-wagging experiences one paw at a time.
              </p>
            </div>

            {/* Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary-yellow/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FaPaw className="text-2xl text-primary-coral" />
                </div>
                <h3 className="text-xl font-semibold text-primary-navy mb-2">Trust</h3>
                <p className="text-gray-600">Every sitter is thoroughly vetted and reviewed by our community</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-yellow/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FaHeart className="text-2xl text-primary-coral" />
                </div>
                <h3 className="text-xl font-semibold text-primary-navy mb-2">Care</h3>
                <p className="text-gray-600">Personalized attention and love for every furry friend</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-yellow/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FaMapMarkerAlt className="text-2xl text-primary-coral" />
                </div>
                <h3 className="text-xl font-semibold text-primary-navy mb-2">Community</h3>
                <p className="text-gray-600">Building connections between pet lovers in Austin and beyond</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 