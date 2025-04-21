'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserIcon } from '@/components/icons/UserIcon';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Job {
  owner: {
    photoUrl?: string;
    name: string;
  };
  createdAt: any;
}

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const jobDoc = await getDoc(doc(db, 'jobs', params.id));
        if (jobDoc.exists()) {
          setJob(jobDoc.data() as Job);
        }
      } catch (error) {
        console.error('Error fetching job:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [params.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!job) {
    return <div>Job not found</div>;
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      {job.owner.photoUrl ? (
        <Image
          src={job.owner.photoUrl}
          alt={job.owner.name}
          width={64}
          height={64}
          className="rounded-full"
          unoptimized
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
          <UserIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <div>
        <h2 className="text-xl font-semibold">{job.owner.name}</h2>
        <p className="text-gray-600">Posted {formatDate(job.createdAt)}</p>
      </div>
    </div>
  );
} 