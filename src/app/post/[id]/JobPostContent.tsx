'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaMapMarkerAlt } from 'react-icons/fa';

interface JobPost {
  id: string;
  ownerUid: string;
  ownerName: string;
  serviceType: string;
  description: string;
  location?: {
    address: string;
    lat: number;
    lng: number;
  };
  rate: string;
  rateType: string;
  startDate: string;
  endDate: string;
  breeds: string[];
}

interface JobPostContentProps {
  postId: string;
}

export default function JobPostContent({ postId }: JobPostContentProps) {
  const { user } = useAuth();
  const [job, setJob] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const jobDoc = await getDoc(doc(db, 'jobs', postId));
        if (jobDoc.exists()) {
          setJob({ id: jobDoc.id, ...jobDoc.data() } as JobPost);
        } else {
          setError('Job post not found');
        }
      } catch (err) {
        console.error('Error fetching job:', err);
        setError('Failed to load job post');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [postId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !job) {
    return <div>{error || 'Job not found'}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-primary-navy mb-4">
          {job.serviceType.charAt(0).toUpperCase() + job.serviceType.slice(1)} Service Needed
        </h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-primary-navy mb-2">Description</h2>
          <p className="text-gray-600">{job.description}</p>
        </div>

        {job.location && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-primary-navy mb-2">Location</h2>
            <div className="flex items-start gap-2 text-gray-600">
              <FaMapMarkerAlt className="mt-1 flex-shrink-0" />
              <p>Location will be shared after connecting</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-primary-navy mb-2">Rate</h2>
          <p className="text-gray-600">${job.rate}/{job.rateType}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-primary-navy mb-2">Schedule</h2>
          <p className="text-gray-600">
            From {new Date(job.startDate).toLocaleDateString()} to {new Date(job.endDate).toLocaleDateString()}
          </p>
        </div>

        {job.breeds && job.breeds.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-primary-navy mb-2">Breeds</h2>
            <div className="flex flex-wrap gap-2">
              {job.breeds.map(breed => (
                <span key={breed} className="px-3 py-1 bg-primary-yellow/20 text-primary-navy rounded-full text-sm">
                  {breed}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-primary-navy mb-2">Posted by</h2>
          <p className="text-gray-600">{job.ownerName}</p>
        </div>
      </div>
    </div>
  );
} 