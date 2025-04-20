'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaGoogle, FaPaw, FaShieldAlt, FaStar, FaHandshake } from 'react-icons/fa';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-lightest flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-12">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary-navy">
              <FaPaw className="text-primary-coral" />
              <span>PawPals</span>
            </Link>
            <h1 className="text-3xl font-bold text-primary-navy mt-6 mb-2">Welcome Back!</h1>
            <p className="text-gray-600">Sign in to connect with trusted pet care providers</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-coral text-white py-3 rounded-lg hover:bg-opacity-90 transition font-semibold"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-neutral-lightest text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white text-gray-700 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold flex items-center justify-center gap-2"
            >
              <FaGoogle className="text-xl" />
              <span>Sign in with Google</span>
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary-coral hover:underline font-semibold">
              Sign up free
            </Link>
          </p>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-gray-600">
            <div className="flex items-center gap-2">
              <FaShieldAlt className="text-primary-coral" />
              <span>Verified Providers</span>
            </div>
            <div className="flex items-center gap-2">
              <FaStar className="text-primary-coral" />
              <span>5-Star Rated</span>
            </div>
            <div className="flex items-center gap-2">
              <FaHandshake className="text-primary-coral" />
              <span>Direct Connections</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-yellow/90 to-primary-coral/90 mix-blend-multiply"></div>
        <Image
          src="/images/login-hero.jpg"
          alt="Happy dog with caregiver"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-lg text-white text-center">
            <h2 className="text-4xl font-bold mb-4">Find Your Perfect Match</h2>
            <p className="text-xl">
              Connect with trusted local pet care providers who'll treat your furry friend like family
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 