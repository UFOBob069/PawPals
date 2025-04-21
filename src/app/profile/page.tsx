'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { doc, updateDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaEdit, FaSave, FaDog, FaSignOutAlt, FaTrash, FaStar, FaStarHalf, FaPaw, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import Link from 'next/link';
import BreedFilter from '@/components/BreedFilter';
import PhotoUpload from '@/components/PhotoUpload';

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
    [key: string]: boolean;
    walk: boolean;
    daycare: boolean;
    boarding: boolean;
    dropIn: boolean;
    training: boolean;
    houseSitting: boolean;
  };
  acceptedBreeds: string[];
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  rating?: number;
  totalReviews?: number;
  photoUrl?: string;
  updatedAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    bio: '',
    role: {},
    services: {
      walk: false,
      daycare: false,
      boarding: false,
      dropIn: false,
      training: false,
      houseSitting: false,
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
              dropIn: false,
              training: false,
              houseSitting: false,
            },
            acceptedBreeds: userData.acceptedBreeds || [],
            location: userData.location || {
              address: '',
              lat: 0,
              lng: 0,
            },
            photoUrl: userData.photoUrl,
            updatedAt: userData.updatedAt,
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
      // Extract the service name from the input name (e.g., "services.walk" -> "walk")
      const serviceName = name.split('.')[1];
      setProfile(prev => ({
        ...prev,
        services: {
          ...prev.services,
          [serviceName]: checked
        }
      }));
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const updateData: Partial<UserProfile> = {
        name: profile.name,
        bio: profile.bio,
        role: profile.role,
        services: profile.services,
        acceptedBreeds: profile.acceptedBreeds,
        location: profile.location,
        updatedAt: new Date().toISOString(),
      };

      // Only include photoUrl if it exists
      if (profile.photoUrl) {
        updateData.photoUrl = profile.photoUrl;
      }

      await updateDoc(doc(db, 'users', user.uid), updateData);
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

  const handlePhotoUploaded = async (photoUrl: string) => {
    try {
      setProfile(prev => ({ ...prev, photoUrl }));
      
      if (!user) return;
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoUrl
      });
    } catch (error) {
      console.error('Error updating profile photo:', error);
      alert('Failed to update profile photo. Please try again.');
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary-navy">Profile</h1>
        <div className="flex gap-4">
          <button
            onClick={() => {
              if (isEditing) {
                handleSubmit(new Event('submit') as any);
              } else {
                setIsEditing(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-primary-navy hover:text-primary-coral"
          >
            {isEditing ? <><FaSave className="text-xl" /> Save</> : <><FaEdit className="text-xl" /> Edit</>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-primary-navy hover:text-red-600"
          >
            <FaSignOutAlt className="text-xl" />
            Logout
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex flex-col items-center space-y-4">
            <PhotoUpload
              currentPhotoUrl={profile.photoUrl}
              userId={user.uid}
              onPhotoUploaded={handlePhotoUploaded}
              disabled={!isEditing}
            />
            {isEditing && (
              <p className="text-sm text-gray-500 text-center">
                Click to upload photo
              </p>
            )}
          </div>
          
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-primary-navy mb-4">About Me</h2>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg mb-4"
                  placeholder="Your Name"
                />
              ) : (
                <p className="text-gray-700 mb-4">{profile.name || 'No name set'}</p>
              )}
            </div>

            {/* Services Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-primary-navy mb-4">Services Offered</h2>
              <div className="flex flex-wrap gap-4">
                {[
                  { id: 'walk', label: 'Walk' },
                  { id: 'daycare', label: 'Daycare' },
                  { id: 'boarding', label: 'Boarding' },
                  { id: 'dropIn', label: 'Drop-in Visit' },
                  { id: 'training', label: 'Training' },
                  { id: 'houseSitting', label: 'House Sitting' }
                ].map(({ id, label }) => (
                  <label key={id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name={`services.${id}`}
                      checked={profile.services?.[id] || false}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="form-checkbox text-primary-coral"
                    />
                    <span className={!isEditing && !profile.services?.[id] ? 'text-gray-400' : 'text-gray-700'}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Accepted Breeds Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-primary-navy mb-4">Accepted Breeds</h2>
              <BreedFilter
                selectedBreeds={profile.acceptedBreeds || []}
                onChange={(breeds) => setProfile(prev => ({ ...prev, acceptedBreeds: breeds }))}
                disabled={!isEditing}
              />
            </div>

            {isEditing && (
              <div className="flex justify-end gap-4">
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-primary-coral text-white rounded-lg hover:bg-primary-coral/90"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Posts Management Section */}
      {profile.role?.owner && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-primary-navy">My Job Posts</h2>
            <Link
              href="/post"
              className="px-4 py-2 bg-primary-coral text-white rounded-lg hover:bg-primary-coral/90"
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
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {editingPostId === post.id ? (
                        <>
                          <select
                            value={editingPost?.serviceType || post.serviceType}
                            onChange={(e) => setEditingPost(prev => ({ ...prev!, serviceType: e.target.value }))}
                            className="w-full p-2 mb-2 border border-gray-300 rounded-lg"
                          >
                            <option value="walk">Dog Walking</option>
                            <option value="daycare">Daycare</option>
                            <option value="boarding">Boarding</option>
                            <option value="dropIn">Drop-in Visit</option>
                            <option value="training">Training</option>
                            <option value="houseSitting">House Sitting</option>
                          </select>
                          <textarea
                            value={editingPost?.description || post.description}
                            onChange={(e) => setEditingPost(prev => ({ ...prev!, description: e.target.value }))}
                            className="w-full p-2 mb-2 border border-gray-300 rounded-lg"
                            rows={3}
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">$</span>
                            <input
                              type="number"
                              value={editingPost?.rate || post.rate}
                              onChange={(e) => setEditingPost(prev => ({ ...prev!, rate: e.target.value }))}
                              className="w-32 p-2 border border-gray-300 rounded-lg"
                            />
                            <select
                              value={editingPost?.rateType || post.rateType}
                              onChange={(e) => setEditingPost(prev => ({ ...prev!, rateType: e.target.value }))}
                              className="p-2 border border-gray-300 rounded-lg"
                            >
                              <option value="per_hour">per hour</option>
                              <option value="per_day">per day</option>
                              <option value="fixed">fixed rate</option>
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3 className="text-lg font-medium text-gray-900">
                            {post.serviceType.charAt(0).toUpperCase() + post.serviceType.slice(1)}
                          </h3>
                          <p className="text-gray-600 mt-1">{post.description}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Rate: ${post.rate}/{post.rateType}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {editingPostId === post.id ? (
                        <>
                          <button
                            onClick={handleSavePost}
                            className="text-green-600 hover:text-green-700"
                          >
                            <FaSave className="text-xl" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingPostId(null);
                              setEditingPost(null);
                            }}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <FaTimes className="text-xl" />
                          </button>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 