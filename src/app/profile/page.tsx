'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { doc, updateDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaEdit, FaSave, FaDog, FaSignOutAlt, FaTrash, FaStar, FaStarHalf } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import Link from 'next/link';
import BreedFilter from '@/components/BreedFilter';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerName: string;
  reviewerPhoto?: string;
  serviceType: string;
}

interface JobPost {
  id: string;
  serviceType: string;
  description: string;
  rate: string;
  rateType: string;
  createdAt: string;
  location: {
    address?: string;
    lat: number;
    lng: number;
  };
}

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
  acceptedBreeds: string[];
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  rating?: number;
  totalReviews?: number;
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
    acceptedBreeds: [],
    location: {
      address: '',
      lat: 0,
      lng: 0,
    },
  });
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<JobPost | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);

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
            acceptedBreeds: userData.acceptedBreeds || [],
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

  // Separate useEffect for fetching posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user) return;

      try {
        const jobsQuery = query(
          collection(db, 'jobs'),
          where('ownerUid', '==', user.uid)
        );
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobs = jobsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as JobPost[];
        setJobPosts(jobs);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts');
      }
    };

    fetchUserPosts();
  }, [user]);

  // Add new useEffect for fetching reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!user) return;

      try {
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('providerId', '==', user.uid)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Review[];
        
        setReviews(reviewsData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));

        // Calculate average rating
        if (reviewsData.length > 0) {
          const avgRating = reviewsData.reduce((acc, review) => acc + review.rating, 0) / reviewsData.length;
          setAverageRating(avgRating);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews');
      }
    };

    fetchReviews();
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

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'jobs', postId));
      setJobPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post');
    }
  };

  const handleEditPost = async (post: JobPost) => {
    setEditingPostId(post.id);
    setEditingPost(post);
  };

  const handleSavePost = async () => {
    if (!user || !editingPost || !editingPostId) return;

    try {
      await updateDoc(doc(db, 'jobs', editingPostId), {
        ...editingPost,
        updatedAt: new Date().toISOString()
      });

      setJobPosts(prev => prev.map(post => 
        post.id === editingPostId ? editingPost : post
      ));
      setEditingPostId(null);
      setEditingPost(null);
    } catch (err) {
      console.error('Error updating post:', err);
      setError('Failed to update post');
    }
  };

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
          <div className="bg-primary-yellow p-6 relative">
            <div className="absolute inset-0 opacity-5">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="paw-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M11 16c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm3-3c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3zm6 0c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3zm4 3c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" 
                      fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#paw-pattern)" />
              </svg>
            </div>
            <div className="relative flex items-center justify-between">
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
                  {profile.role.host && (
                    <div className="flex items-center mt-2">
                      <div className="flex">{renderStars(averageRating)}</div>
                      <span className="ml-2 text-sm text-gray-600">
                        ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  )}
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
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Services Offered</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="walk"
                        checked={profile.services.walk}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-coral rounded border-gray-300 focus:ring-primary-coral"
                      />
                      <span className="text-gray-700">Dog Walking</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="daycare"
                        checked={profile.services.daycare}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-coral rounded border-gray-300 focus:ring-primary-coral"
                      />
                      <span className="text-gray-700">Daycare</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="boarding"
                        checked={profile.services.boarding}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-coral rounded border-gray-300 focus:ring-primary-coral"
                      />
                      <span className="text-gray-700">Boarding</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Accepted Breeds</h3>
                  <div>
                    <BreedFilter
                      selectedBreeds={profile.acceptedBreeds}
                      onBreedsChange={(breeds) => setProfile(prev => ({ ...prev, acceptedBreeds: breeds }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </>
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

        {/* Job Posts Management Section */}
        {profile.role.owner && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">My Job Posts</h2>
                <Link
                  href="/post"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-coral hover:bg-primary-coral/90"
                >
                  Create New Post
                </Link>
              </div>

              {jobPosts.length === 0 ? (
                <p className="text-gray-600">You haven't created any job posts yet.</p>
              ) : (
                <div className="space-y-4">
                  {jobPosts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4">
                      {editingPostId === post.id ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Service Type
                            </label>
                            <select
                              value={editingPost?.serviceType}
                              onChange={(e) => setEditingPost(prev => ({ ...prev!, serviceType: e.target.value }))}
                              className="w-full p-2 border border-gray-300 rounded-lg"
                            >
                              <option value="walk">Dog Walking</option>
                              <option value="daycare">Daycare</option>
                              <option value="boarding">Boarding</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              value={editingPost?.description}
                              onChange={(e) => setEditingPost(prev => ({ ...prev!, description: e.target.value }))}
                              className="w-full p-2 border border-gray-300 rounded-lg"
                              rows={3}
                            />
                          </div>
                          <div className="flex space-x-4">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rate
                              </label>
                              <input
                                type="text"
                                value={editingPost?.rate}
                                onChange={(e) => setEditingPost(prev => ({ ...prev!, rate: e.target.value }))}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rate Type
                              </label>
                              <select
                                value={editingPost?.rateType}
                                onChange={(e) => setEditingPost(prev => ({ ...prev!, rateType: e.target.value }))}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                              >
                                <option value="hour">Per Hour</option>
                                <option value="day">Per Day</option>
                                <option value="week">Per Week</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={() => {
                                setEditingPostId(null);
                                setEditingPost(null);
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSavePost}
                              className="px-4 py-2 bg-primary-coral text-white rounded-md text-sm font-medium hover:bg-primary-coral/90"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {post.serviceType.charAt(0).toUpperCase() + post.serviceType.slice(1)}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                Posted on {new Date(post.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditPost(post)}
                                className="text-gray-600 hover:text-primary-coral"
                              >
                                <FaEdit className="text-xl" />
                              </button>
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="text-gray-600 hover:text-red-600"
                              >
                                <FaTrash className="text-xl" />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-600 mt-2">{post.description}</p>
                          <div className="mt-2 text-sm text-gray-500">
                            Rate: ${post.rate}/{post.rateType}
                          </div>
                          {post.location.address && (
                            <div className="mt-2 text-sm text-gray-500">
                              Location: {post.location.address}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Section - Only show for service providers */}
        {profile.role.host && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Reviews</h2>
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
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center mt-1">
                              <div className="flex">
                                {renderStars(review.rating)}
                              </div>
                              <span className="ml-2 text-sm text-gray-600">
                                {review.serviceType}
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
          </div>
        )}

        {/* Service Provider Listings Section */}
        {profile.role.host && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">My Service Listings</h2>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Available Services</h3>
                  <div className="space-y-2">
                    {Object.entries(profile.services).map(([service, enabled]) => (
                      <div key={service} className="flex items-center">
                        <input
                          type="checkbox"
                          id={service}
                          name={service}
                          checked={enabled}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="h-4 w-4 text-primary-coral border-gray-300 rounded focus:ring-primary-coral"
                        />
                        <label htmlFor={service} className="ml-2 text-gray-700">
                          {service.charAt(0).toUpperCase() + service.slice(1)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 