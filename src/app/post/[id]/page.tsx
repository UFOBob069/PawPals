'use client';

import { Metadata } from 'next';
import JobPostContent from './JobPostContent';

export const metadata: Metadata = {
  title: 'Job Post',
};

export default function Page({ params }: { params: { id: string } }) {
  return <JobPostContent postId={params.id} />;
} 