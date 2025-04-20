'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';
import { FaGoogle } from 'react-icons/fa';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: { owner: false, host: false },
    location: { lat: 0, lng: 0 },
    agreedToTerms: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'owner' || name === 'host') {
        setFormData(prev => ({
          ...prev,
          role: { ...prev.role, [name]: checked }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.role.owner && !formData.role.host) {
      setError('Please select at least one role');
      setLoading(false);
      return;
    }

    if (!formData.agreedToTerms) {
      setError('Please agree to the Terms of Service');
      setLoading(false);
      return;
    }

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Update user profile
      await updateProfile(userCredential.user, {
        displayName: formData.name,
      });

      // Create user document in Firestore
      const userData: User = {
        uid: userCredential.user.uid,
        role: formData.role,
        name: formData.name,
        email: formData.email,
        location: formData.location,
        services: { walk: false, daycare: false, boarding: false },
        breedsPreferred: [],
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      router.push('/');
    } catch (error) {
      console.error('Signup error:', error);
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Create user document
      const userData: User = {
        uid: result.user.uid,
        role: formData.role,
        name: result.user.displayName || '',
        email: result.user.email || '',
        location: formData.location,
        services: { walk: false, daycare: false, boarding: false },
        breedsPreferred: [],
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', result.user.uid), userData);
      router.push('/');
    } catch (error) {
      console.error('Google signup error:', error);
      setError('Failed to sign up with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary-navy">
            Create your PawPals account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-primary-coral hover:text-primary-coral/80">
              sign in to your account
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-coral focus:border-primary-coral focus:z-10 sm:text-sm"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-coral focus:border-primary-coral focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-coral focus:border-primary-coral focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-coral focus:border-primary-coral focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-primary-navy">I am a:</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="owner"
                  name="owner"
                  type="checkbox"
                  checked={formData.role.owner}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-coral focus:ring-primary-coral border-gray-300 rounded"
                />
                <label htmlFor="owner" className="ml-2 block text-sm text-gray-900">
                  I'm a pet owner
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="host"
                  name="host"
                  type="checkbox"
                  checked={formData.role.host}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-coral focus:ring-primary-coral border-gray-300 rounded"
                />
                <label htmlFor="host" className="ml-2 block text-sm text-gray-900">
                  I'm a service provider
                </label>
              </div>
            </div>

            {/* Terms of Service Checkbox */}
            <div className="flex items-center mt-4">
              <input
                id="agreedToTerms"
                name="agreedToTerms"
                type="checkbox"
                checked={formData.agreedToTerms}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-coral focus:ring-primary-coral border-gray-300 rounded"
              />
              <label htmlFor="agreedToTerms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <Link 
                  href="/terms" 
                  target="_blank"
                  className="font-medium text-primary-coral hover:text-primary-coral/80"
                >
                  Terms of Service
                </Link>
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-coral hover:bg-primary-coral/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-coral ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-coral"
            >
              <FaGoogle className="h-5 w-5 text-red-500 mr-2" />
              Sign up with Google
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 