'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaEdit, FaSave, FaDog, FaSignOutAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import Link from 'next/link';

interface UserProfile {
  name: string;
  bio: string;
  role: {
    owner?: boolean;
    host?: boolean;
  };
  services: {
    walk: boolean;
    daycare: boolean;
    boarding: boolean;
  };
  breedsPreferred: string[];
  location: {
    address: string;
    lat: number;
    lng: number;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    bio: '',
    role: {},
    services: {
      walk: false,
      daycare: false,
      boarding: false,
    },
    breedsPreferred: [],
    location: {
      address: '',
      lat: 0,
      lng: 0,
    },
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          setProfile({
            name: userData.name || '',
            bio: userData.bio || '',
            role: userData.role || {},
            services: userData.services || {
              walk: false,
              daycare: false,
              boarding: false,
            },
            breedsPreferred: userData.breedsPreferred || [],
            location: userData.location || {
              address: '',
              lat: 0,
              lng: 0,
            },
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      setProfile(prev => ({
        ...prev,
        services: { ...prev.services, [name]: checked }
      }));
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...profile,
        updatedAt: new Date().toISOString(),
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-coral"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Sign in Required
        </h2>
        <p className="text-gray-600 mb-8">
          You need to be signed in to view your profile.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent('/profile')}`}
          className="inline-block bg-primary-coral text-white px-6 py-3 rounded-lg 
                   hover:bg-primary-coral/90 transition-colors duration-200 font-medium"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Profile Header */}
          <div className="bg-primary-yellow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={profile.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <FaDog className="text-4xl text-primary-navy" />
                  )}
                </div>
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleInputChange}
                      className="text-2xl font-bold text-primary-navy bg-transparent border-b border-primary-navy focus:outline-none"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-primary-navy">{profile.name}</h1>
                  )}
                  <p className="text-gray-600">
                    {profile.role.owner ? 'Dog Owner' : ''}
                    {profile.role.owner && profile.role.host ? ' & ' : ''}
                    {profile.role.host ? 'Pet Care Host' : ''}
                  </p>
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-primary-navy hover:text-primary-coral"
                >
                  {isEditing ? <FaSave className="text-2xl" /> : <FaEdit className="text-2xl" />}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-primary-navy hover:text-primary-coral"
                >
                  <FaSignOutAlt className="text-xl" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Bio */}
            <div>
              <h2 className="text-lg font-semibold text-primary-navy mb-2">About Me</h2>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral"
                  rows={4}
                />
              ) : (
                <p className="text-gray-600">{profile.bio || 'No bio yet'}</p>
              )}
            </div>

            {/* Services */}
            {profile.role.host && (
              <div>
                <h2 className="text-lg font-semibold text-primary-navy mb-2">Services Offered</h2>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="walk"
                      checked={profile.services.walk}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="h-4 w-4 text-primary-coral focus:ring-primary-coral border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700">Dog Walking</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="daycare"
                      checked={profile.services.daycare}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="h-4 w-4 text-primary-coral focus:ring-primary-coral border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700">Daycare</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="boarding"
                      checked={profile.services.boarding}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="h-4 w-4 text-primary-coral focus:ring-primary-coral border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700">Boarding</span>
                  </label>
                </div>
              </div>
            )}

            {isEditing && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-primary-coral text-white px-6 py-2 rounded-lg 
                           hover:bg-primary-coral/90 transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
} 